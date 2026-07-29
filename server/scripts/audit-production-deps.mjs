import { readdirSync, readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const currentScriptPath = fileURLToPath(import.meta.url);
const allowedReactRouterRscAdvisoryUrl =
  "https://github.com/advisories/GHSA-qwww-vcr4-c8h2";

const sourceRoots = ["src", "server"]
  .map((sourceRoot) => path.join(rootDir, sourceRoot))
  .filter((sourceRoot) => {
    try {
      return statSync(sourceRoot).isDirectory();
    } catch {
      return false;
    }
  });

const rscRuntimePattern =
  /RSCHydratedRouter|RSCStaticRouter|ServerRouter|HydratedRouter|@react-router\/node|react-router\/serve|createRequestHandler|unstable_/;

const collectSourceFiles = (roots) => {
  const pending = [...roots];
  const files = [];

  while (pending.length > 0) {
    const currentPath = pending.pop();

    if (!currentPath) {
      continue;
    }

    const stats = statSync(currentPath);

    if (stats.isDirectory()) {
      for (const entry of readdirSync(currentPath)) {
        pending.push(path.join(currentPath, entry));
      }
      continue;
    }

    if (
      currentPath !== currentScriptPath &&
      /\.(mjs|cjs|js|jsx|ts|tsx)$/.test(currentPath)
    ) {
      files.push(currentPath);
    }
  }

  return files;
};

const assertReactRouterRscIsNotUsed = () => {
  const matches = collectSourceFiles(sourceRoots)
    .map((filePath) => ({
      filePath,
      source: readFileSync(filePath, "utf8"),
    }))
    .filter(({ source }) => rscRuntimePattern.test(source));

  if (matches.length > 0) {
    const relativeFiles = matches
      .map(({ filePath }) => path.relative(rootDir, filePath))
      .join(", ");
    throw new Error(
      `React Router RSC advisory cannot be waived because RSC/server routing usage was found: ${relativeFiles}`
    );
  }
};

const runNpmAudit = () => {
  try {
    const stdout = execSync(
      "npm audit --omit=dev --audit-level=moderate --json",
      {
        cwd: rootDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    return stdout;
  } catch (error) {
    if (typeof error.stdout === "string" && error.stdout.trim()) {
      return error.stdout;
    }

    throw error;
  }
};

const auditReport = JSON.parse(runNpmAudit());
const vulnerabilities = Object.values(auditReport.vulnerabilities ?? {});
const unresolved = [];
const allowed = [];

assertReactRouterRscIsNotUsed();

for (const vulnerability of vulnerabilities) {
  const via = Array.isArray(vulnerability.via) ? vulnerability.via : [];
  const advisoryUrls = via
    .filter((entry) => typeof entry === "object" && entry !== null)
    .map((entry) => entry.url)
    .filter(Boolean);
  const isReactRouterRscAdvisory =
    vulnerability.name === "react-router" &&
    advisoryUrls.length > 0 &&
    advisoryUrls.every((url) => url === allowedReactRouterRscAdvisoryUrl);
  const isReactRouterDomWrapperOnly =
    vulnerability.name === "react-router-dom" &&
    via.length === 1 &&
    via[0] === "react-router";
  const isAllowedReactRouterRscOnly =
    isReactRouterRscAdvisory || isReactRouterDomWrapperOnly;

  if (isAllowedReactRouterRscOnly) {
    allowed.push(vulnerability.name);
    continue;
  }

  unresolved.push(vulnerability);
}

if (unresolved.length > 0) {
  console.error(
    JSON.stringify(
      {
        message: "Production dependency audit failed.",
        unresolved: unresolved.map((vulnerability) => ({
          name: vulnerability.name,
          severity: vulnerability.severity,
          range: vulnerability.range,
          via: vulnerability.via,
        })),
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} else {
  const allowedNote =
    allowed.length > 0
      ? ` Allowed non-applicable React Router RSC advisory for SPA runtime: ${[
          ...new Set(allowed),
        ].join(", ")}.`
      : "";
  console.log(`Production dependency audit passed.${allowedNote}`);
}
