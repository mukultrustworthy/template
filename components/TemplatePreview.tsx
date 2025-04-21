'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TemplatePreviewProps = {
  html: string;
  data: Record<string, unknown>;
};

export default function TemplatePreview({ html, data }: TemplatePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
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
                body { margin: 0; font-family: sans-serif; }
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
    }
  }, [html, data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>HTML template with placeholders replaced by JSON values</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-3 h-[450px] overflow-auto bg-white">
          <iframe 
            ref={iframeRef}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Template Preview"
          />
        </div>
      </CardContent>
    </Card>
  );
} 