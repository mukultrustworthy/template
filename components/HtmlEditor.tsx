'use client';

import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

type HtmlEditorProps = {
  html: string;
  onChange: (html: string) => void;
};

export default function HtmlEditor({ html, onChange }: HtmlEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Handle editor mounting
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">HTML Editor</CardTitle>
        <CardDescription className="text-xs">Edit HTML template with placeholders like {"{fieldName}"}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        <div className="border-t">
          <Editor
            height="300px"
            defaultLanguage="html"
            value={html}
            onChange={(value) => onChange(value || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              fontSize: 14,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              theme: 'vs-dark'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
} 