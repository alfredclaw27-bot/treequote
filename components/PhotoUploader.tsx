"use client";
import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Upload, Camera, X, Loader2, Plus } from "lucide-react";

interface PhotoUploaderProps {
  onUploaded: (urls: string[]) => void;
  currentUrls?: string[];
}

export function PhotoUploader({ onUploaded, currentUrls = [] }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<{ url: string; uploading?: boolean }[]>(
    currentUrls.map((url) => ({ url }))
  );
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const syncState = useCallback((updated: typeof photos) => {
    setPhotos(updated);
    const urls = updated.filter((p) => !p.uploading).map((p) => p.url);
    if (urls.length > 0 || updated.length > 0) {
      onUploaded(urls);
    }
  }, [onUploaded]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });

      const ext = compressed.name.split(".").pop() ?? "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("tree-photos")
        .upload(fileName, compressed, { contentType: `image/${ext}`, upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("tree-photos")
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }, [supabase]);

  const addFiles = async (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const remaining = 10 - photos.length;
    if (remaining <= 0) {
      alert("Maximum 10 photos.");
      return;
    }

    const files = Array.from(incoming).slice(0, remaining);

    // Add placeholder entries immediately
    const placeholders = files.map(() => ({ url: "", uploading: true }));
    const newIndexStart = photos.length;
    syncState([...photos, ...placeholders]);
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const uploadedUrl = await uploadFile(file);
      const idx = newIndexStart + i;

      setPhotos((prev) => {
        const updated = [...prev];
        if (uploadedUrl) {
          updated[idx] = { url: uploadedUrl, uploading: false };
        } else {
          updated[idx] = { url: previewUrl, uploading: false };
        }
        const allDone = updated.every((p) => !p.uploading);
        if (allDone) setUploading(false);
        onUploaded(updated.filter((p) => !p.uploading).map((p) => p.url));
        return updated;
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    syncState(updated);
  };

  const realPhotos = photos.filter((p) => !p.uploading);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div
              key={i}
              className={`relative aspect-square rounded-xl overflow-hidden group ${photo.uploading ? "bg-gray-200 animate-pulse" : ""}`}
            >
              {photo.url && !photo.uploading && (
                <img src={photo.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              )}
              {photo.uploading && (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={24} className="text-gray-400 animate-spin" />
                </div>
              )}
              {!photo.uploading && (
                <>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded font-medium">Cover</span>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add more */}
          {photos.length < 10 && !uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-green-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Plus size={22} />
              <span className="text-xs">{10 - photos.length} left</span>
            </button>
          )}
        </div>
      )}

      {/* Upload zone */}
      {photos.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => { void addFiles(inputRef.current?.files ?? null); }}
          className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all py-14 ${dragging ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-gray-50"}`}
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void addFiles(inputRef.current?.files ?? null); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700"
            >
              <Upload size={16} /> Browse Photos
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); void addFiles(inputRef.current?.files ?? null); }}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-green-600 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-50"
            >
              <Camera size={16} /> Take New
            </button>
          </div>
          <p className="text-gray-400 text-sm">Select from gallery or take new · Up to 10 photos</p>
        </div>
      )}

      {/* Status */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Loader2 size={16} className="animate-spin" />
          Uploading {photos.filter((p) => p.uploading).length} photo(s)...
        </div>
      )}
      {photos.length > 0 && !uploading && (
        <p className="text-xs text-gray-400 text-center">
          {realPhotos.length} photo{realPhotos.length !== 1 ? "s" : ""} uploaded · {10 - photos.length} slots remaining
        </p>
      )}
    </div>
  );
}
