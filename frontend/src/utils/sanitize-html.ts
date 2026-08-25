const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "FIGURE",
  "H1",
  "H2",
  "H3",
  "H4",
  "HR",
  "I",
  "IFRAME",
  "IMG",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "UL",
]);

const allowedIframeHosts = new Set(["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"]);
const allowedVideoProviders = new Set(["youtube", "instagram"]);

export type VideoProvider = "youtube" | "instagram";

export type VideoEmbed = {
  provider: VideoProvider;
  url: string;
  embedUrl: string;
  videoId?: string;
  shortcode?: string;
  thumbnailUrl?: string;
};

function isSafeUrl(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:", "data:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isSafeIframeSrc(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    return ["http:", "https:"].includes(parsed.protocol) && allowedIframeHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

function isAllowedVideoUrl(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

    return ["youtube.com", "m.youtube.com", "youtu.be", "instagram.com"].includes(hostname) && ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function cleanElement(element: Element) {
  Array.from(element.children).forEach(cleanElement);

  if (!allowedTags.has(element.tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();

    if (name.startsWith("on") || name === "style") {
      element.removeAttribute(attribute.name);
      return;
    }

    if (
      element.tagName === "FIGURE" &&
      ["data-content-block", "data-provider", "data-video-id", "data-shortcode", "data-url", "data-embed-url"].includes(name)
    ) {
      if (name === "data-content-block" && value !== "video") {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "data-provider" && !allowedVideoProviders.has(value)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === "data-url" || name === "data-embed-url") && !isAllowedVideoUrl(value)) {
        element.removeAttribute(attribute.name);
      }

      return;
    }

    if (name === "class" && element.hasAttribute("data-content-block")) {
      return;
    }

    if (element.tagName === "A" && name === "href") {
      if (isSafeUrl(value)) {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      } else {
        element.removeAttribute(attribute.name);
      }
      return;
    }

    if (element.tagName === "IMG" && ["src", "alt", "title"].includes(name)) {
      if (name === "src" && !isSafeUrl(value)) {
        element.removeAttribute(attribute.name);
      }
      return;
    }

    if (element.tagName === "IFRAME" && name === "src") {
      if (isSafeIframeSrc(value)) {
        element.setAttribute("allowfullscreen", "");
      } else {
        element.remove();
      }
      return;
    }

    if (element.tagName === "IFRAME" && ["title", "allow", "allowfullscreen"].includes(name)) {
      return;
    }

    element.removeAttribute(attribute.name);
  });
}

export function sanitizeHtml(html: string) {
  if (typeof window === "undefined" || !html.trim()) {
    return "";
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  Array.from(template.content.children).forEach(cleanElement);

  return template.innerHTML;
}

export function parseVideoUrl(rawUrl: string): VideoEmbed | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    let videoId: string | null = null;

    if (hostname === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      videoId = parsed.searchParams.get("v");

      if (!videoId && parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/").filter(Boolean)[1] ?? null;
      }

      if (!videoId && parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }

    if (videoId && /^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
      return {
        provider: "youtube",
        url: parsed.href,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        videoId,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    if (hostname === "instagram.com") {
      const [kind, shortcode] = parsed.pathname.split("/").filter(Boolean);

      if ((kind === "p" || kind === "reel") && shortcode && /^[A-Za-z0-9_-]+$/.test(shortcode)) {
        return {
          provider: "instagram",
          url: parsed.href,
          embedUrl: `https://www.instagram.com/${kind}/${shortcode}/embed`,
          shortcode,
        };
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function createVideoBlockHtml(video: VideoEmbed) {
  const videoId = video.videoId ? ` data-video-id="${video.videoId}"` : "";
  const shortcode = video.shortcode ? ` data-shortcode="${video.shortcode}"` : "";

  return `<figure class="content-video" data-content-block="video" data-provider="${video.provider}"${videoId}${shortcode} data-url="${video.url}" data-embed-url="${video.embedUrl}"></figure><p><br></p>`;
}

export function renderArticleContentHtml(html: string) {
  const safeHtml = sanitizeHtml(html);

  if (!safeHtml) {
    return "";
  }

  const template = document.createElement("template");
  template.innerHTML = safeHtml;

  template.content.querySelectorAll<HTMLElement>('[data-content-block="video"]').forEach((block) => {
    const provider = block.dataset.provider;
    const embedUrl = block.dataset.embedUrl;
    const url = block.dataset.url;
    const videoId = block.dataset.videoId;

    if (provider === "youtube" && embedUrl && videoId) {
      block.className = "content-video content-video--youtube";
      block.innerHTML = `<iframe src="${embedUrl}" title="Video de YouTube" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      return;
    }

    if (provider === "instagram" && embedUrl && url) {
      block.className = "content-video content-video--instagram";
      block.innerHTML = `<iframe src="${embedUrl}" title="Publicación de Instagram" loading="lazy"></iframe><p><a href="${url}" target="_blank" rel="noopener noreferrer">Abrir contenido en Instagram →</a></p>`;
      return;
    }

    block.remove();
  });

  return template.innerHTML;
}

export function plainTextToHtml(text: string) {
  if (!text) {
    return "";
  }

  const escapeElement = document.createElement("div");

  return text
    .split(/\r?\n{2,}/)
    .map((paragraph) => {
      const lines = paragraph.split(/\r?\n/).filter(Boolean);
      escapeElement.textContent = lines.join("\n");
      return `<p>${escapeElement.innerHTML.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}
