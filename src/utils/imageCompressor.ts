/**
 * Image compressor utility for client-side image uploads.
 * Scales images to a max dimension and exports as optimized JPEG base64 Data URL.
 * Ensures fast loading, offline compatibility, and keeps document size well within Firestore and localStorage limits.
 */

export async function compressImageFile(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP, etc.).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('No se pudo inicializar el lienzo para optimizar la imagen.'));
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Background fill for PNG transparency
          ctx.fillStyle = '#111827';
          ctx.fillRect(0, 0, width, height);

          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (err: any) {
          reject(new Error(err?.message || 'Error procesando la imagen.'));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
