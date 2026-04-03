import React from 'react';
import { X } from 'lucide-react';
import PhotoUpload from './PhotoUpload';

/**
 * Displays a grid of uploaded photos with delete buttons.
 * Optionally shows the PhotoUpload trigger for adding more photos.
 *
 * @param {{
 *   photos: string[],
 *   onPhotosChange: (photos: string[]) => void,
 *   showUpload?: boolean
 * }} props
 */
export default function PhotoGallery({ photos = [], onPhotosChange, showUpload = true }) {
  const handleDelete = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={src}
                alt={`Photo ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(idx)}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label={`Delete photo ${idx + 1}`}
              >
                <X size={14} className="text-white" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <PhotoUpload photos={photos} onPhotosChange={onPhotosChange} />
      )}
    </div>
  );
}
