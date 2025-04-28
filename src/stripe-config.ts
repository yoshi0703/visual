// src/stripe-config.ts
export interface Product {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'subscription' | 'payment';
  price?: number;
  currency?: string;
  interval?: 'month' | 'year';
  features?: string[];
  recommended?: boolean;
}
// Stripe製品情報
// 実際の製品・価格IDを使用
export const products: Product[] = [
  {
    id: 'prod_S8PEllzm8z0Qgb',
    priceId: 'price_1RE8QDIoXiM5069uMN8Ke2TX',
    name: 'クチトルベーシック',
    description: 'Google Maps のクチコミを集めてくれるAIエージェントを雇用する。クチトルは、あなたのスタッフに代わって丁寧なインタビューを行い、店舗の魅力が伝わるクチコミを生み出します。',
    mode: 'subscription',
    price: 5000,
    currency: 'jpy',
    interval: 'month',
    features: [
      'AIインタビュー機能',
      'QRコード生成',
      'レビュー分析レポート',
      'メールサポート',
    ],
    recommended: true
  }
];
export const getProductByPriceId = (priceId: string): Product | undefined => {
  return products.find(product => product.priceId === priceId);
};
export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};
export const getSubscriptionProducts = (): Product[] => {
  return products.filter(product => product.mode === 'subscription');
};
export const getOneTimeProducts = (): Product[] => {
  return products.filter(product => product.mode === 'payment');
};
export default products;