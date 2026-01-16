export const isYouTubeUrl = (url: string) => /youtube\.com|youtu\.be/.test(url || "");
export const getYouTubeId = (url: string) => {
  const m1 = url?.match(/v=([^&]+)/);
  const m2 = url?.match(/youtu\.be\/([^?]+)/);
  const m3 = url?.match(/embed\/([^?]+)/);
  return (m1?.[1] || m2?.[1] || m3?.[1] || "");
};
export const isGoogleDriveUrl = (url: string) => /drive\.google\.com/.test(url || "");
export const getDriveDirectVideoUrl = (url: string) => {
  const fileMatch = url?.match(/\/file\/d\/([^/]+)/);
  const paramMatch = url?.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] || paramMatch?.[1];
  if (!id) return "";
  return `https://lh3.googleusercontent.com/d/${id}=m22`;
};
export const getDriveEmbedUrl = (url: string) => {
  const fileMatch = url?.match(/\/file\/d\/([^/]+)/);
  const idParam = url?.match(/[?&]id=([^&]+)/);
  const id = fileMatch?.[1] || idParam?.[1];
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
};
