import type { Metadata } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/config";
import Link from "next/link";

export const metadata: Metadata = {
  title: `${SITE_CONFIG.brandName} | Modern Artisan Handmade Luxury`,
  description: SITE_CONFIG.bio,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#182b3f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VISHH CREATION" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) { console.log('PWA ServiceWorker registered with scope:', reg.scope); },
                  function(err) { console.error('PWA ServiceWorker registration failed:', err); }
                );
              });
            }
          `
        }} />
      </head>
      <body className="font-body-md text-body-md antialiased overflow-x-hidden bg-[#fef8f4] text-[#1d1b19] min-h-screen flex flex-col">
        {/* Header (Matching Screenshot 2) */}
        <header className="glass-header sticky top-0 w-full z-50 py-3.5 px-4 md:px-8 border-b border-[#D8E3EC]">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
            {/* Logo & Brand Name */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#F5EFEB] border-2 border-[#5D3264] flex items-center justify-center shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform flex-shrink-0">
                <img
                  src="/icon-192.png"
                  alt="VISHH CREATION Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <img
                  src="/brand-text.png"
                  alt="ViSh❤Yi"
                  className="h-10 sm:h-15 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Search Bar Input */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74777d] text-sm">
                  search
                </span>
                <input
                  className="w-full bg-white border border-[#D8E3EC] rounded-full py-2 pl-10 pr-4 text-xs text-[#1d1b19] outline-none focus:ring-2 focus:ring-[#182b3f] transition-all shadow-inner"
                  placeholder="Search canvas paintings, crochet flowers, keychains..."
                  type="text"
                />
              </div>
            </div>

            {/* Action Header Buttons & Cart */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <a
                href={SITE_CONFIG.artDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex bg-[#2f4156] !text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#1f2d3d] transition-colors items-center gap-1 shadow-sm"
              >
                <span className="!text-white font-bold">🎨 DM Art (@{SITE_CONFIG.artInstagram})</span>
              </a>

              <a
                href={SITE_CONFIG.crochetDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex bg-[#567c8d] !text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#456574] transition-colors items-center gap-1 shadow-sm"
              >
                <span className="!text-white font-bold">🧶 DM Crochet (@{SITE_CONFIG.crochetInstagram})</span>
              </a>

              <div className="w-9 h-9 rounded-full bg-white border border-[#D8E3EC] flex items-center justify-center text-[#182b3f] shadow-sm relative cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-base">shopping_cart</span>
                <span className="absolute -top-1 -right-1 bg-[#182b3f] text-white w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shadow">
                  0
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-4 space-y-8 lg:space-y-6">
          {children}
        </main>

        {/* Footer (Matching Provided Theme) */}
        <footer className="bg-[#182b3f] text-white w-full mt-20 pt-16 pb-10">
          <div className="max-w-[1600px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
            <div>
              <h4 className="font-heading text-xl font-bold text-white mb-4">
                VISHH CREATION
              </h4>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Crafted for the Modern Artisan. Elevating spaces with authentic handmade luxury.
              </p>
            </div>

            <div>
              <h5 className="text-xs text-[#c1e8fc] mb-3 font-bold uppercase tracking-wider">
                Shop
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li><a className="hover:text-white hover:underline transition-all" href="#gallery">Original Paintings</a></li>
                <li><a className="hover:text-white hover:underline transition-all" href="#gallery">Crochet Creations</a></li>
                <li><a className="hover:text-white hover:underline transition-all" href="#gallery">Gift Hampers</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs text-[#c1e8fc] mb-3 font-bold uppercase tracking-wider">
                Support
              </h5>
              <ul className="space-y-2 text-xs text-white/70">
                <li><a className="hover:text-white hover:underline transition-all" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-white hover:underline transition-all" href="#">Terms of Service</a></li>
                <li><a className="hover:text-white hover:underline transition-all" href="#">Shipping Info</a></li>
                <li><a className="hover:text-white hover:underline transition-all" href="#">Returns</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs text-[#c1e8fc] mb-3 font-bold uppercase tracking-wider">
                Connect
              </h5>
              <p className="text-xs text-white/70 mb-3">
                Join our artisan community on Instagram.
              </p>
              <div className="flex gap-3">
                <a
                  href={SITE_CONFIG.artInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#4e6076] flex items-center justify-center hover:bg-[#c1e8fc] hover:text-[#182b3f] transition-colors"
                  title="Follow Art Instagram"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </a>
              </div>
            </div>
          </div>

          <div suppressHydrationWarning className="max-w-[1600px] mx-auto px-6 md:px-12 border-t border-white/20 pt-6 text-center text-xs text-white/50">
            © {new Date().getFullYear()} VISHH CREATION. All Rights Reserved. Crafted for the Modern Artisan by Vishva ❤️
          </div>
        </footer>
      </body>
    </html>
  );
}
