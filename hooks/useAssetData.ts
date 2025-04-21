import { useState } from 'react';
import { AssetImageDto } from '@/types/asset';
import { toast } from 'sonner';

type NestedObject = {
  [key: string]: string | NestedObject;
};

export function useAssetData() {
  const [assetData, setAssetData] = useState<AssetImageDto>({
    answer: '',
    author: {
      name: '',
      designation: ''
    }
  });
  const [selectedAssetType, setSelectedAssetType] = useState<AssetImageDto['type']>('text');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');

  const updateAssetData = (fieldPath: string[], value: string) => {
    setAssetData(prev => {
      const newData = structuredClone(prev);
      let currentLevel = newData as unknown as NestedObject;

      for (let i = 0; i < fieldPath.length - 1; i++) {
        const key = fieldPath[i];
        if (typeof currentLevel[key] === 'undefined' || currentLevel[key] === null) {
           if (fieldPath[i] === 'author') { 
             currentLevel[key] = { name: '', designation: '' }; 
           } else {
             currentLevel[key] = {};
           }
        }
        currentLevel = currentLevel[key] as NestedObject;
      }
      
      const finalKey = fieldPath[fieldPath.length - 1];
      currentLevel[finalKey] = value;
      
      return newData;
    });
  };
  
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    if (!tags.includes(tagInput.trim().toLowerCase())) {
      setTags(prev => [...prev, tagInput.trim().toLowerCase()]);
    }
    
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const publishToLibrary = async (placeholders: Record<string, unknown>[], templateHtml: string) => {
    if (placeholders.length === 0) {
      toast.error('Please add at least one placeholder before publishing.');
      return;
    }
    
    try {
      setIsPublishing(true);
      
      const placeholdersMap = Object.fromEntries(
        placeholders.map(placeholder => {
          return [
            (placeholder.fieldPath as string[]).join('.'), 
            placeholder.content as string
          ];
        })
      );
      
      const designData = {
        name: templateName || `${selectedAssetType || 'Template'} ${new Date().toLocaleDateString()}`,
        version: 1,
        isLatest: true,
        createdBy: 'current-user@example.com',
        placeholders: placeholdersMap
      };
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          design: designData,
          template: {
            html: templateHtml,
            type: selectedAssetType || 'text',
            tags: tags
          }
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Template published to library successfully!');
        
        if (result.templateId) {
          toast.info(`Template ID: ${result.templateId}`);
        }
      } else {
        throw new Error(result.error || 'Failed to publish template');
      }
    } catch (error) {
      console.error('Error publishing template:', error);
      toast.error('Failed to publish template to library');
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    assetData,
    selectedAssetType,
    isPublishing,
    tags,
    tagInput,
    templateName,
    setTemplateName,
    setTagInput,
    setSelectedAssetType,
    updateAssetData,
    addTag,
    removeTag,
    publishToLibrary
  };
}