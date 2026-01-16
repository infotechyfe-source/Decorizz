import React, { useEffect, useState, useContext, useMemo } from "react";
import { Plus, Trash2, Star, Edit } from "lucide-react";
import { AuthContext } from '../../context/AuthContext';
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast } from "sonner";
import { optimizeImage } from "../../utils/optimizeImage";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminTestimonials() {
  const { accessToken } = useContext(AuthContext);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    text: "",
    rating: 5,
    profileImage: "",
  });
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>(""
);

  const optimizedTestimonials = useMemo(() => (
    testimonials.map((t) => ({ ...t, optProfile: optimizeImage(t.profileImage || '', 100) }))
  ), [testimonials]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await res.json();
      setTestimonials(data.testimonials || []);
    } catch (err) {
      console.error("Fetch testimonials error:", err);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  const addTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let profileUrl = formData.profileImage;
      if (profileFile) {
        const base64 = await fileToDataURL(profileFile);
        const resUp = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/profile/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ image: base64, fileName: profileFile.name }),
        });
        const dataUp = await resUp.json();
        if (!resUp.ok) throw new Error(dataUp.error || 'Profile upload failed');
        profileUrl = dataUp.url;
      }

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ...formData, profileImage: profileUrl }),
        }
      );

      if (res.ok) {
        toast.success("Testimonial added");
        setShowForm(false);
        setFormData({ name: "", text: "", rating: 5, profileImage: "" });
        setProfileFile(null);
        setProfilePreview("");
        fetchTestimonials();
      } else {
        toast.error("Failed to add testimonial");
      }
    } catch (err) {
      console.error("Add testimonial error:", err);
      toast.error("Error adding testimonial");
    }
  };

  const fileToDataURL = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (res.ok) {
        toast.success("Testimonial deleted");
        fetchTestimonials();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting testimonial");
    }
  };

  const updateTestimonial = async (id: string, updates: any) => {
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(updates)
      });

      const d = await res.json();
      if (!res.ok) return toast.error(d.error || 'Update failed');
      fetchTestimonials();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <AdminLayout
      title="Manage Testimonials"
      actions={
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      }
    >
      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Add New Testimonial
          </h2>

          <form onSubmit={addTestimonial} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-slate-700 font-semibold mb-2">Rating</label>
                <select
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: Number(e.target.value) })
                  }
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                >
                  {[5, 4, 3, 2, 1].map((num) => (
                    <option key={num} value={num}>
                      {num} Stars
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Text */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Testimonial</label>
              <textarea
                required
                rows={4}
                value={formData.text}
                onChange={(e) =>
                  setFormData({ ...formData, text: e.target.value })
                }
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
              />
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-slate-700 font-semibold mb-2">Profile Image (optional)</label>
              <div className="flex items-center gap-4">
                {profilePreview && (
                  <img src={profilePreview} alt="preview" className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                )}
                <label className="px-4 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-slate-600 text-sm font-medium">
                  Choose File
                  <input type="file" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setProfileFile(f);
                    setProfilePreview(f ? URL.createObjectURL(f) : "");
                  }} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 font-semibold shadow-sm"
              >
                Save Testimonial
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-slate-200 text-slate-700 py-2.5 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Testimonials */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-b-2 border-teal-600 rounded-full animate-spin"></div>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Testimonials</h3>
          <p className="text-slate-500">Collect feedback from your happy customers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {optimizedTestimonials.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <img src={t.optProfile} alt={t.name} className="w-12 h-12 rounded-full object-cover bg-slate-100 ring-2 ring-white shadow-sm" />
                <div className="flex-1 min-w-0">
                  <input
                    defaultValue={t.name}
                    onBlur={(e) => updateTestimonial(t.id, { name: e.target.value })}
                    className="block w-full font-bold text-slate-900 border-none p-0 focus:ring-0 text-base mb-0.5 truncate bg-transparent hover:bg-slate-50 rounded px-1 -ml-1"
                  />
                  <div className="flex text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? "fill-current" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 text-slate-600 text-sm italic relative">
                <textarea
                  defaultValue={t.text}
                  onBlur={(e) => updateTestimonial(t.id, { text: e.target.value })}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm italic resize-none h-full min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Rating:</label>
                  <select
                    defaultValue={t.rating}
                    onChange={(e) => updateTestimonial(t.id, { rating: Number(e.target.value) })}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-teal-500"
                  >
                    {[5, 4, 3, 2, 1].map(n => (<option key={n} value={n}>{n} Stars</option>))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative overflow-hidden">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async (e) => {
                      const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = async () => {
                        const base64 = reader.result as string; const up = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/testimonials/profile/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ image: base64, fileName: f.name }) }); const ud = await up.json(); if (!up.ok) return toast.error(ud.error || 'Upload failed'); updateTestimonial(t.id, { profileImage: ud.url });
                      }; reader.readAsDataURL(f);
                    }} />
                    <button className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-lg transition" title="Update Image">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => deleteTestimonial(t.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
