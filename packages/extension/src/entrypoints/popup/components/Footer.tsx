import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 p-3 border-t border-gray-200">
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="text-xs text-gray-500">版本 v1.8.0</span>
        <div className="flex items-center gap-3">
          <a href="#" className="text-blue-500 hover:underline">帮助文档</a>
          <span className="text-gray-300">|</span>
          <a href="#" className="text-blue-500 hover:underline">手机共享</a>
          <span className="text-gray-300">|</span>
          <a href="#" className="text-blue-500 hover:underline">更多工具</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;