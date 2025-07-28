import React from 'react';

interface DisclaimerBannerProps {
  className?: string;
}

const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ className = '' }) => {
  return (
    <div className={`bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-medium text-yellow-300 mb-1">
            Tool Disclaimer
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            This resource is provided as-is. It is not affiliated with, endorsed by, or officially associated with GitHub in any way. For GitHub's official documentation, pricing, and service offerings, please visit the GitHub Docs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
