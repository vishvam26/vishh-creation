export const SITE_CONFIG = {
  brandName: "VISHH CREATION",
  heroTitle: "Handcrafted Treasures",
  heroSubtitle: "By Vish Creation",
  tagline: "'Crafted by hand just for you'",
  artistName: "Vishva",
  artInstagram: "__vishh.art__",
  crochetInstagram: "vishvayi._",
  artInstagramUrl: "https://instagram.com/__vishh.art__",
  crochetInstagramUrl: "https://instagram.com/vishvayi._",
  artDmUrl: "https://ig.me/m/__vishh.art__",
  crochetDmUrl: "https://ig.me/m/vishvayi._",
  bio: "Discover bespoke canvas paintings, everlasting crochet flower bouquets, soft amigurumi plushies, personalized resin keychains, and luxury gift hampers.",
  currencySymbol: "₹",
  maxUploadSizeMB: 5,
  categories: [
    "All Collections",
    "Original Paintings",
    "Crochet",
    "Custom Keychains",
  ] as const,
};

export type Category = (typeof SITE_CONFIG.categories)[number];
