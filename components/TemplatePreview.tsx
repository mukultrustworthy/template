'use client';

import { useEffect, useRef, useState } from 'react';

type TemplatePreviewProps = {
  html: string;
  data: Record<string, unknown>;
};

export default function TemplatePreview({ html, data }: TemplatePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Function to apply template content to iframe
  const applyTemplate = () => {
    if (!iframeRef.current) return;
    
    // Replace placeholders with actual data
    let processedHtml = html;
    
    // Process all keys in the data object
    function processObject(obj: Record<string, unknown>, prefix = '') {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        
        if (value !== null && typeof value === 'object') {
          // Recursively process nested objects
          processObject(value as Record<string, unknown>, currentPath);
        } else {
          // Replace placeholders in the format {{key}} with their values
          const placeholder = `{{${currentPath}}}`;
          const regex = new RegExp(placeholder, 'g');
          processedHtml = processedHtml.replace(regex, String(value));
        }
      });
    }
    
    processObject(data);
    
    // Update the iframe content
    const iframeDoc = iframeRef.current.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: sans-serif;
                width: 1080px;
                height: 1080px;
                overflow: hidden;
                position: relative;
                transform-origin: 0 0;
              }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body class="prose prose-sm max-w-none">
            ${processedHtml}
          </body>
        </html>
      `);
      iframeDoc.close();
    }
  };

  // Apply initial template
  useEffect(() => {
    applyTemplate();
  }, [html, data]);

  // Calculate and apply scaling
  const updateScale = () => {
    if (!containerRef.current || !iframeRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Calculate the maximum scale that fits both width and height
    const newScale = Math.min(
      containerWidth / 1080,
      containerHeight / 1080
    );
    
    setScale(newScale);

    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${newScale})`;
    }
  };

  // Update scaling when component mounts or window resizes
  useEffect(() => {
    updateScale();
    
    // Add resize listener
    const handleResize = () => {
      updateScale();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial scale calculation after content is loaded
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.onload = updateScale;
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (iframe) {
        iframe.onload = null;
      }
    };
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div 
        ref={containerRef}
        className="aspect-square w-full h-full bg-white flex items-center justify-center overflow-hidden"
        style={{ position: 'relative' }}
      >
        <div 
          style={{ 
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${1080 * scale}px`,
            height: `${1080 * scale}px`
          }}
        >
          <iframe 
            ref={iframeRef}
            style={{
              width: '1080px',
              height: '1080px',
              border: "1px solid black",
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            title="Template Preview"
          />
        </div>
      </div>
    </div>
  );
} 