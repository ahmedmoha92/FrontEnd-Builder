export enum ComponentType {
  TABLE = 'TABLE',
  STAT_CARD = 'STAT_CARD',
  COMPLETE_CARD = 'COMPLETE_CARD',
  CHART = 'CHART',
  PDF_VIEWER = 'PDF_VIEWER',
  IMAGE_VIEWER = 'IMAGE_VIEWER',
  PARAGRAPH_GENERATOR = 'PARAGRAPH_GENERATOR',
  FORM = 'FORM',
}

export interface BaseComponentData {
  id: string;
  type: ComponentType;
  prompt: string; // The prompt used to generate this
  span?: string; // CSS class for grid span (e.g. 'col-span-1')
  customCss?: string; // Custom CSS declarations (e.g. "background-color: #f0f0f0; color: #333;")
}

// Data structures for each component
export interface TableData extends BaseComponentData {
  content: {
    title: string;
    headers: string[];
    rows: string[][];
  };
}

export interface StatCardData extends BaseComponentData {
  content: {
    title: string;
    value: string;
    trend: string;
    trendDirection: 'up' | 'down' | 'neutral';
    description?: string;
  };
}

export interface CompleteCardData extends BaseComponentData {
  content: {
    title: string;
    subtitle: string;
    description: string;
    tags: string[];
    imageUrl?: string; // Optional, can be generated or placeholder
    actionLabel: string;
  };
}

export interface ChartData extends BaseComponentData {
  content: {
    title: string;
    type: 'bar' | 'line' | 'donut';
    data: { label: string; value: number; color?: string }[];
  };
}

export interface PdfViewerData extends BaseComponentData {
  content: {
    title: string;
    pdfUrl: string; // Usually a placeholder or user provided, AI can suggest generic ones
  };
}

export interface ImageViewerData extends BaseComponentData {
  content: {
    title: string;
    altText: string;
    generatedImageBase64?: string; // If AI generated
    imageUrl?: string; // URL from external API
  };
}

export interface ParagraphData extends BaseComponentData {
  content: {
    heading?: string;
    text: string;
  };
}

export interface FormData extends BaseComponentData {
  content: {
    formTitle: string;
    fields: { label: string; type: 'text' | 'email' | 'number' | 'textarea' | 'checkbox'; placeholder?: string }[];
    submitButtonText: string;
  };
}

export type ComponentInstance = 
  | TableData 
  | StatCardData 
  | CompleteCardData 
  | ChartData 
  | PdfViewerData 
  | ImageViewerData 
  | ParagraphData 
  | FormData;