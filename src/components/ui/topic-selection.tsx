import React from 'react';
import { Button } from './button';
import { MessageSquare, MessageCircle, Star, ThumbsUp, Sparkles, Coffee } from 'lucide-react';

// Define available icons for topics to make the UI more visual
const topicIcons: Record<string, React.ReactNode> = {
  '店内の雰囲気': <Coffee className="h-5 w-5" />,
  '接客の対応': <MessageCircle className="h-5 w-5" />,
  'スタッフの対応': <MessageCircle className="h-5 w-5" />,
  '商品の品質': <Star className="h-5 w-5" />,
  '料理の味': <Coffee className="h-5 w-5" />,
  '商品・サービスの品質': <ThumbsUp className="h-5 w-5" />,
  '清潔感': <Sparkles className="h-5 w-5" />,
  '価格': <MessageSquare className="h-5 w-5" />,
  'その他の感想': <MessageSquare className="h-5 w-5" />,
  '雰囲気について': <Coffee className="h-5 w-5" />,
  'サービスについて': <ThumbsUp className="h-5 w-5" />,
  '品質について': <Star className="h-5 w-5" />,
};

// Get an icon for a topic or use a default
const getIconForTopic = (topic: string) => {
  // Check for exact matches
  if (topicIcons[topic]) {
    return topicIcons[topic];
  }
  
  // Check for partial matches (if the topic contains a key word)
  for (const [key, icon] of Object.entries(topicIcons)) {
    if (topic.includes(key) || key.includes(topic)) {
      return icon;
    }
  }
  
  // Default icon
  return <MessageSquare className="h-5 w-5" />;
};

interface TopicSelectionProps {
  topics: string[];
  onSelect: (topic: string) => void;
  isLoading?: boolean;
}

const TopicSelection: React.FC<TopicSelectionProps> = ({
  topics,
  onSelect,
  isLoading = false
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-medium text-center text-gray-800 mb-3">
        話題を選んでください
      </h3>
      <p className="text-sm text-gray-600 text-center mb-5">
        ご感想をお聞かせいただきたい項目をタップしてください
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topics.map((topic, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => onSelect(topic)}
            disabled={isLoading}
            className="py-6 h-auto border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-gray-800"
          >
            <span className="text-blue-600">
              {getIconForTopic(topic)}
            </span>
            <span className="text-base">{topic}</span>
          </Button>
        ))}
      </div>
      
      {isLoading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <div className="inline-block animate-pulse">処理中...</div>
        </div>
      )}
    </div>
  );
};

export default TopicSelection;