import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HtmlPreviewProps = {
  html: string;
  templateHtml: string;
  placeholders: Array<Record<string, unknown>>;
  isSelectMode: boolean;
  isLoadingExample: boolean;
  previewTab: string;
  setPreviewTab: (tab: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  iframeContentRef: React.RefObject<string | null>;
};

export default function HtmlPreview({
  html,
  templateHtml,
  placeholders,
  isSelectMode,
  isLoadingExample,
  previewTab,
  setPreviewTab,
  iframeRef,
  iframeContentRef
}: HtmlPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>HTML Preview</span>
          {isSelectMode && (
            <span className="text-xs font-medium px-2 py-1 bg-primary text-primary-foreground rounded-full animate-pulse">
              Selecting...
            </span>
          )}
        </CardTitle>
        <CardDescription>Rendered view of the imported HTML.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="original" value={previewTab} onValueChange={setPreviewTab}>
          <TabsList className="mb-2 w-full">
            <TabsTrigger value="original" className="flex-1">Original HTML</TabsTrigger>
            <TabsTrigger value="template" className="flex-1" disabled={placeholders.length === 0}>
              Template with Placeholders {placeholders.length > 0 && `(${placeholders.length})`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="original">
            <div className={`border rounded-md p-3 h-[450px] overflow-auto bg-white ${isSelectMode ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
              <div className="w-full h-full">
                <iframe 
                  ref={iframeRef}
                  srcDoc={iframeContentRef.current || `<!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { margin: 0; font-family: sans-serif; }
                        * { box-sizing: border-box; }
                        .highlight-selection {
                          outline: 2px solid blue !important;
                          outline-offset: 2px !important;
                        }
                      </style>
                    </head>
                    <body class="prose prose-sm max-w-none">${html}</body>
                  </html>`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="HTML Preview"
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="template">
            <div className="border rounded-md p-3 h-[450px] overflow-auto bg-white">
              <div className="w-full h-full">
                <iframe 
                  srcDoc={`<!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { margin: 0; font-family: sans-serif; }
                        * { box-sizing: border-box; }
                        [data-placeholder] {
                          background-color: rgba(59, 130, 246, 0.1);
                          border: 1px dashed #3b82f6;
                          padding: 2px 4px;
                          border-radius: 2px;
                          color: #2563eb;
                          font-weight: 500;
                        }
                        img[data-placeholder] {
                          border: 2px dashed #3b82f6 !important;
                          padding: 4px !important;
                          background-color: rgba(59, 130, 246, 0.1) !important;
                          position: relative;
                          max-width: 100% !important;
                          height: auto !important;
                        }
                        [data-image-placeholder] {
                          font-weight: bold;
                          color: #2563eb;
                          background-color: rgba(59, 130, 246, 0.1);
                          border: 1px dashed #3b82f6;
                          padding: 4px 8px;
                          border-radius: 4px;
                          display: inline-block !important;
                          margin: 4px 0;
                        }
                      </style>
                    </head>
                    <body class="prose prose-sm max-w-none">${templateHtml || html}</body>
                  </html>`}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Template Preview"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {isLoadingExample && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Loading Example...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 