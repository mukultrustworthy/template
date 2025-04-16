'use client';

// import { useState } from 'react'; // Removed unused import

interface ExampleLoaderProps {
  onLoadExample: (data: string) => void;
  isLoading: boolean;
}

export default function ExampleLoader({ onLoadExample, isLoading }: ExampleLoaderProps) {
  const loadExample = async (exampleName: string) => {
    try {
      const response = await fetch(`/examples/${exampleName}.html`);
      if (!response.ok) {
        throw new Error('Failed to load example');
      }
      const data = await response.text();
      onLoadExample(data);
    } catch (error) {
      console.error('Error loading example:', error);
      alert('Failed to load example. Please try again.');
    }
  };

  return (
    <div>
      <h3 className="text-md font-medium mb-2 text-gray-700">Or load an example:</h3>
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            isLoading 
              ? 'bg-gray-300 text-gray-500' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => loadExample('testimonial')}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </span>
          ) : (
            'Testimonial Example'
          )}
        </button>
      </div>
    </div>
  );
} 