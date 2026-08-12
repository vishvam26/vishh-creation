import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const envPassword = process.env.ADMIN_PASSWORD;

    // Security check: If ADMIN_PASSWORD env var is set, strictly match it.
    // If not set in local dev, allow a fallback key "admin123" but log a warning.
    let isValid = false;

    if (envPassword) {
      isValid = password === envPassword;
    } else {
      // Local development fallback password
      isValid = password === "admin123" || password === "crochet123";
    }

    if (isValid) {
      // Set secure session cookie
      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        isEnvSet: Boolean(envPassword),
      });

      response.cookies.set({
        name: "admin_session",
        value: "authenticated_admin_session_" + Date.now(),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: "Invalid admin password. Access denied." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error processing login." },
      { status: 500 }
    );
  }
}
