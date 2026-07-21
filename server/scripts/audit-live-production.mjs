const defaultAppUrl = "https://smart-nutrition.club";
const defaultApiUrl = "https://smart-nutrition-sk5r.onrender.com";
const requestTimeoutMs = 12_000;

const routeHeavyVendorPrefixes = [
  "analytics-vendor-",
  "browser-image-compression-",
  "capacitor-vendor-",
  "firebase-vendor-",
  "markdown-vendor-",
  "react-three-vendor-",
  "scanner-vendor-",
  "three-core-vendor-",
];

const protectedSitemapFragments = [
  "/admin",
  "/app",
  "/assistant",
  "/community",
  "/dashboard",
  "/meal",
  "/nutrition",
  "/onboarding",
  "/profile",
  "/progress",
  "/scanner",
  "/settings",
  "/verify-email",
  "/reset-password",
  "token=",
];

const checks = [];

const normalizeOrigin = (value) => String(value || "").replace(/\/+$/, "");
const appOrigin = normalizeOrigin(
  process.env.SMART_NUTRITION_LIVE_APP_URL || defaultAppUrl
);
const apiOrigin = normalizeOrigin(
  process.env.SMART_NUTRITION_LIVE_API_URL || defaultApiUrl
);

const joinUrl = (origin, pathname) =>
  `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

const addCheck = (label, pass, detail) => {
  checks.push({ label, pass, detail });
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      redirect: "follow",
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const readText = async (response) => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const readJson = async (response) => {
  const body = await readText(response);

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const collectInitialJavaScriptAssets = (html) => {
  const assets = new Set();
  const scriptPattern = /<script[^>]+src="\/assets\/([^"]+\.js)"/g;
  const modulePreloadPattern =
    /<link[^>]+rel="modulepreload"[^>]+href="\/assets\/([^"]+\.js)"/g;

  for (const match of html.matchAll(scriptPattern)) {
    assets.add(match[1]);
  }

  for (const match of html.matchAll(modulePreloadPattern)) {
    assets.add(match[1]);
  }

  return [...assets].sort((left, right) => left.localeCompare(right));
};

const inspectFrontend = async () => {
  const response = await fetchWithTimeout(joinUrl(appOrigin, "/"));
  const html = await readText(response);

  addCheck(
    "live frontend root returns HTML",
    response.ok && /<!doctype html>/i.test(html),
    `${joinUrl(appOrigin, "/")} must return the deployed Vercel app HTML.`
  );

  addCheck(
    "live frontend has canonical production URL",
    html.includes('<link rel="canonical" href="https://smart-nutrition.club/"'),
    "Landing HTML must keep the canonical https://smart-nutrition.club/ URL."
  );

  addCheck(
    "live frontend exposes PWA manifest",
    html.includes('rel="manifest"') &&
      html.includes("/manifest.webmanifest"),
    "Landing HTML must link the deployed PWA manifest."
  );

  const initialAssets = collectInitialJavaScriptAssets(html);
  addCheck(
    "live frontend has initial JavaScript assets",
    initialAssets.length > 0,
    "Vercel HTML must reference deployed JavaScript assets."
  );

  const routeHeavyInitialAssets = initialAssets.filter((asset) =>
    routeHeavyVendorPrefixes.some((prefix) => asset.startsWith(prefix))
  );
  addCheck(
    "live initial payload excludes route-heavy vendors",
    routeHeavyInitialAssets.length === 0,
    `Scanner, photo, markdown, analytics, native, and 3D vendors must stay route-lazy. Found: ${routeHeavyInitialAssets.join(", ") || "none"}.`
  );

  await Promise.all(
    initialAssets.map(async (asset) => {
      const assetResponse = await fetchWithTimeout(joinUrl(appOrigin, `/assets/${asset}`));
      addCheck(
        `live initial asset resolves: ${asset}`,
        assetResponse.ok,
        `/assets/${asset} must return 200 from the deployed frontend.`
      );
    })
  );
};

const inspectSeoDiscovery = async () => {
  const robotsResponse = await fetchWithTimeout(joinUrl(appOrigin, "/robots.txt"));
  const robotsText = await readText(robotsResponse);

  addCheck(
    "live robots.txt returns 200",
    robotsResponse.ok,
    "robots.txt must be reachable for crawler discovery."
  );

  addCheck(
    "live robots points to canonical sitemap and blocks protected routes",
    robotsText.includes("Sitemap: https://smart-nutrition.club/sitemap.xml") &&
      robotsText.includes("Disallow: /admin") &&
      robotsText.includes("Disallow: /verify-email") &&
      robotsText.includes("Disallow: /reset-password"),
    "robots.txt must advertise the sitemap while blocking protected/token routes."
  );

  const sitemapResponse = await fetchWithTimeout(joinUrl(appOrigin, "/sitemap.xml"));
  const sitemapText = await readText(sitemapResponse);

  addCheck(
    "live sitemap.xml returns 200",
    sitemapResponse.ok,
    "sitemap.xml must be reachable for crawler discovery."
  );

  addCheck(
    "live sitemap lists only public canonical routes",
    sitemapText.includes("<loc>https://smart-nutrition.club/</loc>") &&
      sitemapText.includes("<loc>https://smart-nutrition.club/register</loc>") &&
      sitemapText.includes("<loc>https://smart-nutrition.club/login</loc>") &&
      protectedSitemapFragments.every((fragment) => !sitemapText.includes(fragment)),
    "sitemap.xml must include public entry routes and exclude protected or token routes."
  );

  const manifestResponse = await fetchWithTimeout(
    joinUrl(appOrigin, "/manifest.webmanifest")
  );
  const manifest = await readJson(manifestResponse);
  const icons = Array.isArray(manifest?.icons) ? manifest.icons : [];

  addCheck(
    "live manifest.webmanifest is valid PWA metadata",
    manifestResponse.ok &&
      String(manifest?.name || "").startsWith("Smart Nutrition") &&
      manifest?.id === "/" &&
      manifest?.start_url === "/" &&
      manifest?.scope === "/" &&
      icons.some((icon) => String(icon.sizes || "").includes("512x512")),
    "manifest.webmanifest must keep Smart Nutrition identity, id/start_url/scope, and a 512 icon."
  );
};

const inspectBackend = async () => {
  const healthResponse = await fetchWithTimeout(joinUrl(apiOrigin, "/api/health"));
  const health = await readJson(healthResponse);
  const healthText = JSON.stringify(health || {}).toLowerCase();
  const forbiddenHealthFragments = [
    "telegram",
    "openrouter",
    "groq",
    "google",
    "provider_order",
    "request",
    "warning",
    "limit",
    "keepalive",
    "databaseName".toLowerCase(),
  ];

  addCheck(
    "live backend health is sanitized and cloud-backed",
    healthResponse.ok &&
      health?.ok === true &&
      health?.mode === "remote-cloud" &&
      health?.auth === "httpOnly-cookie-session" &&
      ["mongodb", "postgres"].includes(health?.storage?.engine) &&
      health?.email?.configured === true,
    "/api/health must expose only minimal public liveness state for a cloud-backed deployment."
  );

  addCheck(
    "live backend health does not expose diagnostics",
    forbiddenHealthFragments.every((fragment) => !healthText.includes(fragment)),
    "/api/health must not expose providers, Telegram, metrics, warnings, keepalive, limits, or database names."
  );

  const readyResponse = await fetchWithTimeout(joinUrl(apiOrigin, "/api/ready"));
  const ready = await readJson(readyResponse);
  const readyChecks = ready?.checks || {};

  addCheck(
    "live backend readiness is green",
    readyResponse.ok &&
      ready?.ok === true &&
      ready?.ready === true &&
      readyChecks.storage === true &&
      readyChecks.cache === true &&
      readyChecks.static === true &&
      readyChecks.email === true,
    "/api/ready must confirm storage, cache, static, and email readiness."
  );
};

const inspectCors = async () => {
  const trustedResponse = await fetchWithTimeout(joinUrl(apiOrigin, "/api/health"), {
    method: "OPTIONS",
    headers: {
      Origin: appOrigin,
      "Access-Control-Request-Method": "GET",
    },
  });
  const trustedAllowOrigin = trustedResponse.headers.get(
    "access-control-allow-origin"
  );
  const trustedAllowCredentials = trustedResponse.headers.get(
    "access-control-allow-credentials"
  );

  addCheck(
    "live CORS allows canonical frontend credentials",
    [200, 204].includes(trustedResponse.status) &&
      trustedAllowOrigin === appOrigin &&
      trustedAllowCredentials === "true",
    "Render backend must allow credentialed requests from the canonical Vercel/domain frontend."
  );

  const untrustedOrigin = "https://example.invalid";
  const untrustedResponse = await fetchWithTimeout(joinUrl(apiOrigin, "/api/health"), {
    method: "OPTIONS",
    headers: {
      Origin: untrustedOrigin,
      "Access-Control-Request-Method": "GET",
    },
  });
  const untrustedAllowOrigin = untrustedResponse.headers.get(
    "access-control-allow-origin"
  );

  addCheck(
    "live CORS rejects untrusted credential origin",
    untrustedAllowOrigin !== untrustedOrigin,
    "Render backend must not reflect arbitrary origins for credentialed browser requests."
  );
};

const main = async () => {
  await inspectFrontend();
  await inspectSeoDiscovery();
  await inspectBackend();
  await inspectCors();

  const failed = checks.filter((check) => !check.pass);

  if (failed.length > 0) {
    console.error("Smart Nutrition live production audit failed:");
    for (const check of failed) {
      console.error(`FAIL ${check.label}`);
      console.error(`     ${check.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Smart Nutrition live production audit passed: ${checks.length} checks.`);
};

main().catch((error) => {
  console.error("Smart Nutrition live production audit failed to run.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
