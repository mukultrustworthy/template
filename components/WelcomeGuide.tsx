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
        <p>This internal tool helps you create templated HTML assets for image generation by mapping elements to placeholders.</p>
        
        <h3 className="font-medium text-base mt-4 text-blue-800">Getting Started:</h3>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>Upload an HTML file or paste HTML code in the editor</li>
          <li>Click the &quot;Select Element from Template&quot; button</li>
          <li>Click on any element in the preview to select it</li>
          <li>Map selected elements to data fields using the dropdown</li>
          <li>For images, use the checkbox to map the src attribute</li>
          <li>Continue selecting and mapping elements as needed</li>
          <li>When finished, export your template with all mappings and placeholders</li>
        </ol>
        
        <h3 className="font-medium text-base mt-4 text-blue-800">How It Works:</h3>
        <ol className="list-decimal list-inside space-y-2 ml-2">
          <li>Your selected elements are replaced with placeholders like <code className="bg-white px-1 py-0.5 rounded text-blue-900">&#123;&#123;answer&#125;&#125;</code></li>
          <li>Image sources are replaced with a standard placeholder image</li>
          <li>The exported JSON contains both the original HTML and the templated version</li>
          <li>The main application uses these templates to inject user data and generate assets</li>
        </ol>
        
        <h3 className="font-medium text-base mt-4 text-blue-800">Accent Color Mapping:</h3>
        <div className="bg-white p-3 rounded-md border border-blue-200 mt-2">
          <p className="text-sm mb-2">
            The accent color feature allows brand colors to be applied consistently across templates:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
            <li>Select any color element and map it to the <span className="font-medium">Accent Color</span> field</li>
            <li>The system will automatically identify other color elements that should use the accent color</li>
            <li>When mapped, you&apos;ll see a preview of how colors are applied in the template</li>
            <li>Common CSS properties that use accent colors include <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">color</code>, <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">background-color</code>, and <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">border-color</code></li>
          </ul>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-orange-500"></div>
            <span className="text-xs text-gray-500">Default accent: #FF5722 (Orange)</span>
          </div>
        </div>
        
        <p className="mt-3 bg-white p-3 rounded-md border border-blue-200 text-blue-800 flex items-start">
          <span className="text-xl mr-2">💡</span>
          <span>Try loading the example testimonial to see how accent colors work!</span>
        </p>
      </div>
    </div>
  );
} 