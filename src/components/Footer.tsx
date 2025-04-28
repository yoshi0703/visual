import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-4">クチトル</h3>
            <p className="text-sm mb-4">お店の口コミを自動で集めるサービス。設置するだけで口コミが増え、新規顧客の獲得につながります。</p>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-4">リンク</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">ホーム</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">新規登録</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">ログイン</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
              <li><Link to="/recruiting" className="hover:text-white transition-colors">採用情報</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-bold mb-4">お問い合わせ</h3>
            <p className="text-sm mb-1">メール: info@kuchitoru.com</p>
            <p className="text-sm mb-1">電話: 03-1234-5678</p>
            <p className="text-sm">営業時間: 平日 10:00-18:00</p>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} クチトル All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;