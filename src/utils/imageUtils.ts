export const compressImage = (file: File, initialMaxWidth = 1920, initialQuality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const MAX_BASE64_SIZE = 1600000; // ~1.2MB limit for base64 string length

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                let currentMaxWidth = initialMaxWidth;
                let currentQuality = initialQuality;

                const attemptCompression = () => {
                    // Update dimensions based on current limits
                    let drawWidth = width;
                    let drawHeight = height;

                    if (drawWidth > currentMaxWidth) {
                        drawHeight = Math.round((drawHeight * currentMaxWidth) / drawWidth);
                        drawWidth = currentMaxWidth;
                    }

                    canvas.width = drawWidth;
                    canvas.height = drawHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(img.src);
                        return;
                    }

                    // Reset background
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, drawWidth, drawHeight);
                    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

                    const base64Data = canvas.toDataURL('image/jpeg', currentQuality);

                    // Check if it fits the limit
                    if (base64Data.length <= MAX_BASE64_SIZE) {
                        resolve(base64Data);
                    } else {
                        // Iteratively reduce downscale and quality
                        currentQuality -= 0.15;
                        currentMaxWidth = Math.round(currentMaxWidth * 0.85);

                        // Failsafe limit
                        if (currentQuality < 0.2 || currentMaxWidth < 600) {
                            console.warn("Image compression hit lower limits, returning resulting base64 anyway.");
                            resolve(base64Data);
                        } else {
                            // Recursively try again
                            attemptCompression();
                        }
                    }
                };

                // Trigger first attempt
                attemptCompression();
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
