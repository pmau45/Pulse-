import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { compressImage } from '../utils/photoUtils';

const MAX_PHOTOS = 5;

/**
 * Photo upload component. Accepts image files, compresses them, and calls
 * onPhotosChange with the updated array of base64 data URLs.
 *
 * @param {{ photos: string[], onPhotosChange: (photos: string[]) => void }} props
 */
export default function PhotoUpload({ photos = [], onPhotosChange }) {
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    const selected = Array.from(files).slice(0, remaining);
    const compressed = await Promise.all(selected.map(compressImage));
    onPhotosChange([...photos, ...compressed]);
  };

  const handleChange = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      // Reset so the same file can be re-selected if deleted and re-added
      e.target.value = '';
    }
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleChange}
        aria-label="Upload photos"
      />

      {/* Upload trigger */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 bg-[#1C1C1E] border border-dashed border-[#00E5FF] text-[#00E5FF] rounded-xl px-4 py-3 text-sm font-medium hover:bg-[#00E5FF]/10 transition-colors w-full justify-center"
        >
          <Camera size={18} aria-hidden="true" />
          {photos.length === 0 ? 'Add Photos' : 'Add More Photos'}
          <span className="text-gray-500 text-xs ml-1">
            ({photos.length}/{MAX_PHOTOS})
          </span>
        </button>
      )}

      {photos.length >= MAX_PHOTOS && (
        <p className="text-xs text-gray-500 text-center mt-1">
          Maximum {MAX_PHOTOS} photos reached
        </p>
      )}
    </div>
  );
}
