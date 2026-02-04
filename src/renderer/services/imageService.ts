/**
 * 画像をリサイズし、WebP形式に変換するユーティリティ
 */

interface OptimizeOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

export const optimizeImage = async (
    fileOrBuffer: File | ArrayBuffer,
    options: OptimizeOptions = {}
): Promise<{ buffer: ArrayBuffer; mimeType: string; extension: string }> => {
    const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

    return new Promise((resolve, reject) => {
        const blob = fileOrBuffer instanceof File
            ? fileOrBuffer
            : new Blob([fileOrBuffer]);

        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
            URL.revokeObjectURL(url);

            let width = img.width;
            let height = img.height;

            // リサイズ計算
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // WebP形式で出力
            canvas.toBlob(
                (resultBlob) => {
                    if (!resultBlob) {
                        reject(new Error('Failed to create blob from canvas'));
                        return;
                    }

                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            buffer: reader.result as ArrayBuffer,
                            mimeType: 'image/webp',
                            extension: 'webp'
                        });
                    };
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(resultBlob);
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
};
