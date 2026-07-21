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
    indexHtml.includes('property="og:image"') &&
    indexHtml.includes('name="twitter:card" content="summary_large_image"') &&
    indexHtml.includes('type="application/ld+json"') &&
    indexHtml.includes('"@type": "WebApplication"') &&
    indexHtml.includes(`"url": "${canonicalOrigin}/"`),
  "index.html must expose canonical URL, index/follow robots, social preview metadata, and WebApplication JSON-LD."
);

addCheck(
  "robots exposes sitemap and blocks private SPA surfaces",
  robotsTxt.includes("User-agent: *") &&
    robotsTxt.includes("Allow: /") &&
    robotsTxt.includes(`Host: ${canonicalOrigin}`) &&
    robotsTxt.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`) &&
    privateOrTokenRoutes.every((route) => robotsTxt.includes(`Disallow: ${route}`)),
  "robots.txt must help crawlers find the sitemap while keeping authenticated, token, and app-internal routes out of public indexing."
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
