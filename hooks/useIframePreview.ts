import { useState, useRef, useEffect } from 'react';
import { addElementIdentifiers } from '@/utils/htmlInspector';

export function useIframePreview(
  html: string,
  isSelectMode: boolean,
  selectedElementId: string | null,
  handlers: {
    handleElementClick: (e: Event) => void;
    handleElementHover: (e: Event) => void;
    handleElementHoverOut: (e: Event) => void;
  }
) {
  const [shouldUpdateIframe, setShouldUpdateIframe] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeContentRef = useRef<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShouldUpdateIframe(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [html]);

  useEffect(() => {
    if (!shouldUpdateIframe && !isSelectMode) return;
    
    const iframe = iframeRef.current;
    if (!iframe) return;

    const newContent = `<!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; font-family: sans-serif; }
            * { box-sizing: border-box; }
            
            .highlight-selection {
              outline: 2px solid blue !important;
              outline-offset: 2px !important;
            }
            
            :root {
              --primary: 222.2 47.4% 11.2%;
              --primary-foreground: 210 40% 98%;
            }
          </style>
        </head>
        <body class="prose prose-sm max-w-none">${html}</body>
      </html>`;
    
    if (iframeContentRef.current !== newContent || shouldUpdateIframe) {
      iframeContentRef.current = newContent;
      
      const handleIframeLoad = () => {
        try {
          if (!iframe.contentDocument || !iframe.contentWindow) return;
          
          const iframeDoc = iframe.contentDocument;
          addElementIdentifiers(iframeDoc.body);
          
          attachIframeEventListeners(iframeDoc);
          
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

      iframe.removeEventListener('load', handleIframeLoad);
      iframe.addEventListener('load', handleIframeLoad);
      
      if (iframe.contentDocument) {
        iframe.srcdoc = newContent;
      }
    } else if (iframe.contentDocument) {
      attachIframeEventListeners(iframe.contentDocument);
      setShouldUpdateIframe(false);
    }
  }, [html, isSelectMode, selectedElementId, shouldUpdateIframe, handlers]);

  const attachIframeEventListeners = (iframeDoc: Document) => {
    const elements = iframeDoc.querySelectorAll('*');
    elements.forEach(element => {
      element.removeEventListener('click', handlers.handleElementClick);
      element.removeEventListener('mouseover', handlers.handleElementHover);
      element.removeEventListener('mouseout', handlers.handleElementHoverOut);
      
      if (isSelectMode) {
        element.addEventListener('click', handlers.handleElementClick);
        element.addEventListener('mouseover', handlers.handleElementHover);
        element.addEventListener('mouseout', handlers.handleElementHoverOut);
      }
    });
  };

  return {
    iframeRef,
    iframeContentRef,
    setShouldUpdateIframe
  };
} 