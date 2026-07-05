import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useToast } from '../components/Toast';
import { ProgressBar } from '../components/ProgressBar';
import { FiUploadCloud, FiFile, FiXCircle, FiSettings, FiActivity } from 'react-icons/fi';

export const UploadPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('Ready to process');
  const [pipelineSteps, setPipelineSteps] = useState<Array<{ name: string; status: 'pending' | 'active' | 'done' }>>([
    { name: 'Load & Normalize', status: 'pending' },
    { name: 'Noise Removal', status: 'pending' },
    { name: 'Contrast (CLAHE)', status: 'pending' },
    { name: 'AI Super Resolution', status: 'pending' },
    { name: 'Neural Colorization', status: 'pending' },
    { name: 'Bilateral Edge Filter', status: 'pending' },
  ]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setProgress(0);
      setStatusMsg('Ready to process');
      // Reset pipeline indicators
      setPipelineSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setProgress(0);
    setStatusMsg('Ready to process');
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMsg('Uploading file...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? ''
        : 'https://irvision-ai.onrender.com';
      // Use standard fetch to read streamed response body
      const response = await fetch(`${apiUrl}/api/upload/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Upload or processing failed.');
      }

      if (!response.body) {
        throw new Error('Server returned empty response stream.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE protocol: data: {...}\n\n
        const lines = buffer.split('\n');
        // Keep the last partial line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanedLine = line.trim();
          if (cleanedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanedLine.substring(6));
              
              if (data.keep_alive) continue;
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.progress !== undefined) {
                setProgress(data.progress);
                setStatusMsg(data.status);
                
                // Dynamically mark pipeline steps as done / active
                setPipelineSteps(steps => {
                  const newSteps = [...steps];
                  const p = data.progress;
                  
                  if (p >= 15) newSteps[0].status = p > 15 ? 'done' : 'active';
                  if (p >= 30) newSteps[1].status = p > 30 ? 'done' : 'active';
                  if (p >= 45) newSteps[2].status = p > 45 ? 'done' : 'active';
                  if (p >= 65) newSteps[3].status = p > 65 ? 'done' : 'active';
                  if (p >= 80) newSteps[4].status = p > 80 ? 'done' : 'active';
                  if (p >= 95) newSteps[5].status = p > 95 ? 'done' : 'active';
                  
                  return newSteps;
                });
              }

              // Finished successfully
              if (data.done && data.result) {
                // All steps are completed
                setPipelineSteps(steps => steps.map(s => ({ ...s, status: 'done' })));
                showToast('Image enhanced and colorized successfully!', 'success');
                // Wait slightly, then redirect to result page with record ID
                setTimeout(() => {
                  navigate(`/result?id=${data.result.id}`);
                }, 800);
              }
            } catch (jsonErr) {
              console.error('Failed to parse SSE JSON chunk:', jsonErr);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Processing error:', err);
      showToast(err.message || 'Image processing failed.', 'error');
      setIsProcessing(false);
      setProgress(0);
      setStatusMsg('Error encountered');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h1 className="font-display font-black text-3xl md:text-4xl text-white">Upload Satellite Imagery</h1>
        <p className="text-slate-400 text-sm mt-1">Upload grayscale thermal or infrared images to execute the enhancement pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6">
            {!previewUrl ? (
              // Drag and drop zone
              <div 
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-accent-purple bg-accent-purple/5' 
                    : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <input {...getInputProps()} />
                <FiUploadCloud className="w-14 h-14 text-slate-500 mx-auto mb-4 animate-pulse" />
                <p className="text-slate-200 font-semibold text-base mb-1">Drag & Drop Image Here</p>
                <p className="text-xs text-slate-400 mb-6">Or click to browse from local directories</p>
                <div className="inline-flex gap-2 justify-center text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <span>PNG</span> • <span>JPG</span> • <span>JPEG</span> • <span>TIFF</span>
                </div>
              </div>
            ) : (
              // File preview & buttons
              <div className="space-y-4">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-space-900 flex items-center justify-center">
                  <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
                  
                  {!isProcessing && (
                    <button 
                      onClick={clearSelection}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-slate-300 hover:text-white transition-colors border border-white/10"
                    >
                      <FiXCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <FiFile className="text-accent-purple w-6 h-6 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate max-w-[200px] md:max-w-md">{selectedFile?.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                      </p>
                    </div>
                  </div>
                  
                  {!isProcessing && (
                    <button 
                      onClick={handleProcess}
                      className="btn-primary py-2 px-5 text-sm"
                    >
                      Process Image
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicators */}
          {isProcessing && (
            <div className="glass-card p-6 space-y-4">
              <ProgressBar progress={progress} status={statusMsg} />
            </div>
          )}
        </div>

        {/* Pipeline Column */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <FiSettings className="text-accent-purple animate-spin" /> Pipeline Progress
            </h3>
            
            <div className="space-y-4">
              {pipelineSteps.map((step, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-medium">
                  <span className={`flex items-center gap-2 ${
                    step.status === 'done' ? 'text-slate-400 line-through' : 
                    step.status === 'active' ? 'text-accent-purple font-bold' : 'text-slate-500'
                  }`}>
                    <FiActivity className={`w-3.5 h-3.5 ${step.status === 'active' ? 'animate-pulse' : ''}`} />
                    {step.name}
                  </span>
                  
                  <span>
                    {step.status === 'done' && <span className="text-emerald-400 font-bold">Done</span>}
                    {step.status === 'active' && <span className="text-accent-purple font-bold animate-pulse">Running</span>}
                    {step.status === 'pending' && <span className="text-slate-600">Pending</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default UploadPage;
