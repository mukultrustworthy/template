'use client';

import { useState, useEffect } from 'react';
import { applyHighlightStyles } from '@/utils/htmlInspector'; 
import { Button } from "@/components/ui/button";
import { Toaster } from "sonner";
import Link from "next/link";
import WelcomeGuide from '@/components/WelcomeGuide';
import ElementMapper from '@/components/ElementMapper';
import HtmlPreview from '@/components/HtmlPreview';
import ImportHtml from '@/components/ImportHtml';
import AssetConfig from '@/components/AssetConfig';
import PlaceholdersList from '@/components/PlaceholdersList';
import PlaceholderInfo from '@/components/PlaceholderInfo';

import { useHtml } from '@/hooks/useHtml';
import { useAssetData } from '@/hooks/useAssetData';
import { useElementSelection } from '@/hooks/useElementSelection';
import { useIframePreview } from '@/hooks/useIframePreview';
import { usePlaceholders } from '@/hooks/usePlaceholders';

export default function Home() {
  const [previewTab, setPreviewTab] = useState<string>("original");
  
  const {
    html,
    setHtml,
    isLoadingExample,
    fileInputRef,
    handleFileUpload,
    handlePaste,
    loadInitialExample
  } = useHtml();
  
  const {
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
  } = useAssetData();
  
  const {
    selectedElement,
    selectedElementId,
    isSelectMode,
    toggleSelectMode,
    handleElementClick,
    handleElementHover,
    handleElementHoverOut
  } = useElementSelection();
  
  const {
    placeholders,
    templateHtml,
    handleAddPlaceholder,
    handleRemovePlaceholder
  } = usePlaceholders(html);
  
  const {
    iframeRef,
    iframeContentRef
  } = useIframePreview(
    html,
    isSelectMode,
    selectedElementId,
    { handleElementClick, handleElementHover, handleElementHoverOut }
  );

  useEffect(() => {
    applyHighlightStyles();
    loadInitialExample();
  }, []);

  const handleUpdateAsset = (fieldPath: string[], value: string) => {
    updateAssetData(fieldPath, value);
    
    if (selectedElement?.dataset.elementId) {
      handleAddPlaceholder(
        selectedElement.dataset.elementId,
        fieldPath,
        value,
        selectedElement.tagName
      );
    } else {
      handleAddPlaceholder(undefined, fieldPath, value);
    }
  };

  const handlePublish = () => {
    publishToLibrary(placeholders as unknown as Record<string, unknown>[], html);
  };

  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">HTML Asset Editor</h1>
        <Button variant="outline" asChild>
          <Link href="/library">View Asset Library</Link>
        </Button>
      </div>
      
      <WelcomeGuide />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ImportHtml
            html={html}
            onChangeHtml={setHtml}
            onPaste={handlePaste}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            isLoadingExample={isLoadingExample}
          />

          <AssetConfig
            assetData={assetData}
            selectedAssetType={selectedAssetType}
            isPublishing={isPublishing}
            tags={tags}
            tagInput={tagInput}
            templateName={templateName}
            setTagInput={setTagInput}
            setTemplateName={setTemplateName}
            onAssetTypeChange={setSelectedAssetType}
            onUpdateAssetData={handleUpdateAsset}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            onPublish={handlePublish}
          />
        </div>
        
        <div>
          <div className="sticky top-6 space-y-6"> 
            <HtmlPreview
              html={html}
              templateHtml={templateHtml}
              placeholders={placeholders as unknown as Record<string, unknown>[]}
              isSelectMode={isSelectMode}
              isLoadingExample={isLoadingExample}
              previewTab={previewTab}
              setPreviewTab={setPreviewTab}
              iframeRef={iframeRef}
              iframeContentRef={iframeContentRef}
            />
            
            <ElementMapper 
              selectedElement={selectedElement} 
              onAddPlaceholder={(fieldPath, value, options) => {
                if (selectedElement?.dataset.elementId) {
                  handleAddPlaceholder(
                    selectedElement.dataset.elementId,
                    fieldPath,
                    value,
                    selectedElement.tagName,
                    options
                  );
                }
                updateAssetData(fieldPath, value);
              }}
              onSelectElementMode={toggleSelectMode}
              isSelectMode={isSelectMode}
            />
            
            <PlaceholdersList 
              placeholders={placeholders as unknown as Record<string, unknown>[]}
              onRemovePlaceholder={handleRemovePlaceholder}
            />

            <PlaceholderInfo placeholders={placeholders as unknown as Record<string, unknown>[]} />
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" /> 
    </main>
  );
}
