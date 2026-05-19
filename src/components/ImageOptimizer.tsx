import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Trash2, Image as ImageIcon, X, HardDrive, CheckCircle, Sliders, SplitSquareHorizontal, DownloadCloud } from 'lucide-react';
import JSZip from 'jszip';

interface OptimizedImage {
  id: string;
  name: string;
  originalFile: File;
  originalDataUrl: string;
  webpBlob: Blob | null;
  webpDataUrl: string | null;
  originalSize: number;
  webpSize: number;
  status: 'processing' | 'done' | 'error';
}

export const ImageOptimizer: React.FC = () => {
  const [images, setImages] = useState<OptimizedImage[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [maxWidth, setMaxWidth] = useState<number>(1200);
  const [isDragging, setIsDragging] = useState(false);
  const [compareImage, setCompareImage] = useState<{ original: string; webp: string } | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getQualityLabel = (val: number) => {
    if (val >= 90) return "შესანიშნავი";
    if (val >= 70) return "კარგი";
    if (val >= 50) return "საშუალო";
    return "დაბალი";
  };

  const processImage = async (file: File, currentQuality: number, currentMaxWidth: number): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > currentMaxWidth) {
            height = (height * currentMaxWidth) / width;
            width = currentMaxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No context'));
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Blob error'));
              const dataUrl = canvas.toDataURL('image/webp', currentQuality / 100);
              resolve({ blob, dataUrl });
            },
            'image/webp',
            currentQuality / 100
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (newFiles.length === 0) return;

    const initialImages: OptimizedImage[] = await Promise.all(
      newFiles.map(async (file) => {
        return new Promise<OptimizedImage>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              originalFile: file,
              originalDataUrl: e.target?.result as string,
              webpBlob: null,
              webpDataUrl: null,
              originalSize: file.size,
              webpSize: 0,
              status: 'processing'
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setImages(prev => [...prev, ...initialImages]);

    for (const img of initialImages) {
      try {
        const { blob, dataUrl } = await processImage(img.originalFile, quality, maxWidth);
        setImages(prev => prev.map(p => 
          p.id === img.id 
            ? { ...p, webpBlob: blob, webpDataUrl: dataUrl, webpSize: blob.size, status: 'done' }
            : p
        ));
      } catch (error) {
        console.error('Error processing image', error);
        setImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error' } : p));
      }
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [quality, maxWidth]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const downloadZip = async () => {
    const zip = new JSZip();
    const doneImages = images.filter(i => i.status === 'done' && i.webpBlob);
    
    doneImages.forEach(img => {
      const baseName = img.name.replace(/\.[^/.]+$/, "");
      zip.file(`${baseName}_optimized.webp`, img.webpBlob!);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `optimized_images_${new Date().getTime()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSingle = (img: OptimizedImage) => {
    if (!img.webpDataUrl) return;
    const a = document.createElement('a');
    a.href = img.webpDataUrl;
    const baseName = img.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}_optimized.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalUploaded = images.length;
  const totalCompleted = images.filter(i => i.status === 'done').length;
  const savedBytes = images.filter(i => i.status === 'done').reduce((acc, img) => acc + (img.originalSize - img.webpSize), 0);
  const isProcessing = images.some(i => i.status === 'processing');

  return (
    <div className="w-full bg-[#faf8f5] text-slate-800 p-6 rounded-xl font-sans selection:bg-rose-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif text-rose-500 flex items-center gap-3">
              <ImageIcon className="w-8 h-8" />
              WebP Optimizer
            </h1>
            <p className="text-slate-500 mt-2 text-sm">
              კლიენტის მხარეს მომუშავე ფოტოების ოპტიმიზატორი
            </p>
          </div>
          
          <div className="flex gap-3">
            {images.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setImages([])}
                className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                გასუფთავება
              </motion.button>
            )}
            
            {totalCompleted > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={downloadZip}
                className="px-6 py-2 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-medium hover:opacity-90 rounded-xl transition-opacity flex items-center gap-2 shadow-lg shadow-rose-200"
              >
                <DownloadCloud className="w-5 h-5" />
                ZIP გადმოწერა
              </motion.button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md border border-rose-100 shadow-sm p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">სულ ატვირთული</p>
              <p className="text-2xl font-semibold text-slate-800">{totalUploaded}</p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md border border-rose-100 shadow-sm p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">დამუშავებული</p>
              <p className="text-2xl font-semibold text-slate-800">{totalCompleted}</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md border border-rose-100 shadow-sm p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/5 to-rose-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">დაზოგილი სივრცე</p>
              <p className="text-2xl font-semibold text-rose-500">{formatBytes(savedBytes)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/80 backdrop-blur-md border border-rose-100 shadow-sm p-6 rounded-2xl space-y-8">
              <h3 className="text-lg font-medium flex items-center gap-2 border-b border-rose-100 pb-4 text-slate-800">
                <Sliders className="w-5 h-5 text-rose-400" />
                პარამეტრები
              </h3>

              {/* Quality Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-600">ხარისხი (Quality)</label>
                  <span className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-md font-medium">
                    {quality}% - {getQualityLabel(quality)}
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-rose-400 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Max Width */}
              <div className="space-y-4">
                <label className="text-sm text-slate-600">მაქს. სიგანე (Max Width)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[800, 1200, 1600].map(w => (
                    <button
                      key={w}
                      onClick={() => setMaxWidth(w)}
                      className={`py-2 px-1 text-xs sm:text-sm rounded-lg border transition-all ${
                        maxWidth === w 
                          ? 'border-rose-300 bg-rose-50 text-rose-600 font-medium shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-slate-400 italic mt-4">
                შენიშვნა: პარამეტრების შეცვლა იმოქმედებს მხოლოდ ახალ ატვირთულ ფოტოებზე.
              </p>
            </div>
          </div>

          {/* Upload and Grid */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Drag & Drop Zone */}
            <motion.div
              animate={{ 
                scale: isDragging ? 1.02 : 1,
                borderColor: isDragging ? '#fb7185' : '#e2e8f0',
                backgroundColor: isDragging ? '#fff1f2' : '#ffffff'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer flex flex-col items-center justify-center min-h-[200px] transition-colors shadow-sm"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 text-rose-400 shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-slate-800">აირჩიეთ ან გადმოათრიეთ ფოტოები</h3>
              <p className="text-slate-500 text-sm">მხარდაჭერილია ყველა სტანდარტული ფორმატი</p>
            </motion.div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-rose-400 to-pink-500"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(totalCompleted / totalUploaded) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Image Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {images.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white border border-slate-100 rounded-xl overflow-hidden group relative shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-video relative bg-slate-50 overflow-hidden">
                        <img 
                          src={img.webpDataUrl || img.originalDataUrl} 
                          alt={img.name}
                          className="w-full h-full object-contain p-2"
                        />
                        
                        {/* Hover Overlay */}
                        {img.status === 'done' && (
                          <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadSingle(img); }}
                              className="p-2 bg-white hover:bg-rose-50 text-rose-500 shadow-sm border border-rose-100 rounded-lg transition-colors tooltip-trigger"
                              title="ჩამოტვირთვა"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setCompareImage({ original: img.originalDataUrl, webp: img.webpDataUrl! }); setSliderPosition(50); }}
                              className="p-2 bg-white hover:bg-rose-50 text-rose-500 shadow-sm border border-rose-100 rounded-lg transition-colors tooltip-trigger"
                              title="შედარება"
                            >
                              <SplitSquareHorizontal className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {img.status === 'processing' && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 space-y-1 border-t border-slate-50">
                        <p className="text-sm font-medium truncate text-slate-700" title={img.name}>
                          {img.name}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 line-through">
                            {formatBytes(img.originalSize)}
                          </span>
                          {img.status === 'done' && (
                            <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {formatBytes(img.webpSize)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Before/After Modal */}
      <AnimatePresence>
        {compareImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={() => setCompareImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] shadow-2xl flex flex-col border border-slate-100"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-medium flex items-center gap-2 text-slate-800">
                  <SplitSquareHorizontal className="w-5 h-5 text-rose-500" />
                  ორიგინალი VS WebP
                </h3>
                <button 
                  onClick={() => setCompareImage(null)}
                  className="p-1 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="relative w-full h-[60vh] min-h-[400px] bg-slate-100 overflow-hidden select-none touch-none"
                   onMouseMove={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                     setSliderPosition((x / rect.width) * 100);
                   }}
                   onTouchMove={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                     setSliderPosition((x / rect.width) * 100);
                   }}
              >
                {/* Under image: WebP */}
                <img 
                  src={compareImage.webp} 
                  alt="WebP" 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
                
                {/* Over image: Original (clipped) */}
                <div 
                  className="absolute inset-0 w-full h-full overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img 
                    src={compareImage.original} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Slider handle */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-rose-400 cursor-ew-resize transform -translate-x-1/2 flex items-center justify-center shadow-[0_0_10px_rgba(251,113,133,0.3)] z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 absolute border-2 border-white">
                    <SplitSquareHorizontal className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 pointer-events-none text-slate-700">
                  ორიგინალი
                </div>
                <div className="absolute top-4 right-4 bg-rose-500/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-lg text-sm font-medium text-white pointer-events-none">
                  WebP ({quality}%)
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 text-center text-sm text-slate-500 border-t border-slate-100">
                გაამოძრავეთ მაუსი ან თითი ეკრანზე განსხვავების სანახავად
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
