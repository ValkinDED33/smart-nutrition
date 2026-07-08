const DEFAULT_SENSITIVE_SEARCH_PARAMS = [
  "token",
  "access_token",
  "code",
  "key",
  "password",
  "email",
] as const;

interface LocationParts {
  pathname: string;
  search: string;
  hash: string;
}

export const stripSensitiveSearchParamsFromLocation = (
  location: LocationParts,
  sensitiveNames: readonly string[] = DEFAULT_SENSITIVE_SEARCH_PARAMS
) => {
  const searchParams = new URLSearchParams(location.search);
  let changed = false;

  sensitiveNames.forEach((name) => {
    if (searchParams.has(name)) {
      searchParams.delete(name);
      changed = true;
    }
  });

  const search = searchParams.toString();

  return {
    changed,
    path: `${location.pathname}${search ? `?${search}` : ""}${location.hash}`,
  };
};

export const clearSensitiveSearchParamsFromCurrentUrl = (
  sensitiveNames: readonly string[] = DEFAULT_SENSITIVE_SEARCH_PARAMS
) => {
  if (typeof window === "undefined") {
    return false;
  }

  const { changed, path } = stripSensitiveSearchParamsFromLocation(
    window.location,
    sensitiveNames
  );

  if (changed) {
    window.history.replaceState(window.history.state, document.title, path);
  }

  return changed;
};
