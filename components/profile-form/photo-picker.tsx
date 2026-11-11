"use client";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { PhotoIcon as ImagePlus, NopeIcon as X } from "@/components/icons";
import { toast } from "sonner";
import { Photo } from "@/components/ui/photo";
import { uploadImage, type UploadKind } from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import type { Photo as PhotoT } from "@/types";

/** Grid photo picker: camera or gallery, upload directly to Cloudinary, reorder by removing. */
export function PhotoPicker({
  value,
  onChange,
  max,
  kind,
  label,
}: {
  value: PhotoT[];
  onChange: (v: PhotoT[]) => void;
  max: number;
  kind: UploadKind;
  label: string;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = max - value.length;
    const list = Array.from(files).slice(0, room);
    setUploading(list.length);
    const results: PhotoT[] = [];
    for (const f of list) {
      try {
        results.push(await uploadImage(f, kind));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (results.length) onChange([...value, ...results]);
  };

  const slots = Array.from({ length: max });
  return (
    <div>
      <div className={cn("grid gap-2.5", max > 4 ? "grid-cols-3" : "grid-cols-2")}>
        {slots.map((_, i) => {
          const p = value[i];
          if (p)
            return (
              <div key={p.url} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2">
                <Photo src={p.url} alt={`${label} ${i + 1}`} fill sizes="200px" />
                {i === 0 && kind === "profile" && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white">Main</span>
                )}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-full bg-black/55 text-white"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          if (i === value.length && uploading > 0)
            return (
              <div key={i} className="grid aspect-[3/4] place-items-center rounded-2xl border-2 border-dashed border-line bg-surface">
                <Loader2 className="size-6 animate-spin text-brand" />
              </div>
            );
          return (
            <button
              key={i}
              type="button"
              disabled={i > value.length + uploading}
              onClick={() => galleryRef.current?.click()}
              className="grid aspect-[3/4] place-items-center rounded-2xl border-2 border-dashed border-line bg-surface text-muted transition-colors active:bg-surface-2 disabled:opacity-40"
              aria-label={`Add ${label.toLowerCase()}`}
            >
              <ImagePlus className="size-7" />
            </button>
          );
        })}
      </div>
      {value.length < max && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => cameraRef.current?.click()} className="tap inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold">
            <Camera className="size-4" /> Camera
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} className="tap inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-semibold">
            <ImagePlus className="size-4" /> Gallery
          </button>
        </div>
      )}
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={(e) => (onFiles(e.target.files), (e.target.value = ""))} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => (onFiles(e.target.files), (e.target.value = ""))} />
    </div>
  );
}
