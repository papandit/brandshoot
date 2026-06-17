// Web port of mobile UploadDropzone.tsx — file picker + drag & drop instead of gallery/camera
import { useRef, useState } from 'react';
import { IoCloudUploadOutline, IoImageOutline, IoCameraOutline } from 'react-icons/io5';
import './components.css';

export default function UploadDropzone({ onFile }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    if (files && files.length > 0) onFile(files[0]);
  };

  return (
    <div
      className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="dz-icon-circle">
        <IoCloudUploadOutline />
      </div>
      <div className="dz-title">Upload product image</div>
      <div className="dz-subtitle">PNG, JPG up to 10MB</div>
      <div className="dz-actions">
        <button
          type="button"
          className="dz-btn filled"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <IoImageOutline /> Gallery
        </button>
        <button
          type="button"
          className="dz-btn outlined"
          onClick={(e) => {
            e.stopPropagation();
            cameraInputRef.current?.click();
          }}
        >
          <IoCameraOutline /> Camera
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
