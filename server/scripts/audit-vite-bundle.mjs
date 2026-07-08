import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const distDir = path.join(projectRoot, "dist");
const assetsDir = path.join(distDir, "assets");
const indexPath = path.join(distDir, "index.html");

const defaultChunkLimitBytes = 500 * 1024;
const acceptedLazyThreeLimitBytes = 760 * 1024;

const formatKiB = (bytes) => `${(bytes / 1024).toFixed(2)} KiB`;

const listJavaScriptAssets = async () => {
  const entries = await readdir(assetsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
};

const getInitialScripts = async () => {
  const html = await readFile(indexPath, "utf8");
  const scripts = new Set();
  const scriptPattern = /<script[^>]+src="\/assets\/([^"]+\.js)"/g;

  for (const match of html.matchAll(scriptPattern)) {
    scripts.add(match[1]);
  }

  return scripts;
};

const main = async () => {
  const [assets, initialScripts] = await Promise.all([
    listJavaScriptAssets(),
    getInitialScripts(),
  ]);
  const violations = [];
  const reviewedLargeChunks = [];

  for (const asset of assets) {
    const assetPath = path.join(assetsDir, asset);
    const { size } = await stat(assetPath);
    const isInitialScript = initialScripts.has(asset);
    const isAcceptedLazyThreeChunk = asset.startsWith("three-core-vendor-");

    if (isInitialScript && size > defaultChunkLimitBytes) {
      violations.push(
        `${asset} is an initial script at ${formatKiB(size)}; initial scripts must stay under ${formatKiB(defaultChunkLimitBytes)}.`
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

  if (violations.length > 0) {
    console.error("Bundle audit failed:");
    for (const violation of violations) {
      console.error(`FAIL ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Bundle audit passed: ${assets.length} JavaScript chunks checked, ${initialScripts.size} initial script(s).`
  );
};

main().catch((error) => {
  console.error("Bundle audit failed to inspect dist output.");
  console.error(error);
  process.exitCode = 1;
});
