import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

type PlaceholdersListProps = {
  placeholders: Array<Record<string, unknown>>;
  onRemovePlaceholder: (index: number) => void;
}

export default function PlaceholdersList({ placeholders, onRemovePlaceholder }: PlaceholdersListProps) {
  if (placeholders.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Placeholders ({placeholders.length})</CardTitle>
        <CardDescription>Review and manage your element-to-field placeholders.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {placeholders.map((placeholder, index) => (
            <li key={index} className="flex flex-col p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-6 w-6 rounded flex items-center justify-center text-xs ${
                      (placeholder.elementType as string) === 'img' ? 'bg-blue-100 text-blue-700' : 
                      (placeholder.fieldPath as string[]).join('.') === 'accentColor' ? 'bg-orange-100 text-orange-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}
                    title={`Element type: ${placeholder.elementType || 'unknown'}`}
                  >
                    {(placeholder.elementType as string) === 'img' ? 'IMG' : 
                     (placeholder.fieldPath as string[]).join('.') === 'accentColor' ? '🎨' :
                     (placeholder.elementType as string)?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="font-mono text-sm font-medium text-primary">{(placeholder.fieldPath as string[]).join('.')}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive/80 h-7 w-7"
                  onClick={() => onRemovePlaceholder(index)}
                  aria-label="Remove placeholder"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-2 pl-8">
                {(placeholder.fieldPath as string[]).join('.') === 'accentColor' ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: placeholder.content as string }}></div>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{placeholder.content as string}</code>
                  </div>
                ) : placeholder.isImageSrc ? (
                  <p className="text-xs text-muted-foreground truncate" title={placeholder.content as string}>
                    <span className="font-medium">Image source:</span> {(placeholder.content as string) || '<empty>'}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground truncate" title={placeholder.content as string}>
                    <span className="font-medium">Content:</span> {(placeholder.content as string) || '<empty>'}
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Placeholder:</span> {
                    placeholder.placeholderValue && typeof placeholder.placeholderValue === 'object' 
                      ? (placeholder.placeholderValue as {value: string}).value
                      : (placeholder.placeholderValue as string)
                  }
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 