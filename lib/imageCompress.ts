/**
 * Kompres & resize gambar di sisi klien sebelum diunggah agar file ringan.
 * Mengembalikan File baru (webp) — atau file asli bila bukan gambar / gagal.
 */
export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.8
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  try {
    const dataUrl: string = await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
    const img: HTMLImageElement = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });

    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((res) =>
      canvas.toBlob(res, "image/webp", quality)
    );
    if (!blob || blob.size >= file.size) {
      // kompresi tidak menguntungkan → pakai asli
      return blob && blob.size < file.size
        ? new File([blob], renameWebp(file.name), { type: "image/webp" })
        : file;
    }
    return new File([blob], renameWebp(file.name), { type: "image/webp" });
  } catch {
    return file;
  }
}

function renameWebp(name: string): string {
  return name.replace(/\.[^.]+$/, "") + ".webp";
}
