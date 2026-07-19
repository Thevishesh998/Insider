// Job descriptions are authored as rich text. Render only a small, safe subset.
export const safeJobHtml = (value = "") => {
  if (typeof window === "undefined") return "";
  const documentFragment = new DOMParser().parseFromString(value, "text/html");
  const allowedTags = new Set(["P", "BR", "STRONG", "EM", "B", "I", "UL", "OL", "LI", "H2", "H3", "H4", "A"]);
  documentFragment.body.querySelectorAll("*").forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      return;
    }
    [...node.attributes].forEach((attribute) => {
      const isSafeHref = node.tagName === "A" && attribute.name === "href" && /^https?:\/\//i.test(attribute.value);
      if (!isSafeHref) node.removeAttribute(attribute.name);
    });
    if (node.tagName === "A") {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
  return documentFragment.body.innerHTML;
};

export const textPreview = (value = "", length = 150) => {
  if (typeof window === "undefined") return "";
  const text = new DOMParser().parseFromString(value, "text/html").body.textContent || "";
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
};
