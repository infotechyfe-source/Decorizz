import { projectId } from './supabase/info';

// Cloud name is public and safe to include
const CLOUD_NAME_DEFAULT = 'dxpabpzkf';

/**
 * Fetches a secure signature from the backend for Cloudinary uploads.
 * The API_SECRET is NEVER exposed to the browser.
 */
async function getCloudinarySignature(
  params: Record<string, string>,
  accessToken: string
): Promise<{ signature: string; api_key: string; cloud_name: string }> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/cloudinary-signature`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params), // Send params directly, not wrapped
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get Cloudinary signature');
  }

  return response.json();
}

/**
 * Uploads a file to Cloudinary.
 * @param file The file (or URL string for migration) to upload.
 * @param accessToken The user's auth token for backend signature request.
 * @returns The secure, optimized URL of the uploaded image.
 */
export async function uploadToCloudinary(file: File | string, accessToken?: string): Promise<string> {
  if (!accessToken) {
    // Try to get from session storage as fallback for migration scenarios
    const stored = sessionStorage.getItem('access_token');
    if (stored) {
      accessToken = stored;
    } else {
      throw new Error('Authentication required for upload');
    }
  }

  const timestamp = Math.round((new Date()).getTime() / 1000).toString();
  const folder = 'products';
  
  const params: Record<string, string> = {
    timestamp,
    folder,
    format: 'webp',
  };

  // For URL migration, derive a consistent public_id to avoid duplicates
  if (typeof file === 'string') {
    try {
      const urlObj = new URL(file);
      const pathname = urlObj.pathname;
      let name = pathname.split('/').pop() || 'image';
      name = name.split('.')[0];
      params.public_id = name;
    } catch (e) {
      // ignore
    }
  }

  // Get secure signature from backend
  const { signature, api_key, cloud_name } = await getCloudinarySignature(params, accessToken);

  const formData = new FormData();
  formData.append('file', file);
  
  formData.append('api_key', api_key);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('format', 'webp');
  formData.append('signature', signature);
  if (params.public_id) {
    formData.append('public_id', params.public_id);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud_name || CLOUD_NAME_DEFAULT}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  
  // Optimize delivery: f_auto + q_auto
  const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
  return optimizedUrl;
}

