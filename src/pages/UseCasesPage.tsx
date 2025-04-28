import React from 'react';
import { Utensils, Scissors, ShoppingBag, Stethoscope, Car, Coffee, Home, Gift } from 'lucide-react';

const UseCasesPage: React.FC = () => {
  // 活用事例データ
  const useCases = [
    {
      icon: <Utensils className="h-10 w-10 text-orange-500" />,
      title: "飲食店",
      description: "ラーメン店「麺や 花道」では、クチトルを導入して2ヶ月で口コミが36件増加。星評価が4.1から4.6に上昇し、週末の来店客が約20%増加しました。",
      image: "https://images.unsplash.com/photo-1555992336-fb0d29498b13?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <Scissors className="h-10 w-10 text-purple-500" />,
      title: "美容室",
      description: "美容室「Hair Salon BLOOM」では、クチトルでお客様の声を集め、具体的な改善点を発見。サービス改善と口コミ増加により、新規顧客が月15名増加しました。",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <ShoppingBag className="h-10 w-10 text-pink-500" />,
      title: "アパレルショップ",
      description: "セレクトショップ「Lino」では、クチトルを活用してお客様の商品に対する生の声を収集。商品ラインナップの改善に役立て、リピート率が15%向上しました。",
      image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <Stethoscope className="h-10 w-10 text-blue-500" />,
      title: "整骨院・整体",
      description: "「健康堂整骨院」では、治療後の感想をクチトルで収集し、Google口コミに変換。地域での認知度が高まり、新規患者が3ヶ月で25名増加しました。",
      image: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <Car className="h-10 w-10 text-red-500" />,
      title: "自動車整備工場",
      description: "「三和自動車整備」では、クチトルで顧客満足度を可視化。技術的な信頼性に関する口コミが増え、高単価の整備依頼が20%増加しました。",
      image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <Coffee className="h-10 w-10 text-yellow-700" />,
      title: "カフェ",
      description: "「Café Soleil」では、クチトルを使って商品やサービスへのフィードバックを収集。メニュー改善とSNS投稿につながり、新規顧客獲得に成功しました。",
      image: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <Home className="h-10 w-10 text-teal-500" />,
      title: "不動産仲介",
      description: "「誠心不動産」では、取引後のクライアントの声をクチトルで収集。信頼性の高い口コミが増え、問い合わせ数が倍増しました。",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=640&h=360"
    },
    {
      icon: <Gift className="h-10 w-10 text-indigo-500" />,
      title: "雑貨店",
      description: "「MONO STYLE」では、クチトルでお客様の商品への反応を収集。商品選定の参考にするとともに、ポジティブな口コミが増えて来店客数が増加しました。",
      image: "https://images.unsplash.com/photo-1516936451219-1a7a2dbf6841?auto=format&fit=crop&q=80&w=640&h=360"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            活用事例
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            様々な業種でクチトルがどのように活用され、成果を出しているかをご紹介します
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={useCase.image} 
                  alt={useCase.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-3">
                    {useCase.icon}
                  </div>
                  <h2 className="text-xl font-bold">{useCase.title}</h2>
                </div>
                <p className="text-gray-600">
                  {useCase.description}
                </p>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    実際の導入事例に基づいたダミーデータです。実装時には実際の事例が表示されます。
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            このページは現在編集中です。実装時には実際の活用事例、成功事例の詳細、統計データなども追加されます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default UseCasesPage;