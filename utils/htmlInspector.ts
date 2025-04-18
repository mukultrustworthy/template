/**
 * Adds highlighting to the clicked element in the HTML preview, or removes highlight if null.
 */
export const highlightElement = (element: HTMLElement | null) => {
  // First remove existing highlights
  const existingHighlighted = document.querySelectorAll('.element-highlight');
  existingHighlighted.forEach(el => {
    el.classList.remove('element-highlight');
  });

  // Add highlight to the selected element if it's not null
  if (element) {
    element.classList.add('element-highlight');
  }
};

/**
 * Adds a unique data attribute to elements for identification
 */
export const addElementIdentifiers = (container: HTMLElement) => {
  const elements = container.querySelectorAll('*');
  elements.forEach((element, index) => {
    (element as HTMLElement).dataset.elementId = `el-${index}`;
  });
};

/**
 * Finds an element by its data-element-id
 */
export const findElementById = (container: HTMLElement, id: string): HTMLElement | null => {
  return container.querySelector(`[data-element-id="${id}"]`) as HTMLElement | null;
};

/**
 * Creates a mapping of elements to data fields
 */
export interface ElementDataMapping {
  elementId: string;
  fieldPath: string[];
  content: string;
  elementType?: string; // The HTML element type (img, p, span, etc.)
  placeholderValue?: string; // The placeholder value to substitute
  isImageSrc?: boolean; // Whether this mapping is for an image src attribute
  regexPattern?: string; // Pattern for finding/replacing the element content in template
}

/**
 * Generate a placeholder value for a field path
 */
export const generatePlaceholder = (fieldPath: string[]): string => {
  return `{{${fieldPath.join('.')}}}`;
};

/**
 * Apply placeholders to HTML based on mappings
 */
export const applyPlaceholders = (html: string, mappings: ElementDataMapping[]): string => {
  // First, parse the HTML to work with DOM elements
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Add element identifiers if they don't exist
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((element, index) => {
    if (!(element as HTMLElement).dataset.elementId) {
      (element as HTMLElement).dataset.elementId = `el-${index}`;
    }
  });
  
  // Extract accent color mapping if it exists
  const accentColorMapping = mappings.find(m => m.fieldPath.join('.') === 'accentColor');
  const accentColor = accentColorMapping?.content || '#FF5722'; // Default orange if not set
  
  // Apply placeholders for each mapping
  mappings.forEach(mapping => {
    const element = doc.querySelector(`[data-element-id="${mapping.elementId}"]`) as HTMLElement;
    if (!element) {
      console.warn(`Element with ID ${mapping.elementId} not found for field ${mapping.fieldPath.join('.')}`);
      return;
    }
    
    const placeholder = mapping.placeholderValue || generatePlaceholder(mapping.fieldPath);
    
    // Handle image src attributes specially
    if (element.tagName.toLowerCase() === 'img' && (mapping.isImageSrc || mapping.fieldPath.some(path => path === 'image' || path.includes('Url') || path.includes('url')))) {
      if (element.hasAttribute('src')) {
        // Set placeholder image with proper visual indicator
        element.setAttribute('src', '/logo.svg'); // Use logo.svg as a placeholder for images
        element.setAttribute('data-placeholder', placeholder);
        // Add visual styling to make it clear this is an image placeholder
        element.style.border = '2px dashed #3b82f6';
        element.style.padding = '4px';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        
        // Add a label to make it clear what field this maps to
        const fieldName = mapping.fieldPath.join('.');
        element.setAttribute('alt', `Image placeholder for: ${fieldName}`);
        
        // Important: Also create a text node for serialization integrity
        const placeholderWrapper = doc.createElement('span');
        placeholderWrapper.setAttribute('data-image-placeholder', 'true');
        placeholderWrapper.textContent = placeholder;
        placeholderWrapper.style.display = 'none';
        element.parentNode?.insertBefore(placeholderWrapper, element.nextSibling);
      }
    } 
    // Handle accent color specially - we apply it directly in the preview
    else if (mapping.fieldPath.join('.') === 'accentColor') {
      // Instead of replacing content, we leave a placeholder indicator
      element.textContent = `${placeholder} (Preview color: ${accentColor})`;
      element.setAttribute('data-accent-color', 'true');
      element.style.color = '#ffffff';
      element.style.backgroundColor = accentColor;
      element.style.padding = '4px 8px';
      element.style.borderRadius = '4px';
      element.style.display = 'inline-block';
    } 
    else {
      // For text content elements
      element.textContent = placeholder;
    }
  });
  
  // Apply accent color to all elements with specific color CSS properties
  if (accentColorMapping) {
    applyAccentColorToElements(doc, accentColor);
  }
  
  // Instead of using XMLSerializer which can cause issues,
  // return the full HTML with placeholders using the document's innerHTML
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

/**
 * Apply accent color to elements with color properties in their style attributes or class-based colors
 */
export const applyAccentColorToElements = (doc: Document, accentColor: string): void => {
  // Common CSS color properties that might use the accent color
  const colorProperties = ['color', 'background-color', 'border-color', 'outline-color'];
  
  // CSS color values that might be replaced (typical theme colors)
  const commonColorValues = [
    // Blues
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
    'rgb(59, 130, 246)', 'rgb(37, 99, 235)', 'rgb(29, 78, 216)',
    // Reds
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    // Oranges
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
    // Common class-based colors from frameworks
    'rgb(239, 68, 68)', 'rgb(249, 115, 22)'
  ];
  
  // Find all elements with style attributes
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach(el => {
    const element = el as HTMLElement;
    const style = element.getAttribute('style') || '';
    
    let modifiedStyle = style;
    colorProperties.forEach(prop => {
      // Check each color property for common values
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
  
  // Additionally, mark elements with common color classes 
  // (this doesn't change the styling but helps identify elements during export)
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

/**
 * Creates a template object with HTML and mappings
 */
export interface AssetTemplate {
  html: string;
  placeholderHtml: string;
  mappings: ElementDataMapping[];
}

/**
 * Apply styles to highlighted elements in editor
 */
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

/**
 * Fetches example HTML content from the public directory.
 */
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
    // Re-throw or return a default/error state HTML
    throw new Error(`Could not load example HTML: ${exampleName}`); 
  }
}; 