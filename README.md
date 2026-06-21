# Predio — Website

The marketing website for **Predio** (https://www.predioapp.com).

Bilingual (English / Spanish) multi-page static site — no build step, no dependencies. Deploys as static files on Vercel.

## Pages
- `index.html` — Home (overview, features highlights, how-it-works, who-it's-for)
- `features.html` — Full feature breakdown
- `pricing.html` — Plans, add-ons and pricing FAQ
- `property-management.html` — For property management companies (US/SEO)
- `hoas.html` — For HOAs & residential communities
- `faq.html` — Frequently asked questions (with FAQ schema)

## Shared
- `styles.css` — all styling
- `app.js` — language toggle (EN/ES), FAQ accordion, mobile nav
- `sitemap.xml`, `robots.txt` — SEO

## Language
Each page ships English content in the HTML (crawlable) plus a Spanish dictionary in an inline `window.ES` object. `app.js` swaps text on toggle and remembers the choice. Defaults to English; auto-switches to Spanish for Spanish-language browsers. English copy targets the U.S. market; Spanish targets Latin America.

## Deploy
Connected to GitHub → Vercel. Pushing to `main` auto-deploys to https://www.predioapp.com.
