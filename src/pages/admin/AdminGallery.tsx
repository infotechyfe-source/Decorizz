// src/pages/admin/AdminGallery.tsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { Plus, Trash2, Upload, Image as ImageIcon, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { optimizeImage } from "../../utils/optimizeImage";
import { uploadToCloudinary } from "../../utils/cloudinary";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminGallery() {
  const { accessToken } = useContext(AuthContext);

  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Events",
    year: new Date().getFullYear(),
    productId: "",
  });

  const categories = ["Events", "Studio", "Outdoor", "Portrait"];

  const optimizedGalleryItems = useMemo(() => (
    galleryItems.map((item) => ({ ...item, optImage: optimizeImage(item.thumbUrl || item.image, 400) }))
  ), [galleryItems]);

  // Load gallery
  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/gallery`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      const data = await response.json();
      setGalleryItems(data.galleryItems || []);
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid image file");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return toast.error("Please select an image");
    setUploading(true);

    try {
      // Upload to Cloudinary directly
      console.log("[Gallery] Starting Cloudinary upload...", { hasFile: !!selectedFile, hasToken: !!accessToken });
      const imageUrl = await uploadToCloudinary(selectedFile, accessToken!);
      console.log("[Gallery] Cloudinary upload success:", imageUrl);

      // Save metadata to backend (without base64, just the Cloudinary URL)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/gallery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...formData,
            image: imageUrl,
            thumbUrl: imageUrl,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Uploaded successfully");
      setShowAddModal(false);
      resetForm();
      fetchGallery();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Events",
      year: new Date().getFullYear(),
      productId: "",
    });
    setPreviewUrl("");
    setSelectedFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete photo?")) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/gallery/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success("Deleted");
      fetchGallery();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setShowEditModal(true);
    setFormData({
      title: item.title || "",
      description: item.description || "",
      category: item.category || "Events",
      year: item.year || new Date().getFullYear(),
      productId: item.productId || "",
    });
    setPreviewUrl(item.image || "");
    setSelectedFile(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl: string | undefined = undefined;

      if (selectedFile) {
        // Upload new image to Cloudinary
        console.log("[Gallery Edit] Starting Cloudinary upload for new file...", { hasFile: !!selectedFile, hasToken: !!accessToken });
        imageUrl = await uploadToCloudinary(selectedFile, accessToken!);
        console.log("[Gallery Edit] Cloudinary upload success:", imageUrl);
      } else if (editingItem?.image && editingItem.image.includes('supabase.co')) {
        // Auto-migrate existing Supabase image to Cloudinary
        console.log("[Gallery Edit] Migrating existing Supabase image to Cloudinary...", editingItem.image);
        try {
          imageUrl = await uploadToCloudinary(editingItem.image, accessToken!);
          console.log("[Gallery Edit] Migration success:", imageUrl);
        } catch (migrationError) {
          console.error("[Gallery Edit] Migration failed, keeping original:", migrationError);
          // Keep original image if migration fails
        }
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/gallery/${editingItem.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...formData,
            ...(imageUrl && { image: imageUrl, thumbUrl: imageUrl }),
          }),
        }
      );

      // Get response as text first to handle non-JSON responses
      const responseText = await response.text();
      console.log("[Gallery Edit] Response:", response.status, responseText);

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[Gallery Edit] JSON parse error:", responseText);
        throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) throw new Error(data.error || "Update failed");

      toast.success("Updated successfully");
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      fetchGallery();
    } catch (err: any) {
      console.error("[Gallery Edit] Error:", err);
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      title="Gallery Management"
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Photo
        </button>
      }
    >
      {/* Gallery */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 border-b-2 rounded-full animate-spin border-teal-600" />
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Photos Yet</h3>
          <p className="text-slate-500">Upload photos to display in your gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {optimizedGalleryItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                  src={item.optImage}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={item.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                  <span className="text-white text-xs font-semibold bg-teal-600 px-2 py-1 rounded">{item.year}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1" title={item.title}>
                    {item.title}
                  </h3>
                </div>

                <p className="text-slate-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
                  {item.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-4 border-t border-slate-100 pt-3">
                  <span className="bg-slate-100 px-2 py-1 rounded">{item.category}</span>
                  {item.productId && <span className="font-mono text-slate-400">ID: {item.productId.slice(0, 6)}...</span>}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="flex-1 py-2 px-3 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 py-2 px-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" data-lenis-prevent>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Add New Photo
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a photo to your gallery
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleUpload} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Photo <span className="text-red-500">*</span>
                  </label>

                  {previewUrl && (
                    <div className="mb-4 relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!previewUrl && (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                      <Upload className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="mb-1 text-sm text-slate-600 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">
                        PNG, JPG, WEBP (MAX. 10MB)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    placeholder="Photo title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    placeholder="Short description..."
                  />
                </div>

                {/* Product ID */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Related Product ID (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1733429041"
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    You can copy IDs from Admin → Products.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={2099}
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-6 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-lg bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold bg-white hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" data-lenis-prevent>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Photo
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Update gallery item details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleUpdate} className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Replace Photo (optional)
                  </label>

                  {previewUrl && (
                    <div className="mb-4 relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setSelectedFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!previewUrl && (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                      <Upload className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="mb-1 text-sm text-slate-600 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">
                        PNG, JPG, WEBP (MAX. 10MB)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  />
                </div>

                {/* Product ID */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Related Product ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.productId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        productId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={2000}
                      max={2099}
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          year: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-6 border-t border-slate-100 mt-6 sticky bottom-0 bg-white">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-lg bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Updating..." : "Update Photo"}
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 py-3 rounded-lg border border-slate-200 text-slate-700 font-semibold bg-white hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
