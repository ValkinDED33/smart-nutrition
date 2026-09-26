const readHeader = (response, name) =>
  response?.headers?.get?.(name) ?? "missing";

export const describeBackendHealth = ({ response, health }) =>
  `status=${response.status} ok=${String(health?.ok)} mode=${
    health?.mode ?? "missing"
  } auth=${health?.auth ?? "missing"} storage=${
    health?.storage?.engine ?? "missing"
  } email=${String(health?.email?.configured)} deployment=${
    health?.deployment?.provider ?? "missing"
  } commit=${health?.deployment?.commit ?? "missing"}`;

export const describeBackendDriftHint = ({ response, health }) => {
  const exposeHeaders = response.headers.get("access-control-expose-headers");
  const deploymentProvider = health?.deployment?.provider;

  if (!deploymentProvider || !exposeHeaders) {
    return " Likely stale Render deploy or wrong backend source: current local code exposes deployment and X-Request-Id diagnostics.";
  }

  return "";
};

export const describeCorsResponse = (response) =>
  `status=${response.status} ACAO=${readHeader(
    response,
    "access-control-allow-origin"
  )} ACAC=${readHeader(response, "access-control-allow-credentials")} ACAM=${readHeader(
    response,
    "access-control-allow-methods"
  )} ACAH=${readHeader(response, "access-control-allow-headers")} ACEH=${readHeader(
    response,
    "access-control-expose-headers"
  )}`;

export const describeHealthResponse = ({ response, data }) =>
  `status=${response.status} ok=${String(data?.ok)} mode=${
    data?.mode ?? "missing"
  } auth=${data?.auth ?? "missing"} storage=${
    data?.storage?.engine ?? "missing"
  } email=${String(data?.email?.configured)} deployment=${
    data?.deployment?.provider ?? "missing"
  } commit=${data?.deployment?.commit ?? "missing"} ACEH=${readHeader(
    response,
    "access-control-expose-headers"
  )}`;

export const describeDeploymentDriftHint = ({ response, data }) => {
  const exposeHeaders = response.headers.get("access-control-expose-headers");
  const deploymentProvider = data?.deployment?.provider;

  if (!deploymentProvider || !exposeHeaders) {
    return " Likely stale Render deploy or wrong backend source: authenticated smoke is unsafe until production exposes deployment and X-Request-Id diagnostics.";
  }

  return "";
};

export const hasExposedRequestId = (response) =>
  String(response.headers.get("access-control-expose-headers") ?? "")
    .toLowerCase()
    .split(",")
    .map((header) => header.trim())
    .includes("x-request-id");

export const isRenderCloudHealth = (health) =>
  health?.ok === true &&
  health?.mode === "remote-cloud" &&
  health?.auth === "httpOnly-cookie-session" &&
  ["mongodb", "postgres"].includes(health?.storage?.engine) &&
  health?.email?.configured === true &&
  health?.deployment?.provider === "render";
