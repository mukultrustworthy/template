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