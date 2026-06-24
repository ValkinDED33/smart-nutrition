import { promises as fs } from "node:fs";
import path from "node:path";
import { sendError } from "../lib/http.mjs";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const fileExists = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
};

const isInsideDirectory = (rootDir, candidatePath) => {
  const relativePath = path.relative(rootDir, candidatePath);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
};

const getContentType = (filePath) =>
  mimeTypes.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";

const getCacheControl = (filePath) => {
  const isAsset = filePath.includes(`${path.sep}assets${path.sep}`);
  const fileName = path.basename(filePath).toLowerCase();

  if (isAsset) {
    return "public, max-age=31536000, immutable";
  }

  if (fileName === "index.html" || fileName === "sw.js") {
    return "no-store, max-age=0";
  }

  return "no-cache";
};

const sendStaticFile = async (request, response, filePath) => {
  const body = await fs.readFile(filePath);

  response.writeHead(200, {
    "Content-Type": getContentType(filePath),
    "Content-Length": String(body.byteLength),
    "Cache-Control": getCacheControl(filePath),
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  response.end(body);
};

export const staticFileRuntimeInternals = {
  getCacheControl,
};

export const createStaticFileServer = async ({ staticDir, serveStatic }) => {
  const staticRoot = path.resolve(staticDir);
  const staticIndexPath = path.join(staticRoot, "index.html");
  const staticAvailable = serveStatic && (await fileExists(staticIndexPath));

  const tryServeStatic = async (request, response, pathname) => {
    if (!staticAvailable || !["GET", "HEAD"].includes(request.method ?? "")) {
      return false;
    }

    let decodedPathname = pathname;

    try {
      decodedPathname = decodeURIComponent(pathname);
    } catch {
      sendError(response, 400, "INVALID_PATH", "Invalid request path.");
      return true;
    }

    const requestedPath =
      decodedPathname === "/"
        ? staticIndexPath
        : path.resolve(staticRoot, decodedPathname.replace(/^\/+/, ""));

    if (!isInsideDirectory(staticRoot, requestedPath)) {
      sendError(response, 404, "NOT_FOUND", "File not found.");
      return true;
    }

    if (await fileExists(requestedPath)) {
      await sendStaticFile(request, response, requestedPath);
      return true;
    }

    if (!path.extname(decodedPathname) && await fileExists(staticIndexPath)) {
      await sendStaticFile(request, response, staticIndexPath);
      return true;
    }

    return false;
  };

  return {
    staticAvailable,
    staticRoot,
    staticIndexPath,
    tryServeStatic,
  };
};
