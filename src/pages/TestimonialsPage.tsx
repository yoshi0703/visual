import React from 'react';
import { Star } from 'lucide-react';

const TestimonialsPage: React.FC = () => {
  // お客様の声データ
  const testimonials = [
    {
      name: "佐藤 和子",
      business: "和食処 さくら",
      age: "68歳",
      quote: "パソコンは全く使えないけど、クチトルなら私でも簡単に使えました。お客様も「こんなに簡単なら協力するわよ」と喜んでくれて、3週間で口コミが15件も増えました。新規のお客様も増えて嬉しいです。",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120",
      stars: 5,
      results: "口コミ数：5件→28件 / 新規客：月30人増加"
    },
    {
      name: "田口 誠一",
      business: "理容室 ハッピーカット",
      age: "72歳",
      quote: "若い子に頼らなくても自分でできるのがいいですね。お客さんとの会話のきっかけにもなります。「良かったよ」って言ってもらえるのが何より嬉しいです。おかげで常連さんも増えました。",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120&h=120",
      stars: 5,
      results: "口コミ数：2件→18件 / リピート率：15%向上"
    },
    {
      name: "山本 恵子",
      business: "癒しの整体院",
      age: "58歳",
      quote: "ホームページを作る余裕がなかったので、Googleの情報だけが頼りでした。クチトルのおかげで患者さんの声がたくさん集まり、新しい方の予約が増えています。本当に感謝しています。",
      image: "https://images.unsplash.com/photo-1569913486515-b74bf7751574?auto=format&fit=crop&q=80&w=120&h=120",
      stars: 5,
      results: "口コミ数：8件→34件 / 新規予約：週3件増加"
    },
    {
      name: "鈴木 健太",
      business: "ラーメン 麺次郎",
      age: "45歳",
      quote: "店は忙しくて口コミのことまで手が回らなかったんです。でもクチトルは置いておくだけで勝手に増えていくのがいい。常連さんも「おいしかったから書いといたよ」って言ってくれるようになりました。",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120",
      stars: 4,
      results: "口コミ数：12件→41件 / 来店客：週50人増加"
    },
    {
      name: "中村 美咲",
      business: "ネイルサロン COLORS",
      age: "34歳",
      quote: "インスタでの宣伝はしていましたが、Google検索で見つけてもらえるようになりたくて導入しました。お客様にQRコードを読み取ってもらうだけなので負担にならず、自然に口コミが増えていきました。",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120",
      stars: 5,
      results: "口コミ数：6件→22件 / 新規客：月15人増加"
    },
    {
      name: "高橋 誠",
      business: "自転車店 サイクルワールド",
      age: "53歳",
      quote: "最初は半信半疑でしたが、導入してみると驚くほど口コミが増えました。お客様の生の声が聞けるのも良いですね。修理の技術評価が高いと分かったので、そこをアピールするようにしています。",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120",
      stars: 4,
      results: "口コミ数：3件→17件 / 修理依頼：月10件増加"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            お客様の声
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            実際にクチトルをご利用いただいているお客様からの声をご紹介します
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.business}</p>
                  <p className="text-gray-500 text-sm">{testimonial.age}</p>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                          i < testimonial.stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <blockquote className="italic text-gray-700 mb-4 border-l-4 border-indigo-300 pl-4 py-1">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="bg-indigo-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-indigo-800">成果：{testimonial.results}</p>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  実際の導入事例に基づいたダミーデータです。実装時には実際の事例が表示されます。
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <p className="text-sm text-gray-500">
            このページは現在編集中です。実装時には実際のお客様の声、成功事例、ビフォーアフターなども追加されます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsPage;