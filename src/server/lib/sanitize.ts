import sanitizeHtml from "sanitize-html";

/**
 * Limpia el HTML del editor antes de guardarlo: solo etiquetas de formato,
 * enlaces http(s)/mailto/tel y sin atributos de evento ni estilos en línea.
 */
export function cleanHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const out = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "h2", "h3", "h4", "hr", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "code", "pre", "span"],
    allowedAttributes: { a: ["href", "target", "rel", "title"], img: ["src", "alt", "width", "height"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: "noopener noreferrer nofollow", ...(attribs.target === "_blank" ? { target: "_blank" } : {}) } }),
    },
  }).trim();
  return out || null;
}

const decodeEntities = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/**
 * Texto plano: elimina cualquier etiqueta y devuelve el texto sin entidades HTML
 * (los consumidores lo renderizan como texto, no como HTML, así que no debe quedar escapado).
 */
export const cleanText = (s: string | null | undefined) => (s ? decodeEntities(sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} })).trim() || null : null);
