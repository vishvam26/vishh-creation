"use client";
// Official Vish♡Yi deployment trigger sync

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAllProducts,
  createProductItem,
  updateProductItem,
  deleteProductItem,
  setFeaturedProduct,
  saveHeroShowcaseToProductsTable,
  Product,
} from "@/lib/products";
import {
  getArtistProfile,
  fetchArtistProfileAsync,
  saveArtistProfilePermanent,
  saveHeroShowcaseCloud,
  ArtistProfile,
  HeroShowcaseConfig,
  DEFAULT_ARTIST_PROFILE,
} from "@/lib/artist";
import { validateAndCompressImage } from "@/lib/imageUtils";
import { extractInstagramInfo, InstagramInfo } from "@/lib/instagramUtils";
import { SITE_CONFIG } from "@/lib/config";
import {
  Sparkles,
  LogOut,
  UploadCloud,
  PlusCircle,
  Trash2,
  Star,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  RefreshCw,
  UserCheck,
  Edit,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const router = useRouter();

  // Mode: "photo" | "instagram"
  const [uploadMode, setUploadMode] = useState<"photo" | "instagram">("photo");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState<string>("Original Paintings");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Artist Profile State (Vishva's Photo & Bio)
  const [artistProfile, setArtistProfileState] = useState<ArtistProfile>(DEFAULT_ARTIST_PROFILE);
  const [artistPhotoPreview, setArtistPhotoPreview] = useState<string | null>(null);
  const [artistName, setArtistName] = useState(DEFAULT_ARTIST_PROFILE.name);
  const [artistBio, setArtistBio] = useState(DEFAULT_ARTIST_PROFILE.bio);

  // Dedicated Hero Showcase Banner Manager State
  const [heroTitleInput, setHeroTitleInput] = useState("");
  const [heroPriceInput, setHeroPriceInput] = useState("");
  const [heroCategoryInput, setHeroCategoryInput] = useState("Original Paintings");
  const [heroPhotoPreview, setHeroPhotoPreview] = useState("");
  const [heroInstaInput, setHeroInstaInput] = useState("");
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Instagram Link State
  const [instagramUrl, setInstagramUrl] = useState("");
  const [instaInfo, setInstaInfo] = useState<InstagramInfo | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Confirm Delete Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<string>("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleStartEdit = (item: Product) => {
    setEditingProductId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price);
    setCategory(item.category);
    setIsAvailable(item.is_available);
    setIsFeatured(item.is_featured || false);
    setImagePreview(item.image_url);
    setInstagramUrl(item.instagram_url || "");
    setUploadMode(item.instagram_url ? "instagram" : "photo");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setImagePreview(null);
    setInstagramUrl("");
    setInstaInfo(null);
    setIsAvailable(true);
    setIsFeatured(false);
  };

  // Load products & artist profile from Supabase
  const refreshProducts = async () => {
    setLoading(true);
    const res = await fetchAllProducts();
    setProducts(res.products);
    setIsCloud(res.isCloud);
    setLoading(false);
    const profile = await fetchArtistProfileAsync();
    setArtistProfileState(profile);
    setArtistName(profile.name);
    setArtistBio(profile.bio);
    setArtistPhotoPreview(profile.photoUrl);

    if (profile.heroShowcase) {
      setHeroTitleInput(profile.heroShowcase.title || "");
      setHeroPriceInput(profile.heroShowcase.price?.toString() || "");
      setHeroCategoryInput(profile.heroShowcase.category || "Original Paintings");
      setHeroPhotoPreview(profile.heroShowcase.imageUrl || "");
      setHeroInstaInput(profile.heroShowcase.instagramUrl || "");
    }
  };

  useEffect(() => {
    const profile = getArtistProfile();
    setArtistProfileState(profile);
    setArtistName(profile.name);
    setArtistBio(profile.bio);
    setArtistPhotoPreview(profile.photoUrl);
    if (profile.heroShowcase) {
      setHeroTitleInput(profile.heroShowcase.title || "");
      setHeroPriceInput(profile.heroShowcase.price?.toString() || "");
      setHeroCategoryInput(profile.heroShowcase.category || "Original Paintings");
      setHeroPhotoPreview(profile.heroShowcase.imageUrl || "");
      setHeroInstaInput(profile.heroShowcase.instagramUrl || "");
    }
    refreshProducts();
  }, []);

  // Update Instagram embed preview when URL changes
  useEffect(() => {
    if (instagramUrl) {
      const info = extractInstagramInfo(instagramUrl);
      if (info.shortcode) {
        setInstaInfo(info);
      } else {
        setInstaInfo(null);
      }
    } else {
      setInstaInfo(null);
    }
  }, [instagramUrl]);

  // Image or Video File Handler for Product
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
        setToastMsg({ type: "success", text: "🎬 Video clip attached! Will play natively inside website." });
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setToastMsg({ type: "info", text: "Compressing and validating photo..." });
      const result = await validateAndCompressImage(file);
      setImagePreview(result.dataUrl);
      setToastMsg({
        type: "success",
        text: `Photo optimized (${result.fileSizeMB}MB, ${result.width}x${result.height}px)`,
      });
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Failed to process image." });
      setImagePreview(null);
    }
  };

  // Artist Photo File Handler
  const handleArtistPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setToastMsg({ type: "info", text: "Processing artist photo..." });
      const result = await validateAndCompressImage(file);
      setArtistPhotoPreview(result.dataUrl);
      setToastMsg({ type: "success", text: "Artist profile photo ready to save!" });
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Failed to process artist photo." });
    }
  };

  // Save Artist Profile permanently to Supabase & Storage
  const handleSaveArtistProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg({ type: "info", text: "Uploading & saving artist profile to Supabase..." });
    const res = await saveArtistProfilePermanent({
      name: artistName,
      bio: artistBio,
      photoUrl: artistPhotoPreview || artistProfile.photoUrl,
    });
    setArtistProfileState(res.profile);
    setArtistPhotoPreview(res.profile.photoUrl);
    setToastMsg({
      type: "success",
      text: res.isCloud
        ? "🎉 Artist Profile (Vishva's Photo & Bio) saved permanently to Supabase cloud!"
        : "🎉 Artist Profile saved to local storage!",
    });
  };

  // Submit Form directly to Supabase
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || price === "") {
      setToastMsg({ type: "error", text: "Please fill in Title, Price, and Description." });
      return;
    }

    if (uploadMode === "photo" && !imagePreview) {
      setToastMsg({ type: "error", text: "Please upload the creation photo." });
      return;
    }

    if (uploadMode === "instagram" && !instagramUrl) {
      setToastMsg({ type: "error", text: "Please paste a valid Instagram Reel or Post link." });
      return;
    }

    setIsSubmitting(true);

    try {
      const instaInfo = instagramUrl ? extractInstagramInfo(instagramUrl) : null;
      const finalImage =
        imagePreview ||
        instaInfo?.proxyImageUrl ||
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop";

      if (editingProductId) {
        const res = await updateProductItem(editingProductId, {
          title,
          description,
          price: Number(price),
          category: category,
          image_url: finalImage,
          instagram_url: instagramUrl ? instagramUrl : undefined,
          is_available: isAvailable,
          is_featured: isFeatured,
        });

        if (res.success) {
          setToastMsg({
            type: "success",
            text: `🎉 "${title}" updated successfully!`,
          });
          handleCancelEdit();
          refreshProducts();
        } else {
          setToastMsg({ type: "error", text: res.message || "Failed to update item." });
        }
      } else {
        const res = await createProductItem({
          title,
          description,
          price: Number(price),
          category: category,
          image_url: finalImage,
          instagram_url: instagramUrl ? instagramUrl : undefined,
          is_available: isAvailable,
          is_featured: isFeatured,
        });

        if (res.success) {
          setToastMsg({
            type: "success",
            text: `🎉 "${res.product.title}" published successfully to main website!`,
          });

          // Reset form
          setTitle("");
          setDescription("");
          setPrice("");
          setImagePreview(null);
          setInstagramUrl("");
          setInstaInfo(null);
          setIsAvailable(true);
          setIsFeatured(false);
          refreshProducts();
        } else {
          setToastMsg({ type: "error", text: res.message || "Failed to publish item." });
        }
      }
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Upload error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set Item as Top Hero Banner Showcase
  const handleSetHeroShowcase = async (id: string, itemTitle: string) => {
    await setFeaturedProduct(id);
    refreshProducts();
    setToastMsg({
      type: "success",
      text: `⭐ "${itemTitle}" set as 1 Top Hero Showcase photo!`,
    });
  };

  // Toggle Availability
  const handleToggleAvailable = async (id: string, currentStatus: boolean) => {
    await updateProductItem(id, { is_available: !currentStatus });
    refreshProducts();
    setToastMsg({ type: "info", text: "Product availability status updated." });
  };

  // Delete — open confirm modal
  const handleDelete = (id: string, itemTitle: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteTitle(itemTitle);
  };

  // Perform actual delete after confirm
  const performDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    const title = confirmDeleteTitle;
    setConfirmDeleteId(null);
    setConfirmDeleteTitle("");
    const res = await deleteProductItem(id);
    if (res.success) {
      refreshProducts();
      setToastMsg({ type: "success", text: `🗑️ "${title}" deleted successfully!` });
    } else {
      setToastMsg({ type: "error", text: "Failed to delete item." });
    }
  };

  const handleHeroPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await validateAndCompressImage(file);
      setHeroPhotoPreview(result.dataUrl);
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Invalid image file" });
    }
  };

  const handleSaveHeroShowcase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroTitleInput.trim()) {
      setToastMsg({ type: "error", text: "Please enter a title for the Hero Showcase Artwork" });
      return;
    }
    setIsSavingHero(true);
    let finalImage = heroPhotoPreview;
    if (heroInstaInput.trim() && !finalImage) {
      const info = extractInstagramInfo(heroInstaInput);
      if (info?.proxyImageUrl) {
        finalImage = info.proxyImageUrl;
      }
    }

    const showcaseConfig: HeroShowcaseConfig = {
      title: heroTitleInput.trim(),
      category: "Original Paintings",
      price: Number(heroPriceInput) || 0,
      imageUrl: finalImage,
      instagramUrl: heroInstaInput.trim(),
    };

    await saveHeroShowcaseToProductsTable({
      title: heroTitleInput.trim(),
      price: Number(heroPriceInput) || 0,
      imageUrl: finalImage,
      instagramUrl: heroInstaInput.trim(),
    });

    await saveHeroShowcaseCloud(showcaseConfig);
    setArtistProfileState((prev) => ({ ...prev, heroShowcase: showcaseConfig }));
    await refreshProducts();
    setIsSavingHero(false);
    setToastMsg({ type: "success", text: "✨ Top Hero Showcase Banner saved directly to Supabase DB for all visitors!" });
  };

  // Logout
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-4">
      {/* Admin Dashboard Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#D8E3EC]">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2f4156] text-white text-xs font-bold uppercase tracking-wider mb-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Vish♡Yi Studio Manager</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-bold text-[#182b3f]">
            Art &amp; Crochet Admin Dashboard
          </h1>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Logout</span>
        </button>
      </div>

      {/* Cloud Status Bar */}
      <div
        className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between shadow-sm ${
          isCloud
            ? "bg-emerald-50 text-emerald-900 border-emerald-300"
            : "bg-amber-50 text-amber-900 border-amber-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isCloud ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <span className="font-semibold">
            {isCloud
              ? "🟢 Connected to Supabase Cloud Database — Uploads & Deletions sync live to main website."
              : "⚠️ Local Test Mode — Check your Supabase API Key in .env.local"}
          </span>
        </div>
      </div>

      {/* Toast Notification Message */}
      {toastMsg && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-md ${
            toastMsg.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
              : toastMsg.type === "error"
              ? "bg-rose-50 text-rose-900 border border-rose-300"
              : "bg-blue-50 text-blue-900 border border-blue-300"
          }`}
        >
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Upload & Artist Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload Form Box & Artist Profile Manager Box */}
        <div className="lg:col-span-6 space-y-8">
          {/* Upload Form Box */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8E3EC] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#D8E3EC] pb-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#182b3f]" />
                <h2 className="font-heading text-xl font-bold text-[#182b3f]">
                  {editingProductId ? "Edit Creation" : "Publish Creation"}
                </h2>
              </div>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#f3ede9] rounded-2xl border border-[#D8E3EC]">
              <button
                type="button"
                onClick={() => setUploadMode("photo")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  uploadMode === "photo"
                    ? "bg-[#182b3f] text-white shadow-sm"
                    : "text-[#50606c] hover:text-[#182b3f]"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Custom Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode("instagram")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  uploadMode === "instagram"
                    ? "bg-[#182b3f] text-white shadow-sm"
                    : "text-[#50606c] hover:text-[#182b3f]"
                }`}
              >
                <Video className="w-4 h-4 text-rose-400" />
                <span>Insta Post / Reel</span>
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4 text-left">
              {/* Instagram Link Field (Supports both /p/ and /reel/) */}
              {uploadMode === "instagram" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-[#D8E3EC] space-y-3">
                  <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider">
                    Instagram Post / Reel URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.instagram.com/p/DaHkjT4DDVf/ or /reel/..."
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    required={uploadMode === "instagram"}
                    className="w-full bg-white border border-[#D8E3EC] rounded-2xl p-3 text-xs text-[#182b3f] outline-none focus:ring-2 focus:ring-[#182b3f]/20 font-medium"
                  />

                  {/* Live Instagram Embed Preview */}
                  {instaInfo && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-emerald-700 block">
                        ✓ Valid Instagram {instaInfo.type === "reel" ? "Reel 🎬" : "Post 📸"} detected:
                      </span>
                      <div className="aspect-[4/5] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-300">
                        <iframe src={instaInfo.embedUrl} className="w-full h-full border-none" title="Insta Preview" />
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-[#50606c]">
                    Paste any Instagram Post or Reel link to display your original post live on your website!
                  </p>
                </div>
              )}

              {/* Image File Input */}
              <div>
                <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-2">
                  {uploadMode === "instagram" ? "Item Photo (Optional for Instagram links)" : "Item Photo (Required)"}
                </label>

                {imagePreview ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-[#D8E3EC] shadow-sm">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#D8E3EC] rounded-2xl bg-[#f8f2ee]/60 hover:bg-[#d1e2ef]/40 transition-all cursor-pointer text-center space-y-2">
                    <UploadCloud className="w-8 h-8 text-[#567c8d]" />
                    <span className="text-xs font-bold text-[#182b3f]">
                      Tap to upload photo from your device
                    </span>
                    <span className="text-xs text-[#50606c]">JPG, PNG, WebP up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>



              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-1.5">
                  Title / Name of Art Piece
                </label>
                <input
                  type="text"
                  placeholder="e.g. Radhe Krishna Acrylic Canvas / Sunflower Bouquet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-[#D8E3EC] rounded-2xl p-3 text-sm text-[#182b3f] outline-none focus:bg-white focus:border-[#182b3f] focus:ring-2 focus:ring-[#182b3f]/20 transition-all font-medium"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-[#D8E3EC] rounded-2xl p-3 text-sm text-[#182b3f] outline-none focus:bg-white focus:border-[#182b3f] focus:ring-2 focus:ring-[#182b3f]/20 transition-all font-medium"
                  >
                    <option value="Original Paintings">Original Paintings</option>
                    <option value="Crochet">Crochet</option>
                    <option value="Custom Keychains">Custom Keychains</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-1.5">
                    Price ({SITE_CONFIG.currencySymbol})
                  </label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    min="0"
                    className="w-full bg-slate-50 border border-[#D8E3EC] rounded-2xl p-3 text-sm text-[#182b3f] outline-none focus:bg-white focus:border-[#182b3f] focus:ring-2 focus:ring-[#182b3f]/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-1.5">
                  Description &amp; Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe canvas size, acrylic details, yarn quality..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-[#D8E3EC] rounded-2xl p-3 text-sm text-[#182b3f] outline-none focus:bg-white focus:border-[#182b3f] focus:ring-2 focus:ring-[#182b3f]/20 transition-all font-medium resize-none"
                />
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-[#f3ede9] rounded-2xl border border-[#D8E3EC]">
                <span className="text-xs font-bold text-[#182b3f]">Available for Purchase</span>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isAvailable
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {isAvailable ? "In Stock" : "Marked Sold"}
                </button>
              </div>

              <div className="flex gap-3">
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-[#f3ede9] hover:bg-[#e8e0d5] text-[#182b3f] font-bold text-sm transition-colors border border-[#D8E3EC]"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-[#182b3f] hover:bg-[#111f2e] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{editingProductId ? "Saving Changes..." : "Publishing to Website..."}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" />
                      <span>{editingProductId ? "Save Changes" : "Publish to Main Website"}</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 👩‍🎨 Update Artist Profile & Photo (Vishva) Box */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8E3EC] shadow-sm space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-[#D8E3EC] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#567c8d]" />
                <h2 className="font-heading text-lg font-bold text-[#182b3f]">
                  Update Artist Profile &amp; Photo (Vishva)
                </h2>
              </div>
            </div>

            <form onSubmit={handleSaveArtistProfile} className="space-y-4">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-2">
                  Artist Profile Photo
                </label>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-900 border-2 border-[#D8E3EC] flex-shrink-0 relative shadow-sm">
                    <img
                      src={artistPhotoPreview || artistProfile.photoUrl}
                      alt="Artist Vishva"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <label className="flex-1 cursor-pointer">
                    <span className="bg-[#f3ede9] hover:bg-[#d1e2ef] text-[#182b3f] border border-[#D8E3EC] text-xs font-bold py-2.5 px-4 rounded-full inline-flex items-center gap-1.5 shadow-sm transition-colors">
                      <UploadCloud className="w-4 h-4 text-[#567c8d]" />
                      <span>Upload Vishva Photo</span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleArtistPhotoChange}
                      className="hidden"
                    />
                    <span className="block text-[11px] text-[#50606c] mt-1.5">
                      PNG, JPG, WebP photo of Vishva in studio
                    </span>
                  </label>
                </div>
              </div>

              {/* Artist Name */}
              <div>
                <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-1.5">
                  Artist Display Name
                </label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Vishva"
                  className="w-full bg-slate-50 border border-[#D8E3EC] rounded-2xl p-3 text-sm text-[#182b3f] outline-none focus:bg-white focus:border-[#182b3f] focus:ring-2 focus:ring-[#182b3f]/20 transition-all font-medium"
                />
              </div>

              {/* Artist Bio */}
              <div>
                <label className="block text-xs font-bold text-[#182b3f] uppercase tracking-wider mb-1.5">
                  Artist Bio / Story Text
                </label>
                <textarea
                  rows={4}
                  value={artistBio}
                  onChange={(e) => setArtistBio(e.target.value)}
                  className="w-full bg-slate-50 border border-[#D8E3EC] rounded-2xl p-3 text-sm text-[#182b3f] outline-none focus:bg-white focus:border-[#182b3f] focus:ring-2 focus:ring-[#182b3f]/20 transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-[#567c8d] hover:bg-[#466978] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <span>Save Artist Profile &amp; Photo</span>
              </button>
            </form>
          </div>
        </div>

        {/* Uploaded Items List with Star Hero Showcase Selection */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8E3EC] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#D8E3EC] pb-4">
              <h2 className="font-heading text-xl font-bold text-[#182b3f]">
                Uploaded Creations ({products.length})
              </h2>
              <button
                onClick={refreshProducts}
                className="p-2 rounded-full bg-white border border-[#D8E3EC] hover:bg-slate-50 transition-colors shadow-sm"
                title="Refresh Products"
              >
                <RefreshCw className="w-4 h-4 text-[#567c8d]" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading items...</div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No products uploaded yet.</div>
            ) : (
              <div className="space-y-3.5">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-[#D8E3EC] hover:border-[#567c8d] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all overflow-hidden bg-white"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                      {/* Fixed 64x64 Thumbnail Box */}
                      <div
                        style={{ width: "64px", height: "64px", flexShrink: 0, overflow: "hidden", borderRadius: "14px" }}
                        className="bg-slate-200 border border-[#D8E3EC] relative shadow-inner"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title}
                          style={{ width: "64px", height: "64px", objectFit: "cover", display: "block" }}
                        />

                        {item.instagram_url && (
                          <span className="absolute bottom-1 right-1 p-0.5 rounded bg-rose-600 text-white text-[9px]" title="Instagram Link">
                            {extractInstagramInfo(item.instagram_url || "").type === "reel" ? "🎬" : "📸"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-[#182b3f] text-sm sm:text-base truncate">{item.title}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#50606c] mt-1">
                          <span className="font-extrabold text-[#182b3f]">
                            {SITE_CONFIG.currencySymbol}{item.price.toLocaleString("en-IN")}
                          </span>
                          <span>•</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#f3ede9] text-[#182b3f] text-[10px] font-bold border border-[#D8E3EC]">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">

                      <button
                        onClick={() => handleToggleAvailable(item.id, item.is_available)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm ${
                          item.is_available
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200"
                        }`}
                      >
                        {item.is_available ? "In Stock" : "Sold"}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleStartEdit(item)}
                        className={`bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm ${
                          editingProductId === item.id ? "ring-2 ring-indigo-500 bg-indigo-100" : ""
                        }`}
                        title="Edit creation details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>EDIT</span>
                      </button>

                      {/* Prominent Red Delete Button */}
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                        title="Delete item permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>DELETE</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 🗑️ Confirm Delete Modal */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
          onClick={() => { setConfirmDeleteId(null); setConfirmDeleteTitle(""); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-[#D8E3EC] max-w-sm w-full p-7 flex flex-col items-center gap-5 text-center animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red icon */}
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-rose-600" />
            </div>

            {/* Text */}
            <div>
              <h3 className="font-heading text-xl font-bold text-[#182b3f] mb-2">Delete Permanently?</h3>
              <p className="text-[#50606c] text-sm leading-relaxed">
                Are you sure you want to delete<br />
                <span className="font-extrabold text-[#182b3f]">"{confirmDeleteTitle}"</span><br />
                from your store? This cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setConfirmDeleteId(null); setConfirmDeleteTitle(""); }}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#f3ede9] hover:bg-[#e8e0d5] text-[#182b3f] font-bold text-sm transition-colors border border-[#D8E3EC]"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                className="flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-colors shadow-md flex items-center justify-center gap-2 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
