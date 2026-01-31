import { ComponentType } from "../types";
import { Schema, Type as GenType } from "@google/genai";

// --- Helper for API Key ---
const getApiKey = () => {
  const customKey = localStorage.getItem('genui_api_key');
  if (customKey && customKey.trim() !== '') return customKey;

  // @ts-ignore
  const envKey = (import.meta as any).env.VITE_API_KEY || process.env.API_KEY;
  if (envKey && envKey.trim() !== '') return envKey;

  throw new Error("API Key is missing. Please enter your Gemini API Key in the sidebar.");
};

// --- Schemas ---
// Re-using the Google GenAI types to maintain compatibility if needed, 
// but we just pass these as JSON objects to the API.

const tableSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    title: { type: GenType.STRING, description: "Title of the table" },
    headers: { type: GenType.ARRAY, items: { type: GenType.STRING }, description: "Column headers" },
    rows: {
      type: GenType.ARRAY,
      items: { type: GenType.ARRAY, items: { type: GenType.STRING } },
      description: "Rows of data, matching headers count"
    },
  },
  required: ["title", "headers", "rows"],
};

const statCardSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    title: { type: GenType.STRING, description: "Label for the statistic (e.g., Total Revenue)" },
    value: { type: GenType.STRING, description: "The main formatted number (e.g., $45,200)" },
    trend: { type: GenType.STRING, description: "Short trend text (e.g., +12% vs last month)" },
    trendDirection: { type: GenType.STRING, enum: ["up", "down", "neutral"], description: "Direction of the trend" },
  },
  required: ["title", "value", "trend", "trendDirection"],
};

const completeCardSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    title: { type: GenType.STRING },
    subtitle: { type: GenType.STRING },
    description: { type: GenType.STRING },
    tags: { type: GenType.ARRAY, items: { type: GenType.STRING }, description: "Max 3-4 short tags" },
    actionLabel: { type: GenType.STRING, description: "Label for the primary button" },
  },
  required: ["title", "description", "tags", "actionLabel"],
};

const chartSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    title: { type: GenType.STRING },
    type: { type: GenType.STRING, enum: ["bar", "line", "donut"] },
    data: {
      type: GenType.ARRAY,
      items: {
        type: GenType.OBJECT,
        properties: {
          label: { type: GenType.STRING },
          value: { type: GenType.NUMBER },
          color: { type: GenType.STRING, description: "Hex color code for this data point (optional)" }
        },
        required: ["label", "value"]
      }
    }
  },
  required: ["title", "type", "data"],
};

const paragraphSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    heading: { type: GenType.STRING, nullable: true },
    text: { type: GenType.STRING, description: "A rich, well-written paragraph." },
  },
  required: ["text"],
};

const formSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    formTitle: { type: GenType.STRING },
    submitButtonText: { type: GenType.STRING },
    fields: {
      type: GenType.ARRAY,
      items: {
        type: GenType.OBJECT,
        properties: {
          label: { type: GenType.STRING },
          type: { type: GenType.STRING, enum: ["text", "email", "number", "textarea", "checkbox"] },
          placeholder: { type: GenType.STRING },
        },
        required: ["label", "type"],
      },
    },
  },
  required: ["formTitle", "fields", "submitButtonText"],
};

const pdfViewerSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    title: { type: GenType.STRING },
    pdfUrl: { type: GenType.STRING, description: "The direct URL to the PDF file." },
  },
  required: ["title", "pdfUrl"],
};

const imageViewerSchema: Schema = {
  type: GenType.OBJECT,
  properties: {
    title: { type: GenType.STRING },
    altText: { type: GenType.STRING, description: "Detailed visual description of the image to be generated" },
    imageUrl: { type: GenType.STRING, description: "Direct URL of the image if available from source data" }
  },
  required: ["title", "altText"]
};


function getSchemaForType(type: ComponentType): Schema {
  switch (type) {
    case ComponentType.TABLE: return tableSchema;
    case ComponentType.STAT_CARD: return statCardSchema;
    case ComponentType.COMPLETE_CARD: return completeCardSchema;
    case ComponentType.CHART: return chartSchema;
    case ComponentType.PARAGRAPH_GENERATOR: return paragraphSchema;
    case ComponentType.FORM: return formSchema;
    case ComponentType.PDF_VIEWER: return pdfViewerSchema;
    case ComponentType.IMAGE_VIEWER: return imageViewerSchema;
    default: return paragraphSchema;
  }
}

// --- Retry Logic ---
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Check for 429 or similar rate limit errors
    const isRateLimit =
      error.code === 429 ||
      error.status === 429 ||
      (error.message && error.message.includes('429')) ||
      (error.message && error.message.includes('Quota exceeded'));

    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limited. Retrying in ${delay / 1000}s... (Retries left: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));

      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Generates the content data for a specific component type using Gemini via Fetch.
 */
export const generateComponentData = async (type: ComponentType, userPrompt: string, externalData?: any) => {
  const schema = getSchemaForType(type);
  const apiKey = getApiKey();

  const systemInstruction = `You are a UI content generator API. 
  Your task is to generate realistic, high-quality content for a web component based on the user's description. 
  Always return valid JSON matching the schema.
  For images, provide descriptions only, not URLs unless specified.`;

  let promptText = `Generate content for a ${type} component. User context/requirement: "${userPrompt}"`;

  if (externalData) {
    const jsonString = JSON.stringify(externalData).slice(0, 30000); // Limit size to avoid context overflow
    promptText = `
        I have the following raw JSON data from an API:
        \`\`\`json
        ${jsonString}
        \`\`\`

        Your task is to transform this data into the specific JSON schema for a ${type} component.
        
        User instructions: "${userPrompt || "Map the data intelligently to the component structure."}"
        
        Ensure the output strictly follows the schema. 
        If the data is an array, use it to populate rows or lists. 
        If the data is a single object, extract relevant fields.
      `;
  }

  try {
    const response = await retryWithBackoff(async () => {
      // Using gemini-2.5-flash as gemini-1.5 series is deprecated/removed in late 2025.
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      console.log("Fetching from URL:", url.replace(apiKey, 'HIDDEN_KEY'));

      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: promptText }]
          }],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        })
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Gemini API Error Response:", errorText);
        throw new Error(`Gemini API Error ${result.status}: ${errorText}`);
      }

      return result.json();
    });

    // Parse response structure from REST API
    // REST API response format: { candidates: [ { content: { parts: [ { text: "..." } ] } } ] }
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error("No data returned from Gemini");
    }

    const text = candidate.content.parts[0].text;
    console.log("Gemini Response Text:", text.substring(0, 100) + "...");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

/**
 * Generates an image using Gemini via Fetch.
 * Note: 1.5-flash via REST API doesn't standardly return image bytes in JSON. 
 * We will return null for now to avoid breaking the app if image gen is requested, 
 * or we could try to implement a specific Imagen endpoint if we knew it.
 */
export const generateImage = async (): Promise<string | null> => {
  // Current fallback: Return null. 
  // Image generation via the generic generateContent text-based endpoint works for text-to-text or image-to-text.
  // Text-to-Image usually requires a specific model or endpoint (like Imagen).
  return null;
};