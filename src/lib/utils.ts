// src/lib/utils.js
import { format, formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 日付フォーマット関数
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return format(date, 'yyyy年MM月dd日', { locale: ja });
};

// 相対時間フォーマット関数
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  return formatDistanceToNow(date, { addSuffix: true, locale: ja });
};

// 星評価の表示用関数
export const getRatingStars = (rating) => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

// QRコードURLの生成関数
export const generateQRCodeUrl = (
  text,
  size = 300
) => {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    text
  )}&size=${size}x${size}`;
};

// Googleマップ口コミ投稿ページURLの生成関数
export const getGoogleReviewUrl = (placeId) => {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
};

// テキストの短縮関数
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// メッセージの安全な表示（XSS対策）
export const sanitizeMessage = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// 配列をシャッフルする関数
export const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// APIリクエスト用のヘルパー関数
export const fetchWithError = async (
  url,
  options = {}
) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * URL validation function - Enhanced for web scraping
 * @param {string} url URL to validate
 * @returns {boolean} True if URL is valid
 */
export const validateUrl = (url) => {
  if (!url) return false;
  
  try {
    // URLの形式を整える
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    // Try to create URL object (catches most invalid URLs)
    new URL(formattedUrl);
    
    // Additional check for http/https protocol and valid domain structure
    // This regex ensures the URL has a valid domain with a TLD
    const pattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    return pattern.test(formattedUrl);
  } catch (e) {
    return false;
  }
};

/**
 * Robust URL validation and normalization
 * @param {string} url Input URL that may be partial
 * @returns {string|null} Normalized URL or null if invalid
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Trim whitespace
  let formattedUrl = url.trim();
  
  // Add protocol if missing
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }
  
  try {
    // Validate with URL constructor
    const urlObj = new URL(formattedUrl);
    
    // Basic validation - must have domain with TLD
    if (!urlObj.hostname || !urlObj.hostname.includes('.')) {
      return null;
    }
    
    return urlObj.href;
  } catch (e) {
    return null;
  }
};

/**
 * Jina Reader APIのURLを生成する関数
 * @param {string} url 変換対象のURL
 * @param {object} options オプション
 * @returns {string} Jina Reader API URL
 */
export const getJinaReaderUrl = (url, options = {}) => {
  if (!url) return '';
  
  // URLエンコード
  const encodedUrl = encodeURIComponent(url);
  return `https://r.jina.ai/${encodedUrl}`;
};

/**
 * Jina Search APIのURLを生成する関数
 * @param {string} query 検索クエリ
 * @param {object} options オプション
 * @returns {string} Jina Search API URL
 */
export const getJinaSearchUrl = (query, options = {}) => {
  if (!query) return '';
  
  // クエリエンコード
  const encodedQuery = encodeURIComponent(query);
  let searchUrl = `https://s.jina.ai/?q=${encodedQuery}`;
  
  // サイト制限オプションの追加
  if (options.site) {
    const sites = Array.isArray(options.site) ? options.site : [options.site];
    sites.forEach(site => {
      searchUrl += `&site=${encodeURIComponent(site)}`;
    });
  }
  
  return searchUrl;
};

/**
 * マークダウンからプレーンテキストに変換する関数
 * @param {string} markdown マークダウンテキスト
 * @returns {string} プレーンテキスト
 */
export const markdownToPlainText = (markdown) => {
  if (!markdown) return '';
  
  return markdown
    // ヘッダーの処理
    .replace(/#{1,6}\s+/g, '')
    // 強調の処理
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    // 斜体の処理
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // コードブロックの処理
    .replace(/```[\s\S]*?```/g, '')
    // インラインコードの処理
    .replace(/`([^`]+)`/g, '$1')
    // リンクの処理
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    // 画像の処理
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '')
    // リストの処理
    .replace(/^[\*\-+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 改行の整理
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * 信頼度スコアを計算する関数
 * @param {object} data 抽出されたデータ
 * @param {object} details 詳細情報
 * @returns {object} 信頼度スコア
 */
export const calculateConfidenceScores = (data, details = {}) => {
  // AIからの信頼度を使用（あれば）
  if (details?.aiConfidence) {
    const baseConfidence = details.aiConfidence;
    return {
      name: Math.min(baseConfidence + 0.2, 1.0),
      description: baseConfidence,
      features: baseConfidence - 0.1,
      location: baseConfidence - 0.05
    };
  }
  
  // 簡易的な信頼度計算（フォールバックの場合）
  const nameScore = data.name ? 0.8 : 0.3;
  const descriptionScore = data.description ? (data.description.length > 50 ? 0.8 : 0.5) : 0.2;
  const featuresScore = Array.isArray(data.features) && data.features.length > 0 ? 
                         Math.min(0.7 + (data.features.length * 0.05), 0.9) : 0.3;
  const locationScore = data.location ? 0.85 : 0.2;
  
  return {
    name: nameScore,
    description: descriptionScore,
    features: featuresScore,
    location: locationScore
  };
};

/**
 * メタデータからキーワードを抽出する関数
 * @param {string} metaKeywords メタキーワード文字列
 * @param {number} maxKeywords 最大キーワード数
 * @returns {string[]} キーワードの配列
 */
export const extractKeywords = (metaKeywords, maxKeywords = 10) => {
  if (!metaKeywords) return [];
  
  // カンマで分割して整形
  const keywords = metaKeywords
    .split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
  
  // 重複を排除
  const uniqueKeywords = [...new Set(keywords)];
  
  // 最大数に制限
  return uniqueKeywords.slice(0, maxKeywords);
};

/**
 * HTMLから日本の住所を抽出する関数
 * @param {string} htmlOrText HTMLまたはテキスト
 * @returns {string|null} 抽出された住所または null
 */
export const extractJapaneseAddress = (htmlOrText) => {
  if (!htmlOrText) return null;
  
  // 日本の住所パターン
  const patterns = [
    // 郵便番号から始まるパターン
    /〒\s*([0-9]{3}[-−ー]?[0-9]{4})\s*([^<>\r\n]+[都道府県][^<>\r\n]+[市区町村][^<>\r\n]*)/,
    // 都道府県から始まるパターン
    /([^<>\r\n]{2,3}[都道府県][^<>\r\n]+[市区町村][^<>\r\n]+)/,
    // 市区町村から始まるパターン（郵便番号なし）
    /([^<>\r\n]+[市区町村][^<>\r\n]+[0-9０-９]+[^<>\r\n]*[0-9０-９]+[^<>\r\n\-−ー]*)/
  ];
  
  // 各パターンで試行
  for (const pattern of patterns) {
    const match = htmlOrText.match(pattern);
    if (match) {
      // 郵便番号付きの場合
      if (match[1] && match[1].match(/[0-9]{3}[-−ー]?[0-9]{4}/)) {
        return `〒${match[1]} ${match[2]}`.trim();
      }
      // それ以外の場合
      return match[1].trim();
    }
  }
  
  return null;
};

/**
 * 住所・場所の正規化を行う関数
 * @param {string} address 正規化する住所
 * @returns {string} 正規化された住所
 */
export const normalizeAddress = (address) => {
  if (!address) return '';
  
  // 余分な空白の削除
  let normalized = address.replace(/\s+/g, ' ').trim();
  
  // 全角数字を半角に変換
  normalized = normalized.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
  
  // 郵便番号を統一フォーマットに
  normalized = normalized.replace(/〒\s*([0-9]{3})[-−ー]?([0-9]{4})/, '〒$1-$2');
  
  return normalized;
};

/**
 * エラーメッセージをユーザーフレンドリーにする関数
 * @param {Error|string} error エラーまたはエラーメッセージ
 * @returns {string} ユーザーフレンドリーなエラーメッセージ
 */
export const getUserFriendlyErrorMessage = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes('<!DOCTYPE') || message.includes('not valid JSON')) {
    return 'サーバーからの応答が無効です。しばらく待ってから再試行してください。';
  } else if (message.includes('Empty response')) {
    return 'サーバーからの応答がありませんでした。ネットワーク接続を確認して再試行してください。';
  } else if (message.includes('Network Error') || message.includes('ECONNREFUSED')) {
    return 'ネットワークエラー: サーバーに接続できませんでした。';
  } else if (message.includes('timeout')) {
    return 'タイムアウトエラー: サーバーからの応答に時間がかかりすぎています。';
  } else if (message.includes('404')) {
    return 'リソースが見つかりません。URLを確認してください。';
  } else if (message.includes('403')) {
    return 'アクセスが拒否されました。権限を確認してください。';
  }
  
  return message;
};

// tailwindcss用のユーティリティ関数
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default {
  formatDate,
  formatRelativeTime,
  getRatingStars,
  generateQRCodeUrl,
  getGoogleReviewUrl,
  truncateText,
  sanitizeMessage,
  shuffleArray,
  fetchWithError,
  validateUrl,
  normalizeUrl,
  getJinaReaderUrl,
  getJinaSearchUrl,
  markdownToPlainText,
  calculateConfidenceScores,
  extractKeywords,
  extractJapaneseAddress,
  normalizeAddress,
  getUserFriendlyErrorMessage,
  cn
};