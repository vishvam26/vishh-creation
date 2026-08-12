"use client";

import { useState, useEffect } from "react";
import { fetchAllProducts, getFeaturedHeroProductId, Product } from "@/lib/products";
import { extractInstagramInfo } from "@/lib/instagramUtils";
import { getArtistProfile, fetchArtistProfileAsync, ArtistProfile } from "@/lib/artist";
import { SITE_CONFIG } from "@/lib/config";
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Collections");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [heroFeaturedId, setHeroFeaturedId] = useState<string | null>(null);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile>(getArtistProfile());

  const defaultWallPhoto = "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600&auto=format&fit=crop";
  const [showRoomVisualizer, setShowRoomVisualizer] = useState(false);
  const [visualizerArtUrl, setVisualizerArtUrl] = useState<string>(
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"
  );
  const [wallBgUrl, setWallBgUrl] = useState<string>(defaultWallPhoto);
  const [artScalePercent, setArtScalePercent] = useState<number>(12);

  // Fullscreen Original HD Photo Lightbox Modal States
  const [fullscreenPhotoUrl, setFullscreenPhotoUrl] = useState<string | null>(null);
  const [fullscreenPhotoTitle, setFullscreenPhotoTitle] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const openFullscreenPhoto = (url: string, title?: string) => {
    setFullscreenPhotoUrl(url);
    setFullscreenPhotoTitle(title || "Handcrafted Masterpiece");
    setZoomLevel(1);
  };
  const [frameStyle, setFrameStyle] = useState<"dark-wood" | "gold-luxury" | "modern-white" | "frameless">("dark-wood");

  const [artPos, setArtPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - artPos.x, y: clientY - artPos.y });
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setArtPos({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleEndDrag = () => {
    setIsDragging(false);
  };

  const handleCustomWallUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setWallBgUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadData = async () => {
    setLoading(true);
    const res = await fetchAllProducts();
    setProducts(res.products);
    const profile = await fetchArtistProfileAsync();
    setArtistProfile(profile);
    setHeroFeaturedId(getFeaturedHeroProductId());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedCategory === "All Collections" || selectedCategory === "All") return true;
    if (selectedCategory === "Instagram Reels") return item.category === "Instagram Reels" || Boolean(item.instagram_url);
    return item.category === selectedCategory;
  });

  const cloudShowcase = artistProfile?.heroShowcase;

  const featuredHeroItem =
    products.find((p) => cloudShowcase?.title && p.title.toLowerCase() === cloudShowcase.title.toLowerCase()) ||
    products.find((p) => p.is_featured) ||
    products.find((p) => p.id === artistProfile?.featuredProductId) ||
    products.find((p) => p.id === heroFeaturedId) ||
    products[0] ||
    null;

  const heroTitle = featuredHeroItem?.title || cloudShowcase?.title || "radhe shyamm!!";
  const heroPrice = featuredHeroItem?.price || cloudShowcase?.price || 499986;
  const heroIgUrl = featuredHeroItem?.instagram_url || cloudShowcase?.instagramUrl;

  const heroIgInfo = heroIgUrl ? extractInstagramInfo(heroIgUrl) : null;
  const heroPhoto =
    featuredHeroItem?.image_url ||
    (heroIgInfo as any)?.proxyImageUrl ||
    cloudShowcase?.imageUrl ||
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop";

  const openVisualizer = (imageUrl?: string) => {
    if (imageUrl) setVisualizerArtUrl(imageUrl);
    setShowRoomVisualizer(true);
  };

  const categoriesList = [
    "All Collections",
    "Original Paintings",
    "Crochet Flowers",
    "Crochet Plushies",
    "Custom Keychains",
    "Gift Hampers",
    "Instagram Reels",
  ];

  const handlePrevCarousel = () => {
    if (products.length === 0) return;
    setCarouselIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
  };

  const handleNextCarousel = () => {
    if (products.length === 0) return;
    setCarouselIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-10">
      <section className="sticky top-[75px] z-40 bg-[#f8f2ee]/95 backdrop-blur-md p-2.5 rounded-2xl border border-[#D8E3EC] shadow-sm">
        <div className="flex items-center justify-start gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? "bg-[#182b3f] !text-white border-[#182b3f] shadow-md"
                  : "bg-white text-[#182b3f] hover:bg-[#d1e2ef] border-[#D8E3EC]"
              }`}
            >
              {cat === "Instagram Reels" ? "🎬 Instagram Reels" : cat}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              openVisualizer(
                heroPhoto || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"
              )
            }
            className="text-xs font-bold px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 !text-white transition-colors border border-emerald-800 whitespace-nowrap flex items-center gap-1.5 shadow-sm"
          >
            <span className="!text-white font-bold">🖼️ Room Wall Visualizer</span>
          </button>
        </div>
      </section>

      <section className="bg-white/60 rounded-3xl p-6 sm:p-10 border border-[#D8E3EC]/80 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="w-full lg:w-[55%] flex flex-col justify-center items-start text-left space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#D8E3EC] text-[#50606c] text-xs font-semibold uppercase tracking-wider shadow-sm">
              <span className="text-amber-500">✨</span>
              <span>Handmade Artwork &amp; Crochet Creations by Vishva</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl font-bold text-[#182b3f] leading-[1.15] tracking-tight">
              Handcrafted Treasures <br />
              <span className="italic font-serif font-normal text-[#2f4156]">By Vish Creation</span>
            </h1>

            <p className="text-[#50606c] text-sm sm:text-base max-w-xl leading-relaxed">
              Discover bespoke canvas paintings, everlasting crochet flower bouquets, soft amigurumi plushies, personalized resin keychains, and luxury gift hampers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#gallery"
                className="bg-[#182b3f] hover:bg-[#111f2e] !text-white text-xs font-extrabold px-6 py-3.5 rounded-full transition-all shadow-md flex items-center gap-2"
                style={{ textDecoration: "none" }}
              >
                <span className="!text-white font-bold">Explore Shop Collection</span>
                <span className="!text-white font-bold">↓</span>
              </a>

              <a
                href={SITE_CONFIG.artDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2f4156] hover:bg-[#1f2d3d] !text-white text-xs font-bold px-5 py-3.5 rounded-full transition-colors shadow-sm"
                style={{ textDecoration: "none" }}
              >
                <span className="!text-white font-bold">🎨 DM Art (@{SITE_CONFIG.artInstagram})</span>
              </a>

              <a
                href={SITE_CONFIG.crochetDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#567c8d] hover:bg-[#456574] !text-white text-xs font-bold px-5 py-3.5 rounded-full transition-colors shadow-sm"
                style={{ textDecoration: "none" }}
              >
                <span className="!text-white font-bold">🧶 DM Crochet (@{SITE_CONFIG.crochetInstagram})</span>
              </a>
            </div>
          </div>

          <div className="w-full lg:w-[410px] max-w-[410px] relative mx-auto lg:mx-0 flex-shrink-0 animate-float">
            <div className="bg-white rounded-3xl p-3 border-2 border-[#D8E3EC] shadow-xl relative overflow-hidden group animate-pulse-glow">
              {/* Main Canvas Image Frame - Dynamic Natural Aspect Ratio Auto-Fitting */}
              <div
                className="relative w-full min-h-[200px] max-h-[360px] flex items-center justify-center bg-[#F5EFEB] rounded-2xl overflow-hidden cursor-pointer p-1"
                onClick={() => openVisualizer(heroPhoto || undefined)}
              >
                <img
                  src={heroPhoto || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"}
                  alt="Featured Hero Artwork"
                  className="w-full h-auto max-h-[350px] object-contain rounded-xl group-hover:scale-105 transition-transform duration-700 shadow-sm"
                />

                {/* Floating Bottom Card Badge */}
                <div className="absolute bottom-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-[#D8E3EC] flex items-center gap-2 active:scale-95 transition-transform">
                  <img
                    src={heroPhoto}
                    alt={heroTitle}
                    className="w-8 h-8 rounded-xl object-cover border border-[#D8E3EC]"
                  />
                  <div>
                    <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-[#567c8d] block flex items-center gap-0.5">
                      TAP FOR 3D WALL VIEW 🔍
                    </span>
                    <p className="font-extrabold text-[11px] text-[#182b3f] truncate max-w-[120px]">
                      {heroTitle}
                    </p>
                    <p className="text-[9.5px] text-[#50606c] font-bold">
                      ₹{heroPrice.toLocaleString("en-IN")} ★ 5.0
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#f8f2ee] to-[#f3ede9] py-12 px-4 sm:px-8 rounded-3xl border border-[#D8E3EC] shadow-sm text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-2 mb-8">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#567c8d] flex items-center justify-center gap-1">
            <span>✨</span> INTERACTIVE 3D ART GALLERY
          </span>
          <h2 className="font-heading text-3xl sm:text-5xl font-bold text-[#182b3f]">
            Explore Masterpiece Gallery
          </h2>
          <p className="text-[#50606c] text-xs sm:text-sm">
            Swipe left or right to experience the 3D curved gallery. Tap any slide to open HD zoom &amp; ordering!
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto min-h-[360px] sm:min-h-[420px] flex items-center justify-center py-4">
          <button
            onClick={handlePrevCarousel}
            className="absolute left-2 sm:left-4 z-30 w-10 h-10 rounded-full bg-white text-[#182b3f] shadow-lg border border-[#D8E3EC] flex items-center justify-center hover:bg-slate-50 transition-transform active:scale-95"
            title="Previous Masterpiece"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-3 sm:gap-6 w-full overflow-hidden py-6 px-2">
            {products.slice(0, 5).map((item, idx) => {
              const isActive = idx === carouselIndex % Math.min(5, products.length);
              const igInfo = item.instagram_url ? extractInstagramInfo(item.instagram_url) : null;
              const photoUrl = igInfo?.proxyImageUrl || item.image_url;

              return (
                <div
                  key={item.id || idx}
                  onClick={() => {
                    setCarouselIndex(idx);
                    setSelectedProduct(item);
                  }}
                  className={`transition-all duration-500 ease-out transform cursor-pointer rounded-3xl overflow-hidden border border-[#D8E3EC] bg-white relative flex-shrink-0 ${
                    isActive
                      ? "w-[240px] sm:w-[300px] h-[340px] sm:h-[400px] z-20 shadow-2xl scale-105 ring-4 ring-[#182b3f]/20"
                      : "w-[160px] sm:w-[210px] h-[260px] sm:h-[320px] z-10 opacity-70 scale-90 blur-[0.3px]"
                  }`}
                >
                  <img src={photoUrl} alt={item.title} className="w-full h-full object-cover" />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 flex flex-col justify-between text-left">
                    <div className="flex justify-end">
                      <span className="bg-white/80 backdrop-blur-md text-[#182b3f] text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        🔍 Tap HD
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                        {item.category}
                      </span>
                      <h4 className="font-heading font-bold text-white text-base sm:text-lg line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-white font-extrabold text-sm sm:text-base">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] text-white/90 underline font-semibold">
                          View Item →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleNextCarousel}
            className="absolute right-2 sm:right-4 z-30 w-10 h-10 rounded-full bg-white text-[#182b3f] shadow-lg border border-[#D8E3EC] flex items-center justify-center hover:bg-slate-50 transition-transform active:scale-95"
            title="Next Masterpiece"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-4">
          {products.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setCarouselIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === carouselIndex % Math.min(5, products.length)
                  ? "w-6 bg-[#182b3f]"
                  : "w-2 bg-[#D8E3EC]"
              }`}
            />
          ))}
        </div>
      </section>

      <section id="gallery" className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#D8E3EC] pb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#567c8d] block mb-1">
              ARTISAN COLLECTION
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold text-[#182b3f]">
              Featured Goods by Vish Creation
            </h2>
            <p className="text-xs text-[#50606c] mt-0.5 flex items-center gap-1">
              <span>⚡ Direct Instagram DM &amp; Share buttons available on each product!</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#D8E3EC] text-xs font-semibold text-[#182b3f] hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#567c8d]" />
              <span>Sync Live Stock</span>
            </button>

            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#D8E3EC] text-xs font-semibold text-[#182b3f] hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-[#182b3f]" />
              <span>Seller Portal Login</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="fixed inset-0 z-[200] bg-[#f8f2ee] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in-up">
            {/* Animated Brand Emblem */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-xl border border-[#D8E3EC] flex items-center justify-center relative animate-bounce">
                <span className="text-3xl animate-pulse">🎨</span>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-stone-900 font-bold text-xs flex items-center justify-center shadow-md animate-ping">
                  ✨
                </span>
              </div>
            </div>

            {/* Brand Title & Tagline */}
            <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#182b3f] tracking-tight mb-2">
              VISHH CREATION
            </h1>
            <p className="text-xs sm:text-sm font-serif italic text-[#567c8d] max-w-sm leading-relaxed">
              Crafting bespoke canvas paintings &amp; handcrafted crochet treasures with love...
            </p>

            {/* Luxury Progress Bar */}
            <div className="w-48 sm:w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-6 relative border border-slate-300 shadow-inner">
              <div className="h-full bg-gradient-to-r from-[#182b3f] via-[#567c8d] to-amber-500 rounded-full animate-pulse w-full"></div>
            </div>

            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-4 flex items-center gap-1.5">
              <span className="animate-spin">✨</span> Loading Handcrafted Treasures...
            </span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-[#D8E3EC] p-8 max-w-md mx-auto">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-heading text-base font-semibold text-[#182b3f]">
              No items in "{selectedCategory}"
            </h3>
            <p className="text-[#50606c] text-xs mt-1">
              Upload an item under this category from Admin Dashboard.
            </p>
            <button
              onClick={() => setSelectedCategory("All Collections")}
              className="mt-4 px-4 py-2 rounded-full bg-[#182b3f] text-white text-xs font-bold"
            >
              Show All Collections
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, idx) => {
              const isArt = product.category === "Original Paintings" || product.category === "Painting";
              const targetIg = isArt ? SITE_CONFIG.artInstagram : SITE_CONFIG.crochetInstagram;
              const targetUrl = isArt ? SITE_CONFIG.artDmUrl : SITE_CONFIG.crochetDmUrl;

              const igInfo = product.instagram_url ? extractInstagramInfo(product.instagram_url) : null;
              const directPostUrl = igInfo?.shortcode ? `https://www.instagram.com/p/${igInfo.shortcode}/` : (product.instagram_url || targetUrl);
              const isReel = product.category === "Instagram Reels";
              const displayPhoto = product.image_url || (igInfo as any)?.proxyImageUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-[#D8E3EC] shadow-sm card-interactive animate-fade-in-up flex flex-col justify-between group cursor-pointer p-3 sm:p-4 text-left"
                  style={{ animationDelay: `${(idx % 8) * 65}ms` }}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div>
                    {/* Image Container with HD Zoom badge & Play Overlay */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 mb-3">
                      <img
                        src={displayPhoto}
                        alt={product.title}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (igInfo?.proxyImageUrl && target.src !== igInfo.proxyImageUrl) {
                            target.src = igInfo.proxyImageUrl;
                          } else {
                            target.src = "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop";
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Right HD Zoom Badge */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullscreenPhoto(displayPhoto, product.title);
                        }}
                        className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#182b3f] text-[10px] font-bold border border-[#D8E3EC] shadow-sm hover:bg-white flex items-center gap-1 z-10"
                      >
                        <Search className="w-3 h-3 text-[#567c8d]" />
                        <span>HD Zoom</span>
                      </button>

                      {/* Reel Overlay */}
                      {isReel && (
                        <>
                          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold flex items-center gap-1">
                            <span>🎬 Reel</span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md border border-white/50 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-lg ml-0.5">▶</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Title and Icon Row */}
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-[#182b3f] text-sm sm:text-base line-clamp-1 flex-1 group-hover:text-[#567c8d]">
                        {product.title}
                      </h4>
                      <span className="text-xs opacity-70 flex-shrink-0">🕹️</span>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-[#74777d] text-[11px] sm:text-xs line-clamp-2 mt-1 font-normal leading-snug">
                      {product.description}
                    </p>

                    {/* DM Light Blue/Beige Pill Button */}
                    <a
                      href={directPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full py-1.5 px-3 rounded-full bg-[#EAF1F7] hover:bg-[#d8e5f0] text-[#182b3f] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#D8E3EC] transition-colors text-center my-3 truncate"
                    >
                      <span>🎨 DM Art IG (@{targetIg})</span>
                    </a>
                  </div>

                  {/* Bottom Row: Price & + Add to Cart Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-base sm:text-lg font-extrabold text-[#182b3f]">
                      {SITE_CONFIG.currencySymbol}{product.price.toLocaleString("en-IN")}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Added "${product.title}" to shopping cart! DM Vishva to complete order.`);
                      }}
                      className="bg-[#2f4156] hover:bg-[#182b3f] text-white text-[11px] sm:text-xs font-bold px-3.5 py-2 rounded-full transition-colors shadow flex items-center gap-1 flex-shrink-0"
                    >
                      <span>+ Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="custom" className="bg-white rounded-3xl p-8 sm:p-12 text-center space-y-4 border border-[#D8E3EC] shadow-sm">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto text-lg font-bold">
            ✨
          </div>

          <h2 className="font-heading text-2xl sm:text-4xl font-bold text-[#182b3f]">
            Personalize Your Gift with Custom Names &amp; Photos
          </h2>

          <p className="text-[#50606c] text-xs sm:text-sm leading-relaxed">
            Send custom photos or names directly to Vishva on Instagram DM (@{SITE_CONFIG.artInstagram} or @{SITE_CONFIG.crochetInstagram}) to create your customized gift!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <a
              href={SITE_CONFIG.artDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2f4156] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#1f2d3d] transition-colors shadow-md"
            >
              <span>🎨 DM Art Photos (@{SITE_CONFIG.artInstagram})</span>
            </a>

            <a
              href={SITE_CONFIG.crochetDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#567c8d] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#456574] transition-colors shadow-md"
            >
              <span>🧶 DM Crochet Orders (@{SITE_CONFIG.crochetInstagram})</span>
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8E3EC] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border-2 border-slate-300 relative shadow-md">
            <img
              src={artistProfile.photoUrl}
              alt={artistProfile.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#567c8d]">
                ABOUT THE ARTIST
              </span>
            </div>

            <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#182b3f]">
              {artistProfile.name} (@{SITE_CONFIG.artInstagram} &amp; @{SITE_CONFIG.crochetInstagram})
            </h3>

            <p className="text-[#50606c] text-xs sm:text-sm leading-relaxed max-w-3xl whitespace-pre-line">
              {artistProfile.bio}
            </p>
          </div>
        </div>
      </section>

      {showRoomVisualizer && (
        <div className="modal-overlay" onClick={() => setShowRoomVisualizer(false)}>
          <div className="modal-content p-5 sm:p-6 max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#D8E3EC] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖼️</span>
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-[#182b3f]">
                    Interactive Room Wall Visualizer
                  </h3>
                  <p className="text-xs text-[#50606c]">
                    Upload your own room wall photo &amp; resize the painting frame in real-time!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRoomVisualizer(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Control Bar: Upload Custom House Wall Photo + Size Slider + Preset Buttons */}
            <div className="bg-[#f8f2ee] p-3 rounded-2xl border border-[#D8E3EC] mb-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Upload Own House Wall Photo Button */}
                <label className="cursor-pointer bg-[#182b3f] hover:bg-[#111f2e] text-white text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95">
                  <span>📸 Upload Your House Wall Photo</span>
                  <input type="file" accept="image/*" onChange={handleCustomWallUpload} className="hidden" />
                </label>

                {wallBgUrl !== defaultWallPhoto && (
                  <button
                    onClick={() => setWallBgUrl(defaultWallPhoto)}
                    className="text-xs font-bold text-[#567c8d] underline hover:text-[#182b3f]"
                  >
                    Reset Preset Wall
                  </button>
                )}

                {/* Frame Style Picker */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D8E3EC] text-xs">
                  <span className="text-[10px] font-bold text-[#50606c] px-1">Frame:</span>
                  <button
                    onClick={() => setFrameStyle("dark-wood")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      frameStyle === "dark-wood" ? "bg-[#2f4156] text-white shadow-sm" : "text-[#50606c]"
                    }`}
                  >
                    🪵 Wood
                  </button>
                  <button
                    onClick={() => setFrameStyle("gold-luxury")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      frameStyle === "gold-luxury" ? "bg-amber-600 text-white shadow-sm" : "text-[#50606c]"
                    }`}
                  >
                    ✨ Gold
                  </button>
                  <button
                    onClick={() => setFrameStyle("modern-white")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      frameStyle === "modern-white" ? "bg-slate-200 text-[#182b3f] shadow-sm" : "text-[#50606c]"
                    }`}
                  >
                    ⚪ White
                  </button>
                  <button
                    onClick={() => setFrameStyle("frameless")}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      frameStyle === "frameless" ? "bg-slate-800 text-white shadow-sm" : "text-[#50606c]"
                    }`}
                  >
                    🖼️ Canvas
                  </button>
                </div>
              </div>

              {/* Painting Size Slider & Preset Quick Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2.5 border-t border-[#D8E3EC]">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-[#182b3f] flex-shrink-0">
                    Resize Painting:
                  </span>
                  <input
                    type="range"
                    min={3}
                    max={65}
                    value={artScalePercent}
                    onChange={(e) => setArtScalePercent(Number(e.target.value))}
                    className="w-full sm:w-48 accent-[#182b3f] cursor-pointer"
                  />
                  <span className="text-xs font-extrabold text-[#182b3f] w-9">
                    {artScalePercent}%
                  </span>

                  {(artPos.x !== 0 || artPos.y !== 0) && (
                    <button
                      onClick={() => setArtPos({ x: 0, y: 0 })}
                      className="ml-2 px-2.5 py-1 rounded-md bg-[#2f4156] text-white text-[10px] font-bold shadow-sm hover:bg-[#182b3f] transition-colors"
                    >
                      🔄 Reset Center
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[10px] font-semibold text-[#50606c] mr-0.5">Quick Size:</span>
                  <button
                    onClick={() => setArtScalePercent(5)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                      artScalePercent === 5 ? "bg-[#182b3f] text-white border-[#182b3f]" : "bg-white text-[#182b3f] border-[#D8E3EC]"
                    }`}
                  >
                    Mini (5%)
                  </button>
                  <button
                    onClick={() => setArtScalePercent(10)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                      artScalePercent === 10 ? "bg-[#182b3f] text-white border-[#182b3f]" : "bg-white text-[#182b3f] border-[#D8E3EC]"
                    }`}
                  >
                    XS (10%)
                  </button>
                  <button
                    onClick={() => setArtScalePercent(18)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                      artScalePercent === 18 ? "bg-[#182b3f] text-white border-[#182b3f]" : "bg-white text-[#182b3f] border-[#D8E3EC]"
                    }`}
                  >
                    S (18%)
                  </button>
                  <button
                    onClick={() => setArtScalePercent(28)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                      artScalePercent === 28 ? "bg-[#182b3f] text-white border-[#182b3f]" : "bg-white text-[#182b3f] border-[#D8E3EC]"
                    }`}
                  >
                    M (28%)
                  </button>
                  <button
                    onClick={() => setArtScalePercent(40)}
                    className={`px-2 py-1 rounded-md border text-[10px] font-bold ${
                      artScalePercent === 40 ? "bg-[#182b3f] text-white border-[#182b3f]" : "bg-white text-[#182b3f] border-[#D8E3EC]"
                    }`}
                  >
                    L (40%)
                  </button>
                </div>
              </div>
            </div>

            {/* Room Wall Canvas View (Draggable Canvas Area) */}
            <div
              className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#D8E3EC] shadow-2xl flex items-center justify-center bg-cover bg-center transition-all duration-300 min-h-[280px] sm:min-h-[400px] select-none"
              style={{
                backgroundImage: `url('${wallBgUrl}')`,
              }}
              onMouseMove={(e) => isDragging && handleMoveDrag(e.clientX, e.clientY)}
              onTouchMove={(e) => {
                if (isDragging && e.touches[0]) {
                  handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onMouseUp={handleEndDrag}
              onMouseLeave={handleEndDrag}
              onTouchEnd={handleEndDrag}
            >
              <div className="absolute inset-0 bg-black/10"></div>

              {/* Draggable Helper Hint Badge */}
              <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#D8E3EC] text-[11px] font-bold text-[#182b3f] shadow-sm flex items-center gap-1.5 pointer-events-none">
                <span className="text-amber-500">🖐️</span>
                <span>Click &amp; Drag painting anywhere on your wall!</span>
              </div>

              {/* Framed Artwork Mounted on Living Room Wall (Touch & Mouse Draggable) */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleStartDrag(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) {
                    handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
                  }
                }}
                className={`relative z-10 aspect-[3/4] rounded-lg shadow-2xl transition-all duration-75 cursor-grab active:cursor-grabbing select-none ${
                  frameStyle === "dark-wood"
                    ? `bg-amber-950 border-amber-900 shadow-amber-950/80 ${
                        artScalePercent <= 12
                          ? "p-0.5 border-2"
                          : artScalePercent <= 24
                          ? "p-1 sm:p-1.5 border-2 sm:border-4"
                          : "p-2 sm:p-2.5 border-4 sm:border-8"
                      }`
                    : frameStyle === "gold-luxury"
                    ? `bg-amber-400 border-amber-500 shadow-amber-600/80 ${
                        artScalePercent <= 12
                          ? "p-0.5 border-2"
                          : artScalePercent <= 24
                          ? "p-1 sm:p-1.5 border-2 sm:border-4"
                          : "p-2 sm:p-2.5 border-4 sm:border-8"
                      }`
                    : frameStyle === "modern-white"
                    ? `bg-slate-100 border-white shadow-slate-900/50 ${
                        artScalePercent <= 12
                          ? "p-0.5 border-2"
                          : artScalePercent <= 24
                          ? "p-1 sm:p-1.5 border-2 sm:border-4"
                          : "p-2 sm:p-2.5 border-4 sm:border-8"
                      }`
                    : "bg-transparent border-0 p-0 shadow-2xl"
                }`}
                style={{
                  width: `${artScalePercent}%`,
                  transform: `translate(${artPos.x}px, ${artPos.y}px)`,
                }}
              >
                <div className="w-full h-full rounded overflow-hidden shadow-inner pointer-events-none">
                  <img src={visualizerArtUrl} alt="Framed Wall Art" className="w-full h-full object-cover pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#50606c]">
              <span>💡 Customer Tip: Upload your own house wall photo to check exact sizing before ordering!</span>
              <a
                href={SITE_CONFIG.artDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2f4156] text-white text-xs font-bold py-1.5 px-4 rounded-full hover:bg-[#182b3f] transition-colors flex-shrink-0"
              >
                <span>🎨 DM Art (@{SITE_CONFIG.artInstagram})</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div
            className="modal-content p-5 sm:p-7 max-w-3xl w-[92%] rounded-[28px] border border-[#D8E3EC] shadow-2xl relative bg-[#F5EFEB] text-left overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button Row */}
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-white hover:bg-slate-100 text-[#182b3f] border border-[#D8E3EC] text-xs font-bold px-3.5 py-1 rounded-full transition-all flex items-center gap-1 shadow-sm active:scale-95"
              >
                <span>✕ Close</span>
              </button>
            </div>

            {(() => {
              const rawInsta = selectedProduct.instagram_url || (selectedProduct.image_url?.includes("instagram.com") ? selectedProduct.image_url : null);
              const igInfo = rawInsta ? extractInstagramInfo(rawInsta) : null;
              const isVideoReel = selectedProduct.category === "Instagram Reels" || Boolean(igInfo && igInfo.type === "reel");
              const targetIgUrl = igInfo?.shortcode
                ? `https://www.instagram.com/p/${igInfo.shortcode}/`
                : (selectedProduct.category === "Crochet Flowers" || selectedProduct.category === "Crochet Plushies" ? SITE_CONFIG.crochetInstagramUrl : SITE_CONFIG.artInstagramUrl);

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-center">
                  {/* Left Column: Artwork Image */}
                  <div
                    className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border border-[#D8E3EC] shadow-md flex items-center justify-center group cursor-pointer"
                    onClick={() => openFullscreenPhoto(selectedProduct.image_url, selectedProduct.title)}
                  >
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Reel Play Badge Overlay */}
                    {isVideoReel && (
                      <a
                        href={targetIgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all hover:bg-black/40 group/play"
                        style={{ textDecoration: "none" }}
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-2xl group-hover/play:scale-110 transition-transform border-2 border-white/80">
                          <span className="text-2xl ml-1">▶</span>
                        </div>
                        <span className="mt-2.5 px-4 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold shadow-lg border border-white/30">
                          🎬 Watch Reel Video on Instagram
                        </span>
                      </a>
                    )}

                    {/* Bottom Left Zoom Badge inside Image */}
                    {!isVideoReel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullscreenPhoto(selectedProduct.image_url, selectedProduct.title);
                        }}
                        className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-[#182b3f] shadow-md border border-[#D8E3EC] flex items-center gap-1.5 hover:bg-white transition-all active:scale-95 z-10"
                      >
                        <Search className="w-3.5 h-3.5 text-[#567c8d]" />
                        <span>Tap for Original HD Fullscreen View 🔍</span>
                      </button>
                    )}
                  </div>

                  {/* Right Column: Product Info & Connect Card */}
                  <div className="flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category & Quick Action Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-3 py-0.5 rounded-full bg-[#EAF1F7] text-[#50606c] text-[10px] font-bold tracking-wider uppercase border border-[#D8E3EC]">
                          {selectedProduct.category}
                        </span>

                        <button
                          onClick={() => {
                            const artPhoto = selectedProduct.image_url;
                            setSelectedProduct(null);
                            openVisualizer(artPhoto);
                          }}
                          className="px-3 py-0.5 rounded-full bg-white hover:bg-slate-50 text-[#182b3f] text-[10px] font-bold border border-[#D8E3EC] transition-colors shadow-sm flex items-center gap-1"
                        >
                          <span>🖼️ Try on Room Wall</span>
                        </button>

                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(window.location.href);
                            alert(`Link copied to clipboard for "${selectedProduct.title}"!`);
                          }}
                          className="px-3 py-0.5 rounded-full bg-white hover:bg-slate-50 text-[#182b3f] text-[10px] font-bold border border-[#D8E3EC] transition-colors shadow-sm flex items-center gap-1"
                        >
                          <span>🕹️ Share Item</span>
                        </button>
                      </div>

                      {/* Title & Price */}
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#182b3f] leading-tight mt-2.5">
                        {selectedProduct.title}
                      </h2>

                      <div className="text-xl sm:text-2xl font-bold text-[#182b3f] mt-1">
                        {SITE_CONFIG.currencySymbol}{selectedProduct.price.toLocaleString("en-IN")}
                      </div>

                      <p className="text-xs text-[#50606c] leading-relaxed mt-2">
                        {selectedProduct.description}
                      </p>
                    </div>

                    {/* Direct Reel Watch Button if video */}
                    {isVideoReel && (
                      <a
                        href={targetIgUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 text-center"
                        style={{ textDecoration: "none" }}
                      >
                        <span className="text-base">🎬</span>
                        <span>Watch &amp; Listen Full Reel on Instagram</span>
                      </a>
                    )}

                    {/* Directly Connect Card */}
                    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D8E3EC] space-y-2 shadow-sm">
                      <span className="text-xs font-bold text-[#182b3f] block">
                        Directly Connect with Vishva:
                      </span>

                      <a
                        href={SITE_CONFIG.artDmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#435969] hover:bg-[#344857] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 text-center shadow-sm"
                        style={{ textDecoration: "none" }}
                      >
                        <span>🎨 DM Art Instagram (@{SITE_CONFIG.artInstagram})</span>
                      </a>

                      <a
                        href={SITE_CONFIG.crochetDmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#567c8d] hover:bg-[#456574] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 text-center shadow-sm"
                        style={{ textDecoration: "none" }}
                      >
                        <span>🧶 DM Crochet Instagram (@{SITE_CONFIG.crochetInstagram})</span>
                      </a>
                    </div>

                    {/* Bottom Shopping Cart Button */}
                    <button
                      onClick={() => {
                        alert(`Added "${selectedProduct.title}" to shopping cart! DM Vishva to complete order.`);
                      }}
                      className="w-full py-4 px-6 rounded-2xl bg-[#2f4156] hover:bg-[#182b3f] text-white text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <ShoppingBag className="w-4.5 h-4.5" />
                      <span>Add to Shopping Cart</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Fullscreen HD Original Uncropped Photo Lightbox Modal */}
      {fullscreenPhotoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 transition-all"
          onClick={() => {
            setFullscreenPhotoUrl(null);
            setZoomLevel(1);
          }}
        >
          {/* Top Control Header */}
          <div
            className="flex items-center justify-between w-full max-w-6xl mx-auto text-white pb-3 border-b border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
                🔍 ORIGINAL FULL HD UNCROPPED VIEW
              </span>
              <h3 className="font-heading text-base sm:text-2xl font-bold text-white truncate max-w-xs sm:max-w-md">
                {fullscreenPhotoTitle || "Handcrafted Masterpiece"}
              </h3>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20 text-xs">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold"
                  title="Zoom Out"
                >
                  -
                </button>
                <span className="px-2 text-xs font-mono">{Math.round(zoomLevel * 100)}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold"
                  title="Zoom In"
                >
                  +
                </button>
                {zoomLevel !== 1 && (
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="px-2 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px]"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setFullscreenPhotoUrl(null);
                  setZoomLevel(1);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1 border border-white/30"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Main Photo Viewing Canvas (True Aspect Ratio, Uncropped, Zoomable) */}
          <div
            className="flex-1 w-full flex items-center justify-center overflow-auto py-4 cursor-zoom-in"
            onClick={(e) => {
              e.stopPropagation();
              setZoomLevel((z) => (z === 1 ? 1.6 : 1));
            }}
          >
            <img
              src={fullscreenPhotoUrl}
              alt={fullscreenPhotoTitle}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[80vh] max-w-[90vw] object-contain transition-transform duration-200 rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Bottom Action Footer */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-6xl mx-auto pt-3 border-t border-white/20 text-white text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/80 text-[11px] sm:text-xs">
              ⚡ Showing original high-resolution uncropped upload. Tap image or use +/- to zoom.
            </span>
            <div className="flex items-center gap-2">
              <a
                href={SITE_CONFIG.artDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2f4156] hover:bg-[#182b3f] text-white text-xs font-bold py-2 px-5 rounded-full border border-white/20 shadow-md"
              >
                🎨 DM Art IG (@{SITE_CONFIG.artInstagram})
              </a>
              <a
                href={SITE_CONFIG.crochetDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#567c8d] hover:bg-[#456574] text-white text-xs font-bold py-2 px-5 rounded-full border border-white/20 shadow-md"
              >
                🧶 DM Crochet IG (@{SITE_CONFIG.crochetInstagram})
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
