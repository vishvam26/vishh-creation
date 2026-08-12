export function extractInstagramInfo(url: string): {
  shortcode: string | null;
  type: "reel" | "post" | "unknown";
  embedUrl: string;
  mediaUrl: string;
  proxyImageUrl: string;
} {
  if (!url || typeof url !== "string") {
    return { shortcode: null, type: "unknown", embedUrl: "", mediaUrl: "", proxyImageUrl: "" };
  }

  try {
    const cleanUrl = url.trim();
    const isReel = cleanUrl.toLowerCase().includes("/reel/");

    // Match shortcode across all Instagram URL variations including query parameters (?igsh=...)
    const match = cleanUrl.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);

    if (match && match[1]) {
      const shortcode = match[1];
      const embedUrl = isReel
        ? `https://www.instagram.com/reel/${shortcode}/embed/`
        : `https://www.instagram.com/p/${shortcode}/embed/`;
      const mediaUrl = `https://www.instagram.com/p/${shortcode}/media/?size=l`;
      const proxyImageUrl = `https://wsrv.nl/?url=https://www.instagram.com/p/${shortcode}/media/?size=l`;

      return {
        shortcode,
        type: isReel ? "reel" : "post",
        embedUrl,
        mediaUrl,
        proxyImageUrl,
      };
    }
  } catch (e) {
    console.error("Failed to parse Instagram URL", e);
  }

  return {
    shortcode: null,
    type: "unknown",
    embedUrl: "",
    mediaUrl: "",
    proxyImageUrl: "",
  };
}
