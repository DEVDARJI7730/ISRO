import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { ImageSlider } from '../components/ImageSlider';
import { ZoomViewer } from '../components/ZoomViewer';
import { FiDownload, FiArrowLeft, FiGrid, FiCompass, FiInfo, FiPrinter, FiMaximize } from 'react-icons/fi';

interface ImageRecord {
  id: string;
  original_filename: string;
  original_url: string;
  enhanced_url: string;
  colorized_url: string;
  timestamp: string;
  processing_time: number;
  downloads: number;
  metadata?: {
    original_resolution?: string;
    enhanced_resolution?: string;
    input_format?: string;
    original_size_kb?: number;
    enhanced_size_kb?: number;
    colorized_size_kb?: number;
  };
}

export const ResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const recordId = searchParams.get('id');

  const [record, setRecord] = useState<ImageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'slider' | 'zoom-color' | 'zoom-enhanced' | 'grid'>('slider');

  useEffect(() => {
    if (!recordId) {
      navigate('/dashboard');
      return;
    }

    const fetchRecord = async () => {
      try {
        // Query history by ID
        const response = await api.get(`/api/history?search=${recordId}`);
        const matched = response.data.find((h: ImageRecord) => h.id === recordId);
        
        if (!matched) {
          showToast('Processed image record could not be found.', 'error');
          navigate('/dashboard');
          return;
        }
        
        setRecord(matched);
      } catch (err: any) {
        console.error('Failed to load image details:', err);
        showToast('Error loading results data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [recordId, navigate, showToast]);

  const handleDownload = async (url: string, formatName: string) => {
    if (!record) return;

    try {
      // Trigger download tracking on backend
      await api.post(`/api/history/${record.id}/download`);
      
      // Fetch image file blob and trigger save-as dialog
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Append format to download name
      const originalBase = record.original_filename.substring(0, record.original_filename.lastIndexOf('.'));
      link.download = `${originalBase}_${formatName}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      showToast(`Image downloaded as ${formatName.toUpperCase()}`, 'success');
      
      // Update local download count
      setRecord(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : null);
    } catch (err) {
      showToast('Download tracking or file retrieval failed.', 'error');
    }
  };

  const handlePrintReport = () => {
    if (!record) return;
    
    // Create iframe or simple pop-up container for print-styled report
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocker prevented printing report.', 'error');
      return;
    }
    
    const htmlReport = `
      <html>
        <head>
          <title>ISRO AI Imaging Lab - Analysis Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-b: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 26px; }
            .header p { margin: 5px 0 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; background: #fafafa; }
            .card h3 { margin-top: 0; color: #1e3a8a; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
            th { background-color: #f3f4f6; color: #374151; }
            .image-row { display: flex; justify-content: space-around; gap: 10px; margin-top: 20px; }
            .image-row div { text-align: center; width: 30%; }
            .image-row img { max-width: 100%; border: 1px solid #ccc; border-radius: 4px; }
            .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ISRO SATELLITE IMAGING REPORT</h1>
            <p>Infrared Image Colorization & Enhancement Analysis</p>
          </div>
          
          <div class="grid">
            <div class="card">
              <h3>Image Overview</h3>
              <p><strong>Original File:</strong> ${record.original_filename}</p>
              <p><strong>Processed ID:</strong> ${record.id}</p>
              <p><strong>Timestamp:</strong> ${new Date(record.timestamp).toLocaleString()}</p>
            </div>
            <div class="card">
              <h3>Performance Specs</h3>
              <p><strong>Total Processing Time:</strong> ${record.processing_time} seconds</p>
              <p><strong>Inference Environment:</strong> Deep PyTorch CNN (LAB + Bilateral Filter)</p>
              <p><strong>Verification State:</strong> Verified / Completed</p>
            </div>
          </div>
          
          <h3>Radiometric Metadata</h3>
          <table>
            <thead>
              <tr>
                <th>Parameters</th>
                <th>Original Resolution</th>
                <th>Enhanced Resolution</th>
                <th>Input Format</th>
                <th>Original File Size</th>
                <th>Enhanced File Size</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Values</td>
                <td>${record.metadata?.original_resolution || 'N/A'}</td>
                <td>${record.metadata?.enhanced_resolution || 'N/A'}</td>
                <td>${record.metadata?.input_format || 'N/A'}</td>
                <td>${record.metadata?.original_size_kb || 'N/A'} KB</td>
                <td>${record.metadata?.enhanced_size_kb || 'N/A'} KB</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Confidential - Generated by IRVision AI Processing Server. For remote sensing and verification checks.</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlReport);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Fetching processed matrices...</p>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back button */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
        
        <button 
          onClick={handlePrintReport}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
        >
          <FiPrinter className="w-3.5 h-3.5" /> Print Report
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Visual Viewers */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-4">
            
            {/* View Tabs */}
            <div className="flex gap-1.5 bg-space-900/60 border border-white/5 p-1 rounded-xl mb-4 w-fit">
              <button 
                onClick={() => setActiveTab('slider')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'slider' ? 'bg-accent-purple text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FiCompass className="w-3.5 h-3.5" /> Comparison Slider
              </button>
              <button 
                onClick={() => setActiveTab('zoom-color')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'zoom-color' ? 'bg-accent-purple text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FiMaximize className="w-3.5 h-3.5" /> Colorized Zoom
              </button>
              <button 
                onClick={() => setActiveTab('zoom-enhanced')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'zoom-enhanced' ? 'bg-accent-purple text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FiMaximize className="w-3.5 h-3.5" /> Enhanced Grayscale Zoom
              </button>
              <button 
                onClick={() => setActiveTab('grid')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'grid' ? 'bg-accent-purple text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FiGrid className="w-3.5 h-3.5" /> Triple Grid
              </button>
            </div>

            {/* Viewer Containers */}
            <div className="w-full">
              {activeTab === 'slider' && (
                <ImageSlider original={record.original_url} processed={record.colorized_url} processedLabel="Colorized RGB" />
              )}
              
              {activeTab === 'zoom-color' && (
                <ZoomViewer src={record.colorized_url} alt="Colorized Output Zoom" />
              )}
              
              {activeTab === 'zoom-enhanced' && (
                <ZoomViewer src={record.enhanced_url} alt="Enhanced Grayscale Zoom" />
              )}

              {activeTab === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Original Grayscale</span>
                    <div className="border border-white/5 rounded-lg overflow-hidden bg-space-900 aspect-square">
                      <img src={record.original_url} alt="Original" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Super-Resolution</span>
                    <div className="border border-white/5 rounded-lg overflow-hidden bg-space-900 aspect-square">
                      <img src={record.enhanced_url} alt="Enhanced" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Neural Colorized</span>
                    <div className="border border-white/5 rounded-lg overflow-hidden bg-space-900 aspect-square">
                      <img src={record.colorized_url} alt="Colorized" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Image Specifications & Downloads */}
        <div className="space-y-6">
          {/* Metadata Specs card */}
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <FiInfo className="text-accent-purple" /> Image Specifications
            </h3>
            
            <div className="space-y-3 text-xs divide-y divide-white/5">
              <div className="flex justify-between py-2 first:pt-0">
                <span className="text-slate-400">Filename:</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{record.original_filename}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Processing Latency:</span>
                <span className="text-accent-cyan font-bold">{record.processing_time} seconds</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Input Resolution:</span>
                <span className="text-white font-semibold">{record.metadata?.original_resolution || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Enhanced Resolution:</span>
                <span className="text-white font-semibold">{record.metadata?.enhanced_resolution || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Original Format:</span>
                <span className="text-white font-semibold uppercase">{record.metadata?.input_format || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Original File Size:</span>
                <span className="text-white font-semibold">{record.metadata?.original_size_kb || 0} KB</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Enhanced File Size:</span>
                <span className="text-white font-semibold">{record.metadata?.enhanced_size_kb || 0} KB</span>
              </div>
              <div className="flex justify-between py-2 last:pb-0">
                <span className="text-slate-400">Colorized File Size:</span>
                <span className="text-white font-semibold">{record.metadata?.colorized_size_kb || 0} KB</span>
              </div>
            </div>
          </div>

          {/* Action Downloads card */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-white mb-2">Export Results</h3>
            
            <button 
              onClick={() => handleDownload(record.colorized_url, 'colorized')}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <FiDownload className="w-4 h-4" /> Download Colorized (PNG)
            </button>
            <button 
              onClick={() => handleDownload(record.enhanced_url, 'enhanced')}
              className="btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <FiDownload className="w-4 h-4" /> Download Enhanced (Grayscale)
            </button>
            
            <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest pt-2">
              Export format is lossless PNG to preserve radiometric coordinates.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ResultPage;
