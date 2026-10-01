"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ProductPhoto } from "@/components/products/product-photo";

const BUCKET = "product-photos";

function extractStoragePath(publicUrl: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length).split("?")[0];
}

export function ProductPhotoUploader({
  productId,
  value,
  onChange,
  size = 220,
}: {
  productId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${productId}/photo.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadError) {
        toast.error("Upload failed", { description: uploadError.message });
        return;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(`${data.publicUrl}?v=${Date.now()}`);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!value) return;
    const path = extractStoragePath(value);
    if (path) {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([path]);
    }
    onChange(null);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ProductPhoto
        src={value}
        alt=""
        size={size}
        className="rounded-xl"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {value ? "Replace Photo" : "Upload Photo"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
