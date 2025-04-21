import { useState, useRef } from 'react';
import { loadExampleHtml } from '@/utils/htmlInspector';
import { toast } from 'sonner';

export function useHtml() {
  const [html, setHtml] = useState<string>('');
  const [isLoadingExample, setIsLoadingExample] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastShownRef = useRef<{[key: string]: boolean}>({});

  const loadInitialExample = async () => {
    if (!isLoadingExample) return;
    
    try {
      const exampleHtml = await loadExampleHtml('testimonial'); 
      setHtml(exampleHtml);
      
      if (!toastShownRef.current.initialLoad) {
        toast.success("Testimonial example loaded successfully!");
        toastShownRef.current.initialLoad = true;
      }
    } catch (error) {
      console.error('Error loading initial example:', error);
      toast.error('Failed to load the initial example.');
    } finally {
      setIsLoadingExample(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtml(content);
        showToast('success', `File "${file.name}" uploaded successfully!`, 'fileUpload');
      };
      reader.onerror = () => {
        showToast('error', "Error reading the uploaded file.", 'fileUploadError');
      };
      reader.readAsText(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    const pastedText = clipboardData.getData('text');
    setHtml(pastedText);
    showToast('info', "HTML pasted successfully!", 'pasteDone');
  };

  const showToast = (type: 'success' | 'info' | 'error', message: string, key: string) => {
    if (toastShownRef.current[key]) return;
    
    toastShownRef.current[key] = true;
    
    if (type === 'success') toast.success(message);
    else if (type === 'info') toast.info(message);
    else if (type === 'error') toast.error(message);
    
    setTimeout(() => {
      toastShownRef.current[key] = false;
    }, 5000);
  };

  return {
    html,
    setHtml,
    isLoadingExample,
    fileInputRef,
    handleFileUpload,
    handlePaste,
    loadInitialExample
  };
} 