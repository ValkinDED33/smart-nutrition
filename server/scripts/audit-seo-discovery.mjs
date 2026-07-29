import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const canonicalOrigin = "https://smart-nutrition.club";
const publicSeoUrls = ["/", "/register", "/login"];
const privateOrTokenRoutes = [
  "/admin",
  "/coach",
  "/community",
  "/dashboard",
  "/food",
  "/meal-builder",
  "/meals",
  "/onboarding",
  "/partner-invite",
  "/profile",
  "/progress",
  "/recipes",
  "/reset-password",
  "/verify-email",
  "/water",
];

const readSource = (relativePath) =>
  readFileSync(path.join(rootDir, relativePath), "utf8");

const checks = [];
const addCheck = (label, pass, detail) => {
  checks.push({ label, pass, detail });
};

const indexHtml = readSource("index.html");
const robotsTxt = readSource("public/robots.txt");
const sitemapXml = readSource("public/sitemap.xml");
const imageSitemapXml = readSource("public/sitemap-images.xml");
const llmsTxt = readSource("public/llms.txt");
const aiTxt = readSource("public/ai.txt");
const manifest = JSON.parse(readSource("public/manifest.webmanifest"));

const sitemapUrls = [...sitemapXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1]
);
const sitemapLastMods = [...sitemapXml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(
  (match) => match[1]
);

addCheck(
  "landing page exposes canonical indexable metadata",
  indexHtml.includes(`<link rel="canonical" href="${canonicalOrigin}/" />`) &&
    indexHtml.includes('<meta name="robots" content="index,follow" />') &&
    indexHtml.includes('name="googlebot"') &&
    indexHtml.includes('name="bingbot"') &&
    indexHtml.includes("max-image-preview:large") &&
    indexHtml.includes('name="keywords"') &&
    indexHtml.includes('property="og:image"') &&
    indexHtml.includes('name="twitter:card" content="summary_large_image"') &&
    indexHtml.includes('type="application/ld+json"') &&
    indexHtml.includes('"@graph"') &&
    indexHtml.includes('"@type": "Organization"') &&
    indexHtml.includes('"@type": "WebSite"') &&
    indexHtml.includes('"@type": "WebApplication"') &&
    indexHtml.includes('"featureList"') &&
    indexHtml.includes('"https://t.me/SmartNutritionAssistBot"') &&
    indexHtml.includes(`"url": "${canonicalOrigin}/"`),
  "index.html must expose canonical URL, crawler-specific robots, social preview metadata, and Organization/WebSite/WebApplication JSON-LD."
);

addCheck(
  "robots exposes sitemap and blocks private SPA surfaces",
    robotsTxt.includes("User-agent: *") &&
    robotsTxt.includes("Allow: /") &&
    robotsTxt.includes("Allow: /llms.txt") &&
    robotsTxt.includes("Allow: /ai.txt") &&
    robotsTxt.includes(`Host: ${canonicalOrigin}`) &&
    robotsTxt.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`) &&
    robotsTxt.includes(`Sitemap: ${canonicalOrigin}/sitemap-images.xml`) &&
    robotsTxt.includes("Disallow: /*?token=") &&
    robotsTxt.includes("Disallow: /*?*token=") &&
    robotsTxt.includes("Disallow: /*?code=") &&
    robotsTxt.includes("Disallow: /*?*code=") &&
    privateOrTokenRoutes.every((route) => robotsTxt.includes(`Disallow: ${route}`)),
  "robots.txt must help crawlers find text/image/AI discovery files while keeping authenticated, token, and app-internal routes out of public indexing."
);

addCheck(
  "sitemap lists only canonical public entry routes",
  sitemapUrls.length === publicSeoUrls.length &&
    publicSeoUrls.every((route) =>
      sitemapUrls.includes(`${canonicalOrigin}${route === "/" ? "/" : route}`)
    ) &&
    privateOrTokenRoutes.every(
      (route) => !sitemapUrls.includes(`${canonicalOrigin}${route}`)
    ),
  "sitemap.xml must list canonical public routes only, not protected app screens or token routes."
);

addCheck(
  "sitemap lastmod dates are current production-era dates",
  sitemapLastMods.length === publicSeoUrls.length &&
    sitemapLastMods.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) &&
    sitemapLastMods.every((date) => date >= "2026-07-21"),
  "sitemap.xml lastmod values must not drift back to stale pre-production dates."
);

addCheck(
  "image sitemap exposes public visual discovery assets only",
  imageSitemapXml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"') &&
    imageSitemapXml.includes(`<loc>${canonicalOrigin}/</loc>`) &&
    imageSitemapXml.includes(`<image:loc>${canonicalOrigin}/og.png</image:loc>`) &&
    imageSitemapXml.includes(`<image:loc>${canonicalOrigin}/icon-512.png</image:loc>`) &&
    privateOrTokenRoutes.every((route) => !imageSitemapXml.includes(`${canonicalOrigin}${route}`)),
  "sitemap-images.xml must expose public brand/app imagery for image discovery without listing protected app routes."
);

addCheck(
  "AI answer engines receive a public project summary without private data",
  llmsTxt.includes("Canonical site: https://smart-nutrition.club/") &&
    llmsTxt.includes("Backend/cloud state is the source of truth") &&
    llmsTxt.includes("should not be indexed") &&
    aiTxt.includes("LLM summary: https://smart-nutrition.club/llms.txt") &&
    aiTxt.includes("Image sitemap: https://smart-nutrition.club/sitemap-images.xml") &&
    aiTxt.includes("Private authenticated app screens") &&
    privateOrTokenRoutes.every((route) => !llmsTxt.includes(`${canonicalOrigin}${route}`)) &&
    privateOrTokenRoutes.every((route) => !aiTxt.includes(`${canonicalOrigin}${route}`)),
  "llms.txt and ai.txt must help AI/search answer engines understand the public product while excluding private route discovery."
);

addCheck(
  "manifest supports installable search-visible app identity",
  manifest.name === "Smart Nutrition | AI nutrition companion" &&
    manifest.short_name === "Smart Nutrition" &&
    manifest.id === "/" &&
    manifest.start_url === "/" &&
    manifest.scope === "/" &&
    manifest.icons?.some((icon) => icon.src === "/icon-512.png") &&
    manifest.categories?.includes("health") &&
    manifest.categories?.includes("fitness") &&
    manifest.categories?.includes("food"),
  "manifest.webmanifest must preserve canonical app identity, install scope, icons, and health/fitness/food categories."
);

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Smart Nutrition SEO discovery audit failed:");
  for (const check of failed) {
    console.error(`FAIL ${check.label}`);
    console.error(`     ${check.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Smart Nutrition SEO discovery audit passed: ${checks.length} checks.`);
}
