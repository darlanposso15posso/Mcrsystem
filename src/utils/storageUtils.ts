import { supabase } from '../lib/supabase';

/**
 * Uploads a base64 image or File to Supabase Storage and returns the public URL.
 * @param fileOrBase64 The image to upload
 * @param bucket The storage bucket name
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (fileOrBase64: File | string, bucket = 'photos'): Promise<string> => {
    try {
        let blob: Blob;
        let fileName: string;

        if (typeof fileOrBase64 === 'string') {
            // Convert base64 to Blob
            const base64Content = fileOrBase64.split(',')[1];
            const mimeType = fileOrBase64.split(',')[0].split(':')[1].split(';')[0];
            const byteCharacters = atob(base64Content);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            blob = new Blob([byteArray], { type: mimeType });
            fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        } else {
            blob = fileOrBase64;
            fileName = `${Date.now()}_${fileOrBase64.name}`;
        }

        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};
