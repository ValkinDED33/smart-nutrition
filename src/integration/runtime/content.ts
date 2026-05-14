import createDOMPurify, { type Config, type WindowLike } from "dompurify";

const stripUnsafeHtmlWithoutDom = (html: string) =>
  html
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");

export const sanitizeHtml = (
  html: string,
  config: Config = {},
  root: WindowLike | undefined = typeof window === "undefined" ? undefined : window
) => {
  if (!root) {
    return stripUnsafeHtmlWithoutDom(html);
  }

  return createDOMPurify(root).sanitize(html, {
    USE_PROFILES: { html: true },
    ...config,
  });
};
