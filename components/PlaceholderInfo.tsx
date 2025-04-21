import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderInfoProps = {
  placeholders: Array<Record<string, unknown>>;
};

export default function PlaceholderInfo({ placeholders }: PlaceholderInfoProps) {
  if (placeholders.length === 0) return null;
  
  const hasAccentColor = placeholders.some(p => (p.fieldPath as string[]).join('.') === 'accentColor');
  const accentColorValue = hasAccentColor 
    ? placeholders.find(p => (p.fieldPath as string[]).join('.') === 'accentColor')?.content as string 
    : '#FF5722';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Using This Template</CardTitle>
        <CardDescription>How to use the exported template in your application.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm">
          <p className="text-sm text-muted-foreground">
            Your exported template contains both the original HTML and a version with placeholders.
            Each placeholder follows this format:
          </p>
          <div className="bg-muted p-2 rounded-md my-2 font-mono text-xs">
            &#123;&#123;fieldName&#125;&#125;
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When generating assets in your main application, use the following pattern:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground mt-2 pl-2">
            <li>Load the template from the exported JSON</li>
            <li>For each placeholder, replace with corresponding user input</li>
            <li>For image placeholders, substitute with actual image URLs</li>
            <li>Apply the accent color to all elements with <code className="bg-muted px-1 rounded text-xs">data-accent-color-applied</code> attribute</li>
          </ol>
          
          {hasAccentColor && (
            <div className="mt-3 p-2 rounded-md border border-orange-200 bg-orange-50">
              <p className="text-xs font-medium text-orange-800 mb-1">Accent Color Detected</p>
              <p className="text-xs text-orange-700">
                This template uses accent color mapping. Remember to apply the user&apos;s chosen color 
                to all elements marked with <code className="bg-white px-1 rounded text-xs">data-accent-color-applied</code> 
                or <code className="bg-white px-1 rounded text-xs">data-accent-class</code> attributes.
              </p>
              
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColorValue }}></div>
                <code className="text-xs bg-white px-1 rounded font-mono">
                  {accentColorValue}
                </code>
              </div>
            </div>
          )}
          
          <p className="text-sm text-muted-foreground mt-2">
            The template JSON includes detailed placeholder information for regex-based replacements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 