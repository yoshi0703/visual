// src/lib/messagegenerator.ts
import { Message } from '../types';

/**
 * 会話の内容を分析して、クレーム内容や関心を持った商品/サービスなどを特定する
 * @param conversation 会話内容
 * @returns 分析結果
 */
export const analyzeConversation = (conversation: Message[]) => {
  // ユーザーメッセージの抽出
  const userMessages = conversation
    .filter(msg => msg.role === 'user')
    .map(msg => msg.text || '');
  
  // 全メッセージの結合テキスト（分析用）
  const fullText = userMessages.join(' ').toLowerCase();
  
  // クレーム・不満の検出
  const complaintKeywords = ['不満', '残念', '悪い', '良くない', '改善', 'ひどい', '最悪', 
    'がっかり', '最低', '遅い', '待た', '高すぎ', '接客が悪', '対応が悪', '態度', '失礼', 
    'クレーム', '問題'];
  
  const hasComplaints = complaintKeywords.some(keyword => 
    fullText.includes(keyword)
  );
  
  // 具体的なクレーム内容の特定
  let complaintType = '';
  
  if (hasComplaints) {
    const serviceComplaints = ['接客', '対応', '態度', '店員', 'スタッフ', '従業員', 'サービス'].some(k => fullText.includes(k));
    const productComplaints = ['商品', '料理', '品質', '味', '材料', '鮮度', 'メニュー'].some(k => fullText.includes(k));
    const environmentComplaints = ['店内', '雰囲気', '席', '座席', '清潔', '騒が', '音', '明る', '暗い', '温度'].some(k => fullText.includes(k));
    const priceComplaints = ['価格', '料金', '高い', '高すぎ', '高額', '費用'].some(k => fullText.includes(k));
    const waitComplaints = ['待ち時間', '待た', '遅い', '時間がかかる'].some(k => fullText.includes(k));
    
    if (serviceComplaints) complaintType = 'service';
    else if (productComplaints) complaintType = 'product';
    else if (environmentComplaints) complaintType = 'environment';
    else if (priceComplaints) complaintType = 'price';
    else if (waitComplaints) complaintType = 'wait';
  }
  
  // ポジティブなフィードバックの検出
  const positiveKeywords = ['良い', '素晴らしい', '美味しい', '満足', '快適', '親切', '丁寧',
    'おいしい', '嬉しい', '楽しい', '気に入った', '最高', '最良', 'また来たい'];
  
  const hasPositiveFeedback = positiveKeywords.some(keyword => 
    fullText.includes(keyword)
  );
  
  // 興味を示した商品・サービスの特定
  const productKeywords = ['料理', '商品', 'メニュー', '品', '製品', 'サービス', 'コース'];
  
  let interestedProducts: string[] = [];
  
  // 商品名・サービス名の抽出（実際はもっと複雑な処理が必要）
  // ここでは簡易的に「◯◯が良かった」「◯◯が気に入った」などのパターンで抽出
  userMessages.forEach(message => {
    const matches = message.match(/[「『](.+?)[」』]/g) || 
                    message.match(/(.+?)(?:が|は)(?:良|よ|美味|おい|すごく|とても)/g);
    
    if (matches) {
      matches.forEach(match => {
        const product = match.replace(/[「『」』]/g, '').replace(/(?:が|は)(?:良|よ|美味|おい|すごく|とても).*$/, '').trim();
        if (product.length > 0 && product.length < 20) { // 極端に長いものは除外
          interestedProducts.push(product);
        }
      });
    }
  });
  
  // 改善要望の有無を検出
  const suggestionKeywords = ['提案', '要望', '改善', 'すれば', 'したら', 'してほしい', 'ほしい', 
    'あれば', 'もっと', '増やして', '減らして', '変えて'];
  
  const hasSuggestions = suggestionKeywords.some(keyword => 
    fullText.includes(keyword)
  );
  
  return {
    hasComplaints,
    complaintType,
    hasPositiveFeedback,
    interestedProducts: [...new Set(interestedProducts)], // 重複を排除
    hasSuggestions
  };
};

/**
 * 会話内容に基づいて店舗からのメッセージを動的に生成する
 * @param conversation 会話内容
 * @param storeName 店舗名
 * @returns 生成されたメッセージ
 */
export const generateStoreMessage = (conversation: Message[], storeName: string = '当店') => {
  const analysis = analyzeConversation(conversation);
  let message = '';
  
  // 1. 謝意表明
  message += `${storeName}へのご来店、またインタビューへのご協力をいただき誠にありがとうございました。`;
  
  // 2. クレーム内容への対応（ある場合）
  if (analysis.hasComplaints) {
    message += '\n\n';
    
    // クレームタイプに応じたメッセージ
    switch (analysis.complaintType) {
      case 'service':
        message += `スタッフの対応についてご不満を抱かせてしまい、大変申し訳ございませんでした。ご指摘いただいた点については、早速スタッフ間で共有し、接客研修を実施して改善してまいります。お客様に快適にお過ごしいただけるサービスを提供できるよう努めてまいります。`;
        break;
      case 'product':
        message += `商品・お料理の品質につきましてご期待に添えず、申し訳ございませんでした。品質管理の徹底と、お客様にご満足いただける商品開発に取り組んでまいります。貴重なご意見として、商品改善の参考にさせていただきます。`;
        break;
      case 'environment':
        message += `店内の環境についてご不便をおかけし、申し訳ございませんでした。お客様に快適な空間でお過ごしいただけるよう、店内環境の改善を進めてまいります。清潔で居心地の良い空間づくりに一層注力いたします。`;
        break;
      case 'price':
        message += `価格設定についてご意見をいただき、ありがとうございます。より多くのお客様にご満足いただけるよう、価格と価値のバランスを見直してまいります。お客様のご期待に沿えるサービスを提供できるよう努めてまいります。`;
        break;
      case 'wait':
        message += `お待たせしてしまい、ご不便をおかけして申し訳ございませんでした。オペレーションの見直しを行い、待ち時間の短縮に取り組んでまいります。お客様の貴重なお時間を大切にできるよう改善いたします。`;
        break;
      default:
        message += `ご不便をおかけし、申し訳ございませんでした。いただいたご意見は真摯に受け止め、サービス改善に活かしてまいります。お客様にご満足いただけるよう、スタッフ一同努めてまいります。`;
    }
  }
  
  // 3. 収集データの活用方法
  message += '\n\n';
  if (analysis.hasSuggestions) {
    message += `いただいたご提案は、今後のサービス改善に積極的に取り入れさせていただきます。具体的な改善策を検討し、より良い${storeName}を目指してまいります。`;
  } else {
    message += `いただいたご意見は、スタッフ全員で共有し、サービス品質の向上に活用させていただきます。定期的なミーティングでお客様からのフィードバックを基にした改善策を実行してまいります。`;
  }
  
  // 4. リピート促進文
  message += '\n\n';
  if (analysis.interestedProducts.length > 0) {
    const products = analysis.interestedProducts.slice(0, 2).join('や'); // 最大2つまで表示
    message += `${products}に関心をお持ちいただき、ありがとうございます。次回のご来店の際には、さらに${storeName}の魅力をお楽しみいただければ幸いです。`;
  } else if (analysis.hasPositiveFeedback) {
    message += `お褒めのお言葉をいただき、スタッフ一同大変嬉しく思っております。これからも${storeName}ならではのサービスと品質を追求してまいります。`;
  } else {
    message += `今後もお客様のニーズにお応えできるよう、日々精進してまいります。`;
  }
  
  message += `いただいたご意見をもとにサービス向上に努めてまいります。またのご来店を心よりお待ちしております。`;
  
  return message;
};