# Predio — Website

The marketing website for **Predio** (https://www.predioapp.com).

Bilingual (English / Spanish) single-page site built as a self-contained `index.html` — no build step, no dependencies. Deploys as a static site.

## Structure
- `index.html` — the entire site (HTML + CSS + JS inline)

## Deploy (Vercel)
1. Push this repo to GitHub.
2. In Vercel, **Add New → Project → Import** this GitHub repo.
3. Framework preset: **Other** (static). No build command needed.
4. Deploy.

## Connect the domain (predioapp.com)
After deploying, in the Vercel project go to **Settings → Domains**, add `predioapp.com` and `www.predioapp.com`, then add the DNS records Vercel shows you at your registrar (Squarespace).

## Language
The site defaults to English and auto-switches to Spanish for Spanish-language browsers. Users can toggle EN/ES in the top-right. English copy targets the U.S. market; Spanish targets Latin America.
