import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ExampleLoader from '@/components/ExampleLoader';

type ImportHtmlProps = {
  html: string;
  onChangeHtml: (html: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoadingExample: boolean;
};

export default function ImportHtml({
  html,
  onChangeHtml,
  onPaste,
  fileInputRef,
  onFileUpload,
  isLoadingExample
}: ImportHtmlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import HTML</CardTitle>
        <CardDescription>Upload a file, paste code, or load an example.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Upload File
          </Button>
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".html,.htm"
            onChange={onFileUpload}
            className="hidden"
          />
          <ExampleLoader onLoadExample={onChangeHtml} isLoading={isLoadingExample} />
        </div>
        <Separator />
        <div>
          <Label htmlFor="html-paste-area" className="text-sm font-medium">Or paste HTML code:</Label>
          <Textarea 
            id="html-paste-area"
            className="mt-1 font-mono text-sm h-48"
            onPaste={onPaste}
            onChange={(e) => onChangeHtml(e.target.value)}
            value={html}
            placeholder="<!-- Paste your HTML snippet here -->"
          />
        </div>
      </CardContent>
    </Card>
  );
} 