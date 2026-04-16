import React from 'react';
import { compressImage } from '../lib/imageUtils';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
  isUploading: boolean;
  id: string;
  accept?: string;
  className?: string;
  children: React.ReactNode;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUpload, 
  isUploading, 
  id, 
  accept = "image/*", 
  className,
  children 
}) => {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Client-side compression to ensure it fits in Firestore (1MB limit)
        const compressed = await compressImage(base64);
        await onUpload(compressed);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image processing failed:", error);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className={className}>
      <input 
        type="file" 
        id={id} 
        className="sr-only" 
        accept={accept}
        onChange={handleChange}
        disabled={isUploading}
      />
      <label htmlFor={id} className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
        {children}
      </label>
    </div>
  );
};
