'use client';

import { useState, useEffect } from 'react';

type FieldMapOption = {
  label: string;
  value: string;
  path: string[];
  type?: 'text' | 'color' | 'image';
};

const FIELD_OPTIONS: FieldMapOption[] = [
  { label: 'Answer', value: 'answer', path: ['answer'], type: 'text' },
  { label: 'Question', value: 'question', path: ['question'], type: 'text' },
  { label: 'Author Name', value: 'author.name', path: ['author', 'name'], type: 'text' },
  { label: 'Author Designation', value: 'author.designation', path: ['author', 'designation'], type: 'text' },
  { label: 'Author Image URL', value: 'author.image', path: ['author', 'image'], type: 'image' },
  { label: 'Brand Logo URL', value: 'brandLogoUrl', path: ['brandLogoUrl'], type: 'image' },
  { label: 'Company Name', value: 'companyName', path: ['companyName'], type: 'text' },
  { label: 'Accent Color', value: 'accentColor', path: ['accentColor'], type: 'color' },
  { label: 'Thumbnail URL', value: 'thumbnailUrl', path: ['thumbnailUrl'], type: 'image' },
];

interface ElementMapperProps {
  selectedElement: HTMLElement | null;
  onMapElement: (fieldPath: string[], value: string, options?: { isImageSrc?: boolean }) => void;
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
  const [isImageSrcAttribute, setIsImageSrcAttribute] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>('#FF5722'); // Default orange accent
  const [customValue, setCustomValue] = useState<string>('');

  // Update custom value when selected element changes
  useEffect(() => {
    if (selectedElement) {
      if (isImageSrcAttribute && selectedElement.tagName.toLowerCase() === 'img') {
        setCustomValue(selectedElement.getAttribute('src') || '');
      } else {
        setCustomValue(selectedElement.textContent || '');
      }
    } else {
      setCustomValue('');
    }
  }, [selectedElement, isImageSrcAttribute]);

  const handleMapElement = () => {
    if (selectedField) {
      const field = FIELD_OPTIONS.find(option => option.value === selectedField);
      if (field) {
        // Determine the right value to use
        let contentValue = '';
        
        // Determine if this is an image field either by type or by the isImageSrcAttribute flag
        const isImageField = field.type === 'image' || field.path.some(p => p === 'image' || p.includes('Url') || p.includes('url'));
        const shouldHandleAsImageSrc = isImageSrcAttribute || isImageField;
        
        // Special handling for different field types
        if (field.type === 'color') {
          contentValue = selectedColor;
        } else if (shouldHandleAsImageSrc && selectedElement?.tagName.toLowerCase() === 'img') {
          // Use src attribute for images
          contentValue = selectedElement?.getAttribute('src') || customValue;
        } else if (selectedElement) {
          contentValue = selectedElement.textContent || '';
        } else {
          contentValue = customValue; // Use custom input for manual mapping
        }
        
        onMapElement(field.path, contentValue, { isImageSrc: shouldHandleAsImageSrc });
        setSelectedField(''); // Reset selection after mapping
        setIsImageSrcAttribute(false); // Reset image src flag
        setCustomValue(''); // Reset custom value
      }
    }
  };

  const isImgElement = selectedElement?.tagName.toLowerCase() === 'img';
  const selectedOption = FIELD_OPTIONS.find(option => option.value === selectedField);
  const isColorField = selectedOption?.type === 'color';

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
            
            {isImgElement && (
              <div className="mb-3 mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={isImageSrcAttribute}
                    onChange={(e) => setIsImageSrcAttribute(e.target.checked)}
                  />
                  <span className="ml-2 text-gray-700 text-sm">Map image source (src) attribute</span>
                </label>
              </div>
            )}
            
            <div className="mb-1">
              <span className="text-gray-700 font-medium">
                {isImgElement && isImageSrcAttribute ? 'Image Source:' : 'Content:'}
              </span>
            </div>
            <div className="p-2 bg-white border border-gray-200 rounded max-h-20 overflow-y-auto break-words text-sm">
              {isImgElement && isImageSrcAttribute 
                ? (selectedElement?.getAttribute('src') || '<no src>') 
                : (selectedElement?.textContent || '<empty>')}
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
          
          {isColorField && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select color:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-md font-mono text-sm"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#000000"
                />
                <div className="flex flex-wrap gap-1">
                  {['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#F44336'].map(color => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 p-2 rounded" style={{ backgroundColor: selectedColor }}>
                <p className="text-xs font-medium text-center" style={{ color: getContrastColor(selectedColor) }}>
                  Preview Accent Color
                </p>
              </div>
            </div>
          )}
          
          {!selectedElement && selectedField && !isColorField && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom value:
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Enter value manually"
              />
            </div>
          )}

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

// Helper function to determine text color for good contrast
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate perceived brightness (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Return black or white depending on brightness
  return yiq >= 128 ? '#000000' : '#ffffff';
}