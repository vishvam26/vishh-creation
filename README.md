# 🧶 Art & Crochet Studio Showcase Website

A full-stack, responsive e-commerce showcase website built with **Next.js 14**, **Supabase (PostgreSQL & Storage)**, and **Tailwind-inspired Vanilla CSS**.

Designed specifically for solo artists & crochet makers to publish their handmade items, set pricing, and allow visitors to order directly via **WhatsApp**.

---

## 🌟 Key Features

1. **Public Art Showcase**: Responsive gallery grid showing photos, titles, prices in ₹, category badges (Crochet, Painting, Sketch, Accessories), and availability status ("In Stock" / "Sold Out").
2. **Direct WhatsApp Ordering**: Click "Buy via WhatsApp" on any product card or detail modal to automatically open a pre-filled chat with the artist containing the item title & price.
3. **Sister's Admin Password Lock (`/admin`)**: Password-protected admin section for uploading photos, setting titles, prices, descriptions, marking items as Sold, or deleting listings.
4. **Mobile Photo Compression & 5MB Validation**: Client-side canvas image optimization prevents slow loading on mobile phones.
5. **Dual Persistence Mode**: Includes built-in Local Test Mode so you can preview uploading products locally immediately without configuring cloud keys.
6. **Deploy Anywhere**: Pre-configured for free one-click deployment on **Vercel**.

---

## 🚀 Quick Start (Run Locally)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Public Gallery**: `http://localhost:3000`
- **Sister Admin Lock**: `http://localhost:3000/admin` (Default password in local dev: `admin123` or set `ADMIN_PASSWORD` in `.env.local`).

---

## 🌐 Publishing Online (Free on Vercel & Supabase)

### Step 1: Create Supabase Project (Database & Photo Storage)
1. Sign up for free at [supabase.com](https://supabase.com).
2. Create a new project.
3. In **Table Editor**, create a table named `products` with the following columns:
   - `id` (uuid, primary key, default `gen_random_uuid()`)
   - `title` (text)
   - `description` (text)
   - `price` (numeric)
   - `category` (text)
   - `image_url` (text)
   - `is_available` (boolean, default `true`)
   - `created_at` (timestamp, default `now()`)
4. In **Storage**, create a public bucket named `product-images`.
5. Copy your **Project URL**, **anon key**, and **service_role key** from **Settings -> API**.

### Step 2: Deploy to Vercel
1. Push your code to GitHub.
2. Sign up at [vercel.com](https://vercel.com) and click **Add New -> Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:

| Environment Variable | Value Example | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `YourStrongPassword123!` | Secret password for Sister's admin portal |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `918320588261` | Sister's phone number for orders (with country code) |
| `NEXT_PUBLIC_BRAND_NAME` | `Aanya's Crochet Studio` | Business / Brand Name |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Public Anon Key |

5. Click **Deploy**. Vercel will give you a live URL (e.g. `your-sister-art.vercel.app`).

---

## 🔒 Security & Admin Access
- The `/admin` login route verifies the password on the server side and sets a secure `HttpOnly` cookie.
- No password or session data is hardcoded in the frontend.
