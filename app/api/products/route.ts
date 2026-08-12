import { NextResponse } from "next/server";
import { createProductItem, fetchAllProducts } from "@/lib/products";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const { products, isCloud } = await fetchAllProducts();
    return NextResponse.json({ success: true, products, isCloud });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error fetching products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, price, category, image_url, is_available } = body;

    if (!title || !description || price === undefined || !image_url) {
      return NextResponse.json(
        { success: false, message: "Please provide Title, Price, Description and Photo." },
        { status: 400 }
      );
    }

    const result = await createProductItem({
      title,
      description,
      price: Number(price),
      category: category || "Crochet",
      image_url,
      is_available: is_available !== undefined ? is_available : true,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Error creating product item." },
      { status: 500 }
    );
  }
}
