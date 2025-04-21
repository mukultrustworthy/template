export const highlightElement = (element: HTMLElement | null) => {
  const existingHighlighted = document.querySelectorAll('.element-highlight');
  existingHighlighted.forEach(el => {
    el.classList.remove('element-highlight');
  });

  if (element) {
    element.classList.add('element-highlight');
  }
};

export const addElementIdentifiers = (container: HTMLElement) => {
  const elements = container.querySelectorAll('*');
  elements.forEach((element, index) => {
    (element as HTMLElement).dataset.elementId = `el-${index}`;
  });
};

export const findElementById = (container: HTMLElement, id: string): HTMLElement | null => {
  return container.querySelector(`[data-element-id="${id}"]`) as HTMLElement | null;
};

export interface ElementDataMapping {
  elementId: string;
  fieldPath: string[];
  content: string;
  elementType?: string;
  placeholderValue?: {
    type?: string;
    value: string;
  };
  isImageSrc?: boolean;
  regexPattern?: string;
}

export const generatePlaceholder = (fieldPath: string[]): { value: string } => {
  return { value: `{{${fieldPath.join('.')}}}` };
};

export const applyPlaceholders = (html: string, mappings: ElementDataMapping[]): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((element, index) => {
    if (!(element as HTMLElement).dataset.elementId) {
      (element as HTMLElement).dataset.elementId = `el-${index}`;
    }
  });
  
  const accentColorMapping = mappings.find(m => m.fieldPath.join('.') === 'accentColor');
  const accentColor = accentColorMapping?.content || '#FF5722';
  
  mappings.forEach(mapping => {
    const element = doc.querySelector(`[data-element-id="${mapping.elementId}"]`) as HTMLElement;
    if (!element) {
      console.warn(`Element with ID ${mapping.elementId} not found for field ${mapping.fieldPath.join('.')}`);
      return;
    }
    
    const placeholder = mapping.placeholderValue 
      ? mapping.placeholderValue.value 
      : generatePlaceholder(mapping.fieldPath).value;
    
    if (element.tagName.toLowerCase() === 'img' && (mapping.isImageSrc || mapping.fieldPath.some(path => path === 'image' || path.includes('Url') || path.includes('url')))) {
      if (element.hasAttribute('src')) {
        element.setAttribute('src', '/logo.svg');
        element.setAttribute('data-placeholder', placeholder);
        element.style.border = '2px dashed #3b82f6';
        element.style.padding = '4px';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        
        const fieldName = mapping.fieldPath.join('.');
        element.setAttribute('alt', `Image placeholder for: ${fieldName}`);
        
        const placeholderWrapper = doc.createElement('span');
        placeholderWrapper.setAttribute('data-image-placeholder', 'true');
        placeholderWrapper.textContent = placeholder;
        placeholderWrapper.style.display = 'none';
        element.parentNode?.insertBefore(placeholderWrapper, element.nextSibling);
      }
    } 
    else if (mapping.fieldPath.join('.') === 'accentColor') {
      element.textContent = `${placeholder} (Preview color: ${accentColor})`;
      element.setAttribute('data-accent-color', 'true');
      element.style.color = '#ffffff';
      element.style.backgroundColor = accentColor;
      element.style.padding = '4px 8px';
      element.style.borderRadius = '4px';
      element.style.display = 'inline-block';
    } 
    else {
      element.textContent = placeholder;
    }
  });
  
  if (accentColorMapping) {
    applyAccentColorToElements(doc, accentColor);
  }
  
  return `<!DOCTYPE html>
<html>
<head>
  ${doc.head.innerHTML}
</head>
<body>
  ${doc.body.innerHTML}
</body>
</html>`;
};

export const applyAccentColorToElements = (doc: Document, accentColor: string): void => {
  const colorProperties = ['color', 'background-color', 'border-color', 'outline-color'];
  
  const commonColorValues = [
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
    'rgb(59, 130, 246)', 'rgb(37, 99, 235)', 'rgb(29, 78, 216)',
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
    'rgb(239, 68, 68)', 'rgb(249, 115, 22)'
  ];
  
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach(el => {
    const element = el as HTMLElement;
    const style = element.getAttribute('style') || '';
    
    let modifiedStyle = style;
    colorProperties.forEach(prop => {
      commonColorValues.forEach(colorValue => {
        const regex = new RegExp(`${prop}\\s*:\\s*${colorValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
        modifiedStyle = modifiedStyle.replace(regex, `${prop}: ${accentColor}`);
      });
    });
    
    if (modifiedStyle !== style) {
      element.setAttribute('style', modifiedStyle);
      element.setAttribute('data-accent-color-applied', 'true');
    }
  });
  
  const commonColorClasses = [
    'text-blue-', 'bg-blue-', 'border-blue-', 
    'text-red-', 'bg-red-', 'border-red-',
    'text-orange-', 'bg-orange-', 'border-orange-',
    'hover:text-blue-', 'hover:bg-blue-', 'hover:border-blue-'
  ];
  
  commonColorClasses.forEach(classPrefix => {
    const elements = doc.querySelectorAll(`[class*="${classPrefix}"]`);
    elements.forEach(el => {
      (el as HTMLElement).setAttribute('data-accent-class', 'true');
    });
  });
}

export interface AssetTemplate {
  html: string;
  placeholderHtml: string;
  mappings: ElementDataMapping[];
}

export const applyHighlightStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .element-highlight {
      outline: 2px solid #3b82f6 !important;
      background-color: rgba(59, 130, 246, 0.1) !important;
      position: relative;
    }
    
    .element-highlight::after {
      content: "Selected";
      position: absolute;
      top: 0;
      right: 0;
      background-color: #3b82f6;
      color: white;
      font-size: 10px;
      padding: 2px 4px;
      border-radius: 0 0 0 4px;
      z-index: 1000;
    }
  `;
  document.head.appendChild(style);
};

export const loadExampleHtml = async (exampleName: string): Promise<string> => {
  try {
    const response = await fetch(`/examples/${exampleName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to fetch example: ${response.statusText}`);
    }
    const htmlContent = await response.text();
    return htmlContent;
  } catch (error) {
    console.error(`Error loading example HTML '${exampleName}':`, error);
    throw new Error(`Could not load example HTML: ${exampleName}`); 
  }
}; 