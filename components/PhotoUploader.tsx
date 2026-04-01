"use client";
import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Upload, Camera, X, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  onUploaded: (url: string) => void;
  currentUrl?: string;
}

export function PhotoUploader({ onUploaded, currentUrl }: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string>(currentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      // Compress image first
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      });

      const ext = compressed.name.split(".").pop() ?? "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("tree-photos")
        .upload(fileName, compressed, { contentType: `image/${ext}` });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("tree-photos")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [supabase, onUploaded]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Photo must be smaller than 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
          <button
            type="button"
            onClick={() => {
              setPreview("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X size={16} />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="text-white animate-spin" size={40} />
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
            ${dragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-gray-50"}
          `}
        >
          <Upload className="text-gray-400" size={40} />
          <p className="text-gray-500 font-medium">Tap to upload or take a photo</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Camera size={16} /> Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
