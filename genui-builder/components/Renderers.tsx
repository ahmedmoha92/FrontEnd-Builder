import React, { useState } from 'react';
import {
  ComponentInstance,
  ComponentType,
  TableData,
  StatCardData,
  CompleteCardData,
  ChartData,
  ParagraphData,
  FormData,
  PdfViewerData,
  ImageViewerData
} from '../types';
import { generateImage } from '../services/geminiService';

// --- Helper Icons ---
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const MagicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// --- Helpers ---

/**
 * Converts a CSS string (e.g. "background-color: red; color: white;") to a React style object.
 */
const styleToObject = (styleString?: string): React.CSSProperties => {
  if (!styleString) return {};
  const style: any = {};

  // Split by semicolon OR newline to handle various user input formats
  const rules = styleString.split(/[;\n]+/);

  rules.forEach((rule) => {
    const colonIndex = rule.indexOf(':');
    if (colonIndex > 0) {
      const key = rule.substring(0, colonIndex).trim();
      const value = rule.substring(colonIndex + 1).trim();
      if (key && value) {
        // Convert kebab-case to camelCase
        const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        style[camelCaseKey] = value;
      }
    }
  });
  return style;
};

// --- Component Wrappers ---

const RendererWrapper: React.FC<{
  children: React.ReactNode;
  onDelete: () => void;
  onEdit: () => void;
  onStyle: () => void;
  title: string;
  customCss?: string;
  className?: string;
}> = ({ children, onDelete, onEdit, onStyle, title, customCss, className = "" }) => {
  const customStyles = styleToObject(customCss);

  return (
    <div
      className={`group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col ${className}`}
      style={customStyles}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-full border border-slate-200 shadow-sm">
        <div className="px-2 py-1 text-xs text-slate-500 font-medium border-r border-slate-200 mr-1">
          {title}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onStyle(); }}
          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
          title="Edit Styles"
        >
          <PaletteIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
          title="Edit / Regenerate"
        >
          <PencilIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
          title="Delete Component"
        >
          <TrashIcon />
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

// --- Individual Renderers ---

const TableRenderer: React.FC<{ data: TableData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const { title, headers, rows } = data.content;
  return (
    <RendererWrapper title="Dynamic Table" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{title}</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RendererWrapper>
  );
};

const StatCardRenderer: React.FC<{ data: StatCardData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const { title, value, trend, trendDirection } = data.content;

  const isUp = trendDirection === 'up';
  const isNeutral = trendDirection === 'neutral';

  const trendColor = isNeutral
    ? 'text-slate-500 bg-slate-100'
    : isUp
      ? 'text-emerald-700 bg-emerald-50'
      : 'text-red-700 bg-red-50';

  const TrendIcon = () => {
    if (isNeutral) return <span className="text-lg leading-none">-</span>;
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isUp ? '' : 'transform rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    );
  }

  return (
    <RendererWrapper title="Statistic" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="p-6 flex flex-col justify-between h-full">
        <div>
          <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</h4>
          <div className="text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        </div>
        <div className="mt-4 flex items-center">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${trendColor}`}>
            <TrendIcon />
            {trend}
          </div>
          <span className="ml-2 text-xs text-slate-400">vs previous period</span>
        </div>
      </div>
    </RendererWrapper>
  );
};

const CompleteCardRenderer: React.FC<{ data: CompleteCardData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const { title, subtitle, description, tags, actionLabel, imageUrl } = data.content;
  const displayImage = imageUrl || `https://picsum.photos/seed/${data.id}/600/300`;

  return (
    <RendererWrapper title="Feature Card" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="relative h-48 bg-slate-200 shrink-0">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <h3 className="text-white font-bold text-xl p-4">{title}</h3>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">{subtitle}</h4>
        <p className="text-slate-700 mb-4 text-sm leading-relaxed flex-1">{description}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {tags.map((tag, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
              #{tag}
            </span>
          ))}
        </div>
        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm active:transform active:scale-95">
          {actionLabel}
        </button>
      </div>
    </RendererWrapper>
  );
};

const ChartRenderer: React.FC<{ data: ChartData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const { title, type, data: rawChartData } = data.content;

  // Robustness Fix: Ensure all values are parsed as numbers.
  const chartData = rawChartData.map(d => ({
    ...d,
    value: typeof d.value === 'string' ? parseFloat(d.value) : Number(d.value) || 0
  }));

  const maxValue = Math.max(...chartData.map(d => d.value));
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6'];

  return (
    <RendererWrapper title="Data Chart" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="p-6 h-full flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-6">{title}</h3>

        <div className="flex-1 min-h-[160px] flex flex-col justify-end">
          {/* Simple Bar Chart Implementation using HTML/CSS/Flex */}
          {type === 'bar' && (
            <div className="flex items-end justify-between gap-2 h-full pt-4 pb-2">
              {chartData.map((d, i) => {
                const heightPercent = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full bg-slate-100 rounded-t-md overflow-hidden flex items-end h-full">
                      <div
                        className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-500 ease-out rounded-t-md relative"
                        style={{ height: `${heightPercent}%`, backgroundColor: d.color || colors[i % colors.length] }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                          {d.value}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 truncate w-full text-center">{d.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* SVG Line Chart */}
          {type === 'line' && (
            <div className="h-full relative pt-4 min-h-[200px]">
              <svg viewBox={`0 0 100 100`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="100" x2="100" y2="100" stroke="#e2e8f0" strokeWidth="1" />

                {/* The Line */}
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                  points={chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 100;
                    const y = maxValue > 0 ? 100 - (d.value / maxValue) * 100 : 100;
                    return `${x},${y}`;
                  }).join(' ')}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Dots */}
                {chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = maxValue > 0 ? 100 - (d.value / maxValue) * 100 : 100;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="1.5"
                      fill="white"
                      stroke="#6366f1"
                      strokeWidth="0.5"
                      className="hover:r-2 transition-all cursor-pointer"
                      vectorEffect="non-scaling-stroke"
                    >
                      <title>{d.label}: {d.value}</title>
                    </circle>
                  );
                })}
              </svg>
              <div className="flex justify-between mt-2">
                {chartData.map((d, i) => (
                  <span key={i} className="text-xs text-slate-400">{d.label}</span>
                ))}
              </div>
            </div>
          )}

          {/* Donut Chart */}
          {type === 'donut' && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="relative w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center shrink-0">
                <div className="text-center">
                  <span className="block text-lg font-bold text-slate-800 truncate px-2" title={chartData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}>
                    {/* Simple format for huge numbers */}
                    {(() => {
                      const total = chartData.reduce((acc, curr) => acc + curr.value, 0);
                      if (total > 1000000) return (total / 1000000).toFixed(1) + 'M';
                      if (total > 1000) return (total / 1000).toFixed(1) + 'k';
                      return total.toLocaleString();
                    })()}
                  </span>
                  <span className="text-xs text-slate-400">Total</span>
                </div>
                {/* SVG Arc approach */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                  {(() => {
                    let accumulatedPercent = 0;
                    const total = chartData.reduce((a, b) => a + b.value, 0);
                    return chartData.map((d, i) => {
                      // Guard against divide by zero
                      const percent = total > 0 ? d.value / total : 0;
                      const circumference = 2 * Math.PI * 40; // r=40
                      const strokeDasharray = `${percent * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedPercent * circumference;
                      accumulatedPercent += percent;
                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={d.color || colors[i % colors.length]}
                          strokeWidth="10"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
              </div>
              <div className="ml-6 space-y-1">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color || colors[i % colors.length] }}></div>
                    <span className="text-xs text-slate-600 truncate max-w-[100px]" title={`${d.label}: ${d.value}`}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RendererWrapper>
  );
};

const ParagraphRenderer: React.FC<{ data: ParagraphData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const { heading, text } = data.content;
  return (
    <RendererWrapper title="Generated Text" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="p-6">
        {heading && <h3 className="text-2xl font-bold text-slate-800 mb-4">{heading}</h3>}
        <div className="prose prose-slate max-w-none">
          {text.split('\n').map((line, i) => (
            <p key={i} className="mb-2 last:mb-0">{line}</p>
          ))}
        </div>
      </div>
    </RendererWrapper>
  );
};

const FormRenderer: React.FC<{ data: FormData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const { formTitle, fields, submitButtonText } = data.content;
  return (
    <RendererWrapper title="Dynamic Form" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} className="mx-auto w-full" customCss={data.customCss}>
      <div className="p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">{formTitle}</h3>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {fields.map((field, i) => (
            <div key={i}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 border p-2"
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <input
                  type={field.type}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 border p-2"
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
          <div className="pt-2">
            <button className="w-full py-2.5 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 transition-colors">
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </RendererWrapper>
  );
};

const PdfViewerRenderer: React.FC<{ data: PdfViewerData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  const pdfUrl = data.content.pdfUrl || "https://pdfobject.com/pdf/sample.pdf";

  // Default to NATIVE for everything. Google Viewer is often flaky (blank pages) or blocked.
  // Native <object> handles blobs and many external PDFs well.
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);

  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <RendererWrapper title="PDF Viewer" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="flex flex-col h-[600px] bg-slate-900 rounded-b-xl overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center shadow-lg z-10 border-b border-slate-700">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-red-500 rounded-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 3.414L15.586 7A2 2 0 0116 8.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium text-sm truncate max-w-[200px] text-slate-200" title={data.content.title}>{data.content.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Button */}
            <button
              onClick={() => setUseGoogleViewer(!useGoogleViewer)}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300 transition-colors"
            >
              {useGoogleViewer ? "Switch to Native" : "Switch to Google Viewer"}
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
            >
              Open <ExternalLinkIcon />
            </a>
          </div>
        </div>
        <div className="flex-1 relative w-full h-full bg-slate-200">
          {useGoogleViewer ? (
            <iframe
              src={googleDocsUrl}
              className="w-full h-full border-none"
              title="Google PDF Viewer"
            ></iframe>
          ) : (
            <object
              data={pdfUrl}
              type="application/pdf"
              className="w-full h-full"
            >
              <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4 text-center">
                <p className="mb-2">Unable to display PDF directly.</p>
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                  Click here to download/view
                </a>
              </div>
            </object>
          )}

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-slate-50 -z-10">
            <div className="animate-pulse text-slate-300">Loading PDF...</div>
          </div>
        </div>
      </div>
    </RendererWrapper>
  );
};

const ImageViewerRenderer: React.FC<{ data: ImageViewerData; onDelete: () => void; onEdit: () => void; onStyle: () => void }> = ({ data, onDelete, onEdit, onStyle }) => {
  // Prioritize external URL, then AI generated base64, then fallback
  const [imageSrc, setImageSrc] = useState<string>(
    data.content.imageUrl || data.content.generatedImageBase64 || `https://picsum.photos/seed/${data.id}/800/600`
  );
  const [loading, setLoading] = useState(false);

  const handleGenerateImage = async () => {
    if (loading) return;
    setLoading(true);
    const b64 = await generateImage();
    if (b64) {
      setImageSrc(b64);
    }
    setLoading(false);
  };

  // Update if props change significantly (e.g. regen from API)
  React.useEffect(() => {
    if (data.content.imageUrl) setImageSrc(data.content.imageUrl);
  }, [data.content.imageUrl]);

  return (
    <RendererWrapper title="Image Viewer" onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} customCss={data.customCss}>
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{data.content.title}</h3>
          <button
            onClick={handleGenerateImage}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshIcon className="animate-spin" /> : <MagicIcon />}
            {loading ? "Generating..." : "Generate with AI"}
          </button>
        </div>
        {/* Fixed container: Removed aspect-video to allow dynamic height based on image content. 
                    Removed object-cover to prevent cropping. 
                */}
        <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group min-h-[200px] flex items-center justify-center">
          <img
            src={imageSrc}
            alt={data.content.altText}
            className="w-full h-auto object-contain transition-transform duration-700"
          />
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <p className="mt-3 text-sm text-slate-500 line-clamp-2">{data.content.altText}</p>
      </div>
    </RendererWrapper>
  );
};

export const renderComponent = (component: ComponentInstance, onDelete: () => void, onEdit: () => void, onStyle: () => void) => {
  switch (component.type) {
    case ComponentType.TABLE:
      return <TableRenderer key={component.id} data={component as TableData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.STAT_CARD:
      return <StatCardRenderer key={component.id} data={component as StatCardData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.COMPLETE_CARD:
      return <CompleteCardRenderer key={component.id} data={component as CompleteCardData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.CHART:
      return <ChartRenderer key={component.id} data={component as ChartData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.PARAGRAPH_GENERATOR:
      return <ParagraphRenderer key={component.id} data={component as ParagraphData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.FORM:
      return <FormRenderer key={component.id} data={component as FormData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.PDF_VIEWER:
      return <PdfViewerRenderer key={component.id} data={component as PdfViewerData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    case ComponentType.IMAGE_VIEWER:
      return <ImageViewerRenderer key={component.id} data={component as ImageViewerData} onDelete={onDelete} onEdit={onEdit} onStyle={onStyle} />;
    default:
      return null;
  }
};