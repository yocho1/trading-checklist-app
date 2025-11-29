import React, { useRef, useState } from 'react';
import { X, Upload, XCircle } from 'lucide-react';

export const ImageUploadModal = ({ isOpen, onClose, onImageSelect }) => {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file) => {
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG or JPG)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreviewUrl('');
    onImageSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setPreviewUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full">
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Upload Chart Image</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files[0])}
            accept="image/png,image/jpeg,image/jpg"
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Chart preview"
                className="w-full h-64 object-contain rounded-lg border border-slate-600"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
          ) : (
            <div
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver 
                  ? 'border-emerald-400 bg-emerald-400 bg-opacity-10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <Upload size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-300 text-lg mb-2">Click to upload chart image</p>
              <p className="text-slate-500 text-sm">PNG, JPG up to 10MB (1 image only)</p>
              <p className="text-slate-500 text-sm mt-2">or drag and drop here</p>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
              disabled={!previewUrl}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};