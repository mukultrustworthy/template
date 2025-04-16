'use client';

import { useState } from 'react';

type FieldMapOption = {
  label: string;
  value: string;
  path: string[];
};

const FIELD_OPTIONS: FieldMapOption[] = [
  { label: 'Answer', value: 'answer', path: ['answer'] },
  { label: 'Question', value: 'question', path: ['question'] },
  { label: 'Author Name', value: 'author.name', path: ['author', 'name'] },
  { label: 'Author Designation', value: 'author.designation', path: ['author', 'designation'] },
  { label: 'Author Image URL', value: 'author.image', path: ['author', 'image'] },
  { label: 'Brand Logo URL', value: 'brandLogoUrl', path: ['brandLogoUrl'] },
  { label: 'Company Name', value: 'companyName', path: ['companyName'] },
  { label: 'Accent Color', value: 'accentColor', path: ['accentColor'] },
  { label: 'Thumbnail URL', value: 'thumbnailUrl', path: ['thumbnailUrl'] },
];

interface ElementMapperProps {
  selectedElement: HTMLElement | null;
  onMapElement: (fieldPath: string[], value: string) => void;
  onSelectElementMode: () => void;
  isSelectMode: boolean;
}

export default function ElementMapper({ 
  selectedElement, 
  onMapElement, 
  onSelectElementMode,
  isSelectMode 
}: ElementMapperProps) {
  const [selectedField, setSelectedField] = useState<string>('');

  const handleMapElement = () => {
    if (selectedElement && selectedField) {
      const field = FIELD_OPTIONS.find(option => option.value === selectedField);
      if (field) {
        onMapElement(field.path, selectedElement.textContent || '');
        setSelectedField(''); // Reset selection after mapping
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <button 
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            isSelectMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          onClick={onSelectElementMode}
        >
          {isSelectMode ? '✓ Select Element Mode Active' : '👆 Select Element from Template'}
        </button>
      </div>

      {!selectedElement && !isSelectMode ? (
        <div className="text-gray-500 p-4 bg-gray-50 rounded-md text-center">
          <p>No element selected</p>
          <p className="text-sm mt-1">Click &quot;Select Element from Template&quot; to begin</p>
        </div>
      ) : isSelectMode ? (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-blue-800">
            <span className="font-bold">Selection Mode Active</span>
          </p>
          <p className="text-sm mt-1 text-blue-600">
            Click on any element in the preview to select it
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="mb-2">
              <span className="text-gray-700 font-medium">Selected Element:</span> 
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-sm">
                {selectedElement?.tagName.toLowerCase()}
              </span>
            </div>
            <div className="mb-1">
              <span className="text-gray-700 font-medium">Content:</span>
            </div>
            <div className="p-2 bg-white border border-gray-200 rounded max-h-20 overflow-y-auto break-words text-sm">
              {selectedElement?.textContent || '<empty>'}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Map to field:
            </label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <option value="">Select field...</option>
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button 
            className={`w-full py-2 px-4 rounded-md transition-colors ${
              selectedField 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleMapElement}
            disabled={!selectedField}
          >
            Map Element
          </button>
        </div>
      )}
    </div>
  );
}