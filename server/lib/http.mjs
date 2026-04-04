export const setCorsHeaders = (request, response) => {
  const origin = request.headers.origin;

  response.setHeader("Access-Control-Allow-Origin", origin || "*");
  response.setHeader("Vary", "Origin");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Device-Id, X-State-Version"
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
};

export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

export const sendNoContent = (response, statusCode = 204) => {
  response.writeHead(statusCode);
  response.end();
};

export const sendError = (response, statusCode, code, message, details = undefined) => {
  sendJson(response, statusCode, {
    code,
    message,
    ...(details && typeof details === "object" ? details : {}),
  });
};

export const readJsonBody = async (request, bodyLimitBytes) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;

    request.on("data", (chunk) => {
      totalLength += chunk.length;

      if (totalLength > bodyLimitBytes) {
        reject(new Error("BODY_TOO_LARGE"));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });

    request.on("error", reject);
  });
