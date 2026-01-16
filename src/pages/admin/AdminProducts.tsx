import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import { Plus, Edit, Trash2, X, Copy, Eye, RefreshCw } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast } from "sonner";
import AdminSidebar from "./AdminSidebar";
import { clearCategoryImagesCache } from "../../utils/useCategoryImages";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { optimizeImage } from "../../utils/optimizeImage";

export default function AdminProducts() {
    const { accessToken } = useContext(AuthContext);

    const [sidebarWidth, setSidebarWidth] = useState(256);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const onResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [viewingProduct, setViewingProduct] = useState<any>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationProgress, setMigrationProgress] = useState("");
    const [colorImageFiles, setColorImageFiles] = useState<Record<string, File | null>>({});
    const [colorImagePreviews, setColorImagePreviews] = useState<{ White?: string; Black?: string; Brown?: string }>({});

    const [extraImages, setExtraImages] = useState<File[]>([]);
    const [extraImagePreviews, setExtraImagePreviews] = useState<string[]>([]);

    // Ref to store scroll position
    const scrollPositionRef = useRef<number>(0);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [subsectionFilter, setSubsectionFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        categories: [] as string[],
        material: "Wood",
        image: "",
        colors: ["White", "Black", "Brown"],
        sizes: [
            "8X12", "12X18", "18X24", "20X30", "24X36", "30X40", "36X48", "48X66",
            "18X18", "24X24", "36X36", "20X20", "30X30"
        ],
        roomCategory: "",
        layout: "",
        subsection: "Basic",
        format: "Rolled",
        frameColor: "Black",
        imagesByColor: { White: "", Black: "", Brown: "" },
    });

    const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setExtraImages(files);

        const previews = files.map((file) => URL.createObjectURL(file));
        setExtraImagePreviews(previews);
    };

    // Fetch Products
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`,
                {
                    headers: {
                        Authorization: `Bearer ${publicAnonKey}`,
                    },
                }
            );

            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error("Fetch products error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories from products for filter dropdown
    const allCategories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach(p => {
            if (p.categories?.length) {
                p.categories.forEach((c: string) => cats.add(c));
            } else if (p.category) {
                cats.add(p.category);
            }
        });
        return Array.from(cats).sort();
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        const filtered = products.filter(product => {
            // Search filter
            const matchesSearch = !searchQuery ||
                product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.id?.toLowerCase().includes(searchQuery.toLowerCase());

            // Category filter
            const matchesCategory = !categoryFilter ||
                (product.categories?.includes(categoryFilter)) ||
                (product.category === categoryFilter);

            // Subsection filter
            const matchesSubsection = !subsectionFilter ||
                product.subsection === subsectionFilter;

            return matchesSearch && matchesCategory && matchesSubsection;
        });

        // Sort by ID (which contains timestamp) - newest first or oldest first
        return filtered.sort((a, b) => {
            const idA = a.id || '';
            const idB = b.id || '';
            if (sortOrder === 'newest') {
                return idB.localeCompare(idA); // Descending (newest first)
            } else {
                return idA.localeCompare(idB); // Ascending (oldest first)
            }
        });
    }, [products, searchQuery, categoryFilter, subsectionFilter, sortOrder]);

    const handleColorImageChange = (color: 'White' | 'Black' | 'Brown') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setColorImageFiles(prev => ({ ...prev, [color]: file }));
            const reader = new FileReader();
            reader.onloadend = () => setColorImagePreviews(prev => ({ ...prev, [color]: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const uploadColorImage = async (color: 'White' | 'Black' | 'Brown') => {
        const file = colorImageFiles[color];
        if (!file) return (formData.imagesByColor as any)[color];

        try {
            const url = await uploadToCloudinary(file, accessToken);
            return url;
        } catch (error) {
            console.error(`Upload failed for ${color}:`, error);
            toast.error(`Image upload failed for ${color}`);
            return (formData.imagesByColor as any)[color];
        }
    };


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadExtraImages = async () => {
        let uploadedUrls: string[] = [];

        for (const file of extraImages) {
            try {
                const url = await uploadToCloudinary(file, accessToken);
                if (url) {
                    uploadedUrls.push(url);
                }
            } catch (error) {
                console.error("Extra image upload failed:", error);
                toast.error("Failed uploading one or more extra images");
            }
        }

        return uploadedUrls;
    };


    const uploadImage = async () => {
        if (!imageFile) return formData.image;

        setUploading(true);
        try {
            const url = await uploadToCloudinary(imageFile, accessToken);
            setUploading(false);
            return url;
        } catch (error) {
            console.error("Main image upload failed:", error);
            toast.error('Image upload failed');
            setUploading(false);
            return formData.image;
        }
    };
    const openModal = (product?: any) => {
        // Save current scroll position before opening modal
        scrollPositionRef.current = window.scrollY;

        if (product) {
            setEditingProduct(product);
            // Handle both old single category and new categories array
            const existingCategories = product.categories
                ? product.categories
                : (product.category ? [product.category] : []);
            setFormData({
                name: product.name,
                description: product.description || "",
                price: product.price.toString(),
                categories: existingCategories,
                material: product.material,
                roomCategory: product.roomCategory || "",
                layout: product.layout || "",
                image: product.image,
                colors: product.colors || [],
                sizes: product.sizes || [],
                subsection: product.subsection || "Basic",
                format: product.format || "Rolled",
                frameColor: product.frameColor || "Black",
                imagesByColor: (product as any).imagesByColor || { White: "", Black: "", Brown: "" },
            });

            // Load existing extra images for preview when editing
            setExtraImages([]);
            setExtraImagePreviews(product.extraImages || []);
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                description: "",
                price: "",
                categories: [],
                material: "Wood",
                image: "",
                colors: ["White", "Black", "Brown"],
                sizes: [
                    "8X12", "12X18", "18X24", "20X30", "24X36", "30X40", "36X48", "48X66",
                    "18X18", "24X24", "36X36", "20X20", "30X30"
                ],
                roomCategory: "",
                layout: "",
                subsection: "Basic",
                format: "Rolled",
                frameColor: "Black",
                imagesByColor: { White: "", Black: "", Brown: "" },
            });
        }

        setShowModal(true);
    };

    const saveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        // Upload new extra images
        const newExtraImagesUrls = await uploadExtraImages();

        // Combine existing extra images (URLs that are still in previews) with new uploads
        // Filter previews to only include URLs (existing images from server, not blob URLs)
        let existingExtraImages = extraImagePreviews.filter(url => !url.startsWith('blob:'));

        // Migrate existing extra images if they are still on Supabase or unoptimized Cloudinary
        existingExtraImages = await Promise.all(existingExtraImages.map(async (url) => {
            if (url.includes('supabase.co') || (url.includes('res.cloudinary.com') && !url.includes('f_auto,q_auto'))) {
                try {
                    return await uploadToCloudinary(url, accessToken);
                } catch (e) {
                    console.error("Failed to migrate extra image", e);
                    return url;
                }
            }
            return url;
        }));

        const finalExtraImages = [...existingExtraImages, ...newExtraImagesUrls];

        let imageUrl = await uploadImage();
        // Migrate main image if it's still on Supabase or unoptimized Cloudinary
        if (!imageFile && imageUrl && (imageUrl.includes('supabase.co') || (imageUrl.includes('res.cloudinary.com') && !imageUrl.includes('f_auto,q_auto')))) {
            try {
                imageUrl = await uploadToCloudinary(imageUrl, accessToken);
            } catch (error) {
                console.error("Failed to migrate main image:", error);
            }
        }

        const byColor: any = { ...formData.imagesByColor };
        for (const c of ['White', 'Black', 'Brown'] as const) {
            let colorUrl = await uploadColorImage(c);

            // Migrate color image if it's still on Supabase or unoptimized Cloudinary
            if (!colorImageFiles[c] && colorUrl && (colorUrl.includes('supabase.co') || (colorUrl.includes('res.cloudinary.com') && !colorUrl.includes('f_auto,q_auto')))) {
                try {
                    colorUrl = await uploadToCloudinary(colorUrl, accessToken);
                } catch (error) {
                    console.error(`Failed to migrate ${c} image:`, error);
                }
            }

            byColor[c] = colorUrl;
        }

        const bodyData = {
            ...formData,
            price: parseFloat(formData.price),
            image: imageUrl,
            imagesByColor: byColor,
            extraImages: finalExtraImages,
        };

        try {
            const url = editingProduct
                ? `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${editingProduct.id}`
                : `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products`;

            const response = await fetch(url, {
                method: editingProduct ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(bodyData),
            });

            if (response.ok) {
                toast.success(editingProduct ? "Product updated" : "Product created");
                // Clear navbar category images cache to show new images
                clearCategoryImagesCache();

                // Reset form states
                setImageFile(null);
                setImagePreview('');
                setColorImageFiles({});
                setColorImagePreviews({});
                setExtraImages([]);
                setExtraImagePreviews([]);
                setEditingProduct(null);
                setUploading(false);

                // Close modal first
                setShowModal(false);

                // Set loading to show refresh
                setLoading(true);

                // Fetch updated products
                await fetchProducts();

                // Restore scroll position after page updates
                setTimeout(() => {
                    window.scrollTo(0, scrollPositionRef.current);
                }, 100);
            } else {
                setUploading(false);
                toast.error("Failed to save product");
            }
        } catch (error) {
            console.error("Save error:", error);
            setUploading(false);
            toast.error("Failed to save product");
        }
    };

    const deleteProduct = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        try {
            const response = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${productId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.ok) {
                toast.success("Product deleted");
                clearCategoryImagesCache();
                fetchProducts();
            } else {
                toast.error("Failed to delete product");
            }
        } catch (error) {
            console.error("Delete product error:", error);
            toast.error("Could not delete product");
        }
    };

    const handleBulkMigration = async () => {
        if (!confirm("This will scan ALL products and move/optimize images to Cloudinary. This may take a while. Continue?")) return;

        setIsMigrating(true);
        let updatedCount = 0;

        try {
            const total = products.length;

            for (let i = 0; i < total; i++) {
                const p = products[i];
                setMigrationProgress(`Processing ${i + 1}/${total}: ${p.name}`);

                let needsUpdate = false;

                // Helper to check and migrate a single URL
                const migrateIfNeeded = async (url: string) => {
                    if (!url) return url;
                    if (url.includes('supabase.co') || (url.includes('res.cloudinary.com') && !url.includes('f_auto,q_auto'))) {
                        try {
                            const newUrl = await uploadToCloudinary(url, accessToken);
                            if (newUrl !== url) {
                                needsUpdate = true;
                                return newUrl;
                            }
                        } catch (e) {
                            console.error(`Failed to migrate url: ${url}`, e);
                        }
                    }
                    return url;
                };

                // 1. Main Image
                const newImage = await migrateIfNeeded(p.image);

                // 2. Extra Images
                const newExtraImages = await Promise.all((p.extraImages || []).map(migrateIfNeeded));

                // 3. Color Images
                const newImagesByColor: any = { ...(p.imagesByColor || {}) };
                if (p.imagesByColor) {
                    for (const color of Object.keys(p.imagesByColor)) {
                        newImagesByColor[color] = await migrateIfNeeded(p.imagesByColor[color]);
                    }
                }

                if (needsUpdate) {
                    // Save to backend
                    const bodyData = {
                        ...p,
                        image: newImage,
                        extraImages: newExtraImages,
                        imagesByColor: newImagesByColor,
                    };

                    await fetch(
                        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/products/${p.id}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${accessToken}`,
                            },
                            body: JSON.stringify(bodyData),
                        }
                    );
                    updatedCount++;
                }
            }

            toast.success(`Migration Complete! Updated ${updatedCount} products.`);
            fetchProducts();

        } catch (error) {
            console.error("Bulk migration failed:", error);
            toast.error("Bulk migration failed");
        } finally {
            setIsMigrating(false);
            setMigrationProgress("");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Admin Sidebar */}
            <AdminSidebar onSidebarWidthChange={(w) => setSidebarWidth(w)} />

            {/* Main Content */}
            <div className="w-full pt-16 p-4 md:p-8" style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}>
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">
                        Manage Products
                    </h1>

                    <div className="flex gap-3">
                        {isMigrating && (
                            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                                <span className="animate-spin">↻</span>
                                <span className="text-sm font-medium">{migrationProgress}</span>
                            </div>
                        )}

                        <button
                            onClick={handleBulkMigration}
                            disabled={isMigrating}
                            className={`flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 ${isMigrating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <RefreshCw className="w-5 h-5" />
                            Migrate All Images
                        </button>

                        <button
                            onClick={() => openModal()}
                            disabled={isMigrating}
                            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
                        >
                            <Plus className="w-5 h-5" />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search Input */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="min-w-[180px]">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="">All Categories</option>
                                {allCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subsection Filter */}
                        <div className="min-w-[150px]">
                            <select
                                value={subsectionFilter}
                                onChange={(e) => setSubsectionFilter(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="">All Subsections</option>
                                <option value="Basic">Basic</option>
                                <option value="2-Set">2-Set</option>
                                <option value="3-Set">3-Set</option>
                                <option value="Square">Square</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div className="min-w-[150px]">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {(searchQuery || categoryFilter || subsectionFilter) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setCategoryFilter('');
                                    setSubsectionFilter('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Filter Results Count */}
                    <div className="mt-3 text-sm text-gray-600">
                        Showing {filteredProducts.length} of {products.length} products
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-12 w-12 border-b-2 border-gray-600 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-gray-900">ID</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Image</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Name</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Category</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Subsection</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Format</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Frame Color</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Price</th>
                                    <th className="px-6 py-3 text-left text-gray-900">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-6 py-4 text-xs text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate max-w-[180px] inline-block align-middle">{product.id}</span>
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(product.id); toast.success("Copied"); }}
                                                    className="p-1 rounded border hover:bg-gray-100"
                                                    title="Copy ID"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <img
                                                src={optimizeImage(product.image, 100)}
                                                alt={product.name}
                                                loading="lazy"
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        </td>

                                        <td className="px-6 py-4 text-gray-600">{product.name}</td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {product.categories && product.categories.length > 0
                                                ? (
                                                    <div className="flex flex-wrap text-gray-600 gap-1 max-w-[200px]">
                                                        {product.categories.slice(0, 2).map((cat: string) => (
                                                            <span key={cat} className="inline-block px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-xs">
                                                                {cat}
                                                            </span>
                                                        ))}
                                                        {product.categories.length > 2 && (
                                                            <span className="text-xs text-gray-500">+{product.categories.length - 2} more</span>
                                                        )}
                                                    </div>
                                                )
                                                : (product.category || '-')
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{product.subsection || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{product.format || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{product.frameColor || '-'}</td>
                                        <td className="px-6 py-4 text-gray-900">
                                            ₹{product.price.toFixed(2)}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setViewingProduct(product)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title="View Product"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={() => openModal(product)}
                                                    className="text-[#14b8a6] hover:text-teal-700"
                                                    title="Edit Product"
                                                >
                                                    <Edit className="w-5 h-5 bg-black" />
                                                </button>

                                                <button
                                                    onClick={() => deleteProduct(product.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" data-lenis-prevent>

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden">

                        {/* HEADER */}
                        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {editingProduct ? "Edit Product" : "Add New Product"}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {editingProduct ? "Update product details" : "Fill in the details to create a new product"}
                                </p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="hover:bg-white/50 p-2 rounded-full transition-all hover:rotate-90 duration-300"
                            >
                                <X className="w-6 h-6 text-gray-700" />
                            </button>
                        </div>

                        {/* BODY SCROLLER */}
                        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6" data-lenis-prevent>
                            {/** FORM CONTENT HERE **/}

                            {/* FORM (NO MAX-WRAPPER) */}
                            <form onSubmit={saveProduct} className="space-y-6">

                                {/* BASIC INFO SECTION */}
                                <div className="border-b pb-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
                                        Basic Information
                                    </h3>

                                    {/* NAME */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Product Name *</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    {/* DESCRIPTION */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows={3}
                                            className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                            value={formData.description}
                                            onChange={(e) =>
                                                setFormData({ ...formData, description: e.target.value })
                                            }
                                        />
                                    </div>

                                    {/* PRICE + CATEGORY RESPONSIVE GRID */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Price */}
                                        <div>
                                            <label className="block font-medium text-gray-700 mb-1">Price (₹)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                                value={formData.price}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, price: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* CATEGORIZATION SECTION */}
                                    <div className="border-b pb-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
                                            Categorization & Filters
                                        </h3>

                                        {/* Categories - Multi Select */}
                                        <div>
                                            <label className="block font-medium text-gray-700 mb-2">Categories (Select Multiple)</label>
                                            <p className="text-sm text-gray-500 mb-3">Select all categories that apply to this product</p>

                                            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4 space-y-4">
                                                {/* Spiritual Art Gallery */}
                                                <div>
                                                    <p className="font-semibold text-gray-900 mb-2 text-sm">Spiritual Art Gallery</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Vastu Yatra Painting', 'Ganesh Wall Art', 'Radha Krishna Art', 'Vishnu Art', 'Buddha Painting', 'Shiva Mahdev Art', 'Ma Durga Art', 'Jesus Art', 'Islamic Art'].map(cat => (
                                                            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.categories.includes(cat)}
                                                                    onChange={() => {
                                                                        const newCats = formData.categories.includes(cat)
                                                                            ? formData.categories.filter(c => c !== cat)
                                                                            : [...formData.categories, cat];
                                                                        setFormData({ ...formData, categories: newCats });
                                                                    }}
                                                                    className="accent-teal-600"
                                                                />
                                                                <span className="text-gray-700">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Décor Your Space */}
                                                <div className="border-t pt-3">
                                                    <p className="font-semibold text-gray-900 mb-2 text-sm">Décor Your Space</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Animals Art', 'Birds Art', 'Natural Art', 'Office Canvas Art', 'Boho Art', 'Wall Art', '3D Wall Art', '3 Set Art', '2 Set Art', 'Mandela Art'].map(cat => (
                                                            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.categories.includes(cat)}
                                                                    onChange={() => {
                                                                        const newCats = formData.categories.includes(cat)
                                                                            ? formData.categories.filter(c => c !== cat)
                                                                            : [...formData.categories, cat];
                                                                        setFormData({ ...formData, categories: newCats });
                                                                    }}
                                                                    className="accent-teal-600"
                                                                />
                                                                <span className="text-gray-700">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* New Art Gallery */}
                                                <div className="border-t pt-3">
                                                    <p className="font-semibold text-gray-900 mb-2 text-sm">New Art Gallery</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Gen Z Art', 'Living Room Art', 'Pop Art', 'Bed Room Art', 'Graffiti Art', 'Abstract Art', 'Bollywood Art', 'Couple Art', 'Restaurant and Bar'].map(cat => (
                                                            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.categories.includes(cat)}
                                                                    onChange={() => {
                                                                        const newCats = formData.categories.includes(cat)
                                                                            ? formData.categories.filter(c => c !== cat)
                                                                            : [...formData.categories, cat];
                                                                        setFormData({ ...formData, categories: newCats });
                                                                    }}
                                                                    className="accent-teal-600"
                                                                />
                                                                <span className="text-gray-700">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Neon Sign */}
                                                <div className="border-t pt-3">
                                                    <p className="font-semibold text-gray-900 mb-2 text-sm">Neon Sign</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Gods', 'Cafe', 'Gym', 'Car', 'Gaming', 'Wings', 'Kids', 'Christmas'].map(cat => (
                                                            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.categories.includes(cat)}
                                                                    onChange={() => {
                                                                        const newCats = formData.categories.includes(cat)
                                                                            ? formData.categories.filter(c => c !== cat)
                                                                            : [...formData.categories, cat];
                                                                        setFormData({ ...formData, categories: newCats });
                                                                    }}
                                                                    className="accent-teal-600"
                                                                />
                                                                <span className="text-gray-700">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Acrylic Art Gallery */}
                                                <div className="border-t pt-3">
                                                    <p className="font-semibold text-gray-900 mb-2 text-sm">Acrylic Art Gallery</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['Animal Acrylic Art', 'Spiritual Acrylic Art', 'Gen Z Acrylic Art'].map(cat => (
                                                            <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.categories.includes(cat)}
                                                                    onChange={() => {
                                                                        const newCats = formData.categories.includes(cat)
                                                                            ? formData.categories.filter(c => c !== cat)
                                                                            : [...formData.categories, cat];
                                                                        setFormData({ ...formData, categories: newCats });
                                                                    }}
                                                                    className="accent-teal-600"
                                                                />
                                                                <span className="text-gray-700">{cat}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Selected Categories Display */}
                                            {formData.categories.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-sm text-gray-600 mb-2">Selected: {formData.categories.length} categories</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.categories.map(cat => (
                                                            <span key={cat} className="inline-flex items-center gap-1 px-2 py-1  text-gray-900 rounded-full text-xs">
                                                                {cat}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, categories: formData.categories.filter(c => c !== cat) })}
                                                                    className="hover:text-red-600"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Subsection */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <label className="block font-medium text-gray-700 mb-1">Subsection</label>
                                                <select
                                                    className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                                    value={formData.subsection}
                                                    onChange={(e) => setFormData({ ...formData, subsection: e.target.value })}
                                                >
                                                    <option value="Basic">Basic</option>
                                                    <option value="2-Set">2-Set</option>
                                                    <option value="3-Set">3-Set</option>
                                                    <option value="Square">Square</option>
                                                </select>
                                            </div>

                                            {/* Format */}
                                            <div>
                                                <label className="block font-medium text-gray-700 mb-1">Format</label>
                                                <select
                                                    className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                                    value={formData.format}
                                                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                                                >
                                                    <option value="Rolled">Rolled</option>
                                                    <option value="Canvas">Canvas</option>
                                                    <option value="Frame">Frame</option>
                                                </select>
                                            </div>

                                            {/* Frame Color */}
                                            <div>
                                                <label className="block font-medium text-gray-700 mb-1">Frame Color</label>
                                                <select
                                                    className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                                    value={formData.frameColor}
                                                    onChange={(e) => setFormData({ ...formData, frameColor: e.target.value })}
                                                    disabled={formData.format !== 'Frame'}
                                                >
                                                    <option value="White">White</option>
                                                    <option value="Black">Black</option>
                                                    <option value="Brown">Brown</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* MATERIAL */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Material</label>
                                        <select
                                            className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                            value={formData.material}
                                            onChange={(e) =>
                                                setFormData({ ...formData, material: e.target.value })
                                            }
                                        >
                                            <option value="Wood">Wood</option>
                                            <option value="Metal">Metal</option>
                                            <option value="Plastic">Plastic</option>
                                            <option value="Glass">Glass</option>
                                        </select>
                                    </div>

                                    {/* ROOM CATEGORY */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Decor by Room (Optional)</label>
                                        <select
                                            className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                            value={formData.roomCategory}
                                            onChange={(e) =>
                                                setFormData({ ...formData, roomCategory: e.target.value })
                                            }
                                        >
                                            <option value="">-- Select Room --</option>
                                            <option value="Home Bar">Home Bar</option>
                                            <option value="Bath Space">Bath Space</option>
                                            <option value="Bedroom">Bedroom</option>
                                            <option value="Dining Area">Dining Area</option>
                                            <option value="Game Zone / Lounge Cave">Game Zone / Lounge Cave</option>
                                            <option value="Workshop / Garage Space">Workshop / Garage Space</option>
                                            <option value="Fitness Room">Fitness Room</option>
                                            <option value="Entryway / Corridor">Entryway / Corridor</option>
                                            <option value="Kids Space">Kids Space</option>
                                            <option value="Kitchen">Kitchen</option>
                                            <option value="Living Area">Living Area</option>
                                            <option value="Office / Study Zone">Office / Study Zone</option>
                                            <option value="Pooja Room">Pooja Room</option>
                                        </select>
                                    </div>

                                    {/* LAYOUT */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-1">Layout (Optional)</label>
                                        <select
                                            className="w-full text-gray-700 px-4 py-2 rounded-lg bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all form-input"
                                            value={formData.layout}
                                            onChange={(e) =>
                                                setFormData({ ...formData, layout: e.target.value })
                                            }
                                        >
                                            <option value="">-- Select Layout --</option>
                                            <option value="Portrait">Portrait</option>
                                            <option value="Square">Square</option>
                                            <option value="Circle">Circle</option>
                                            <option value="Landscape">Landscape</option>
                                        </select>
                                    </div>
                                </div>

                                {/* IMAGE SECTION */}
                                <div className="border-b pb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
                                        Product Image
                                    </h3>

                                    {/* IMAGE UPLOAD */}
                                    <div>
                                        <label className="block font-medium text-gray-700 mb-2">Product Image *</label>

                                        {/* Image Preview */}
                                        {(imagePreview || formData.image) && (
                                            <div className="mb-4 relative">
                                                <img
                                                    src={imagePreview || formData.image}
                                                    alt="Preview"
                                                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImagePreview('');
                                                        setImageFile(null);
                                                        setFormData({ ...formData, image: '' });
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>

                                                <div className="mt-3">
                                                    <label htmlFor="product-image-input" className="inline-block px-4 py-2 rounded-lg border-2 text-sm font-semibold cursor-pointer"
                                                        style={{ borderColor: '#d1d5db', color: '#374151' }}
                                                    >
                                                        Replace Image
                                                    </label>
                                                    <input
                                                        id="product-image-input"
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* File Input - shown only when no preview */}
                                        {!(imagePreview || formData.image) && (
                                            <div className="flex items-center justify-center w-full">
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-gray-500">PNG, JPG, WEBP (MAX. 5MB)</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* COLORS */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
                                        Available Colors
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">Select colors available for this product</p>
                                </div>

                                {/* COLOR-SPECIFIC IMAGES */}
                                <div className="border-t pt-6 mt-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
                                        Frame Images by Color (optional)
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">Upload different frame images for White, Black, Brown</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {(['White', 'Black', 'Brown'] as const).map(color => (
                                            <div key={color} className="border rounded-lg p-3">
                                                <p className="text-sm font-semibold text-gray-600 mb-2">{color}</p>
                                                {(colorImagePreviews[color] || (formData.imagesByColor as any)[color]) ? (
                                                    <div className="relative">
                                                        <img
                                                            src={colorImagePreviews[color] || (formData.imagesByColor as any)[color]}
                                                            alt={`${color} frame`}
                                                            className="w-full h-32 object-cover rounded"
                                                        />
                                                        <label className="mt-2 inline-block px-3 py-1 rounded border text-sm cursor-pointer" style={{ borderColor: '#d1d5db', color: '#374151' }}>
                                                            Replace
                                                            <input type="file" className="hidden" accept="image/*" onChange={handleColorImageChange(color)} />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                        <span className="text-xs text-gray-500">Upload {color} frame image</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleColorImageChange(color)} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {["White", "Black", "Brown"].map((color) => (
                                        <label
                                            key={color}
                                            className="flex items-center gap-2 border border-gray-300 
                           rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.colors.includes(color)}
                                                onChange={() => {
                                                    let updated = [...formData.colors];
                                                    updated = updated.includes(color)
                                                        ? updated.filter((c) => c !== color)
                                                        : [...updated, color];
                                                    setFormData({ ...formData, colors: updated });
                                                }}
                                            />
                                            <span className="text-gray-700">{color}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* MULTIPLE IMAGES SECTION */}
                                <div className="border-t pt-6 mt-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                                        Additional Product Images (Optional)
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Upload multiple images for gallery display
                                    </p>

                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        <span className="text-sm text-gray-600">Choose Multiple Images</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleExtraImagesChange}
                                        />
                                    </label>

                                    {/* Previews */}
                                    {extraImagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-3 mt-4">
                                            {extraImagePreviews.map((src, idx) => (
                                                <div key={idx} className="relative">
                                                    <img
                                                        src={src}
                                                        className="w-full h-24 object-cover rounded border"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
                                                        onClick={() => {
                                                            const updatedPreviews = [...extraImagePreviews];
                                                            const removedUrl = updatedPreviews[idx];
                                                            updatedPreviews.splice(idx, 1);
                                                            setExtraImagePreviews(updatedPreviews);

                                                            // Only remove from extraImages if it's a blob URL (newly uploaded file)
                                                            if (removedUrl.startsWith('blob:')) {
                                                                // Find the corresponding index in extraImages
                                                                const blobIndex = extraImagePreviews
                                                                    .slice(0, idx)
                                                                    .filter(url => url.startsWith('blob:')).length;
                                                                const updatedFiles = [...extraImages];
                                                                updatedFiles.splice(blobIndex, 1);
                                                                setExtraImages(updatedFiles);
                                                            }
                                                        }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>


                                {/* SIZES */}
                                <div className="border-t pt-6 mt-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-gradient-to-b from-blue-600 to-purple-600 rounded"></span>
                                        Available Sizes
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">Select sizes available for this product</p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {["8X12", "12X18", "18X24", "20X30", "24X36", "30X40", "36X48", "48X66", "18X18", "24X24", "36X36", "20X20", "30X30"].map((size) => (
                                        <label
                                            key={size}
                                            className="flex items-center gap-2 border border-gray-300 
                           rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.sizes.includes(size)}
                                                onChange={() => {
                                                    let updated = [...formData.sizes];
                                                    updated = updated.includes(size)
                                                        ? updated.filter((s) => s !== size)
                                                        : [...updated, size];
                                                    setFormData({ ...formData, sizes: updated });
                                                }}
                                            />
                                            <span className="text-gray-700">{size}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* BUTTONS */}
                                <div className="flex gap-4 pt-6 border-t mt-6">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="flex-1 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold
                         hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                {editingProduct ? "Update Product" : "Create Product"}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold
                         hover:bg-gray-50 hover:border-gray-400 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>

                            </form>
                        </div>

                    </div>
                </div>
            )}


            {/* View Product Modal */}
            {viewingProduct && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4" data-lenis-prevent onClick={() => setViewingProduct(null)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fadeIn overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-teal-50 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
                                <p className="text-sm text-gray-600 mt-1">Viewing: {viewingProduct.name}</p>
                            </div>
                            <button
                                onClick={() => setViewingProduct(null)}
                                className="p-2 rounded-full hover:bg-gray-200 transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left - Image */}
                                <div className="space-y-4">
                                    <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                                        {viewingProduct.image ? (
                                            <img
                                                src={viewingProduct.image}
                                                alt={viewingProduct.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    {/* Color Images */}
                                    {viewingProduct.colorImages && Object.keys(viewingProduct.colorImages).length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Frame Color Images:</p>
                                            <div className="flex gap-2">
                                                {Object.entries(viewingProduct.colorImages).map(([color, url]) => (
                                                    <div key={color} className="text-center">
                                                        <img
                                                            src={url as string}
                                                            alt={color}
                                                            className="w-16 h-16 rounded object-cover border"
                                                        />
                                                        <span className="text-xs text-gray-600">{color}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Extra Images */}
                                    {viewingProduct.extraImages && viewingProduct.extraImages.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-2">Extra Images:</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {viewingProduct.extraImages.map((url: string, idx: number) => (
                                                    <img
                                                        key={idx}
                                                        src={url}
                                                        alt={`Extra ${idx + 1}`}
                                                        className="w-16 h-16 rounded object-cover border"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right - Details */}
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Product Name</p>
                                        <p className="text-lg font-semibold text-gray-900">{viewingProduct.name}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Price</p>
                                        <p className="text-xl font-bold text-teal-600">₹{viewingProduct.price?.toFixed(2)}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Description</p>
                                        <p className="text-gray-700">{viewingProduct.description || '-'}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Categories</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {viewingProduct.categories?.length > 0 ? (
                                                viewingProduct.categories.map((cat: string) => (
                                                    <span key={cat} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">
                                                        {cat}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Subsection</p>
                                            <p className="text-gray-700">{viewingProduct.subsection || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Format</p>
                                            <p className="text-gray-700">{viewingProduct.format || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Layout</p>
                                            <p className="text-gray-700">{viewingProduct.layout || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Material</p>
                                            <p className="text-gray-700">{viewingProduct.material || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Frame Color</p>
                                            <p className="text-gray-700">{viewingProduct.frameColor || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Frame Colors</p>
                                            <p className="text-gray-700">{viewingProduct.frameColors?.join(', ') || '-'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Product ID</p>
                                        <p className="text-xs text-gray-500 font-mono break-all">{viewingProduct.id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-gray-50 flex gap-3">
                            <button
                                onClick={() => {
                                    setViewingProduct(null);
                                    openModal(viewingProduct);
                                }}
                                className="flex-1 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 transition"
                            >
                                Edit Product
                            </button>
                            <button
                                onClick={() => window.open(`/product/${viewingProduct.id}`, '_blank')}
                                className="flex-1 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                            >
                                View on Site
                            </button>
                            <button
                                onClick={() => setViewingProduct(null)}
                                className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Custom Scrollbar Styles */}
            <style>{`
        /* Webkit browsers (Chrome, Safari, Edge) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
          margin: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
          transition: all 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #7c3aed);
          border-color: #e2e8f0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, #1d4ed8, #6d28d9);
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #f1f5f9;
        }

        /* Smooth scroll behavior */
        .custom-scrollbar {
          scroll-behavior: smooth;
          overflow-y: auto;
        }

        /* Form input focus effects */
        .form-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        /* Checkbox animation */
        input[type="checkbox"]:checked {
          animation: checkBounce 0.3s ease;
        }

        @keyframes checkBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Modal animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

        </div>
    );
}
