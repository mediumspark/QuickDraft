# SEO Deploy Verification

After deploying to `https://www.aquickdraft.com` with `VITE_SITE_URL=https://www.aquickdraft.com`:

## Build command

```bash
npm run build:seo
```

This runs Vite build, generates `sitemap.xml`, and prerenders marketing pages.

## Checklist

1. **View source** on `/`, `/faq`, `/templates/revenue-sharing` — confirm full page content and meta tags appear in HTML without running JavaScript.

2. **Crawl files**
   - https://www.aquickdraft.com/robots.txt
   - https://www.aquickdraft.com/sitemap.xml
   - https://www.aquickdraft.com/llms.txt

3. **Rich results** — test `/faq` in [Google Rich Results Test](https://search.google.com/test/rich-results) for FAQPage schema.

4. **Open Graph** — test `/` in [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) or similar. Confirm title, description, and `og-image.svg`.

5. **Noindex routes** — view source on `/builder` and `/account`; confirm `<meta name="robots" content="noindex, nofollow">`.

6. **Search Console** — submit `https://www.aquickdraft.com/sitemap.xml`.

## Environment

Ensure production build uses:

```env
VITE_SITE_URL=https://www.aquickdraft.com
```
