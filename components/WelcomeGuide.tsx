'use client';

import { useState } from 'react';

export default function WelcomeGuide() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-6 border border-blue-200">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-blue-800">Welcome to HTML Asset Editor</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-500 hover:text-blue-700 bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center"
          aria-label="Close welcome guide"
        >
          &times;
        </button>
      </div>
      
      <div className="space-y-3 text-blue-700">
        <p>This tool helps you map HTML elements to structured data for image generation.</p>
        
        <h3 className="font-medium text-base mt-4 text-blue-800">Getting Started:</h3>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>Upload an HTML file or paste HTML code in the editor</li>
          <li>Click the &quot;Select Element from Template&quot; button</li>
          <li>Click on any element in the preview to select it</li>
          <li>Map selected elements to data fields using the dropdown</li>
          <li>Continue selecting and mapping elements as needed</li>
          <li>When finished, export your data for use in image generation</li>
        </ol>
        
        <p className="mt-3 bg-white p-3 rounded-md border border-blue-200 text-blue-800 flex items-start">
          <span className="text-xl mr-2">💡</span>
          <span>Try loading the example testimonial to see how it works!</span>
        </p>
      </div>
    </div>
  );
} 