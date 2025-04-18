'use client';

import { useState, useRef, useEffect } from 'react';
import { AssetImageDto } from '@/types/asset';
import ElementMapper from '@/components/ElementMapper';
import ExampleLoader from '@/components/ExampleLoader';
import WelcomeGuide from '@/components/WelcomeGuide';
import { 
  highlightElement, 
  addElementIdentifiers, 
  applyHighlightStyles,
  ElementDataMapping,
  loadExampleHtml,
  generatePlaceholder,
  applyPlaceholders,
  AssetTemplate
} from '@/utils/htmlInspector'; // Added new imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner"; // Use sonner for toasts
import { toast } from "sonner"; // Import toast function from sonner
import { Upload, Trash2, Download, Share } from 'lucide-react'; // Added Share icon 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs component
import Link from "next/link";

export default function Home() {
  const [html, setHtml] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<AssetImageDto['type']>('text');
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [assetData, setAssetData] = useState<AssetImageDto>({
    answer: '',
    author: {
      name: '',
      designation: ''
    }
    // Add other fields as needed from AssetImageDto for initial state
  });
  const [mappings, setMappings] = useState<ElementDataMapping[]>([]);
  const [isLoadingExample, setIsLoadingExample] = useState<boolean>(true);
  const [shouldUpdateIframe, setShouldUpdateIframe] = useState<boolean>(false);
  const [templateHtml, setTemplateHtml] = useState<string>(''); // Store HTML with placeholders
  const [previewTab, setPreviewTab] = useState<string>("original"); // Track active preview tab
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeContentRef = useRef<string | null>(null); // Store iframe content to prevent reloads
  const toastShownRef = useRef<{[key: string]: boolean}>({});

  // Apply highlight styles & load default example when component mounts
  useEffect(() => {
    applyHighlightStyles();
    
    const fetchInitialExample = async () => {
      if (!isLoadingExample) return; // Prevent multiple fetches
      
      try {
        // Assuming loadExampleHtml fetches and returns HTML string
        const exampleHtml = await loadExampleHtml('testimonial'); 
        setHtml(exampleHtml);
        
        // Show toast only once
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

    fetchInitialExample();
  }, []); // Empty dependency array, run only once on mount

  // Handle HTML changes - prepare iframe update but limit frequency
  useEffect(() => {
    // Debounce the iframe updates to prevent excessive refreshing
    const timeoutId = setTimeout(() => {
      setShouldUpdateIframe(true);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [html]);

  // Handle iframe content updates only when needed
  useEffect(() => {
    if (!shouldUpdateIframe && !isSelectMode) return;
    
    const iframe = iframeRef.current;
    if (!iframe) return;

    const newContent = `<!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Base styles to match the site's styling for the preview */
            body { margin: 0; font-family: sans-serif; }
            * { box-sizing: border-box; }
            
            /* Selection styles */
            .highlight-selection {
              outline: 2px solid blue !important;
              outline-offset: 2px !important;
            }
            
            /* Custom styles to replace Tailwind in the iframe */
            :root {
              --primary: 222.2 47.4% 11.2%;
              --primary-foreground: 210 40% 98%;
            }
          </style>
        </head>
        <body class="prose prose-sm max-w-none">${html}</body>
      </html>`;
    
    // Only update content if it changed or selection mode changed
    if (iframeContentRef.current !== newContent || shouldUpdateIframe) {
      iframeContentRef.current = newContent;
      
      const handleIframeLoad = () => {
        try {
          if (!iframe.contentDocument || !iframe.contentWindow) return;
          
          // Access iframe document and add element identifiers
          const iframeDoc = iframe.contentDocument;
          addElementIdentifiers(iframeDoc.body);
          
          // Clear previous event listeners and attach new ones
          attachIframeEventListeners(iframeDoc);
          
          // Restore highlight for the selected element if there is one
          if (selectedElementId) {
            const elementToHighlight = iframeDoc.querySelector(`[data-element-id="${selectedElementId}"]`);
            if (elementToHighlight) {
              elementToHighlight.classList.add('highlight-selection');
            }
          }
        } catch (error) {
          console.error('Error accessing iframe content:', error);
        } finally {
          setShouldUpdateIframe(false);
        }
      };

      // Remove previous and add new load event listener
      iframe.removeEventListener('load', handleIframeLoad);
      iframe.addEventListener('load', handleIframeLoad);
      
      // Update iframe content
      if (iframe.contentDocument) {
        iframe.srcdoc = newContent;
      }
    } else if (iframe.contentDocument) {
      // If content hasn't changed but selection mode has, just update the event listeners
      attachIframeEventListeners(iframe.contentDocument);
      setShouldUpdateIframe(false);
    }
  }, [html, isSelectMode, selectedElementId, shouldUpdateIframe]);

  // Custom toast function to prevent duplicate toasts
  const showToast = (type: 'success' | 'info' | 'error', message: string, key: string) => {
    if (toastShownRef.current[key]) return;
    
    toastShownRef.current[key] = true;
    
    if (type === 'success') toast.success(message);
    else if (type === 'info') toast.info(message);
    else if (type === 'error') toast.error(message);
    
    // Increase timeout to prevent accidental re-firing
    setTimeout(() => {
      toastShownRef.current[key] = false;
    }, 5000);
  };

  // Function to attach event listeners to iframe elements
  const attachIframeEventListeners = (iframeDoc: Document) => {
    const elements = iframeDoc.querySelectorAll('*');
    elements.forEach(element => {
      element.removeEventListener('click', handleElementClick);
      element.removeEventListener('mouseover', handleElementHover);
      element.removeEventListener('mouseout', handleElementHoverOut);
      
      if (isSelectMode) {
        element.addEventListener('click', handleElementClick);
        element.addEventListener('mouseover', handleElementHover);
        element.addEventListener('mouseout', handleElementHoverOut);
      }
    });
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

  const handleElementClick = (e: Event) => {
    if (!isSelectMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    const element = e.target as HTMLElement;
    
    // Reset any previous highlight
    if (iframeRef.current?.contentDocument) {
      const elements = iframeRef.current.contentDocument.querySelectorAll('.highlight-selection');
      elements.forEach(el => el.classList.remove('highlight-selection'));
    }
    
    // Store the element ID for persistence
    const elementId = element.dataset.elementId;
    if (elementId) {
      setSelectedElementId(elementId);
    }
    
    // Add highlight to selected element
    element.classList.add('highlight-selection');
    
    setSelectedElement(element);
    highlightElement(element);
    setIsSelectMode(false);
    
    // Use a unique, stable key that includes the element path for better disambiguation
    const elementPath = element.tagName.toLowerCase() + 
      (element.id ? `#${element.id}` : '') + 
      (element.className ? `.${element.className.replace(/\s+/g, '.')}` : '');
    showToast('success', `Element <${element.tagName.toLowerCase()}> selected.`, `elementSelected-${elementPath}`);
  };

  const handleElementHover = (e: Event) => {
    if (!isSelectMode) return;
    const element = e.target as HTMLElement;
    // Use direct styling instead of classList for iframe elements
    element.style.outline = '2px solid hsl(222.2 47.4% 11.2%)';
    element.style.outlineOffset = '2px';
    element.style.cursor = 'pointer';
  };

  const handleElementHoverOut = (e: Event) => {
    if (!isSelectMode) return;
    const element = e.target as HTMLElement;
    // Reset the styles
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.cursor = '';
  };

  const toggleSelectMode = () => {
    const enteringSelectMode = !isSelectMode;
    setIsSelectMode(enteringSelectMode);
    if (enteringSelectMode) {
      setSelectedElement(null);
      setSelectedElementId(null); // Clear the selected element ID
      highlightElement(null);
      showToast('info', "Selection mode activated. Click an element in the preview.", 'selectModeOn');
      
      // Update listeners immediately if iframe is already loaded
      if (iframeRef.current?.contentDocument) {
        attachIframeEventListeners(iframeRef.current.contentDocument);
      }
    } else {
      showToast('info', "Selection mode deactivated.", 'selectModeOff');
      
      // Remove listeners if iframe is loaded
      if (iframeRef.current?.contentDocument) {
        const elements = iframeRef.current.contentDocument.querySelectorAll('*');
        elements.forEach(element => {
          element.removeEventListener('click', handleElementClick);
          element.removeEventListener('mouseover', handleElementHover);
          element.removeEventListener('mouseout', handleElementHoverOut);
        });
      }
    }
  };

  const handleMapElement = (fieldPath: string[], value: string, options?: { isImageSrc?: boolean }) => {
    setAssetData(prev => {
      const newData = structuredClone(prev); // Deep clone for safer nested updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let currentLevel: any = newData; // Using any here as object structure varies, disabling lint rule

      for (let i = 0; i < fieldPath.length - 1; i++) {
        const key = fieldPath[i] as keyof typeof currentLevel;
        if (typeof currentLevel[key] === 'undefined' || currentLevel[key] === null) {
           // Ensure nested objects exist if they don't
           // Be careful with this - might need refinement based on actual DTO structure
           if (fieldPath[i] === 'author') { 
             currentLevel[key] = { name: '', designation: '' }; 
           } else {
             currentLevel[key] = {}; // Default to empty object if structure unknown
           }
        }
        currentLevel = currentLevel[key];
      }
      
      const finalKey = fieldPath[fieldPath.length - 1];
      currentLevel[finalKey] = value;
      
      return newData;
    });

    if (selectedElement?.dataset.elementId) {
      // Generate a placeholder value based on the field path
      const placeholder = generatePlaceholder(fieldPath);
      
      // Determine if this is an image field based on field path or explicit flag
      const isImageField = fieldPath.some(p => p === 'image' || p.includes('Url') || p.includes('url'));
      const shouldTreatAsImage = options?.isImageSrc || isImageField || selectedElement.tagName.toLowerCase() === 'img';
      
      // Create the enhanced mapping with placeholder and element type information
      const newMapping: ElementDataMapping = {
        elementId: selectedElement.dataset.elementId,
        fieldPath,
        content: value,
        elementType: selectedElement.tagName.toLowerCase(),
        placeholderValue: placeholder,
        isImageSrc: shouldTreatAsImage
      };
      
      // Update mappings state with the new mapping
      setMappings(prevMappings => {
        let updatedMappings: ElementDataMapping[];
        
        const existingMappingIndex = prevMappings.findIndex(
          m => m.fieldPath.join('.') === fieldPath.join('.')
        );
        
        if (existingMappingIndex !== -1) {
          // Update existing mapping
          updatedMappings = [...prevMappings];
          updatedMappings[existingMappingIndex] = newMapping;
        } else {
          // Add new mapping
          updatedMappings = [...prevMappings, newMapping];
        }
        
        // Regenerate template HTML with all mappings including the new one
        setTimeout(() => {
          const newTemplateHtml = applyPlaceholders(html, updatedMappings);
          setTemplateHtml(newTemplateHtml);
          
          // Log the mapping to console for debugging when developing
          if (process.env.NODE_ENV === 'development') {
            console.debug('Applied mapping:', newMapping, 'Current mappings:', updatedMappings.length);
          }
        }, 0);
        
        return updatedMappings;
      });
      
      showToast('success', `Mapped element to field: ${fieldPath.join('.')}`, `mappedField-${fieldPath.join('.')}`);
    } else if (!selectedElement) {
        // Allow manual input mapping even without element selection
        showToast('info', `Manually set field: ${fieldPath.join('.')}`, `manualField-${fieldPath.join('.')}`);
    }
  };
  
  const handleRemoveMapping = (indexToRemove: number) => {
    const mappingToRemove = mappings[indexToRemove];
    
    setMappings(prev => {
      const updatedMappings = prev.filter((_, i) => i !== indexToRemove);
      
      // Regenerate template HTML without the removed mapping
      setTimeout(() => {
        const newTemplateHtml = applyPlaceholders(html, updatedMappings);
        setTemplateHtml(newTemplateHtml);
      }, 0);
      
      return updatedMappings;
    });

    showToast('info', `Mapping for "${mappingToRemove.fieldPath.join('.')}" removed.`, `removeMapping-${mappingToRemove.fieldPath.join('.')}`);
  };


  const exportAssetData = () => {
    // Create the asset template that includes both the original HTML and the placeholder version
    const assetTemplate: AssetTemplate = {
      html: html,
      placeholderHtml: templateHtml || applyPlaceholders(html, mappings), // Generate if not already done
      mappings: mappings
    };
    
    // Generate a mock MongoDB document structure
    const templateId = `template_${Math.random().toString(36).substring(2, 10)}`;
    const assetId = `${assetData.type || 'asset'}_${Math.random().toString(36).substring(2, 7)}`;
    const version = '1.0.0';
    
    // Create MongoDB-compatible document structure
    const mongoDocument = {
      id: templateId,
      assetId,
      type: assetData.type || 'text',
      version,
      isLatest: true,
      publishedAt: new Date().toISOString(),
      createdBy: 'current-user@example.com',
      updatedAt: new Date().toISOString(),
      tags: tags,
      mappings: mappings,
      htmlUrl: `https://assets.example.com/html/${assetId}_v${version}.html`
    };
    
    // Export JSON data
    const dataStr = JSON.stringify(mongoDocument, null, 2);
    const jsonBlob = new Blob([dataStr], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    
    // Export HTML file
    const htmlBlob = new Blob([assetTemplate.html], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    
    // Create a name for the export files based on generated IDs
    const baseFileName = `${assetId}_v${version}`;
    
    // Download JSON file
    const jsonLinkElement = document.createElement('a');
    jsonLinkElement.href = jsonUrl;
    jsonLinkElement.download = `${baseFileName}.json`;
    document.body.appendChild(jsonLinkElement);
    jsonLinkElement.click();
    
    // Small delay between downloads to avoid browser issues
    setTimeout(() => {
      // Download HTML file
      const htmlLinkElement = document.createElement('a');
      htmlLinkElement.href = htmlUrl;
      htmlLinkElement.download = `${baseFileName}.html`;
      document.body.appendChild(htmlLinkElement);
      htmlLinkElement.click();
      
      // Clean up
      document.body.removeChild(htmlLinkElement);
      URL.revokeObjectURL(htmlUrl);
      
      toast.success("Asset template files exported successfully!");
    }, 100);
    
    // Clean up JSON download
    document.body.removeChild(jsonLinkElement);
    URL.revokeObjectURL(jsonUrl);
  };

  // Function to publish asset template to library
  const publishToLibrary = async () => {
    if (mappings.length === 0) {
      showToast('error', 'Please map at least one element before publishing.', 'publishNoMappings');
      return;
    }
    
    try {
      setIsPublishing(true);
      
      // Create the asset template
      const assetTemplate: AssetTemplate = {
        html: html,
        placeholderHtml: templateHtml || applyPlaceholders(html, mappings), // Generate if not already done
        mappings: mappings
      };
      
      // Prepare payload for API
      const payload = {
        assetData,
        template: assetTemplate,
        tags
      };
      
      // Call API to publish
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success('Template published to library successfully!');
        
        // Optional: Show asset ID or other metadata
        if (result.assetId) {
          toast.info(`Asset ID: ${result.assetId}`);
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
  
  // Add a tag to the template
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Prevent duplicate tags
    if (!tags.includes(tagInput.trim().toLowerCase())) {
      setTags(prev => [...prev, tagInput.trim().toLowerCase()]);
    }
    
    setTagInput('');
  };
  
  // Remove a tag from the template
  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // --- Component Rendering ---
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
        {/* Left Column */}
        <div className="space-y-6">
          {/* Import Card */}
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
                  accept=".html,.htm" // Accept both extensions
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <ExampleLoader onLoadExample={setHtml} isLoading={isLoadingExample} />
              </div>
              <Separator />
              <div>
                <Label htmlFor="html-paste-area" className="text-sm font-medium">Or paste HTML code:</Label>
                <Textarea 
                  id="html-paste-area"
                  className="mt-1 font-mono text-sm h-48" // Use monospace font
                  onPaste={handlePaste}
                  onChange={(e) => setHtml(e.target.value)}
                  value={html}
                  placeholder="<!-- Paste your HTML snippet here -->"
                />
              </div>
            </CardContent>
          </Card>

          {/* Config Card */}
          <Card>
            <CardHeader>
              <CardTitle>Asset Data Configuration</CardTitle>
              <CardDescription>Define the structure and content of your asset.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="asset-type">Asset Type</Label>
                <Select 
                  value={selectedAssetType} 
                  onValueChange={(value) => setSelectedAssetType(value as AssetImageDto['type'])}
                >
                  <SelectTrigger id="asset-type">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Add SelectItem components for each type */}
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="rating-summary">Rating Summary</SelectItem>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="multiple-choice-individual">Multiple Choice Individual</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="multiple-choice-text">Multiple Choice Text</SelectItem>
                    {/* Add more based on AssetImageDto['type'] */}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Dynamically generate input fields based on selected type or DTO? */}
              {/* For now, using the existing static fields */}
              <div className="grid gap-2">
                  <Label htmlFor="brandLogoUrl">Brand Logo URL</Label>
                  <Input 
                    id="brandLogoUrl"
                    type="url" 
                    placeholder="https://example.com/logo.png"
                    value={assetData.brandLogoUrl || ''}
                    onChange={(e) => handleMapElement(['brandLogoUrl'], e.target.value)}
                  />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="question">Question</Label>
                  <Input 
                    id="question"
                    placeholder="Enter the question text"
                    value={assetData.question || ''}
                    onChange={(e) => handleMapElement(['question'], e.target.value)}
                  />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Input 
                    id="answer"
                    placeholder="Enter the answer text"
                    value={assetData.answer}
                    onChange={(e) => handleMapElement(['answer'], e.target.value)}
                  />
              </div>
              {/* Author Fields */}
              <Separator />
              <h4 className="text-sm font-medium text-muted-foreground pt-2">Author Details</h4>
               <div className="grid gap-2">
                  <Label htmlFor="authorName">Author Name</Label>
                  <Input 
                    id="authorName"
                    placeholder="John Doe"
                    value={assetData.author.name}
                    onChange={(e) => handleMapElement(['author', 'name'], e.target.value)}
                  />
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="authorDesignation">Author Designation</Label>
                  <Input 
                    id="authorDesignation"
                    placeholder="CEO, Example Inc."
                    value={assetData.author.designation}
                    onChange={(e) => handleMapElement(['author', 'designation'], e.target.value)}
                  />
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="authorImage">Author Image URL</Label>
                  <Input 
                    id="authorImage"
                    type="url"
                    placeholder="https://example.com/author.jpg"
                    value={assetData.author.image || ''}
                    onChange={(e) => handleMapElement(['author', 'image'], e.target.value)}
                  />
              </div>
              {/* Style Fields */}
              <Separator />
               <h4 className="text-sm font-medium text-muted-foreground pt-2">Styling</h4>
               <div className="grid gap-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <Input 
                    id="accentColor"
                    placeholder="#FF0000"
                    value={assetData.accentColor || ''}
                    onChange={(e) => handleMapElement(['accentColor'], e.target.value)}
                  />
              </div>
              {/* Add other fields from AssetImageDto as needed */}
              
              {/* Tags section */}
              <Separator />
              <h4 className="text-sm font-medium text-muted-foreground pt-2">Template Tags</h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button variant="outline" onClick={addTag} type="button">
                    Add
                  </Button>
                </div>
                
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <div key={tag} className="flex items-center bg-muted rounded-full pl-3 pr-2 py-1 text-xs">
                        {tag}
                        <button 
                          className="ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          <span aria-hidden="true">×</span>
                          <span className="sr-only">Remove {tag}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button onClick={exportAssetData} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Export Asset Data
              </Button>
              <Button 
                onClick={publishToLibrary} 
                className="w-full" 
                variant="secondary" 
                disabled={isPublishing}
              >
                <Share className="mr-2 h-4 w-4" /> 
                {isPublishing ? 'Publishing...' : 'Publish to Library'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Right Column (Sticky Preview & Mapper) */}
        <div>
          <div className="sticky top-6 space-y-6"> 
            {/* Preview Card */}
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
                    <TabsTrigger value="template" className="flex-1" disabled={mappings.length === 0}>
                      Template with Placeholders {mappings.length > 0 && `(${mappings.length})`}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="original">
                    <div className={`border rounded-md p-3 h-[450px] overflow-auto bg-white ${isSelectMode ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      <div ref={previewRef} className="w-full h-full">
                        <iframe 
                          ref={iframeRef}
                          srcDoc={iframeContentRef.current || `<!DOCTYPE html>
                          <html>
                            <head>
                              <style>
                                /* Base styles to match the site's styling for the preview */
                                body { margin: 0; font-family: sans-serif; }
                                * { box-sizing: border-box; }
                                
                                /* Selection styles */
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
                                /* Base styles to match the site's styling for the preview */
                                body { margin: 0; font-family: sans-serif; }
                                * { box-sizing: border-box; }
                                
                                /* Placeholder styling */
                                [data-placeholder] {
                                  background-color: rgba(59, 130, 246, 0.1);
                                  border: 1px dashed #3b82f6;
                                  padding: 2px 4px;
                                  border-radius: 2px;
                                  color: #2563eb;
                                  font-weight: 500;
                                }
                                
                                /* Special styling for image placeholders */
                                img[data-placeholder] {
                                  border: 2px dashed #3b82f6 !important;
                                  padding: 4px !important;
                                  background-color: rgba(59, 130, 246, 0.1) !important;
                                  position: relative;
                                  max-width: 100% !important;
                                  height: auto !important;
                                }
                                
                                /* Special handling for image placeholders */
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
                                
                                /* Add an indicator for image placeholders */
                                img[data-placeholder]::after {
                                  content: attr(data-placeholder);
                                  position: absolute;
                                  bottom: 0;
                                  left: 0;
                                  right: 0;
                                  background-color: rgba(59, 130, 246, 0.8);
                                  color: white;
                                  font-size: 10px;
                                  padding: 2px 4px;
                                  text-align: center;
                                }
                                
                                /* Style elements with accent color applied */
                                [data-accent-color-applied], [data-accent-class] {
                                  position: relative;
                                }
                                
                                [data-accent-color-applied]::after, [data-accent-class]::after {
                                  content: '🎨';
                                  position: absolute;
                                  top: -8px;
                                  right: -8px;
                                  font-size: 12px;
                                  width: 16px;
                                  height: 16px;
                                  z-index: 100;
                                }
                                
                                /* Style placeholder elements */
                                *:not(img):contains("{{") {
                                  position: relative;
                                  background-color: rgba(59, 130, 246, 0.05);
                                  border: 1px dashed rgba(59, 130, 246, 0.3);
                                  border-radius: 2px;
                                  padding: 1px 2px;
                                }
                                
                                /* Apply pulse animation to all placeholders to make them stand out */
                                *:not(img):contains("{{")::before {
                                  content: "";
                                  position: absolute;
                                  top: 0;
                                  left: 0;
                                  right: 0;
                                  bottom: 0;
                                  border: 1px solid rgba(59, 130, 246, 0.5);
                                  border-radius: 2px;
                                  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                                }
                                
                                @keyframes pulse {
                                  0%, 100% {
                                    opacity: 0;
                                  }
                                  50% {
                                    opacity: 1;
                                  }
                                }
                              </style>
                              <script>
                                // Polyfill for :contains() selector which is not standard
                                Element.prototype.contains = function(text) {
                                  if (this.textContent.includes(text)) return true;
                                  return false;
                                };
                                
                                // Add highlight to all elements with placeholders
                                document.addEventListener('DOMContentLoaded', function() {
                                  document.querySelectorAll('*').forEach(el => {
                                    if (el.textContent && el.textContent.includes('{{')) {
                                      el.classList.add('has-placeholder');
                                    }
                                  });
                                });
                              </script>
                            </head>
                            <body class="prose prose-sm max-w-none">${templateHtml || applyPlaceholders(html, mappings)}</body>
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
            
            {/* Element Mapper Card */}
            <Card>
              <CardHeader>
                 <CardTitle>Element Mapper</CardTitle>
                 <CardDescription>Select an element in the preview and map it to a data field.</CardDescription>
              </CardHeader>
              <CardContent>
                <ElementMapper 
                  selectedElement={selectedElement} 
                  onMapElement={handleMapElement}
                  onSelectElementMode={toggleSelectMode}
                  isSelectMode={isSelectMode}
                />
              </CardContent>
            </Card>
            
            {/* Mappings Card */}
            {mappings.length > 0 && (
              <Card>
                 <CardHeader>
                   <CardTitle>Current Mappings ({mappings.length})</CardTitle>
                   <CardDescription>Review and manage your element-to-field mappings.</CardDescription>
                 </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mappings.map((mapping, index) => (
                      <li key={index} className="flex flex-col p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className={`h-6 w-6 rounded flex items-center justify-center text-xs ${
                                mapping.elementType === 'img' ? 'bg-blue-100 text-blue-700' : 
                                mapping.fieldPath.join('.') === 'accentColor' ? 'bg-orange-100 text-orange-700' : 
                                'bg-gray-100 text-gray-700'
                              }`}
                              title={`Element type: ${mapping.elementType || 'unknown'}`}
                            >
                              {mapping.elementType === 'img' ? 'IMG' : 
                               mapping.fieldPath.join('.') === 'accentColor' ? '🎨' :
                               mapping.elementType?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-mono text-sm font-medium text-primary">{mapping.fieldPath.join('.')}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive/80 h-7 w-7"
                            onClick={() => handleRemoveMapping(index)}
                            aria-label="Remove mapping"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 pl-8">
                          {mapping.fieldPath.join('.') === 'accentColor' ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: mapping.content }}></div>
                              <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">{mapping.content}</code>
                            </div>
                          ) : mapping.isImageSrc ? (
                            <p className="text-xs text-muted-foreground truncate" title={mapping.content}>
                              <span className="font-medium">Image source:</span> {mapping.content || '<empty>'}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate" title={mapping.content}>
                              <span className="font-medium">Content:</span> {mapping.content || '<empty>'}
                            </p>
                          )}
                          
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">Placeholder:</span> {mapping.placeholderValue || generatePlaceholder(mapping.fieldPath)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Add this Placeholder Info Card after the mappings card */}
            {mappings.length > 0 && (
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
                    
                    {mappings.some(m => m.fieldPath.join('.') === 'accentColor') && (
                      <div className="mt-3 p-2 rounded-md border border-orange-200 bg-orange-50">
                        <p className="text-xs font-medium text-orange-800 mb-1">Accent Color Detected</p>
                        <p className="text-xs text-orange-700">
                          This template uses accent color mapping. Remember to apply the user&apos;s chosen color 
                          to all elements marked with <code className="bg-white px-1 rounded text-xs">data-accent-color-applied</code> 
                          or <code className="bg-white px-1 rounded text-xs">data-accent-class</code> attributes.
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: mappings.find(m => m.fieldPath.join('.') === 'accentColor')?.content || '#FF5722' }}></div>
                          <code className="text-xs bg-white px-1 rounded font-mono">
                            {mappings.find(m => m.fieldPath.join('.') === 'accentColor')?.content || '#FF5722'}
                          </code>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mt-2">
                      The template JSON includes detailed mapping information for regex-based replacements.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" /> 
    </main>
  );
}
