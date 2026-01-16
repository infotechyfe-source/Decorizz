import React, { useContext, useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { AuthContext } from '../../context/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../../utils/cloudinary';

type VideoItem = { id: string; title: string; url: string; caption?: string; thumbnail?: string; order?: number; productId?: string };

export default function AdminVideos() {
  const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { accessToken } = useContext(AuthContext);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<VideoItem>({ id: '', title: '', url: '', caption: '', thumbnail: '', order: 0 });
  const [productId, setProductId] = useState('');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10 MB

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchVideos = async () => {
    try {
      const [authRes, pubRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, { headers: { Authorization: `Bearer ${publicAnonKey}` } }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`),
      ]);
      let list: VideoItem[] = [];
      if (authRes.ok) {
        const j = await authRes.json();
        list = j.videos || [];
      }
      if (!list.length && pubRes.ok) {
        const j2 = await pubRes.json();
        list = j2.videos || [];
      }
      setItems(list);
    } catch (e) { toast.error('Failed to load videos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
  const isYouTube = (url: string) => /youtube\.com|youtu\.be/.test(url);
  const isGoogleDrive = (url: string) => /drive\.google\.com/.test(url);
  const normalizeUrl = (url: string) => {
    if (!url) return url;
    if (isYouTube(url)) return url.includes('watch?v=') ? url.replace('watch?v=', 'embed/') : url;
    if (isGoogleDrive(url)) {
      const fileMatch = url.match(/\/file\/d\/([^/]+)/);
      const idParam = url.match(/[?&]id=([^&]+)/);
      const id = fileMatch?.[1] || idParam?.[1];
      return id ? `https://drive.google.com/file/d/${id}/preview` : url;
    }
    return url;
  };

  const createVideo = async () => {
    try {
      let thumbUrl = form.thumbnail || '';
      if (thumbFile) {
        // Upload thumbnail to Cloudinary
        thumbUrl = await uploadToCloudinary(thumbFile, accessToken!);
      }
      let videoUrl = form.url || '';
      if (videoFile) {
        if (videoFile.size > MAX_VIDEO_SIZE) {
          return toast.error('Video is too large. Max size is 10MB.');
        }
        setUploading(true);
        const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
        const base64 = await toBase64(videoFile);
        const up = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/upload`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ video: base64, fileName: videoFile.name, mimeType: videoFile.type })
        });
        const ud = await up.json();
        setUploading(false);
        if (!up.ok) return toast.error(ud.error || 'Upload failed');
        videoUrl = ud.url;
      }
      if (!videoUrl && form.url) {
        // Validate Google Drive links: must be a file link (contains /file/d/<id> or ?id=)
        if (isGoogleDrive(form.url)) {
          const fileMatch = form.url.match(/\/file\/d\/([^/]+)/);
          const idParam = form.url.match(/[?&]id=([^&]+)/);
          const id = fileMatch?.[1] || idParam?.[1];
          if (!id) {
            return toast.error('Paste a Google Drive FILE link (Open the file → Copy link), not a folder link');
          }
        }
        videoUrl = normalizeUrl(form.url);
      }
      if (!videoUrl) {
        return toast.error('Please upload a video file or paste a valid video URL');
      }
      let thumbFinal = thumbUrl;
      if (!thumbFinal && form.url) {
        const fileMatch = form.url.match(/\/file\/d\/([^/]+)/);
        const idParam = form.url.match(/[?&]id=([^&]+)/);
        const id = fileMatch?.[1] || idParam?.[1];
        if (id) thumbFinal = `https://drive.google.com/thumbnail?id=${id}&sz=w640`;
      }
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ ...form, url: videoUrl, thumbnail: thumbFinal, productId })
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Create failed');
      toast.success('Video added');
      setForm({ id: '', title: '', url: '', caption: '', thumbnail: '', order: 0 }); setThumbFile(null); setThumbPreview(''); setVideoFile(null); setVideoPreview(''); setProductId('');
      fetchVideos();
    } catch { toast.error('Create failed'); }
  };

  const updateVideo = async (id: string, updates: Partial<VideoItem>) => {
    try {
      // Auto-migrate thumbnail if it's on Supabase
      const currentVideo = items.find(v => v.id === id);
      if (currentVideo?.thumbnail && currentVideo.thumbnail.includes('supabase.co') && !updates.thumbnail) {
        console.log("[Video Edit] Migrating thumbnail to Cloudinary...", currentVideo.thumbnail);
        try {
          const newThumb = await uploadToCloudinary(currentVideo.thumbnail, accessToken!);
          updates.thumbnail = newThumb;
          console.log("[Video Edit] Migration success:", newThumb);
        } catch (e) {
          console.error("[Video Edit] Migration failed:", e);
        }
      }

      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(updates)
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Update failed');
      toast.success('Updated');
      setItems(items.map(v => v.id === id ? d.video : v));
    } catch { toast.error('Update failed'); }
  };

  const deleteVideo = async (id: string) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/videos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Delete failed');
      toast.success('Deleted');
      setItems(items.filter(v => v.id !== id));
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />
      <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
        <h1 className="text-3xl font-bold mb-6" style={{ color: '#1f2937' }}><span style={{ color: '#3b2f27' }}>Shop by</span> <span style={{ color: '#14b8a6' }}>Videos</span></h1>

        {/* Create */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1f2937' }}>Add Video</h2>
          <div className="mb-3">
            <a href="https://drive.google.com/drive/folders/1H6JXi-VX7-uIIX1rplfbO0ffyZuo3Aub?usp=sharing" target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">Open Google Drive Folder</a>
            <span className="ml-3 text-sm" style={{ color: '#374151' }}><br /> <br />Paste file link below if you upload to Drive.</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
            <div>
              <label className="text-sm font-medium" style={{ color: '#374151' }}>Upload Video</label>
              <input type="file" accept="video/*" onChange={(e) => { const f = e.target.files?.[0] || null; setVideoFile(f); setVideoPreview(f ? URL.createObjectURL(f) : ''); }} className="w-full" style={{ color: '#111827' }} />
              {videoPreview && <video src={videoPreview} controls className="mt-2 w-40 h-24 rounded" />}
              {uploading && (
                <div className="mt-2 flex items-center gap-2" style={{ color: '#374151' }}>
                  <div className="h-5 w-5 border-b-2 border-gray-800 rounded-full animate-spin" />
                  <span className="text-sm">Uploading video…</span>
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Max 10MB. For larger videos, upload to Google Drive and paste the link below.</p>
            </div>
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="Or paste Video URL (YouTube / Google Drive / MP4)" className="border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
            <input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} placeholder="Caption (optional)" className="border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
            <input type="number" value={form.order || 0} onChange={e => setForm({ ...form, order: Number(e.target.value) })} placeholder="Order" className="border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
            <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="Related Product ID (optional)" className="border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
            <div>
              <label className="text-sm font-medium" style={{ color: '#374151' }}>Thumbnail</label>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setThumbFile(f); setThumbPreview(f ? URL.createObjectURL(f) : ''); }} className="w-full" style={{ color: '#111827' }} />
              {thumbPreview && <img src={thumbPreview} alt="thumb" className="mt-2 w-24 h-16 object-cover rounded" />}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={createVideo} className="bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition disabled:opacity-50" disabled={uploading}>{uploading ? 'Uploading…' : 'Create'}</button>
            <button onClick={() => { setForm({ id: '', title: '', url: '', caption: '', thumbnail: '', order: 0 }); setVideoFile(null); setVideoPreview(''); setThumbFile(null); setThumbPreview(''); }} className="py-2 px-4 rounded-lg hover:bg-gray-300 transition" style={{ backgroundColor: '#e5e7eb', color: '#374151' }}>Clear</button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-12 w-12 border-b-2 border-gray-800 rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {items.map(v => (
              <div key={v.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  <div>
                    {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="w-32 h-20 object-cover rounded" /> : <div className="w-32 h-20 rounded bg-gray-200" />}
                    <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { const newThumb = await uploadToCloudinary(f, accessToken!); await updateVideo(v.id, { thumbnail: newThumb }); } catch (err: any) { toast.error(err.message || 'Upload failed'); } }} className="mt-2 text-sm" style={{ color: '#111827' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Title</label>
                    <input defaultValue={v.title} onBlur={(e) => updateVideo(v.id, { title: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Video URL</label>
                    <input defaultValue={v.url} onBlur={(e) => updateVideo(v.id, { url: normalizeUrl(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Product ID</label>
                    <input defaultValue={String((v as any).productId || '')} placeholder="Enter Product ID" onBlur={(e) => updateVideo(v.id, { productId: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Order</label>
                    <input type="number" defaultValue={v.order || 0} onBlur={(e) => updateVideo(v.id, { order: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2" style={{ backgroundColor: '#fff', color: '#111827' }} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-medium" style={{ color: '#6b7280' }}>Caption</label>
                  <textarea defaultValue={v.caption || ''} placeholder="Video caption..." onBlur={(e) => updateVideo(v.id, { caption: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={2} style={{ backgroundColor: '#fff', color: '#111827' }} />
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  <button onClick={() => deleteVideo(v.id)} className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
