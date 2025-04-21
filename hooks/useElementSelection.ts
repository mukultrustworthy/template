import { useState } from 'react';
import { highlightElement } from '@/utils/htmlInspector';
import { toast } from 'sonner';

export function useElementSelection() {
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);

  const handleElementClick = (e: Event) => {
    if (!isSelectMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    const element = e.target as HTMLElement;
    
    if (element?.ownerDocument) {
      const elements = element.ownerDocument.querySelectorAll('.highlight-selection');
      elements.forEach(el => el.classList.remove('highlight-selection'));
    }
    
    const elementId = element.dataset.elementId;
    if (elementId) {
      setSelectedElementId(elementId);
    }
    
    element.classList.add('highlight-selection');
    
    setSelectedElement(element);
    highlightElement(element);
    setIsSelectMode(false);
    
    toast.success(`Element <${element.tagName.toLowerCase()}> selected.`);
  };

  const handleElementHover = (e: Event) => {
    if (!isSelectMode) return;
    const element = e.target as HTMLElement;
    element.style.outline = '2px solid hsl(222.2 47.4% 11.2%)';
    element.style.outlineOffset = '2px';
    element.style.cursor = 'pointer';
  };

  const handleElementHoverOut = (e: Event) => {
    if (!isSelectMode) return;
    const element = e.target as HTMLElement;
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.cursor = '';
  };

  const toggleSelectMode = () => {
    const newMode = !isSelectMode;
    setIsSelectMode(newMode);
    
    if (newMode) {
      setSelectedElement(null);
      setSelectedElementId(null);
      highlightElement(null);
      toast.info("Selection mode activated. Click an element in the preview.");
    } else {
      toast.info("Selection mode deactivated.");
    }
  };

  return {
    selectedElement,
    selectedElementId,
    isSelectMode,
    toggleSelectMode,
    handleElementClick,
    handleElementHover,
    handleElementHoverOut
  };
} 