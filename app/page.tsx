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
  loadExampleHtml // Assuming this function exists or will be created
} from '@/utils/htmlInspector'; // Adjust path if needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner"; // Use sonner for toasts
import { toast } from "sonner"; // Import toast function from sonner
import { Upload, Trash2, Download /*, Info */ } from 'lucide-react'; // Import icons (Removed unused Info)

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

  const handleMapElement = (fieldPath: string[], value: string) => {
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
      const newMapping: ElementDataMapping = {
        elementId: selectedElement.dataset.elementId,
        fieldPath,
        content: value
      };
      setMappings(prevMappings => {
        const existingMappingIndex = prevMappings.findIndex(
          m => m.fieldPath.join('.') === fieldPath.join('.')
        );
        if (existingMappingIndex !== -1) {
          const updatedMappings = [...prevMappings];
          updatedMappings[existingMappingIndex] = newMapping;
          return updatedMappings;
        }
        return [...prevMappings, newMapping];
      });
      showToast('success', `Mapped element to field: ${fieldPath.join('.')}`, `mappedField-${fieldPath.join('.')}`);
    } else if (!selectedElement) {
        // Allow manual input mapping even without element selection
        showToast('info', `Manually set field: ${fieldPath.join('.')}`, `manualField-${fieldPath.join('.')}`);
    }
  };
  
  const handleRemoveMapping = (indexToRemove: number) => {
    const mappingToRemove = mappings[indexToRemove];
    setMappings(prev => prev.filter((_, i) => i !== indexToRemove));
    
    // Optionally clear the corresponding data field when unmapping
    // setAssetData(prev => { ... }); // Logic to clear field based on mappingToRemove.fieldPath

    showToast('info', `Mapping for "${mappingToRemove.fieldPath.join('.')}" removed.`, `removeMapping-${mappingToRemove.fieldPath.join('.')}`);
  };


  const exportAssetData = () => {
    const dataStr = JSON.stringify(assetData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = 'asset-data.json';
    const linkElement = document.createElement('a');
    linkElement.href = url;
    linkElement.download = exportFileDefaultName;
    document.body.appendChild(linkElement); // Required for Firefox
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url); // Clean up
    toast.success("Asset data exported successfully!");
  };

  // --- Component Rendering ---
  return (
    <main className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">HTML Asset Editor</h1>
      
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
            </CardContent>
            <CardFooter>
              <Button onClick={exportAssetData} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Export Asset Data
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
                          </style>
                        </head>
                        <body class="prose prose-sm max-w-none">${html}</body>
                      </html>`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                      title="HTML Preview"
                    />
                  </div>
                </div>
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
                   <CardTitle>Current Mappings</CardTitle>
                   <CardDescription>Review and manage your element-to-field mappings.</CardDescription>
                 </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mappings.map((mapping, index) => (
                      <li key={index} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                        <div>
                          <span className="font-mono text-sm font-medium text-primary">{mapping.fieldPath.join('.')}</span>
                           <p className="text-xs text-muted-foreground mt-1 truncate" title={mapping.content}>
                             Content: {mapping.content || '<empty>'}
                           </p>
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
                      </li>
                    ))}
                  </ul>
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
