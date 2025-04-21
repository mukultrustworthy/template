import { useState, useEffect } from 'react';
import { ElementDataMapping, generatePlaceholder, applyPlaceholders } from '@/utils/htmlInspector';
import { toast } from "sonner";

export function usePlaceholders(html: string) {
  const [placeholders, setPlaceholders] = useState<Record<string, unknown>[]>([]);
  const [templateHtml, setTemplateHtml] = useState<string>('');

  useEffect(() => {
    if (placeholders.length > 0) {
      const newTemplateHtml = applyPlaceholders(html, placeholders as unknown as ElementDataMapping[]);
      setTemplateHtml(newTemplateHtml);
    }
  }, [html, placeholders]);

  const handleAddPlaceholder = (
    elementId: string | undefined, 
    fieldPath: string[], 
    value: string, 
    elementTagName: string | undefined = '',
    options?: { isImageSrc?: boolean }
  ) => {
    if (!elementId && !options?.isImageSrc) return;

    const isImageField = fieldPath.some(p => p === 'image' || p.includes('Url') || p.includes('url'));
    const shouldTreatAsImage = options?.isImageSrc || isImageField || elementTagName?.toLowerCase() === 'img';
    const placeholder = generatePlaceholder(fieldPath);
    
    const newPlaceholder: Record<string, unknown> = {
      elementId: elementId || `manual-${fieldPath.join('-')}`,
      fieldPath,
      content: value,
      elementType: elementTagName?.toLowerCase() || 'div',
      placeholderValue: placeholder,
      isImageSrc: shouldTreatAsImage
    };
    
    setPlaceholders(prevPlaceholders => {
      const existingIndex = prevPlaceholders.findIndex(
        p => (p.fieldPath as string[]).join('.') === fieldPath.join('.')
      );
      
      if (existingIndex !== -1) {
        const updated = [...prevPlaceholders];
        updated[existingIndex] = newPlaceholder;
        return updated;
      } else {
        return [...prevPlaceholders, newPlaceholder];
      }
    });
    
    if (elementId) {
      toast.success(`Added placeholder for field: ${fieldPath.join('.')}`);
    } else {
      toast.info(`Manually set placeholder: ${fieldPath.join('.')}`);
    }
  };
  
  const handleRemovePlaceholder = (indexToRemove: number) => {
    setPlaceholders(prev => {
      const removed = prev[indexToRemove];
      toast.info(`Placeholder for "${(removed.fieldPath as string[]).join('.')}" removed.`);
      return prev.filter((_, i) => i !== indexToRemove);
    });
  };

  return {
    placeholders,
    templateHtml,
    handleAddPlaceholder,
    handleRemovePlaceholder
  };
} 