// netlify/functions/webscraper.js
// -----------------------------------------------------------------------------
// 高性能ウェブスクレイパー with マルチステージ処理, Jina AI + Gemini API統合
//
// 機能:
// - 同一ドメイン内のページを収集 (BFSアルゴリズム)
// - Jina AIによる高精度テキスト抽出
// - Gemini APIによる構造化データ分析
// - Netlify Functionsのタイムアウト対策としてのマルチステージ処理
// - 指数バックオフ付きリトライ、包括的なエラーハンドリングとロギング
//
// リクエスト形式 (operationTypeで処理を分岐):
// 1. 'collect-urls': 指定URLからリンクを収集
//    { "operationType": "collect-urls", "url": "https://example.com", "maxPages": 30, "debug": false }
//
// 2. 'extract-content': 収集したURLリストからコンテンツを抽出 (バッチ処理)
//    { "operationType": "extract-content", "urls": [{url: "...", title: "..." }, ...], "batchIndex": 0, "batchSize": 5, "debug": false }
//
// 3. 'analyze-info': 抽出したコンテンツを分析
//    { "operationType": "analyze-info", "contentItems": [{url: "...", title: "...", content: "..." }, ...], "storeType": "restaurant", "debug": false }
//
// 4. 'process-all': 小規模サイト向け一括処理 (URL収集 -> 抽出 -> 分析)
//    { "operationType": "process-all", "url": "https://example.com", "maxPages": 5, "storeType": "restaurant", "debug": false }
// -----------------------------------------------------------------------------

import axios from 'axios';
import cheerio from 'cheerio';
import { URL } from 'url'; // Node.js標準モジュール
import pLimit from 'p-limit'; // 並列処理制御
import crypto from 'crypto'; // リクエストID生成用

// --- 設定値 ------------------------------------------------------------------

const CONFIG = {
  // APIキー (Netlifyの環境変数から読み込むのがベストプラクティス)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

  // URL収集設定
  DEFAULT_MAX_PAGES: 30,
  MAX_ALLOWED_PAGES: 50, // システム全体での上限
  COLLECTION_TIMEOUT_MS: 8500, // URL収集ステージのタイムアウト (Netlifyの10秒制限考慮)

  // コンテンツ抽出設定
  DEFAULT_BATCH_SIZE: 5,
  MAX_ALLOWED_BATCH_SIZE: 10,
  JINA_AI_PREFIX: 'https://r.jina.ai/', // Jina Reader URL
  EXTRACTION_CONCURRENCY: 3, // Jina AIへの同時リクエスト数

  // HTTPリクエスト設定
  DEFAULT_TIMEOUT: 8000, // axiosのタイムアウト
  MAX_RETRIES: 2, // リトライ回数
  INITIAL_RETRY_DELAY: 1000, // 初期リトライ遅延(ms)
  RETRY_BACKOFF_FACTOR: 1.5, // 指数バックオフ係数
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', // 標準的なUA

  // Gemini API設定
  GEMINI_MAX_CONTENT_LENGTH: 18000, // Geminiに送るコンテンツの最大文字数 (トークン数を見越して設定)
  GEMINI_MAX_OUTPUT_TOKENS: 4096,
  GEMINI_TEMPERATURE: 0.2,
  GEMINI_TOP_K: 40,
  GEMINI_TOP_P: 0.95,

  // 分析設定
  DEFAULT_STORE_TYPE: 'general', // 未指定時のデフォルト業種

  // ロギング
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'info', // 環境によってログレベル変更
};

// --- ユーティリティ関数 ---------------------------------------------------------

/**
 * リクエスト固有のロガーを作成します。
 * @param {string} requestId - ログエントリに関連付けるリクエストID。
 * @returns {object} ロギング関数 (info, warn, error, debug) とログ取得関数 (getLogs) を持つオブジェクト。
 */
const createLogger = (requestId) => {
  const logs = [];
  const logLevels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLogLevel = logLevels[CONFIG.LOG_LEVEL] ?? logLevels.info;

  const log = (message, level = 'info') => {
    if (logLevels[level] < currentLogLevel) {
      return; // 設定レベルより低いログは無視
    }
    const entry = {
      timestamp: new Date().toISOString(),
      requestId,
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message, null, 2), // オブジェクトは整形して記録
    };
    logs.push(entry);
    // Netlify Functionsのログにも出力
    console.log(`[${entry.timestamp}][${level.toUpperCase()}][${requestId}] ${entry.message}`);
    return entry.message; // 主にテスト用
  };

  return {
    info: (message) => log(message, 'info'),
    warn: (message) => log(message, 'warn'),
    error: (message, error = null) => { // エラーオブジェクトを受け取れるように
      let logMessage = message;
      if (error instanceof Error) {
        logMessage += `: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`;
      } else if (error) {
         logMessage += `: ${JSON.stringify(error)}`;
      }
      log(logMessage, 'error');
    },
    debug: (message) => log(message, 'debug'),
    getLogs: () => logs,
  };
};

/**
 * 指数バックオフ付きのリトライロジックでURLを取得します。
 * @param {string} url - 取得するURL。
 * @param {object} options - axiosに渡すオプション。
 * @param {object} logger - ロギング用インスタンス。
 * @param {number} retries - 残りリトライ回数。
 * @param {number} delay - 次のリトライまでの遅延時間(ms)。
 * @returns {Promise<object>} axiosのレスポンスオブジェクト。
 * @throws {Error} リトライしても失敗した場合、または致命的なエラーの場合。
 */
const fetchWithRetry = async (url, options = {}, logger, retries = CONFIG.MAX_RETRIES, delay = CONFIG.INITIAL_RETRY_DELAY) => {
  const { timeout = CONFIG.DEFAULT_TIMEOUT, headers = {}, ...restOptions } = options;

  const defaultHeaders = {
    'User-Agent': CONFIG.USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  };

  logger.debug(`Fetching URL: ${url} (Retries left: ${retries})`);

  try {
    const response = await axios({
      url,
      timeout,
      headers: { ...defaultHeaders, ...headers },
      validateStatus: () => true, // 常にresolveさせ、後でステータスコードをチェック
      ...restOptions,
    });

    logger.debug(`Response from ${url}: Status ${response.status}, Size ${response.data?.length ?? 0} bytes`);

    // 成功またはリダイレクト(3xx)はOKとする場合もあるが、ここでは2xxのみ成功とする
    if (response.status >= 200 && response.status < 300) {
      return response;
    }

    // リトライ対象のエラーか判定 (例: 429 Too Many Requests, 5xx Server Error)
    if (response.status === 429 || response.status >= 500) {
       throw new Error(`HTTP ${response.status} ${response.statusText} - Retrying`);
    } else {
      // リトライ対象外のエラー (4xxなど)
      throw new Error(`HTTP ${response.status} ${response.statusText} - Not retrying`);
    }

  } catch (error) {
    logger.warn(`Error fetching ${url}: ${error.message}`);

    if (retries > 0 && error.message.includes('Retrying')) { // リトライ可能なエラーの場合のみ
      await new Promise(resolve => setTimeout(resolve, delay));
      // 次のリトライ遅延を指数的に増加させる
      return fetchWithRetry(url, options, logger, retries - 1, delay * CONFIG.RETRY_BACKOFF_FACTOR);
    } else {
      logger.error(`Failed to fetch ${url} after all retries or non-retryable error`, error);
      throw error; // 最終的に失敗したエラーを上位に投げる
    }
  }
};

/**
 * URLを正規化し、重複や不要な情報を除去します。
 * @param {string} url - 正規化するURL文字列。
 * @returns {string} 正規化されたURL文字列。無効なURLの場合は元の文字列を返す。
 */
const normalizeUrl = (url) => {
  try {
    const parsedUrl = new URL(url);

    // クエリパラメータを除去する場合 (必要に応じてコメント解除)
    // parsedUrl.search = '';

    // ハッシュフラグメントを除去
    parsedUrl.hash = '';

    // 末尾のスラッシュを削除 (ルートパス "/" は除く)
    if (parsedUrl.pathname.endsWith('/') && parsedUrl.pathname !== '/') {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }

    // ドメイン名を小文字に変換 (パス部分はケースセンシティブな場合があるのでそのまま)
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

    return parsedUrl.toString();
  } catch (e) {
    // URLコンストラクタが失敗した場合 (無効なURL)
    return url; // 元の値をそのまま返す
  }
};

/**
 * 標準的なAPIレスポンスオブジェクトを作成します。
 * @param {number} statusCode - HTTPステータスコード。
 * @param {object} body - レスポンスボディとなるオブジェクト。
 * @param {object|null} logger - ロガーインスタンス。デバッグ情報を含める場合に使用。
 * @returns {object} Netlify Functionsが期待するレスポンス形式。
 */
const createResponse = (statusCode, body, logger = null) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', // CORS設定 (本番ではより厳密に)
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // デバッグモードが有効な場合、ログを追加
  if (body.debug === true && logger) {
    body.logs = logger.getLogs();
  }
  // レスポンスボディからデバッグフラグ自体は削除 (クライアントに不要な情報)
  delete body.debug;


  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
};

// --- ステージ1: URL収集 --------------------------------------------------------

/**
 * 指定されたシードURLから開始し、同一ドメイン内のURLをBFSで収集します。
 * @param {string} seedUrl - クロールを開始するURL。
 * @param {number} maxPages - 収集する最大ページ数。
 * @param {object} logger - ロギング用インスタンス。
 * @returns {Promise<Array<object>>} 収集されたURL情報 ({ url, title, description, status }) の配列。
 * @throws {Error} 収集プロセス中に致命的なエラーが発生した場合。
 */
const collectUrls = async (seedUrl, maxPages, logger) => {
  logger.info(`Starting URL collection. Seed: ${seedUrl}, Max Pages: ${maxPages}`);
  const startTime = Date.now();

  let origin;
  let domain;
  try {
      const parsedSeedUrl = new URL(seedUrl);
      origin = parsedSeedUrl.origin;
      domain = parsedSeedUrl.hostname;
  } catch (e) {
      logger.error(`Invalid seed URL: ${seedUrl}`, e);
      throw new Error(`Invalid seed URL provided: ${seedUrl}`);
  }

  const queue = [normalizeUrl(seedUrl)];
  const seen = new Set(queue); // Setを使うことで重複チェックが高速に
  const results = [];
  const limit = pLimit(CONFIG.EXTRACTION_CONCURRENCY); // 収集時も並列数を少し制限

  // robots.txtの考慮 (簡易的な警告)
  // 注意: 本番環境では、robots.txtを実際に取得・解析し、
  //       Disallowルールに従う処理を追加することを強く推奨します。
  //       例: `robots-parser` ライブラリを使用
  logger.warn(`robots.txt check is not implemented. Ensure compliance with ${origin}/robots.txt`);
  // クロールディレイの考慮 (簡易的な警告)
  // 注意: ターゲットサーバーへの負荷を避けるため、連続リクエスト間に
  //       適切な待機時間 (例: 1秒以上) を設けることが推奨されます。
  //       現状はリトライ時の遅延のみです。

  while (queue.length > 0 && results.length < maxPages) {
    // タイムアウトチェック
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= CONFIG.COLLECTION_TIMEOUT_MS) {
      logger.warn(`URL collection timeout reached (${elapsedTime}ms). Collected ${results.length} pages.`);
      break;
    }

    const currentUrl = queue.shift();
    if (!currentUrl) continue; //念のため

    // 並列処理でフェッチ
    limit(async () => {
      try {
        // 注意: 待機時間を設ける場合はここに `await new Promise(resolve => setTimeout(resolve, 1000));` などを追加
        logger.debug(`Processing URL: ${currentUrl}`);
        const response = await fetchWithRetry(currentUrl, { responseType: 'text' }, logger); // HTMLをテキストとして取得

        // コンテンツタイプがHTMLかチェック (簡易)
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.toLowerCase().includes('text/html')) {
          logger.warn(`Skipping non-HTML content at ${currentUrl} (Content-Type: ${contentType})`);
          return; // HTMLでない場合はスキップ
        }

        const html = response.data;
        if (!html || typeof html !== 'string' || html.length < 50) { // 短すぎるコンテンツもスキップ
          logger.warn(`Skipping invalid or too short HTML content at ${currentUrl}`);
          return;
        }

        const $ = cheerio.load(html);

        // ページ情報を結果に追加 (既に上限なら追加しない)
        if (results.length < maxPages) {
            const title = $('title').text().trim() || '';
            const description = $('meta[name="description"]').attr('content')?.trim() ||
                               $('meta[property="og:description"]').attr('content')?.trim() || '';

            results.push({
              url: currentUrl,
              title,
              description: description.substring(0, 250), // 少し長めに取得
              status: response.status,
            });
            logger.info(`Collected (${results.length}/${maxPages}): ${currentUrl} (${title})`);
        } else {
             // 上限に達したらループを抜ける準備
             logger.info(`Reached max pages limit (${maxPages}). Stopping collection.`);
             // queueを空にするか、早期リターンが必要
             queue.length = 0; // キューを空にして処理を終了させる
             return;
        }


        // 新しいリンクを探索してキューに追加
        let newLinksFound = 0;
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href');
          if (!href) return;

          try {
            const absoluteUrl = new URL(href, currentUrl).href; // 相対URLを解決
            const normalized = normalizeUrl(absoluteUrl);
            const linkUrl = new URL(normalized); // 再度パースしてホスト名などをチェック

            // 同じドメイン、http/httpsプロトコル、未訪問、特定の拡張子やフラグメントを含まない
            if (
              linkUrl.hostname === domain &&
              /^https?:$/.test(linkUrl.protocol) &&
              !seen.has(normalized) &&
              !normalized.match(/\.(pdf|zip|exe|dmg|pkg|rar|7z|tar|gz|bz2|iso|xml|rss|atom|json|css|js)(\?.*)?$/i) && // より多くの不要拡張子を除外
              !normalized.match(/\.(jpe?g|png|gif|bmp|svg|webp|ico|tiff|mp3|mp4|avi|mov|wmv|flv|webm)(\?.*)?$/i) // 画像・動画・音声ファイルも除外
            ) {
               // 追加する前に再度上限チェック
               if (seen.size < maxPages * 5 && queue.length < maxPages * 3) { // seenやqueueが膨れ上がりすぎないように制限
                   seen.add(normalized);
                   queue.push(normalized);
                   newLinksFound++;
               }
            }
          } catch (e) {
            // 無効なhref属性などは無視
            logger.debug(`Ignoring invalid href: ${href} on page ${currentUrl}`);
          }
        });
         if (newLinksFound > 0) {
             logger.debug(`Found ${newLinksFound} new valid links on ${currentUrl}. Queue size: ${queue.length}, Seen: ${seen.size}`);
         }

      } catch (error) {
        // fetchWithRetry で最終的に失敗した場合など
        logger.error(`Failed to process URL ${currentUrl}`, error);
      }
    }); // end limit(async () => ...)
  } // end while loop

  // 並列処理の完了を待つ
  await limit.idle();

  logger.info(`URL collection finished. Collected ${results.length} pages.`);
  return results;
};

// --- ステージ2: コンテンツ抽出 (Jina AI) ---------------------------------------

/**
 * 指定されたURLリスト（バッチ）からJina AIを使用してコンテンツを抽出します。
 * @param {Array<object>} urls - 抽出対象のURLオブジェクト ({ url, title }) の配列。
 * @param {number} batchIndex - 現在のバッチ番号。
 * @param {number} batchSize - 1バッチあたりのURL数。
 * @param {object} logger - ロギング用インスタンス。
 * @returns {Promise<object>} 抽出結果 ({ results: Array, batchInfo: object }) を含むオブジェクト。
 * @throws {Error} 抽出プロセス中に致命的なエラーが発生した場合。
 */
const extractContentWithJinaAI = async (urls, batchIndex, batchSize, logger) => {
  const validatedBatchSize = Math.min(batchSize, CONFIG.MAX_ALLOWED_BATCH_SIZE);
  logger.info(`Starting content extraction. Batch Index: ${batchIndex}, Batch Size: ${validatedBatchSize}, Total URLs: ${urls.length}`);

  const startIdx = batchIndex * validatedBatchSize;
  const endIdx = Math.min(startIdx + validatedBatchSize, urls.length);
  const batchUrls = urls.slice(startIdx, endIdx);

  if (batchUrls.length === 0) {
    logger.warn('No URLs to process in this batch.');
    return {
        results: [],
        batchInfo: {
            current: batchIndex,
            next: -1, // これ以上ない
            isComplete: true,
            processedCount: endIdx,
            totalCount: urls.length,
        }
    };
  }

  logger.info(`Processing URLs ${startIdx + 1} to ${endIdx} of ${urls.length}`);
  const limit = pLimit(CONFIG.EXTRACTION_CONCURRENCY);
  const results = [];

  try {
    await Promise.all(
      batchUrls.map(urlObj => limit(async () => {
        const targetUrl = urlObj.url;
        const jinaUrl = `${CONFIG.JINA_AI_PREFIX}${targetUrl}`;
        logger.debug(`Requesting content from Jina AI for: ${targetUrl}`);

        try {
          // Jina AIへのリクエストヘッダーでAcceptを指定すると良い場合がある
          const response = await fetchWithRetry(jinaUrl, {
             headers: { 'Accept': 'text/plain' }, // プレーンテキストを期待
             responseType: 'text',
             timeout: CONFIG.DEFAULT_TIMEOUT + 2000 // Jinaは少し時間がかかる場合があるので長めに
          }, logger);

          const contentText = response.data?.trim() || ''; // 前後の空白を除去

          if (contentText.length === 0) {
              logger.warn(`Jina AI returned empty content for ${targetUrl}`);
              //空でも成功として扱うか、エラーとして扱うかは要件次第
              results.push({
                url: targetUrl,
                title: urlObj.title,
                success: false, // 空の場合は失敗扱いにする
                error: 'Jina AI returned empty content',
                content: '',
                contentLength: 0,
                timestamp: new Date().toISOString(),
              });
          } else {
             logger.debug(`Successfully extracted content for ${targetUrl}, Length: ${contentText.length} chars`);
             results.push({
                url: targetUrl,
                title: urlObj.title,
                success: true,
                content: contentText,
                contentLength: contentText.length,
                timestamp: new Date().toISOString(),
              });
          }
        } catch (error) {
          logger.error(`Failed to extract content using Jina AI for ${targetUrl}`, error);
          results.push({
            url: targetUrl,
            title: urlObj.title,
            success: false,
            error: error.message || 'Unknown extraction error',
            timestamp: new Date().toISOString(),
          });
        }
      }))
    );

    const isComplete = endIdx >= urls.length;
    const batchInfo = {
      current: batchIndex,
      next: isComplete ? -1 : batchIndex + 1,
      isComplete: isComplete,
      processedCount: endIdx,
      totalCount: urls.length,
    };

    const successCount = results.filter(r => r.success).length;
    logger.info(`Content extraction finished for batch ${batchIndex}. Success: ${successCount}/${batchUrls.length}`);

    return { results, batchInfo };

  } catch (error) {
    // p-limit自体や予期せぬエラー
    logger.error(`Fatal error during content extraction batch ${batchIndex}`, error);
    throw error; // 上位に投げて処理全体を失敗させる
  }
};

// --- ステージ3: 情報分析 (Gemini API) -----------------------------------------

/**
 * 業種に応じたGemini APIへの分析プロンプトを構築します。
 * @param {string} storeType - 店舗の業種 (例: 'restaurant', 'salon')。
 * @param {string} content - 分析対象の結合されたテキストコンテンツ。
 * @returns {string} Gemini APIに送信するプロンプト文字列。
 */
const buildAnalysisPrompt = (storeType, content) => {
  // 共通の指示部分
  const commonInstructions = `
あなたは高精度な店舗情報抽出エキスパートAIです。提供された複数のウェブページのコンテンツから、以下の指示に従って店舗情報を抽出し、指定されたJSON形式で構造化してください。

**抽出ルール:**
1.  **正確性重視:** 複数のページに情報がある場合、最も信頼性が高く詳細な情報を採用してください。情報が明確に見つからないフィールドは `null` または空文字列 `""`、空配列 `[]` を使用し、**絶対に推測や創作をしないでください**。
2.  **網羅性:** 指定されたJSONスキーマの全フィールドについて情報を探してください。
3.  **一貫性:** 電話番号、住所、営業時間などの形式は可能な限り統一してください。
4.  **JSON形式厳守:** 回答は必ず下記の指定されたJSON形式のコードブロック内のみで出力してください。コードブロック以外のテキスト（例: "以下に結果を示します"など）は一切含めないでください。

**抽出対象のウェブサイトコンテンツ:**
--- BEGIN CONTENT ---
${content}
--- END CONTENT ---

**出力形式 (JSON):**
`;

  // 基本となるJSONスキーマ
  const baseSchema = `{
  "storeName": "店舗名 (文字列 or null)",
  "description": "店舗や会社の特徴を簡潔にまとめた説明 (文字列 or null)",
  "address": "完全な住所 (文字列 or null)",
  "phoneNumber": "主要な電話番号 (文字列 or null)",
  "businessHours": "営業時間に関する記述 (文字列 or null)",
  "定休日": "定休日に関する記述 (文字列 or null)",
  "websiteUrl": "公式サイトのURL (あれば, 文字列 or null)",
  "features": ["店舗の特筆すべき特徴や強み (文字列の配列 or [])"],
  "services": ["提供している主要なサービスや商品 (文字列の配列 or [])"],
  "mainImageUrl": "代表的な画像URL (og:imageなどから, 文字列 or null)",
  "socialLinks": {
    "twitter": "Twitter URL (文字列 or null)",
    "instagram": "Instagram URL (文字列 or null)",
    "facebook": "Facebook URL (文字列 or null)",
    "line": "LINEアカウント情報 (文字列 or null)",
    "youtube": "YouTubeチャンネルURL (文字列 or null)",
    "tiktok": "TikTok URL (文字列 or null)"
  },
  "paymentMethods": ["利用可能な支払い方法 (文字列の配列 or [])"],
  "accessInfo": "アクセス方法や最寄り駅からの時間など (文字列 or null)",
  "contactFormUrl": "問い合わせフォームページのURL (文字列 or null)",
  "representativeName": "代表者名 (文字列 or null)",
  "establishmentDate": "設立日や開店日 (文字列 or null)"
}`;

  // 業種別に追加するフィールド
  const storeSpecificSchemas = {
    'restaurant': `,
  "cuisine": ["料理のジャンル (文字列の配列 or [])"],
  "menuHighlights": ["おすすめメニューや看板メニュー (文字列の配列 or [])"],
  "priceRange": "価格帯情報 (例: 'ランチ ¥1,000~, ディナー ¥3,000~', 文字列 or null)",
  "reservationUrl": "予約ページのURLまたは予約方法の説明 (文字列 or null)",
  "hasTakeout": "テイクアウト可能か (boolean or null)",
  "hasDelivery": "デリバリー可能か (boolean or null)",
  "seatInfo": "席数や個室情報 (文字列 or null)"
`,
    'salon': `,
  "specialties": ["得意な施術や分野 (文字列の配列 or [])"],
  "stylistInfo": ["在籍スタイリストの情報や紹介 (文字列の配列 or [])"],
  "priceRange": "主要な施術の価格帯 (文字列 or null)",
  "reservationUrl": "予約システムのURLまたは予約方法 (文字列 or null)",
  "hairCatalogUrl": "ヘアカタログページのURL (文字列 or null)"
`,
    'retail': `,
  "productCategories": ["主な取扱商品カテゴリ (文字列の配列 or [])"],
  "brands": ["取扱ブランド (文字列の配列 or [])"],
  "onlineStoreUrl": "オンラインストアのURL (文字列 or null)",
  "returnPolicy": "返品・交換ポリシーに関する情報 (文字列 or null)"
`,
    'medical': `,
  "medicalDepartments": ["診療科目 (文字列の配列 or [])"],
  "doctorInfo": ["医師の紹介 (文字列の配列 or [])"],
  "insuranceAccepted": "保険適用の有無や種類 (文字列 or null)",
  "reservationInfo": "予約方法や予約要否 (文字列 or null)"
`,
    // 'general' または未定義の業種は基本スキーマのみ
    'general': ''
  };

  // 最終的なJSONスキーマを構築
  const schemaAddition = storeSpecificSchemas[storeType] || '';
  // 最後の } を削除し、業種別フィールドを追加し、再度 } を追加
  const finalSchema = baseSchema.slice(0, -1) + schemaAddition + '\n}';

  // プロンプト全体を結合
  return `${commonInstructions}\n\`\`\`json\n${finalSchema}\n\`\`\``;
};


/**
 * 抽出されたコンテンツをGemini APIに送信し、構造化された店舗情報を分析・取得します。
 * @param {Array<object>} contentItems - 抽出されたコンテンツ ({ url, title, success, content, ... }) の配列。
 * @param {string} storeType - 分析する店舗の業種。
 * @param {object} logger - ロギング用インスタンス。
 * @returns {Promise<object>} 分析結果のJSONオブジェクト。エラー時は { error: string, rawResponse?: string } を含む。
 * @throws {Error} APIキーがない場合や、API通信中に致命的なエラーが発生した場合。
 */
const analyzeWithGemini = async (contentItems, storeType, logger) => {
  if (!CONFIG.GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY is not configured in environment variables.');
    throw new Error('Gemini API key is missing. Cannot perform analysis.');
  }

  logger.info(`Starting content analysis with Gemini. Store Type: ${storeType}, Items: ${contentItems.length}`);

  const validItems = contentItems.filter(item => item.success && item.content && item.content.trim().length > 0);

  if (validItems.length === 0) {
    logger.warn('No valid content items found for analysis.');
    return { error: 'No valid content provided for analysis.', _meta: { analyzedUrls: 0, totalUrls: contentItems.length, storeType, timestamp: new Date().toISOString()} };
  }

  // コンテンツを結合し、長さを制限
  let combinedContent = validItems.map(item => {
      // 各アイテムのコンテンツも個別に制限（Geminiへの負荷軽減）
       const truncatedItemContent = item.content.length > CONFIG.GEMINI_MAX_CONTENT_LENGTH / validItems.length
         ? item.content.substring(0, CONFIG.GEMINI_MAX_CONTENT_LENGTH / validItems.length) + '...[truncated]'
         : item.content;
      return `## Page URL: ${item.url}\n## Page Title: ${item.title || 'N/A'}\n\n${truncatedItemContent}`;
    }).join('\n\n---\n\n');

  // 全体の長さを最終チェック
  if (combinedContent.length > CONFIG.GEMINI_MAX_CONTENT_LENGTH) {
    logger.warn(`Combined content length (${combinedContent.length}) exceeds limit (${CONFIG.GEMINI_MAX_CONTENT_LENGTH}). Truncating.`);
    combinedContent = combinedContent.substring(0, CONFIG.GEMINI_MAX_CONTENT_LENGTH) + '\n\n...[Combined content truncated]';
  }

  logger.debug(`Combined content length for Gemini: ${combinedContent.length} chars from ${validItems.length} pages.`);

  const analysisPrompt = buildAnalysisPrompt(storeType || CONFIG.DEFAULT_STORE_TYPE, combinedContent);
  logger.debug(`Generated Gemini Prompt (first 500 chars): ${analysisPrompt.substring(0, 500)}...`);

  try {
    logger.info(`Sending request to Gemini API endpoint: ${CONFIG.GEMINI_ENDPOINT}`);
    const response = await axios.post(
      `${CONFIG.GEMINI_ENDPOINT}?key=${CONFIG.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: analysisPrompt }] }],
        generationConfig: {
          temperature: CONFIG.GEMINI_TEMPERATURE,
          maxOutputTokens: CONFIG.GEMINI_MAX_OUTPUT_TOKENS,
          topK: CONFIG.GEMINI_TOP_K,
          topP: CONFIG.GEMINI_TOP_P,
          // レスポンス形式をJSONに指定 (Gemini 1.5 Pro以降で利用可能)
          response_mime_type: "application/json",
        },
        // 安全性設定はデフォルトまたは必要に応じて調整
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: CONFIG.DEFAULT_TIMEOUT * 3 // 分析は時間がかかる可能性があるので長めに
      }
    );

    logger.debug(`Gemini API Response Status: ${response.status}`);

    // Geminiからのレスポンス構造を確認
    // response_mime_type: "application/json" を指定した場合、直接JSONが返ることを期待
    const generatedContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedContent) {
      // レスポンスがない、または期待した構造でない場合
      logger.error('No valid content generated by Gemini API.', response.data);
      // 停止理由などをログに出力
      const finishReason = response.data?.candidates?.[0]?.finishReason;
      const safetyRatings = response.data?.candidates?.[0]?.safetyRatings;
       if (finishReason) logger.error(`Gemini Finish Reason: ${finishReason}`);
       if (safetyRatings) logger.error(`Gemini Safety Ratings: ${JSON.stringify(safetyRatings)}`);
      throw new Error('Gemini API did not return valid content.');
    }

    logger.debug(`Received raw response from Gemini API (first 500 chars): ${generatedContent.substring(0, 500)}...`);

    // JSONパース試行
    try {
      const analysisResult = JSON.parse(generatedContent);
      logger.info('Successfully parsed JSON response from Gemini.');

      // メタ情報を付与して返す
      return {
        ...analysisResult,
        _meta: {
          analyzedUrls: validItems.length,
          totalUrlsProvided: contentItems.length,
          storeType: storeType || CONFIG.DEFAULT_STORE_TYPE,
          modelUsed: response.data?.candidates?.[0]?.model || 'gemini-2.0-flash', // 使用モデル情報
          finishReason: response.data?.candidates?.[0]?.finishReason,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (parseError) {
      logger.error('Failed to parse JSON from Gemini response. The response might not be valid JSON.', parseError);
      logger.error(`Raw Gemini Response that failed parsing:\n${generatedContent}`);
      // パース失敗時はエラー情報と生レスポンスを返す
      return {
        error: 'Failed to parse structured data from Gemini response.',
        rawResponse: generatedContent, // クライアント側で確認できるように生データを返す
        _meta: {
          analyzedUrls: validItems.length,
          totalUrlsProvided: contentItems.length,
          storeType: storeType || CONFIG.DEFAULT_STORE_TYPE,
          timestamp: new Date().toISOString(),
        },
      };
    }
  } catch (error) {
    logger.error('Error occurred during Gemini API request or processing.', error);
    // axiosエラーの場合、レスポンス内容もログに出力
    if (error.response) {
      logger.error(`Gemini API Error Response Status: ${error.response.status}`);
      logger.error(`Gemini API Error Response Data: ${JSON.stringify(error.response.data)}`);
    }
    // エラーを再スローするか、エラー情報を返すかは設計次第
    // ここではエラー情報を返す
     return {
        error: `Gemini API analysis failed: ${error.message}`,
        _meta: {
          analyzedUrls: validItems.length,
          totalUrlsProvided: contentItems.length,
          storeType: storeType || CONFIG.DEFAULT_STORE_TYPE,
          timestamp: new Date().toISOString(),
        },
     };
  }
};


// --- 一括処理 (小規模サイト用) -----------------------------------------------

/**
 * URL収集、コンテンツ抽出、情報分析を一つのリクエストで実行します（小規模サイト向け）。
 * @param {string} seedUrl - 開始URL。
 * @param {number} maxPages - 収集・分析する最大ページ数。
 * @param {string} storeType - 分析する店舗の業種。
 * @param {object} logger - ロギング用インスタンス。
 * @returns {Promise<object>} 分析結果、処理したURL数などの情報を含むオブジェクト。
 * @throws {Error} 処理中に致命的なエラーが発生した場合。
 */
const processAll = async (seedUrl, maxPages, storeType, logger) => {
  const validatedMaxPages = Math.min(maxPages, CONFIG.MAX_ALLOWED_PAGES / 2); // 一括処理では上限を少し厳しめに
  logger.info(`Starting all-in-one process. URL: ${seedUrl}, Max Pages: ${validatedMaxPages}, Store Type: ${storeType}`);
  const processStartTime = Date.now();

  try {
    // ステップ1: URL収集
    logger.info('Step 1: Collecting URLs...');
    const collectedUrls = await collectUrls(seedUrl, validatedMaxPages, logger);

    if (!collectedUrls || collectedUrls.length === 0) {
      logger.warn('No URLs collected. Aborting process-all.');
      return { error: 'No URLs were collected from the seed URL.', urlCount: { collected: 0 } };
    }
    logger.info(`Collected ${collectedUrls.length} URLs.`);

    // ステップ2: コンテンツ抽出 (全URLを一括で)
    logger.info('Step 2: Extracting content...');
    // バッチ処理を使わず、収集した全URLを1バッチとして処理（ただし並列数は制御）
    const { results: contentResults, batchInfo } = await extractContentWithJinaAI(collectedUrls, 0, collectedUrls.length, logger);

    const validContentItems = contentResults.filter(item => item.success && item.content);
    if (validContentItems.length === 0) {
      logger.warn('No valid content could be extracted from the collected URLs.');
      return {
          error: 'Failed to extract content from any URL.',
          urlCount: { collected: collectedUrls.length, processed: contentResults.length, successfulExtraction: 0 }
      };
    }
    logger.info(`Successfully extracted content from ${validContentItems.length}/${contentResults.length} pages.`);

    // ステップ3: 情報分析
    logger.info('Step 3: Analyzing content with Gemini...');
    const analysisResult = await analyzeWithGemini(validContentItems, storeType, logger);

    const processEndTime = Date.now();
    logger.info(`All-in-one process completed successfully in ${(processEndTime - processStartTime) / 1000} seconds.`);

    return {
      storeInfo: analysisResult, // 分析結果（エラー情報を含む可能性あり）
      processedUrls: validContentItems.map(item => item.url),
      urlCount: {
        collected: collectedUrls.length,
        processedForExtraction: contentResults.length,
        successfulExtraction: validContentItems.length,
        analyzed: validContentItems.length, // 分析対象となった数
      },
      durationMs: processEndTime - processStartTime,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    logger.error('Error occurred during the all-in-one process.', error);
    // エラー発生時も、それまでの情報を一部返すことを検討できる
    // ここでは、プロセス全体のエラーとして投げる
    throw new Error(`All-in-one process failed: ${error.message}`);
  }
};


// --- Netlify Function ハンドラー --------------------------------------------

export const handler = async (event) => {
  // OPTIONS リクエスト (プリフライト) 対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*', // 必要に応じて制限
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400', // 24時間キャッシュ
      },
      body: '',
    };
  }

  // POST以外のメソッドは拒否
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, error: 'Method Not Allowed. Only POST is accepted.' });
  }

  // リクエストID生成とロガー初期化
  const requestId = crypto.randomBytes(6).toString('hex'); // 短縮
  const logger = createLogger(requestId);
  logger.info(`Request received. Path: ${event.path}, Method: ${event.httpMethod}`);

  let body;
  try {
    if (!event.body) {
        throw new Error('Request body is missing.');
    }
    body = JSON.parse(event.body);
    // デバッグ用にリクエストボディをログ出力（機密情報が含まれないか注意）
    // logger.debug(`Request body parsed: ${JSON.stringify(body)}`);
  } catch (e) {
    logger.error('Failed to parse request body as JSON.', e);
    return createResponse(400, { success: false, requestId, error: 'Invalid JSON format in request body.' }, logger);
  }

  // デバッグフラグの取得（レスポンスにログを含めるか）
  const isDebugMode = body.debug === true;

  const { operationType } = body;
  if (!operationType) {
    logger.error('Missing required parameter: operationType');
    return createResponse(400, { success: false, requestId, error: 'Missing required parameter: operationType', debug: isDebugMode }, logger);
  }

  logger.info(`Processing operationType: ${operationType}`);

  try {
    let result;
    switch (operationType) {
      case 'collect-urls': {
        const { url, maxPages = CONFIG.DEFAULT_MAX_PAGES } = body;
        if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) {
           logger.error('Invalid or missing "url" parameter for collect-urls.');
           return createResponse(400, { success: false, requestId, error: 'Valid "url" parameter starting with http:// or https:// is required.', debug: isDebugMode }, logger);
        }
        const validatedMaxPages = Math.min(Number(maxPages) || CONFIG.DEFAULT_MAX_PAGES, CONFIG.MAX_ALLOWED_PAGES);
        const urls = await collectUrls(url, validatedMaxPages, logger);
        result = { urls, count: urls.length, seedUrl: url };
        break;
      }

      case 'extract-content': {
        const { urls, batchIndex = 0, batchSize = CONFIG.DEFAULT_BATCH_SIZE } = body;
        if (!Array.isArray(urls) || urls.length === 0 || !urls.every(item => typeof item === 'object' && item.url)) {
             logger.error('Invalid or missing "urls" array for extract-content.');
             return createResponse(400, { success: false, requestId, error: 'A non-empty array of URL objects (each with a "url" property) is required for "urls".', debug: isDebugMode }, logger);
        }
        const validatedBatchIndex = Math.max(0, Number(batchIndex) || 0);
        const validatedBatchSize = Math.min(Math.max(1, Number(batchSize) || CONFIG.DEFAULT_BATCH_SIZE), CONFIG.MAX_ALLOWED_BATCH_SIZE);
        const { results, batchInfo } = await extractContentWithJinaAI(urls, validatedBatchIndex, validatedBatchSize, logger);
        result = { contentResults: results, batchInfo };
        break;
      }

      case 'analyze-info': {
        const { contentItems, storeType = CONFIG.DEFAULT_STORE_TYPE } = body;
         if (!Array.isArray(contentItems) || contentItems.length === 0 || !contentItems.every(item => typeof item === 'object' && 'url' in item && 'success' in item)) {
             logger.error('Invalid or missing "contentItems" array for analyze-info.');
             return createResponse(400, { success: false, requestId, error: 'A non-empty array of content item objects (each with "url" and "success" properties) is required for "contentItems".', debug: isDebugMode }, logger);
         }
        const analysisResult = await analyzeWithGemini(contentItems, storeType, logger);
        result = { storeInfo: analysisResult };
        break;
      }

      case 'process-all': {
         const { url, maxPages = 5, storeType = CONFIG.DEFAULT_STORE_TYPE } = body; // process-allのデフォルトは少なめ
          if (!url || typeof url !== 'string' || !/^https?:\/\//.test(url)) {
           logger.error('Invalid or missing "url" parameter for process-all.');
           return createResponse(400, { success: false, requestId, error: 'Valid "url" parameter starting with http:// or https:// is required.', debug: isDebugMode }, logger);
          }
          const validatedMaxPages = Math.min(Number(maxPages) || 5, Math.floor(CONFIG.MAX_ALLOWED_PAGES / 2)); // 上限も設定
          result = await processAll(url, validatedMaxPages, storeType, logger);
          break;
      }

      default:
        logger.error(`Unknown operationType received: ${operationType}`);
        return createResponse(400, { success: false, requestId, error: `Invalid operationType: ${operationType}. Valid types are: collect-urls, extract-content, analyze-info, process-all.`, debug: isDebugMode }, logger);
    }

    // 成功レスポンス
    logger.info(`Operation ${operationType} completed successfully.`);
    return createResponse(200, { success: true, requestId, ...result, debug: isDebugMode }, logger);

  } catch (error) {
    // ハンドラ全体でキャッチされなかった、または各処理関数からスローされたエラー
    logger.error(`Unhandled error during operation ${operationType}.`, error);
    return createResponse(500, {
      success: false,
      requestId,
      error: `An internal server error occurred during operation ${operationType}. Please check logs for details. Error: ${error.message}`,
      debug: isDebugMode // エラー時もデバッグログを出力可能に
    }, logger);
  }
};