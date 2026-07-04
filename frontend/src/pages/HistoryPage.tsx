import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { FiSearch, FiTrash2, FiDownload, FiEye, FiLayers } from 'react-icons/fi';

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
  };
}

export const HistoryPage: React.FC = () => {
  const { showToast } = useToast();
  
  const [history, setHistory] = useState<ImageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (query: string = '') => {
    try {
      setLoading(true);
      const url = query ? `/api/history?search=${encodeURIComponent(query)}` : '/api/history';
      const response = await api.get(url);
      setHistory(response.data);
    } catch (err: any) {
      showToast('Failed to retrieve processing history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounce = setTimeout(() => {
      fetchHistory(searchQuery);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleDelete = async (recordId: string, filename: string) => {
    const confirm = window.confirm(`Are you sure you want to delete the record for ${filename}? This cannot be undone.`);
    if (!confirm) return;

    try {
      await api.delete(`/api/history/${recordId}`);
      showToast('Record deleted successfully.', 'success');
      // Update state local cache
      setHistory((prev) => prev.filter((h) => h.id !== recordId));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete record.', 'error');
    }
  };

  const handleDownload = async (recordId: string, url: string, originalFilename: string) => {
    try {
      await api.post(`/api/history/${recordId}/download`);
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      const baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
      link.download = `${baseName}_colorized.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      showToast('Image download started.', 'success');
      
      // Update local download count indicator
      setHistory(prev => 
        prev.map(h => h.id === recordId ? { ...h, downloads: h.downloads + 1 } : h)
      );
    } catch (err) {
      showToast('Failed to download image file.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-black text-3xl text-white">Enhancement History</h1>
          <p className="text-slate-400 text-sm mt-1">Review, inspect, or re-export previously colorized satellite imagery.</p>
        </div>

        {/* Search Input bar */}
        <div className="relative max-w-sm w-full">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name..."
            className="w-full glass-input pl-12 py-2 text-sm"
          />
        </div>
      </div>

      {/* History content container */}
      <div className="glass-card p-6 overflow-hidden">
        {loading && history.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Searching imagery archives...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-xl">
            <FiLayers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-semibold">No records found matching search query.</p>
            <Link to="/upload" className="text-xs text-accent-purple hover:underline mt-2 inline-block">
              Upload and colorize an image to generate history
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-left">
                  <th className="pb-4">Preview</th>
                  <th className="pb-4">File Name</th>
                  <th className="pb-4">Timestamp</th>
                  <th className="pb-4">Stats</th>
                  <th className="pb-4">Downloads</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pr-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-white/10 bg-space-900">
                        <img 
                          src={record.colorized_url} 
                          alt="Colorized Preview" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-semibold max-w-[200px] truncate" title={record.original_filename}>
                      {record.original_filename}
                    </td>
                    <td className="py-4 pr-4 text-slate-400">
                      <div className="flex flex-col">
                        <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-500 mt-0.5">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-col text-xs">
                        <span className="text-accent-cyan font-bold">{record.processing_time}s</span>
                        <span className="text-slate-500 text-[10px] mt-0.5">{record.metadata?.original_resolution || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 font-bold text-center pl-4">
                      {record.downloads}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link 
                          to={`/result?id=${record.id}`} 
                          title="Inspect Output"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDownload(record.id, record.colorized_url, record.original_filename)}
                          title="Download Colorized Image"
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.original_filename)}
                          title="Delete Record"
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default HistoryPage;
