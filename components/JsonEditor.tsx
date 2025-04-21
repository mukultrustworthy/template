'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

type JsonEditorProps = {
  json: Record<string, unknown>;
  onChange: (json: Record<string, unknown>) => void;
};

export default function JsonEditor({ json, onChange }: JsonEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Handle editor mounting
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Setup JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
    });
  };

  // Update editor content when json prop changes
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      const newValue = JSON.stringify(json, null, 2);
      
      // Only update if different to avoid cursor position reset
      if (currentValue !== newValue) {
        editorRef.current.setValue(newValue);
      }
    }
  }, [json]);

  // Handle content changes
  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    
    try {
      const parsedJson = JSON.parse(value);
      onChange(parsedJson);
    } catch {
      // Let Monaco handle the error highlighting
      // Don't call onChange with invalid JSON
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-base">JSON Editor</CardTitle>
        <CardDescription className="text-xs">Edit the template data in JSON format</CardDescription>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-lg">
        <div className="border-t">
          <Editor
            height="300px"
            defaultLanguage="json"
            defaultValue={JSON.stringify(json, null, 2)}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              formatOnPaste: true,
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