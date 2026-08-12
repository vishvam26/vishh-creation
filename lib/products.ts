import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  instagram_url?: string;
  is_available: boolean;
  is_featured?: boolean;
  created_at: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Handmade Floral Crochet Blanket & Plush",
    description: "Cozy handmade floral crochet throw blanket with matching plushie. Premium cotton yarn with vibrant non-fading colors.",
    price: 1850,
    category: "Crochet Flowers",
    image_url: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=800&auto=format&fit=crop",
    is_available: true,
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Boho Chic Crochet Plushies & Bags",
    description: "Stylish eco-friendly tote bag woven with sturdy natural cotton cord. Features sturdy handles and solid inner lining.",
    price: 1290,
    category: "Crochet Plushies",
    image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop",
    is_available: true,
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "Sunflowers in Golden Glow Oil Painting",
    description: "Original 12x16 inch acrylic oil painting on gallery canvas. Textured palette knife strokes with gold leaf highlights.",
    price: 2490,
    category: "Original Paintings",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
    is_available: true,
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const LOCAL_STORAGE_KEY = "vishart_local_products_v4";
const HERO_FEATURED_KEY = "vishart_hero_featured_id_v1";

export function getFeaturedHeroProductId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(HERO_FEATURED_KEY);
  } catch (e) {
    return null;
  }
}

export function setFeaturedHeroProductId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HERO_FEATURED_KEY, id);
  } catch (e) {
    console.error("Failed to save hero featured id", e);
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

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getLocalProducts(): Product[] {
  if (typeof window === "undefined") return INITIAL_PRODUCTS;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  } catch (e) {
    return INITIAL_PRODUCTS;
  }
}

export function saveLocalProducts(products: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

// Fetch products from Supabase
export async function fetchAllProducts(): Promise<{ products: Product[]; isCloud: boolean }> {
  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return { products: data as Product[], isCloud: true };
      } else if (error) {
        console.error("Supabase select error:", error);
      }
    } catch (err) {
      console.warn("Supabase fetch exception:", err);
    }
  }

  return { products: getLocalProducts(), isCloud: false };
}

// Set a single product as the featured Hero Showcase photo (Synced for all visitors)
export async function setFeaturedProduct(id: string): Promise<{ success: boolean; isCloud: boolean }> {
  setFeaturedHeroProductId(id);

  // Update local list first so UI updates immediately
  const localList = getLocalProducts();
  const updatedList = localList.map((item) => ({
    ...item,
    is_featured: item.id === id,
  }));
  saveLocalProducts(updatedList);

  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      // Unset all existing featured items in Supabase
      await supabase.from("products").update({ is_featured: false }).neq("id", "000");
      // Set target item as featured in Supabase
      const { error } = await supabase.from("products").update({ is_featured: true }).eq("id", id);
      if (!error) return { success: true, isCloud: true };
    } catch (err) {
      console.warn("Supabase setFeatured warning:", err);
    }
  }

  return { success: true, isCloud: Boolean(isSupabaseConfigured() && supabase) };
}

// Upload image & insert row with valid UUID into Supabase products table
export async function createProductItem(
  productData: Omit<Product, "id" | "created_at">
): Promise<{ success: boolean; product: Product; isCloud: boolean; message?: string }> {
  const uuid = generateUUID();
  let finalImageUrl = productData.image_url;
  const supabase = getSupabase();

  if (productData.is_featured) {
    setFeaturedHeroProductId(uuid);
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      // Step 1: Upload image to Storage bucket if base64 data URL
      if (productData.image_url.startsWith("data:image/")) {
        const imageBlob = dataURLtoBlob(productData.image_url);
        const fileName = `${uuid}.jpg`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!storageError && storageData) {
          const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            finalImageUrl = publicUrlData.publicUrl;
          }
        } else {
          console.warn("Storage upload note (proceeding with row insert):", storageError);
        }
      }

      // If set as featured, unset other items
      if (productData.is_featured) {
        await supabase.from("products").update({ is_featured: false }).neq("id", "000");
      }

      // Step 2: Insert row into products table with valid UUID
      const insertPayload: any = {
        id: uuid,
        title: productData.title,
        description: productData.description,
        price: Number(productData.price),
        category: productData.category,
        image_url: finalImageUrl,
        is_available: productData.is_available,
        is_featured: productData.is_featured || false,
        created_at: new Date().toISOString(),
      };

      if (productData.instagram_url) {
        insertPayload.instagram_url = productData.instagram_url;
      }

      let { data: dbData, error: dbError } = await supabase
        .from("products")
        .insert([insertPayload])
        .select()
        .single();

      // Gracefully handle missing instagram_url or is_featured column in Supabase table
      if (dbError && (dbError.message?.includes("instagram_url") || dbError.message?.includes("is_featured"))) {
        console.warn("Supabase table missing custom columns. Retrying insert...");
        delete insertPayload.instagram_url;
        delete insertPayload.is_featured;

        const { data: retryData, error: retryError } = await supabase
          .from("products")
          .insert([insertPayload])
          .select()
          .single();

        if (!retryError && retryData) {
          const finalProduct = {
            ...(retryData as Product),
            instagram_url: productData.instagram_url,
            is_featured: productData.is_featured,
          };
          return {
            success: true,
            product: finalProduct,
            isCloud: true,
          };
        } else {
          dbError = retryError;
        }
      }

      if (!dbError && dbData) {
        return { success: true, product: dbData as Product, isCloud: true };
      } else {
        console.error("Supabase Database Insert Error:", dbError);
        return {
          success: false,
          product: { ...productData, id: uuid, created_at: new Date().toISOString() },
          isCloud: false,
          message: dbError?.message || "Database insert error",
        };
      }
    } catch (err: any) {
      console.error("Supabase exception on create:", err);
      return {
        success: false,
        product: { ...productData, id: uuid, created_at: new Date().toISOString() },
        isCloud: false,
        message: err.message || "Upload exception",
      };
    }
  }

  const newLocalProduct: Product = {
    ...productData,
    id: uuid,
    created_at: new Date().toISOString(),
  };

  const localList = getLocalProducts();
  const updatedList = [newLocalProduct, ...localList];
  saveLocalProducts(updatedList);

  return {
    success: true,
    product: newLocalProduct,
    isCloud: false,
  };
}

export async function updateProductItem(
  id: string,
  updates: Partial<Product>
): Promise<{ success: boolean; isCloud: boolean }> {
  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      if (!error) return { success: true, isCloud: true };
    } catch (err) {
      console.error("Supabase update error:", err);
    }
  }

  const localList = getLocalProducts();
  const updatedList = localList.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveLocalProducts(updatedList);
  return { success: true, isCloud: false };
}

export async function deleteProductItem(id: string): Promise<{ success: boolean; isCloud: boolean }> {
  const supabase = getSupabase();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (!error) return { success: true, isCloud: true };
    } catch (err) {
      console.error("Supabase delete error:", err);
    }
  }

  const localList = getLocalProducts();
  const updatedList = localList.filter((item) => item.id !== id);
  saveLocalProducts(updatedList);
  return { success: true, isCloud: false };
}
