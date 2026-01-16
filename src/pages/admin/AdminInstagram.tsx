import React, { useContext, useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { AuthContext } from "../../context/AuthContext";
import { projectId } from "../../utils/supabase/info";
import { Link } from "react-router-dom";
import { Instagram, Trash2, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminInstagram() {
  const { accessToken } = useContext(AuthContext);
  const [items, setItems] = useState<Array<{ id: string; url: string; embedUrl: string }>>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram`);
      const data = await res.json();
      setItems(data.items || []);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setSubmitting(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ url })
      });
      const d = await res.json();
      if (res.ok) {
        setUrl("");
        fetchItems();
        toast.success("Post added successfully");
      }
      else toast.error(d.error || 'Failed to add post');
    } catch { toast.error('Network error'); }
    setSubmitting(false);
  };

  const removeItem = async (id: string) => {
    if (!confirm('Remove this post?')) return;
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        fetchItems();
        toast.success("Post removed");
      } else toast.error('Failed to remove post');
    } catch { toast.error('Network error'); }
  };

  return (
    <AdminLayout title="Instagram Feed">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-teal-600" /> Add New Post
        </h2>
        <form onSubmit={addItem} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            <input
              type="url"
              placeholder="Paste Instagram post/reel URL (e.g. https://instagram.com/p/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-900 transition"
            />
            <p className="text-xs text-slate-500 mt-2">Support for Posts and Reels links.</p>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition shadow-sm disabled:opacity-50 whitespace-nowrap"
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Post'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-b-2 border-teal-600 rounded-full animate-spin"></div></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Instagram className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Instagram Posts</h3>
          <p className="text-slate-500">Add posts to display them on your website.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(it => (
            <div key={it.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-4 aspect-[4/5] relative">
                <iframe
                  src={it.embedUrl}
                  className="w-full h-full"
                  style={{ border: '0', overflow: 'hidden' }}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                ></iframe>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <a href={it.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> View on IG
                </a>
                <button onClick={() => removeItem(it.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove Post">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
