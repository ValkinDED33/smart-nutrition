import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const distDir = path.join(projectRoot, "dist");
const assetsDir = path.join(distDir, "assets");
const indexPath = path.join(distDir, "index.html");

const defaultChunkLimitBytes = 500 * 1024;
const acceptedLazyThreeLimitBytes = 760 * 1024;
const acceptedInitialPayloadLimitBytes = 1_180 * 1024;
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

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

const listJavaScriptAssets = async () => {
  const entries = await readdir(assetsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
};

const getInitialAssets = async () => {
  const html = await readFile(indexPath, "utf8");
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

  return assets;
};

const main = async () => {
  const [assets, initialAssets] = await Promise.all([
    listJavaScriptAssets(),
    getInitialAssets(),
  ]);
  const violations = [];
  const reviewedLargeChunks = [];
  let initialPayloadBytes = 0;

  for (const asset of assets) {
    const assetPath = path.join(assetsDir, asset);
    const { size } = await stat(assetPath);
    const isInitialAsset = initialAssets.has(asset);
    const isAcceptedLazyThreeChunk = asset.startsWith("three-core-vendor-");
    const isRouteHeavyVendor = routeHeavyVendorPrefixes.some((prefix) =>
      asset.startsWith(prefix)
    );

    if (isInitialAsset) {
      initialPayloadBytes += size;
    }

    if (isInitialAsset && isRouteHeavyVendor) {
      violations.push(
        `${asset} is preloaded by index.html; scanner, photo, markdown, analytics, native, and 3D vendors must stay route-lazy.`
      );
      continue;
    }

    if (isInitialAsset && size > defaultChunkLimitBytes) {
      violations.push(
        `${asset} is an initial asset at ${formatKiB(size)}; initial assets must stay under ${formatKiB(defaultChunkLimitBytes)}.`
      );
      continue;
    }

    if (isAcceptedLazyThreeChunk) {
      if (size > acceptedLazyThreeLimitBytes) {
        violations.push(
          `${asset} is ${formatKiB(size)}; accepted lazy 3D chunk limit is ${formatKiB(acceptedLazyThreeLimitBytes)}.`
        );
      } else if (size > defaultChunkLimitBytes) {
        reviewedLargeChunks.push(
          `${asset} ${formatKiB(size)} accepted: lazy 3D companion vendor, guarded by runtime/mobile checks.`
        );
      }

      continue;
    }

    if (size > defaultChunkLimitBytes) {
      violations.push(
        `${asset} is ${formatKiB(size)}; non-3D chunks must stay under ${formatKiB(defaultChunkLimitBytes)}.`
      );
    }
  }

  if (reviewedLargeChunks.length > 0) {
    console.log("Reviewed large lazy chunks:");
    for (const chunk of reviewedLargeChunks) {
      console.log(`OK  ${chunk}`);
    }
  }

  if (initialPayloadBytes > acceptedInitialPayloadLimitBytes) {
    violations.push(
      `initial JavaScript payload is ${formatKiB(initialPayloadBytes)}; accepted initial payload limit is ${formatKiB(acceptedInitialPayloadLimitBytes)}.`
    );
  }

  if (violations.length > 0) {
    console.error("Bundle audit failed:");
    for (const violation of violations) {
      console.error(`FAIL ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Bundle audit passed: ${assets.length} JavaScript chunks checked, ${initialAssets.size} initial asset(s), ${formatKiB(initialPayloadBytes)} initial payload.`
  );
};

main().catch((error) => {
  console.error("Bundle audit failed to inspect dist output.");
  console.error(error);
  process.exitCode = 1;
});
