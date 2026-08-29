const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "DIV",
  "EM",
  "FIGCAPTION",
  "FIGURE",
  "H1",
  "H2",
  "H3",
  "HR",
  "I",
  "IFRAME",
  "IMG",
  "LI",
  "OL",
  "P",
  "SPAN",
  "S",
  "STRONG",
  "TABLE",
  "TBODY",
  "TD",
  "TH",
  "THEAD",
  "TR",
  "U",
  "UL",
]);

const allowedIframeHosts = new Set([
  "www.facebook.com",
  "www.instagram.com",
  "www.tiktok.com",
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "drive.google.com",
]);
const allowedVideoProviders = new Set(["youtube", "instagram", "tiktok", "x", "facebook", "drive"]);
const allowedClasses = new Set([
  "article-callout",
  "article-callout--info",
  "article-callout--note",
  "article-callout--important",
  "article-callout--warning",
  "article-callout--update",
  "article-image",
  "content-video",
  "content-video--youtube",
  "content-video--instagram",
  "content-video--tiktok",
  "content-video--x",
  "content-video--facebook",
  "content-video--drive",
  "content-video__fallback",
  "image-align-left",
  "image-align-center",
  "image-align-right",
  "image-align-full",
  "image-size-25",
  "image-size-50",
  "image-size-75",
  "image-size-100",
  "text-align-left",
  "text-align-center",
  "text-align-right",
  "text-align-justify",
  "text-size-8",
  "text-size-9",
  "text-size-10",
  "text-size-11",
  "text-size-12",
  "text-size-14",
  "text-size-16",
  "text-size-18",
  "text-size-20",
  "text-size-22",
  "text-size-24",
  "text-size-26",
  "text-size-28",
  "text-size-32",
  "text-size-36",
  "text-size-40",
  "text-size-44",
  "text-size-48",
  "text-size-54",
  "text-size-60",
  "text-size-64",
  "text-size-72",
  "text-color-carbon",
  "text-color-gray",
  "text-color-gold",
  "text-color-navy",
  "text-color-red",
  "text-color-green",
  "font-institucional",
  "font-arial",
  "font-calibri",
  "font-times-new-roman",
  "font-georgia",
  "font-verdana",
  "font-tahoma",
  "font-trebuchet",
  "font-garamond",
]);
const allowedTextAlignments = new Set(["left", "center", "right", "justify"]);

export type VideoProvider = "youtube" | "instagram" | "tiktok" | "x" | "facebook" | "drive";

export type VideoEmbed = {
  provider: VideoProvider;
  url: string;
  embedUrl: string;
  videoId?: string;
  shortcode?: string;
  postId?: string;
  fileId?: string;
  thumbnailUrl?: string;
};

type UnsupportedMedia = {
  provider: "unsupported";
  url: string;
  reason: string;
};

export type MediaDetection = VideoEmbed | UnsupportedMedia;

function isSafeUrl(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol) || /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(value);
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

    return ["youtube.com", "m.youtube.com", "youtu.be", "instagram.com", "tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com", "x.com", "twitter.com", "facebook.com", "m.facebook.com", "fb.watch", "drive.google.com"].includes(hostname) && ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function hostWithoutWww(url: URL) {
  return url.hostname.replace(/^www\./, "").toLowerCase();
}

function htmlAttribute(value: string) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML.replace(/"/g, "&quot;");
}

function unsupportedMedia(url: string, reason = "Este enlace no pertenece a una plataforma compatible."): UnsupportedMedia {
  return { provider: "unsupported", url, reason };
}

function cleanElement(element: Element) {
  Array.from(element.children).forEach(cleanElement);

  const replacementTag = element.tagName === "B"
    ? "strong"
    : element.tagName === "I"
      ? "em"
      : element.tagName === "STRIKE" || element.tagName === "DEL"
        ? "s"
        : null;

  if (replacementTag) {
    const replacement = document.createElement(replacementTag);
    replacement.replaceChildren(...Array.from(element.childNodes));
    element.replaceWith(replacement);
    cleanElement(replacement);
    return;
  }

  if (!allowedTags.has(element.tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  const style = element.getAttribute("style") ?? "";
  const textAlignMatch = style.match(/(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)\s*(?:;|$)/i);

  if (textAlignMatch && allowedTextAlignments.has(textAlignMatch[1].toLowerCase())) {
    element.classList.add(`text-align-${textAlignMatch[1].toLowerCase()}`);
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value.trim();

    if (name.startsWith("on") || name === "style" || name.startsWith("mso-")) {
      element.removeAttribute(attribute.name);
      return;
    }

    if (
      element.tagName === "FIGURE" &&
      ["data-content-block", "data-provider", "data-video-id", "data-shortcode", "data-post-id", "data-file-id", "data-url", "data-embed-url"].includes(name)
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

      if ((name === "data-video-id" || name === "data-shortcode" || name === "data-post-id" || name === "data-file-id") && !/^[A-Za-z0-9_-]+$/.test(value)) {
        element.removeAttribute(attribute.name);
      }

      return;
    }

    if (name === "class") {
      const safeClasses = value.split(/\s+/).filter((className) => allowedClasses.has(className));

      if (safeClasses.length) {
        element.setAttribute("class", safeClasses.join(" "));
      } else {
        element.removeAttribute(attribute.name);
      }
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

  if (element.tagName === "SPAN" && element.attributes.length === 0) {
    element.replaceWith(...Array.from(element.childNodes));
  }
}

function mediaFallbackHtml(url: string, label: string, message = "Contenido externo no disponible") {
  return `<div class="content-video__fallback"><strong>${message}</strong><a href="${htmlAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a></div>`;
}

export function sanitizeHtml(html: string) {
  if (typeof window === "undefined" || !html.trim()) {
    return "";
  }

  const template = document.createElement("template");
  template.innerHTML = html;
  const comments = document.createTreeWalker(template.content, NodeFilter.SHOW_COMMENT);
  const commentsToRemove: Comment[] = [];
  while (comments.nextNode()) {
    commentsToRemove.push(comments.currentNode as Comment);
  }
  commentsToRemove.forEach((comment) => comment.remove());
  Array.from(template.content.children).forEach(cleanElement);

  return template.innerHTML;
}

export function detectMediaProvider(rawUrl: string): MediaDetection {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = hostWithoutWww(parsed);
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

      if ((kind === "p" || kind === "reel" || kind === "tv") && shortcode && /^[A-Za-z0-9_-]+$/.test(shortcode)) {
        return {
          provider: "instagram",
          url: parsed.href,
          embedUrl: `https://www.instagram.com/${kind}/${shortcode}/embed`,
          shortcode,
        };
      }
    }

    if (hostname === "tiktok.com" || hostname === "m.tiktok.com" || hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com") {
      const videoMatch = parsed.pathname.match(/\/@[^/]+\/video\/(\d+)/);
      const sharedCode = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
      const videoId = videoMatch?.[1] ?? (/^[A-Za-z0-9]+$/.test(sharedCode) ? sharedCode : "");

      if (videoId) {
        return {
          provider: "tiktok",
          url: parsed.href,
          embedUrl: /^\d+$/.test(videoId) ? `https://www.tiktok.com/embed/v2/${videoId}` : parsed.href,
          videoId,
        };
      }
    }

    if (hostname === "x.com" || hostname === "twitter.com") {
      const [, username, kind, postId] = parsed.pathname.split("/");

      if (username && kind === "status" && postId && /^\d+$/.test(postId)) {
        return {
          provider: "x",
          url: `https://x.com/${username}/status/${postId}`,
          embedUrl: `https://x.com/${username}/status/${postId}`,
          postId,
        };
      }
    }

    if (hostname === "facebook.com" || hostname === "m.facebook.com" || hostname === "fb.watch") {
      const isKnownFacebookContent = hostname === "fb.watch" || parsed.pathname.includes("/videos/") || parsed.pathname.includes("/posts/") || parsed.searchParams.has("story_fbid") || parsed.searchParams.has("v");

      if (isKnownFacebookContent) {
        const normalizedUrl = parsed.href;
        const plugin = parsed.pathname.includes("/videos/") || parsed.searchParams.has("v") || hostname === "fb.watch" ? "video.php" : "post.php";

        return {
          provider: "facebook",
          url: normalizedUrl,
          embedUrl: `https://www.facebook.com/plugins/${plugin}?href=${encodeURIComponent(normalizedUrl)}&show_text=true&width=560`,
        };
      }
    }

    if (hostname === "drive.google.com") {
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      const fileIdFromPath = pathParts[0] === "file" && pathParts[1] === "d" ? pathParts[2] : "";
      const fileId = fileIdFromPath || parsed.searchParams.get("id") || "";

      if (fileId && /^[A-Za-z0-9_-]+$/.test(fileId)) {
        return {
          provider: "drive",
          url: parsed.href,
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          fileId,
        };
      }
    }

    return unsupportedMedia(rawUrl);
  } catch {
    return unsupportedMedia(rawUrl);
  }
}

export function parseVideoUrl(rawUrl: string): VideoEmbed | null {
  const detection = detectMediaProvider(rawUrl);
  return detection.provider === "unsupported" ? null : detection;
}

export function createVideoBlockHtml(video: VideoEmbed) {
  const videoId = video.videoId ? ` data-video-id="${video.videoId}"` : "";
  const shortcode = video.shortcode ? ` data-shortcode="${video.shortcode}"` : "";
  const postId = video.postId ? ` data-post-id="${video.postId}"` : "";
  const fileId = video.fileId ? ` data-file-id="${video.fileId}"` : "";

  return `<figure class="content-video" data-content-block="video" data-provider="${video.provider}"${videoId}${shortcode}${postId}${fileId} data-url="${htmlAttribute(video.url)}" data-embed-url="${htmlAttribute(video.embedUrl)}"></figure><p><br></p>`;
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
      block.innerHTML = `<iframe src="${embedUrl}" title="Publicacion de Instagram" loading="lazy"></iframe>${mediaFallbackHtml(url, "Ver en Instagram", "No se pudo mostrar esta publicacion de Instagram.")}`;
      return;
    }

    if (provider === "tiktok" && embedUrl && url) {
      block.className = "content-video content-video--tiktok";
      block.innerHTML = isSafeIframeSrc(embedUrl)
        ? `<iframe src="${embedUrl}" title="Video de TikTok" loading="lazy" allowfullscreen></iframe>${mediaFallbackHtml(url, "Ver video en TikTok")}`
        : mediaFallbackHtml(url, "Ver video en TikTok");
      return;
    }

    if (provider === "x" && url) {
      block.className = "content-video content-video--x";
      block.innerHTML = mediaFallbackHtml(url, "Ver publicacion en X", "Publicacion externa de X");
      return;
    }

    if (provider === "facebook" && embedUrl && url) {
      block.className = "content-video content-video--facebook";
      block.innerHTML = isSafeIframeSrc(embedUrl)
        ? `<iframe src="${embedUrl}" title="Publicacion de Facebook" loading="lazy" allowfullscreen></iframe>${mediaFallbackHtml(url, "Ver publicacion en Facebook")}`
        : mediaFallbackHtml(url, "Ver publicacion en Facebook");
      return;
    }

    if (provider === "drive" && embedUrl && url) {
      block.className = "content-video content-video--drive";
      block.innerHTML = `<iframe src="${embedUrl}" title="Archivo de Google Drive" loading="lazy" allowfullscreen></iframe>${mediaFallbackHtml(url, "Abrir en Google Drive", "Este archivo de Google Drive requiere permisos para visualizarse.")}`;
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
