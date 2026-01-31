import React, { useState, useRef, useEffect } from 'react';
import { ComponentType, ComponentInstance } from './types';
import { generateComponentData } from './services/geminiService';
import { renderComponent } from './components/Renderers';

const COMPONENT_LABELS: Record<ComponentType, string> = {
  [ComponentType.TABLE]: 'Data Table',
  [ComponentType.STAT_CARD]: 'Stat Card',
  [ComponentType.COMPLETE_CARD]: 'Feature Card',
  [ComponentType.CHART]: 'Chart',
  [ComponentType.PDF_VIEWER]: 'PDF Viewer',
  [ComponentType.IMAGE_VIEWER]: 'Image Viewer',
  [ComponentType.PARAGRAPH_GENERATOR]: 'Paragraph',
  [ComponentType.FORM]: 'Input Form',
};

// --- API Examples for each component ---
const API_EXAMPLES: Partial<Record<ComponentType, Array<{ url: string; prompt: string; label: string }>>> = {
    [ComponentType.TABLE]: [
        {
            label: "Users List (JSONPlaceholder)",
            url: "https://jsonplaceholder.typicode.com/users",
            prompt: "Create a table showing Name, Email, and Company Name for each user."
        },
        {
            label: "US Public Holidays",
            url: "https://date.nager.at/api/v3/PublicHolidays/2024/US",
            prompt: "Create a table showing Date, LocalName, and Name for the holidays."
        }
    ],
    [ComponentType.STAT_CARD]: [
        {
            label: "Bitcoin Ticker (Binance)",
            url: "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
            prompt: "Use 'lastPrice' as the value (format as currency). Use 'priceChangePercent' for the trend (add % symbol). Title it 'Bitcoin (BTC)'."
        },
        {
            label: "IP Address Info",
            url: "https://ipapi.co/json/",
            prompt: "Use the 'ip' field as the main value. Title it 'Your IP Address'. Use the 'city' and 'country_name' as the description."
        }
    ],
    [ComponentType.CHART]: [
        {
            label: "Population by Country",
            url: "https://restcountries.com/v3.1/all?fields=name,population",
            prompt: "Create a Bar Chart showing the top 5 most populous countries. Map 'name.common' to label and 'population' to value."
        },
        {
            label: "Crypto Prices",
            url: "https://api.coinlore.net/api/tickers/?start=0&limit=5",
            prompt: "Create a Donut Chart. Map 'data' array items: use 'name' for label and 'price_usd' for value (ensure to parse the string value to a number)."
        }
    ],
    [ComponentType.COMPLETE_CARD]: [
        {
            label: "Random User Profile",
            url: "https://randomuser.me/api/",
            prompt: "Create a profile card. Use results[0] data. Map name to title, location to subtitle, and picture.large to imageUrl."
        },
        {
            label: "Rick and Morty Character",
            url: "https://rickandmortyapi.com/api/character/1",
            prompt: "Create a character card. Map 'name' to title, 'species' to subtitle, 'image' to imageUrl. Add 'origin.name' and 'status' to tags."
        }
    ],
    [ComponentType.IMAGE_VIEWER]: [
        {
            label: "Random Dog",
            url: "https://dog.ceo/api/breeds/image/random",
            prompt: "Map the 'message' field to 'imageUrl'. Set the title to 'Random Dog' and altText to 'A random dog'."
        },
        {
            label: "Random Coffee",
            url: "https://coffee.alexflipnote.dev/random.json",
            prompt: "Map 'file' to 'imageUrl'. Title 'Random Coffee' and altText 'A delicious cup of coffee'."
        }
    ],
    [ComponentType.PDF_VIEWER]: [
        {
            label: "Direct PDF File (PDFObject)",
            url: "https://pdfobject.com/pdf/sample.pdf",
            prompt: "The API returns a direct PDF file. Map the 'pdfUrl' from the source data to the 'pdfUrl' field. Title it 'Sample Report'."
        },
        {
            label: "W3C Dummy PDF",
            url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            prompt: "The API returns a direct PDF file. Title it 'W3C Standard Test PDF'."
        }
    ],
    [ComponentType.PARAGRAPH_GENERATOR]: [
        {
            label: "Filler Text (BaconIpsum)",
            url: "https://baconipsum.com/api/?type=meat-and-filler&paras=1",
            prompt: "Display the first paragraph from the array as the text content."
        },
        {
            label: "Corporate Buzzwords",
            url: "https://corporatebs-generator.sameerkumar.website/",
            prompt: "Display the 'phrase' field as the main text. Set the heading to 'Corporate Insight'."
        }
    ],
    [ComponentType.FORM]: [
        {
            label: "Edit Post (JSONPlaceholder)",
            url: "https://jsonplaceholder.typicode.com/posts/1",
            prompt: "Create an edit form pre-filled with this post's title and body."
        },
        {
            label: "Edit Todo",
            url: "https://jsonplaceholder.typicode.com/todos/1",
            prompt: "Create a form to edit this todo item. Include fields for 'title' and a checkbox for 'completed'."
        }
    ]
};

// Icons for Sidebar
const Icons: Record<ComponentType, React.ReactNode> = {
    [ComponentType.TABLE]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    [ComponentType.STAT_CARD]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    [ComponentType.COMPLETE_CARD]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    [ComponentType.CHART]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
    [ComponentType.PDF_VIEWER]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    [ComponentType.IMAGE_VIEWER]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    [ComponentType.PARAGRAPH_GENERATOR]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>,
    [ComponentType.FORM]: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
};

// Helper to determine DEFAULT span based on type and content
const getDefaultSpan = (type: ComponentType, content?: any) => {
    switch (type) {
        case ComponentType.STAT_CARD:
            return 'col-span-1';
            
        case ComponentType.CHART:
            const chartData = content as any;
            if (chartData?.type === 'donut') return 'col-span-1';
            // Line and Bar charts benefit from horizontal space
            return 'col-span-1 md:col-span-2 lg:col-span-2';
            
        case ComponentType.COMPLETE_CARD:
            // Feature cards often look best in standard grid slots
            return 'col-span-1';
            
        case ComponentType.IMAGE_VIEWER:
            return 'col-span-1 md:col-span-1 lg:col-span-1';
            
        case ComponentType.TABLE:
            const tableData = content as any;
            // Many columns = full width. Few columns = medium width.
            if (tableData?.headers?.length > 4) return 'col-span-1 md:col-span-2 lg:col-span-3';
            return 'col-span-1 md:col-span-2 lg:col-span-2';
            
        case ComponentType.FORM:
            const formData = content as any;
            // Complex forms need more room
            if (formData?.fields?.length > 5) return 'col-span-1 md:col-span-2 lg:col-span-3';
            return 'col-span-1 md:col-span-2 lg:col-span-2';
            
        case ComponentType.PARAGRAPH_GENERATOR:
            const pData = content as any;
            // Long articles need width for readability lines
            if (pData?.text?.length > 400) return 'col-span-1 md:col-span-2 lg:col-span-3';
            return 'col-span-1 md:col-span-2 lg:col-span-2';
            
        case ComponentType.PDF_VIEWER:
            // PDF readers always need maximum space
            return 'col-span-1 md:col-span-2 lg:col-span-3';
            
        default:
            return 'col-span-1 md:col-span-2 lg:col-span-3';
    }
};

type GenerationMode = 'generate' | 'api' | 'upload';

// --- ROBUST FETCH LOGIC ---
interface FetchStrategy {
    name: string;
    getUrl: (target: string) => string;
    needsUnwrap: boolean;
}

const STRATEGIES: FetchStrategy[] = [
    { 
        name: "Direct", 
        getUrl: (t) => t, 
        needsUnwrap: false 
    },
    { 
        name: "CodeTabs", 
        getUrl: (t) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(t)}`, 
        needsUnwrap: false 
    },
    {
        name: "ThingProxy",
        getUrl: (t) => `https://thingproxy.freeboard.io/fetch/${t}`,
        needsUnwrap: false
    },
    {
        name: "AllOriginsRaw",
        getUrl: (t) => `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,
        needsUnwrap: false
    },
    { 
        name: "AllOrigins", 
        getUrl: (t) => `https://api.allorigins.win/get?url=${encodeURIComponent(t)}`, 
        needsUnwrap: true 
    }
];

const smartFetch = async (targetUrl: string): Promise<any> => {
    let lastError: any = null;
    const cleanUrl = targetUrl.trim().replace(/\/$/, "");

    for (const strategy of STRATEGIES) {
        try {
            console.log(`Trying fetch strategy: ${strategy.name}`);
            const fetchUrl = strategy.getUrl(cleanUrl);
            
            const response = await fetch(fetchUrl, {
                // omit credentials to avoid strict CORS issues with wildcard access-control-allow-origin
                credentials: 'omit'
            });

            if (!response.ok) {
                // If it's a 4xx/5xx error, it might be the proxy failing OR the actual destination failing.
                // We throw to try the next strategy.
                throw new Error(`HTTP ${response.status} (${response.statusText || 'Error'})`);
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.toLowerCase().includes("application/pdf")) {
                console.log("Detected PDF response. Creating Blob URL...");
                const blob = await response.blob();
                const objectUrl = URL.createObjectURL(blob);
                return {
                    pdfUrl: objectUrl,
                    detectedType: "application/pdf",
                    info: "The API returned a raw PDF file. The file has been converted to a local Blob URL."
                };
            }

            if (strategy.needsUnwrap) {
                const wrapper = await response.json();
                if (!wrapper.contents) throw new Error("No content in wrapper");
                if (typeof wrapper.contents === 'string') {
                    try {
                        // Check if the string content itself looks like HTML error
                        if (wrapper.contents.trim().startsWith('<') && !wrapper.contents.includes('"')) {
                            throw new Error("Proxy returned HTML (likely an error page)");
                        }
                        return JSON.parse(wrapper.contents);
                    } catch (e) {
                         if (wrapper.contents.trim().startsWith('<')) {
                             throw new Error("Proxy returned HTML (likely an error page)");
                         }
                         // If it's just a string (not JSON), return it
                         return wrapper.contents;
                    }
                } else {
                    return wrapper.contents;
                }
            } else {
                const text = await response.text();
                if (!text) throw new Error("Empty response");
                
                // If text looks like HTML error but response was OK (common with proxies)
                if (text.trim().startsWith('<') && (text.includes('<html') || text.includes('<body'))) {
                     throw new Error(`Response was HTML (likely error 404/403/500), not JSON.`);
                }

                try {
                    return JSON.parse(text);
                } catch (e) {
                     // Some APIs return text that isn't JSON but is valid content. 
                     // But for this app, we mostly expect JSON. 
                     throw new Error(`Response was not valid JSON: ${text.substring(0, 50)}...`);
                }
            }
            // If successful, break the loop (unreachable due to returns, but good practice)
            return; 

        } catch (e: any) {
            console.warn(`Strategy ${strategy.name} failed:`, e.message);
            lastError = e;
            // Continue to next strategy
        }
    }
    throw new Error(`Failed to fetch data from ${targetUrl}. \nLast error: ${lastError?.message || "Unknown error"}. \nIf this API is private or blocks proxies, it cannot be accessed here.`);
};

function App() {
  // Initialize from LocalStorage if available
  const [components, setComponents] = useState<ComponentInstance[]>(() => {
    try {
        const saved = localStorage.getItem('genui-components');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
  
  // Layout Editing Mode
  const [layoutMode, setLayoutMode] = useState(false);
  
  // Style Editor State
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [currentCustomCss, setCurrentCustomCss] = useState('');
  const [stylingComponentId, setStylingComponentId] = useState<string | null>(null);
  
  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('genui_api_key') || '');
  
  // DnD State
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modal State
  const [mode, setMode] = useState<GenerationMode>('generate');
  const [prompt, setPrompt] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist components to localStorage
  useEffect(() => {
    localStorage.setItem('genui-components', JSON.stringify(components));
  }, [components]);

  useEffect(() => {
    // Auto scroll to bottom when new component is added, but not in layout mode
    if (bottomRef.current && !layoutMode && !isDragging && !editingComponentId && !styleModalOpen) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [components, layoutMode, isDragging, editingComponentId, styleModalOpen]);

  const handleAddComponentClick = (type: ComponentType) => {
    setSelectedType(type);
    setPrompt('');
    setApiUrl('');
    setSelectedFile(null);
    setMode('generate');
    setEditingComponentId(null); // Ensure we are in create mode
    setError(null);
    setIsModalOpen(true);
  };

  const handleEditComponentClick = (component: ComponentInstance) => {
    setSelectedType(component.type);
    setMode('generate'); 
    setPrompt(component.prompt || ''); // Pre-fill with original prompt
    setApiUrl('');
    setSelectedFile(null);
    setEditingComponentId(component.id);
    setError(null);
    setIsModalOpen(true);
  };

  const handleStyleComponentClick = (component: ComponentInstance) => {
    setStylingComponentId(component.id);
    setCurrentCustomCss(component.customCss || '');
    setStyleModalOpen(true);
  };

  const handleSaveStyle = () => {
    if (stylingComponentId) {
        setComponents(prev => prev.map(c => {
            if (c.id === stylingComponentId) {
                return { ...c, customCss: currentCustomCss };
            }
            return c;
        }));
    }
    setStyleModalOpen(false);
  };

  const handleApplyExample = (example: { url: string; prompt: string }) => {
      setApiUrl(example.url);
      setPrompt(example.prompt);
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem('genui_api_key', val);
  };

  const handleGenerate = async () => {
    if (!selectedType) return;
    
    setLoading(true);
    setError(null);

    try {
      let data;
      
      if (mode === 'upload') {
        if (!selectedFile) {
            throw new Error("Please select a file to upload.");
        }
        
        const objectUrl = URL.createObjectURL(selectedFile);
        
        if (selectedType === ComponentType.PDF_VIEWER) {
            data = {
                title: selectedFile.name,
                pdfUrl: objectUrl
            };
        } else if (selectedType === ComponentType.IMAGE_VIEWER) {
            data = {
                title: selectedFile.name,
                altText: "Uploaded image: " + selectedFile.name,
                imageUrl: objectUrl
            };
        } else {
            throw new Error("Upload not supported for this component type.");
        }

      } else if (mode === 'api') {
        if (!apiUrl.trim()) {
            throw new Error("Please enter a valid API URL.");
        }
        const apiData = await smartFetch(apiUrl);
        console.log("Successfully fetched API data:", apiData);
        data = await generateComponentData(selectedType, prompt, apiData);
      
      } else {
        if (!prompt.trim()) {
            throw new Error("Please describe what you want to generate.");
        }
        data = await generateComponentData(selectedType, prompt);
      }

      if (editingComponentId) {
          // UPDATE EXISTING
          setComponents(prev => prev.map(c => {
              if (c.id === editingComponentId) {
                  return {
                      ...c,
                      prompt: mode === 'api' ? `API: ${apiUrl}` : (mode === 'upload' ? `Uploaded: ${selectedFile?.name}` : prompt),
                      content: data
                  };
              }
              return c;
          }));
      } else {
          // CREATE NEW
          // Calculate initial span intelligently based on generated data
          const initialSpan = getDefaultSpan(selectedType, data);

          const newComponent: ComponentInstance = {
            id: crypto.randomUUID(),
            type: selectedType,
            prompt: mode === 'api' ? `API: ${apiUrl}` : (mode === 'upload' ? `Uploaded: ${selectedFile?.name}` : prompt),
            span: initialSpan,
            content: data 
          } as ComponentInstance;

          setComponents(prev => [...prev, newComponent]);
      }
      
      setIsModalOpen(false);

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this component?")) {
        setComponents(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear the entire canvas? This cannot be undone.")) {
        setComponents([]);
    }
  };

  // --- Layout Functions ---

  const resizeComponent = (id: string, size: 'small' | 'medium' | 'full') => {
      setComponents(prev => prev.map(c => {
          if (c.id !== id) return c;
          
          let newSpan = 'col-span-1';
          if (size === 'medium') newSpan = 'col-span-1 md:col-span-2';
          if (size === 'full') newSpan = 'col-span-1 md:col-span-2 lg:col-span-3';

          return { ...c, span: newSpan };
      }));
  };

  // --- DnD Handlers ---
  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    setIsDragging(true);
    // Required for Firefox to allow dragging
    e.dataTransfer.effectAllowed = "move"; 
    // Set a transparent drag image or similar if desired, but default is usually okay.
  };

  const handleDragEnter = (_e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Necessary to allow dropping
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // If we have a valid source and target, perform the swap/move
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const _components = [...components];
        const draggedItemContent = _components[dragItem.current];
        
        // Remove from old pos
        _components.splice(dragItem.current, 1);
        // Insert at new pos
        _components.splice(dragOverItem.current, 0, draggedItemContent);
        
        setComponents(_components);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const supportsUpload = selectedType === ComponentType.PDF_VIEWER || selectedType === ComponentType.IMAGE_VIEWER;

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 shadow-lg shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
             <h1 className="text-xl font-bold tracking-tight text-slate-800">GenUI <span className="text-slate-400 font-normal">Builder</span></h1>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Powered by Gemini. Click to generate components.
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Components</h3>
            {Object.values(ComponentType).map((type) => (
                <button
                key={type}
                onClick={() => handleAddComponentClick(type)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all duration-200 group"
                >
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {Icons[type]}
                </div>
                {COMPONENT_LABELS[type]}
                </button>
            ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
             {/* Layout Toggle */}
             <button 
                onClick={() => setLayoutMode(!layoutMode)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${layoutMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {layoutMode ? 'Done Editing' : 'Edit Layout'}
            </button>

            {components.length > 0 && (
                <button 
                    onClick={handleClearAll}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                >
                    Clear All
                </button>
            )}

            {/* API Key Input */}
            <div className="mt-auto pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    API Key
                </label>
                <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="Paste Gemini API Key"
                    className="w-full px-3 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
            </div>
            
            <div className="text-xs text-slate-400 text-center">
                Drag cards to reorder in edit mode
            </div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 overflow-y-auto relative bg-slate-50/50 scroll-smooth">
        <div className="max-w-7xl mx-auto p-8 min-h-full">
            {components.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Start building your app</h2>
                    <p className="text-slate-500 max-w-md">
                        Select a component from the sidebar to begin. Gemini will help you generate the content and layout instantly.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 auto-rows-min">
                    {components.map((component, index) => (
                        <div 
                            key={component.id} 
                            draggable={layoutMode}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            className={`animate-fade-in-up relative ${component.span || getDefaultSpan(component.type, component.content)} transition-all duration-300 ease-in-out
                                ${layoutMode ? 'cursor-grab active:cursor-grabbing hover:scale-[1.01] hover:shadow-lg' : ''}
                                ${isDragging && dragItem.current === index ? 'opacity-40 scale-95' : ''}
                            `}
                        >
                            {renderComponent(
                                component, 
                                () => handleDelete(component.id), 
                                () => handleEditComponentClick(component),
                                () => handleStyleComponentClick(component)
                            )}
                            
                            {/* Layout Editor Overlay */}
                            {layoutMode && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] border-2 border-dashed border-indigo-400 rounded-xl z-20 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-200 pointer-events-none">
                                    {/* Pointer events set to none for the overlay container so clicks pass through to the parent div for dragging, 
                                        BUT we enable pointer events on buttons specifically. */}
                                    
                                    <div className="p-3 bg-white rounded-full shadow-sm text-indigo-500 mb-2 pointer-events-auto cursor-grab active:cursor-grabbing">
                                        {/* Drag Handle Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                        </svg>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg pointer-events-auto">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); resizeComponent(component.id, 'small'); }}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
                                            title="1 Column (1/3)"
                                        >
                                            Small
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); resizeComponent(component.id, 'medium'); }}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
                                            title="2 Columns (2/3)"
                                        >
                                            Medium
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); resizeComponent(component.id, 'full'); }}
                                            className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-slate-600"
                                            title="Full Width (3/3)"
                                        >
                                            Full
                                        </button>
                                    </div>
                                    <div className="mt-2 text-xs text-indigo-500 font-medium">Drag to Reorder</div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={bottomRef} className="col-span-full h-0" />
                </div>
            )}
        </div>
      </main>

      {/* Style Editor Modal */}
      {styleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
             <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 flex flex-col">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        Edit Component Styles
                    </h3>
                    <button onClick={() => setStyleModalOpen(false)} className="text-white/80 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Custom CSS Properties</label>
                    <p className="text-xs text-slate-500 mb-3">
                        Enter standard CSS key-value pairs separated by semicolons. 
                        These will be applied to the component's container.
                    </p>
                    <div className="relative">
                        <textarea
                            value={currentCustomCss}
                            onChange={(e) => setCurrentCustomCss(e.target.value)}
                            placeholder={`background-color: #f0fdf4;\nborder: 2px solid #22c55e;\ncolor: #15803d;`}
                            className="w-full h-40 p-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-700 placeholder-slate-400"
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setStyleModalOpen(false)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveStyle}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-md transition-all"
                        >
                            Apply Styles
                        </button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Generation Modal */}
      {isModalOpen && selectedType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100 flex flex-col">
                <div className="bg-indigo-600 pt-6 px-6 pb-0 relative">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {Icons[selectedType]}
                            {editingComponentId ? 'Edit / Regenerate' : (mode === 'generate' ? 'Generate' : (mode === 'upload' ? 'Upload' : 'Connect API to'))} {COMPONENT_LABELS[selectedType]}
                        </h3>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-6 mt-2">
                        <button 
                            onClick={() => setMode('generate')}
                            className={`pb-3 text-sm font-medium transition-all relative ${mode === 'generate' ? 'text-white' : 'text-indigo-200 hover:text-white'}`}
                        >
                            ✨ AI Generation
                            {mode === 'generate' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"></div>}
                        </button>
                        <button 
                            onClick={() => setMode('api')}
                            className={`pb-3 text-sm font-medium transition-all relative ${mode === 'api' ? 'text-white' : 'text-indigo-200 hover:text-white'}`}
                        >
                            🌐 Connect API
                            {mode === 'api' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"></div>}
                        </button>
                        {supportsUpload && (
                            <button 
                                onClick={() => setMode('upload')}
                                className={`pb-3 text-sm font-medium transition-all relative ${mode === 'upload' ? 'text-white' : 'text-indigo-200 hover:text-white'}`}
                            >
                                📂 Upload File
                                {mode === 'upload' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"></div>}
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="p-6">
                    {mode === 'api' && (
                        <div className="mb-4 space-y-4">
                            {/* Example List */}
                            {API_EXAMPLES[selectedType] && (
                                <div className="mb-4">
                                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recommended APIs</span>
                                    <div className="space-y-2">
                                        {API_EXAMPLES[selectedType]!.map((example, idx) => (
                                            <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between group hover:border-indigo-300 transition-colors">
                                                <div className="text-sm text-indigo-900 font-medium truncate pr-2" title={example.label}>{example.label}</div>
                                                 <button
                                                    onClick={() => handleApplyExample(example)}
                                                    className="text-xs bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition-colors shrink-0 font-medium"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">API Endpoint URL</label>
                                <input
                                    type="url"
                                    value={apiUrl}
                                    onChange={(e) => setApiUrl(e.target.value)}
                                    placeholder="https://api.example.com/data"
                                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-sm"
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Ensure the endpoint allows CORS. Examples: jsonplaceholder.typicode.com
                                </p>
                            </div>
                        </div>
                    )}
                
                    {mode === 'upload' ? (
                         <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Select {selectedType === ComponentType.PDF_VIEWER ? 'PDF' : 'Image'} File
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-500">{selectedFile ? selectedFile.name : (selectedType === ComponentType.PDF_VIEWER ? 'PDF (MAX. 10MB)' : 'PNG, JPG, GIF')}</p>
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept={selectedType === ComponentType.PDF_VIEWER ? "application/pdf" : "image/*"}
                                        onChange={(e) => {
                                            if(e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    ) : (
                        <>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {mode === 'generate' ? 'Prompt' : 'Transformation Instructions (Optional)'}
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={mode === 'generate' 
                                    ? `e.g., "Monthly Active Users over the last 6 months"` 
                                    : `e.g., "Map the 'users' list to the table rows, showing name and email"`}
                                className="w-full h-24 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-slate-700 placeholder-slate-400 bg-slate-50"
                                autoFocus={mode === 'generate'}
                            />
                        </>
                    )}
                    
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                             <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading || (mode === 'upload' && !selectedFile)}
                            className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 ${loading || (mode === 'upload' && !selectedFile) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {mode === 'generate' ? 'Generating...' : (mode === 'upload' ? 'Loading...' : 'Fetching...')}
                                </>
                            ) : (
                                <>
                                    <span>{editingComponentId ? 'Update' : (mode === 'generate' ? 'Create' : (mode === 'upload' ? 'Create Viewer' : 'Connect & Build'))}</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* Global CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;