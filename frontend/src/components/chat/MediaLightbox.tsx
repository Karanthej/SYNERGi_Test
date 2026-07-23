import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

interface MediaLightboxProps {
  url: string;
  type: 'image' | 'video';
  fileName?: string;
  onClose: () => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({ url, type, fileName, onClose }) => {
  const [scale, setScale] = React.useState(1);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = getImageUrl(url);
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fullUrl = getImageUrl(url);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
          <button 
            onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 0.5, 4)); }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 0.5, 0.5)); }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.div 
          className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {type === 'image' ? (
            <img 
              src={fullUrl} 
              alt={fileName || 'Attachment preview'} 
              className="max-w-full max-h-[90vh] object-contain transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          ) : (
            <video 
              src={fullUrl} 
              controls 
              autoPlay 
              className="max-w-full max-h-[90vh] transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
