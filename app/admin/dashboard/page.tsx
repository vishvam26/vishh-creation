"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  fetchAllProducts,
  createProductItem,
  updateProductItem,
  deleteProductItem,
  setFeaturedProduct,
  Product,
} from "@/lib/products";
import {
  getArtistProfile,
  fetchArtistProfileAsync,
  saveArtistProfilePermanent,
  ArtistProfile,
} from "@/lib/artist";
import { validateAndCompressImage } from "@/lib/imageUtils";
import { extractInstagramInfo, InstagramInfo } from "@/lib/instagramUtils";
import { SITE_CONFIG } from "@/lib/config";

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
  const [artistProfile, setArtistProfileState] = useState<ArtistProfile>(getArtistProfile());
  const [artistPhotoPreview, setArtistPhotoPreview] = useState<string | null>(null);
  const [artistName, setArtistName] = useState(artistProfile.name);
  const [artistBio, setArtistBio] = useState(artistProfile.bio);

  // Instagram Link State
  const [instagramUrl, setInstagramUrl] = useState("");
  const [instaInfo, setInstaInfo] = useState<InstagramInfo | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

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
  };

  useEffect(() => {
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

  // Delete Item
  const handleDelete = async (id: string, itemTitle: string) => {
    if (confirm(`🗑️ Are you sure you want to delete "${itemTitle}" permanently from your store?`)) {
      const res = await deleteProductItem(id);
      if (res.success) {
        refreshProducts();
        setToastMsg({ type: "success", text: `Deleted "${itemTitle}" successfully!` });
      } else {
        setToastMsg({ type: "error", text: "Failed to delete item." });
      }
    }
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
            <span>VISHH CREATION Studio Manager</span>
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
                  Publish Creation
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

              {/* Set as Top Hero Banner Showcase Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                  <span className="text-xs font-bold text-amber-900">Set as 1 Top Hero Showcase Photo</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-amber-600 cursor-pointer"
                />
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
                    <option value="Crochet Flowers">Crochet Flowers</option>
                    <option value="Crochet Plushies">Crochet Plushies</option>
                    <option value="Custom Keychains">Custom Keychains</option>
                    <option value="Gift Hampers">Gift Hampers</option>
                    <option value="Instagram Reels">🎬 Instagram Reels</option>
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#182b3f] hover:bg-[#111f2e] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publishing to Website...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4" />
                    <span>Publish to Main Website</span>
                  </span>
                )}
              </button>
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
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all overflow-hidden ${
                      item.is_featured
                        ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/50 shadow-md"
                        : "bg-white border-[#D8E3EC] hover:border-[#567c8d] shadow-sm"
                    }`}
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
                        {item.is_featured && (
                          <span className="absolute top-1 left-1 p-0.5 rounded bg-amber-500 text-white text-[9px]" title="Top Hero Showcase">
                            ⭐
                          </span>
                        )}
                        {item.instagram_url && (
                          <span className="absolute bottom-1 right-1 p-0.5 rounded bg-rose-600 text-white text-[9px]" title="Instagram Link">
                            {extractInstagramInfo(item.instagram_url || "").type === "reel" ? "🎬" : "📸"}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-[#182b3f] text-sm sm:text-base truncate">{item.title}</h4>
                          {item.is_featured && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-extrabold flex items-center gap-0.5">
                              ⭐ HERO PHOTO
                            </span>
                          )}
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
                      {/* Set as Top Hero Showcase Button */}
                      <button
                        onClick={() => handleSetHeroShowcase(item.id, item.title)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 shadow-sm ${
                          item.is_featured
                            ? "bg-amber-500 text-white border-amber-600"
                            : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Set as 1 Top Hero Showcase photo"
                      >
                        <Star className={`w-3.5 h-3.5 ${item.is_featured ? "fill-white" : "fill-amber-400"}`} />
                        <span>{item.is_featured ? "Hero Active ⭐" : "Set Hero ⭐"}</span>
                      </button>

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
    </div>
  );
}
