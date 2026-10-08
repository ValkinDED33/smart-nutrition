import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const canonicalOrigin = "https://www.smart-nutrition.club";
const publicSeoUrls = [
  "/",
  "/uk.html",
  "/pl.html",
  "/en.html",
  "/ru.html",
  "/ai-nutrition-companion.html",
  "/meal-planner.html",
  "/barcode-scanner.html",
  "/photo-meal-recognition.html",
  "/hydration-tracker.html",
  "/family-wellness.html",
  "/telegram-nutrition-assistant.html",
  "/register",
  "/login",
];
const topicSeoUrls = publicSeoUrls.filter((route) => route.endsWith(".html"));
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
    indexHtml.includes(`hreflang="x-default" href="${canonicalOrigin}/"`) &&
    indexHtml.includes(`hreflang="uk" href="${canonicalOrigin}/uk.html"`) &&
    indexHtml.includes(`hreflang="pl" href="${canonicalOrigin}/pl.html"`) &&
    indexHtml.includes(`hreflang="en" href="${canonicalOrigin}/en.html"`) &&
    indexHtml.includes(`hreflang="ru" href="${canonicalOrigin}/ru.html"`) &&
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
  "landing page exposes crawlable fallback links",
  indexHtml.includes("<noscript>") &&
    indexHtml.includes("AI nutrition companion") &&
    topicSeoUrls.every((route) => indexHtml.includes(`href="${route}"`)) &&
    topicSeoUrls.every((route) => indexHtml.includes(`${canonicalOrigin}${route}`)),
  "index.html must provide non-JavaScript discovery links to public topic pages."
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
    privateOrTokenRoutes.every((route) => robotsTxt.includes(`Disallow: ${route}`)) &&
    topicSeoUrls.every((route) => robotsTxt.includes(`Allow: ${route}`)),
  "robots.txt must help crawlers find text/image/AI discovery files while keeping authenticated, token, and app-internal routes out of public indexing."
);

addCheck(
  "sitemap lists canonical public entry and topic routes",
  sitemapUrls.length === publicSeoUrls.length &&
    publicSeoUrls.every((route) =>
      sitemapUrls.includes(`${canonicalOrigin}${route === "/" ? "/" : route}`)
    ) &&
    sitemapXml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"') &&
    sitemapXml.includes(`hreflang="uk" href="${canonicalOrigin}/uk.html"`) &&
    sitemapXml.includes(`hreflang="pl" href="${canonicalOrigin}/pl.html"`) &&
    sitemapXml.includes(`hreflang="en" href="${canonicalOrigin}/en.html"`) &&
    sitemapXml.includes(`hreflang="ru" href="${canonicalOrigin}/ru.html"`) &&
    privateOrTokenRoutes.every(
      (route) => !sitemapUrls.includes(`${canonicalOrigin}${route}`)
    ),
  "sitemap.xml must list canonical public entry/topic routes, not protected app screens or token routes."
);

addCheck(
  "sitemap lastmod dates are current production-era dates",
  sitemapLastMods.length === publicSeoUrls.length &&
    sitemapLastMods.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)) &&
    sitemapLastMods.every((date) => date >= "2026-10-08"),
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
  llmsTxt.includes(`Canonical site: ${canonicalOrigin}/`) &&
    llmsTxt.includes("Backend/cloud state is the source of truth") &&
    llmsTxt.includes("should not be indexed") &&
    topicSeoUrls.every((route) => llmsTxt.includes(`${canonicalOrigin}${route}`)) &&
    aiTxt.includes(`LLM summary: ${canonicalOrigin}/llms.txt`) &&
    aiTxt.includes(`Image sitemap: ${canonicalOrigin}/sitemap-images.xml`) &&
    aiTxt.includes("Topic pages cover") &&
    aiTxt.includes("Private authenticated app screens") &&
    privateOrTokenRoutes.every((route) => !llmsTxt.includes(`${canonicalOrigin}${route}`)) &&
    privateOrTokenRoutes.every((route) => !aiTxt.includes(`${canonicalOrigin}${route}`)),
  "llms.txt and ai.txt must help AI/search answer engines understand the public product while excluding private route discovery."
);

for (const route of topicSeoUrls) {
  const source = readSource(`public${route}`);
  addCheck(
    `topic page is crawlable: ${route}`,
    source.includes("<!doctype html>") &&
      source.includes(`rel="canonical" href="${canonicalOrigin}${route}"`) &&
      source.includes('name="description"') &&
      source.includes('name="robots" content="index,follow') &&
      source.includes('property="og:image"') &&
      source.includes('href="/register"') &&
      !source.includes("token=") &&
      !source.includes("/dashboard"),
    `${route} must be a real public HTML page with canonical metadata, social preview, conversion link, and no private route discovery.`
  );
}

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
