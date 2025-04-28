import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Download } from 'lucide-react';
import { Button } from './button';

interface DebugProps {
  title?: string;
  data: any;
  open?: boolean;
}

const DebugPanel: React.FC<DebugProps> = ({ title = 'デバッグ情報', data, open = false }) => {
  const [isOpen, setIsOpen] = useState(open);
  const [timestamp, setTimestamp] = useState(new Date());

  // Update timestamp when data changes
  useEffect(() => {
    setTimestamp(new Date());
  }, [data]);

  // Format time
  const formattedTime = timestamp.toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  });

  // Download debug data as JSON
  const downloadDebugData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `debug-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };
  
  return (
    <div className="mt-6 border border-gray-200 rounded-md">
      <div 
        className="flex items-center justify-between p-3 bg-gray-100 rounded-t-md cursor-pointer border-b"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <span className="font-medium text-gray-700">{title}</span>
          <span className="ml-2 text-xs text-gray-500">{formattedTime}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={(e) => {
              e.stopPropagation();
              downloadDebugData();
            }}
            className="h-7 w-7"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {isOpen ? <EyeOff size={16} /> : <Eye size={16} />}
        </div>
      </div>
      {isOpen && (
        <div className="p-3 bg-gray-50 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;