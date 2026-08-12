import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface HeroShowcaseConfig {
  title: string;
  category: string;
  price: number;
  imageUrl: string;
  instagramUrl?: string;
}

export const DEFAULT_HERO_SHOWCASE: HeroShowcaseConfig = {
  title: "radhe shyamm!!",
  category: "Original Paintings",
  price: 499986,
  imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
  instagramUrl: "",
};

export interface ArtistProfile {
  name: string;
  photoUrl: string;
  bio: string;
  featuredProductId?: string | null;
  heroShowcase?: HeroShowcaseConfig | null;
}

export const DEFAULT_ARTIST_PROFILE: ArtistProfile = {
  name: "Vishva",
  photoUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=400&auto=format&fit=crop",
  bio: "Every artwork and crochet creation is 100% handcrafted in small batches by Vishva in her home studio. Check out her Instagram profiles @__vishh.art__ (Art) and @vishvayi._ (Crochet) to see all her art posts and behind-the-scenes craft videos!",
  featuredProductId: null,
  heroShowcase: DEFAULT_HERO_SHOWCASE,
};

const ARTIST_STORAGE_KEY = "vishart_artist_profile_v3";

export function getArtistProfile(): ArtistProfile {
  if (typeof window === "undefined") return DEFAULT_ARTIST_PROFILE;
  try {
    const saved = localStorage.getItem(ARTIST_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to read artist profile from storage", e);
  }
  return DEFAULT_ARTIST_PROFILE;
}

function saveLocalArtistProfile(profile: ArtistProfile): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ARTIST_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save local artist profile", e);
    }
  }
}

function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Fetch artist profile permanently from Supabase
export async function fetchArtistProfileAsync(): Promise<ArtistProfile> {
  const local = getArtistProfile();
  const supabase = getSupabase();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("artist_profile")
        .select("*")
        .limit(1);

      if (!error && data && data.length > 0 && data[0].photo_url) {
        let parsedShowcase: HeroShowcaseConfig | null = null;
        if (data[0].hero_showcase) {
          try {
            parsedShowcase = typeof data[0].hero_showcase === "string" ? JSON.parse(data[0].hero_showcase) : data[0].hero_showcase;
          } catch (e) {}
        }

        const fetched: ArtistProfile = {
          name: data[0].name || local.name,
          photoUrl: data[0].photo_url || local.photoUrl,
          bio: data[0].bio || local.bio,
          featuredProductId: data[0].featured_product_id || local.featuredProductId || null,
          heroShowcase: parsedShowcase || local.heroShowcase || DEFAULT_HERO_SHOWCASE,
        };
        saveLocalArtistProfile(fetched);
        return fetched;
      }
    } catch (err) {
      console.warn("Supabase fetchArtistProfileAsync exception:", err);
    }
  }
  return local;
}

// Save artist profile permanently to Supabase & Local Storage
export async function saveArtistProfilePermanent(
  profile: Partial<ArtistProfile>
): Promise<{ profile: ArtistProfile; isCloud: boolean }> {
  const current = getArtistProfile();
  let updatedPhotoUrl = profile.photoUrl || current.photoUrl;

  const supabase = getSupabase();

  // If photo is a base64 DataURL, upload to Supabase Storage Bucket first!
  if (isSupabaseConfigured() && supabase && updatedPhotoUrl.startsWith("data:")) {
    try {
      const blob = dataURLtoBlob(updatedPhotoUrl);
      const fileName = `artist-vishva-${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadData.path);

        if (publicUrlData?.publicUrl) {
          updatedPhotoUrl = publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn("Failed to upload artist photo to Supabase storage:", err);
    }
  }

  const finalProfile: ArtistProfile = {
    name: profile.name || current.name,
    photoUrl: updatedPhotoUrl,
    bio: profile.bio || current.bio,
  };

  saveLocalArtistProfile(finalProfile);

  if (isSupabaseConfigured() && supabase) {
    try {
      // Upsert into Supabase table artist_profile
      await supabase.from("artist_profile").upsert({
        id: 1,
        name: finalProfile.name,
        photo_url: finalProfile.photoUrl,
        bio: finalProfile.bio,
        featured_product_id: current.featuredProductId || null,
        hero_showcase: current.heroShowcase ? JSON.stringify(current.heroShowcase) : null,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase upsert artist_profile warning:", err);
    }
  }

  return { profile: finalProfile, isCloud: Boolean(isSupabaseConfigured() && supabase) };
}

export async function saveFeaturedProductIdCloud(id: string): Promise<void> {
  const current = getArtistProfile();
  const updated: ArtistProfile = { ...current, featuredProductId: id };
  saveLocalArtistProfile(updated);

  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("artist_profile").upsert({
        id: 1,
        name: updated.name,
        photo_url: updated.photoUrl,
        bio: updated.bio,
        featured_product_id: id,
        hero_showcase: current.heroShowcase ? JSON.stringify(current.heroShowcase) : null,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase upsert featured_product_id warning:", err);
    }
  }
}

export async function saveHeroShowcaseCloud(showcase: HeroShowcaseConfig): Promise<void> {
  const current = getArtistProfile();
  let finalImageUrl = showcase.imageUrl || "";

  const supabase = getSupabase();

  if (isSupabaseConfigured() && supabase && finalImageUrl.startsWith("data:")) {
    try {
      const blob = dataURLtoBlob(finalImageUrl);
      const fileName = `hero-showcase-${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(uploadData.path);

        if (publicUrlData?.publicUrl) {
          finalImageUrl = publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn("Failed to upload hero image to Supabase storage:", err);
    }
  }

  const finalShowcase: HeroShowcaseConfig = {
    ...showcase,
    imageUrl: finalImageUrl,
  };

  const updated: ArtistProfile = { ...current, heroShowcase: finalShowcase };
  saveLocalArtistProfile(updated);

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("artist_profile").upsert({
        id: 1,
        name: updated.name,
        photo_url: updated.photoUrl,
        bio: updated.bio,
        featured_product_id: updated.featuredProductId || null,
        hero_showcase: JSON.stringify(finalShowcase),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Supabase upsert hero_showcase warning:", err);
    }
  }
}
