import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { FiUploadCloud, FiClock, FiActivity, FiDownload, FiCheckCircle, FiCpu, FiTrendingUp } from 'react-icons/fi';

interface ImageRecord {
  id: string;
  original_filename: string;
  original_url: string;
  enhanced_url: string;
  colorized_url: string;
  timestamp: string;
  processing_time: number;
  downloads: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [stats, setStats] = useState({
    totalProcessed: 0,
    totalDownloads: 0,
    avgTime: '0.00',
    modelStatus: 'Ready (CPU)',
  });
  const [recentUploads, setRecentUploads] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user history to get counts and recent uploads
        const historyRes = await api.get('/api/history');
        const historyData: ImageRecord[] = historyRes.data;
        
        // Compute statistics locally based on user history
        const processedCount = historyData.length;
        const downloadsSum = historyData.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
        
        const times = historyData.map(h => h.processing_time).filter(t => t != null);
        const avg = times.length > 0 
          ? (times.reduce((acc, curr) => acc + curr, 0) / times.length).toFixed(2)
          : '0.00';
          
        setStats({
          totalProcessed: processedCount,
          totalDownloads: downloadsSum,
          avgTime: avg,
          modelStatus: 'Active (PyTorch CPU)',
        });
        
        setRecentUploads(historyData.slice(0, 4));
      } catch (err: any) {
        console.error('Dashboard data fetch error:', err);
        showToast('Could not load recent activity stats. Showing offline profile.', 'info');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display font-black text-3xl md:text-4xl text-white">Welcome back, {user?.full_name}</h1>
          <p className="text-slate-400 text-sm mt-1">Satellite analysis, image enhancement, and deep spectral colorization controls.</p>
        </div>
        <Link to="/upload" className="btn-primary self-start md:self-auto py-3">
          <FiUploadCloud className="w-5 h-5" /> Enhance New Image
        </Link>
      </div>

      {/* Grid Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6 h-28 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {/* Card 1 */}
          <motion.div variants={cardVariants} className="glass-card p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Images Processed</span>
              <span className="text-3xl font-black text-white font-display">{stats.totalProcessed}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple">
              <FiActivity className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={cardVariants} className="glass-card p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">File Downloads</span>
              <span className="text-3xl font-black text-white font-display">{stats.totalDownloads}</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue">
              <FiDownload className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={cardVariants} className="glass-card p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Avg Process Speed</span>
              <span className="text-3xl font-black text-white font-display">{stats.avgTime}s</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <FiClock className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div variants={cardVariants} className="glass-card p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Neural Model</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-1">
                <FiCheckCircle className="w-4 h-4" /> {stats.modelStatus}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FiCpu className="w-6 h-6" />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-bold text-xl text-white">Recent Processed Images</h2>
              <Link to="/history" className="text-xs font-semibold text-accent-purple hover:underline flex items-center gap-1">
                View History <FiClock className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : recentUploads.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                <FiUploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3 animate-bounce" />
                <p className="text-slate-400 text-sm">No enhanced imagery found in your history.</p>
                <Link to="/upload" className="text-xs text-accent-purple font-semibold hover:underline mt-2 inline-block">
                  Upload your first file now
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentUploads.map((record) => (
                  <div key={record.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail (original or colorized preview) */}
                      <div className="w-14 h-10 rounded-lg overflow-hidden border border-white/10 bg-space-900 flex-shrink-0">
                        <img 
                          src={record.colorized_url} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate max-w-xs md:max-w-md">{record.original_filename}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(record.timestamp).toLocaleDateString()} | Duration: {record.processing_time}s
                        </p>
                      </div>
                    </div>
                    <Link 
                      to={`/result?id=${record.id}`}
                      className="btn-secondary py-2 px-4 text-xs font-semibold"
                    >
                      Inspect
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Specs / Help */}
        <div className="space-y-6">
          {/* Quick Specs */}
          <div className="glass-card p-6 bg-gradient-to-br from-accent-purple/10 to-accent-blue/10">
            <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <FiTrendingUp className="text-accent-purple" /> Remote Sensing Tips
            </h3>
            <ul className="space-y-3 text-xs text-slate-300 leading-relaxed list-disc list-inside">
              <li>
                <strong>Speckle Noise:</strong> Use noise removal on high-latitude sensors to strip background thermal interference.
              </li>
              <li>
                <strong>CLAHE clipLimit:</strong> Ideal for ocean boundary detection. Prevents brightness blowouts on high-reflection clouds.
              </li>
              <li>
                <strong>False-Color Spectral maps:</strong> Blended color gradients align cold areas with blue and intense IR signatures with green/red.
              </li>
              <li>
                <strong>Super Resolution:</strong> Reconstructs sharp borders, excellent for vectorizing roads or runway parameters.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
