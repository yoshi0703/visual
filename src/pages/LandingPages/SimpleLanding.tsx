import React from 'react';
import BaseLandingPage from '../BaseLandingPage';

const SimpleLanding: React.FC = () => {
  return (
    <BaseLandingPage
      title="IT知識ゼロでも3分で始められるクチコミ集めツール"
      subtitle="URLを入力するだけ。QRコードを置くだけ。難しいことは一切ありません。"
      persona="IT初心者"
    />
  );
};

export default SimpleLanding;