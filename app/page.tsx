"use client";

import React, { useEffect, useMemo, useState } from "react";

// Small helper to access a writable global
const getG = () => (typeof window !== "undefined" ? (window as any) : ({} as any));

// --- Minimal styles (no Tailwind required) ---
const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    background: "#0b0b0c",
    color: "#e8e8ea",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
  },
  sidebar: {
    borderRight: "1px solid #1f2023",
    padding: 16,
    position: "sticky",
    top: 0,
    height: "100vh",
    overflow: "auto",
  },
  brand: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  folderBtn: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a2b30",
    background: "#121316",
    color: "#e8e8ea",
    textAlign: "left" as const,
    cursor: "pointer",
    marginBottom: 8,
  },
  content: { padding: 16 },
  toolbar: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  search: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2a2b30",
    background: "#111215",
    color: "#e8e8ea",
  },
  grid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  },
  card: {
    border: "1px solid #202126",
    background: "#0f1013",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  clickable: { cursor: "pointer" },
  thumbWrap: {
    position: "relative",
    background: "#000",
    // 9:16 aspect ratio for Instagram Reel / YouTube Short format
    paddingTop: "177.78%", // 16/9 = 1.7778, so 177.78%
  },
  thumbImg: {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  thumbOverlay: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(0deg, rgba(0,0,0,0.45), rgba(0,0,0,0.45))",
  },
  playBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #ffffff33",
    color: "#fff",
    fontSize: 12,
    backdropFilter: "blur(4px)",
  },
  meta: { padding: 10, fontSize: 13, color: "#b7b8bd" },
  chips: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  chip: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #2a2b30",
    background: "#121316",
    fontSize: 12,
    color: "#c6c7cc",
    cursor: "pointer",
  },
  // Modal
  modalBackdrop: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    position: "relative" as const,
    width: "min(90vw, 460px)",
    background: "#0f1013",
    border: "1px solid #2a2b30",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalVideoWrap: {
    position: "relative" as const,
    paddingTop: "56.25%", // 16:9 aspect ratio for video content
    background: "#000",
  },
  modalClose: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    border: "1px solid #2a2b30",
    background: "#14151a",
    color: "#e8e8ea",
    padding: "6px 10px",
    borderRadius: 10,
    cursor: "pointer",
    zIndex: 10,
  },
  embedMount: {
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
  },
};

// --- Types ---

type Provider = "youtube" | "tiktok" | "instagram";

type Clip = {
  id: string;
  provider: Provider;
  folder: string; // e.g., "Cooking", "Fashion"
  title?: string;
  // Provider-specific fields
  youtube?: { videoId: string };
  tiktok?: { videoId: string; citeUrl?: string };
  instagram?: { permalink: string };
  // Optional thumbnail URL (used for non-YouTube where we can't derive easily)
  thumbUrl?: string;
};

// --- Sample data (replace with your own) ---
const initialClips: Clip[] = [
  {
    id: "yt1",
    provider: "youtube",
    folder: "Cooking",
    title: "Knife Skills",
    youtube: { videoId: "LV3mChwupF8" },
  },
  {
    id: "tt1",
    provider: "tiktok",
    folder: "Cooking",
    title: "Maja's Recipes",
    tiktok: {
      videoId: "7498864456584285445",
      citeUrl: "https://www.tiktok.com/@majasrecipes/video/7498864456584285445",
    },
    // If omitted, we'll auto-fetch via TikTok oEmbed
    // thumbUrl: "https://.../tiktok-thumb.jpg",
  },
  {
    id: "ig1",
    provider: "instagram",
    folder: "Fashion",
    title: "Outfit inspo",
    instagram: { permalink: "https://www.instagram.com/p/DI66ERaTsm8/" },
  },
];

// --- Helpers ---
const youTubeThumb = (videoId: string) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

async function fetchTikTokThumb(citeUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(citeUrl)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thumbnail_url || null;
  } catch {
    return null;
  }
}

// --- Self-tests (dev-only) ---
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  try {
    const filters = ["All", "YouTube", "TikTok", "Instagram"] as const;
    console.assert(filters.length === 4, "Expected four filter chips");
    console.assert(
      youTubeThumb("abc123") === "https://img.youtube.com/vi/abc123/hqdefault.jpg",
      "youtubeThumb format check"
    );
  } catch (e) {
    console.warn("Self-test failed", e);
  }
}

// --- Script loader that never re-asks (per tab) ---
function loadScriptOnce(src: string, globalFlag?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();

    const G = getG();
    G.__sdkLoaded = G.__sdkLoaded || {};

    if (globalFlag && typeof G[globalFlag] !== "undefined") return resolve();
    if (G.__sdkLoaded[src]) return resolve();

    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)));
      G.__sdkLoaded[src] = true;
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.addEventListener("load", () => {
      G.__sdkLoaded[src] = true;
      resolve();
    });
    s.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)));
    document.body.appendChild(s);
  });
}

// Lazy mount: only initialize embeds when the modal is opened
const ThirdPartyEmbed: React.FC<{ clip: Clip; autoplay?: boolean }> = ({ clip, autoplay }) => {
  const mountRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    el.innerHTML = "";

    if (clip.provider === "youtube" && clip.youtube) {
      const { videoId } = clip.youtube;
      const src = `https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0${autoplay ? "&autoplay=1&mute=1" : ""}`;
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "YouTube video player";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      (iframe as any).allowFullscreen = true;
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      el.appendChild(iframe);
      return;
    }

    if (clip.provider === "tiktok" && clip.tiktok) {
      const { videoId, citeUrl } = clip.tiktok;
      const bq = document.createElement("blockquote");
      bq.className = "tiktok-embed";
      bq.setAttribute("data-video-id", videoId);
      bq.setAttribute("cite", citeUrl || `https://www.tiktok.com/@_/video/${videoId}`);
      const section = document.createElement("section");
      bq.appendChild(section);
      el.appendChild(bq);

      loadScriptOnce("https://www.tiktok.com/embed.js").catch(() => {});
      return;
    }

    if (clip.provider === "instagram" && clip.instagram) {
      const { permalink } = clip.instagram;
      const bq = document.createElement("blockquote");
      bq.className = "instagram-media";
      bq.setAttribute("data-instgrm-permalink", permalink);
      bq.setAttribute("data-instgrm-version", "14");
      el.appendChild(bq);

      loadScriptOnce("https://www.instagram.com/embed.js", "instgrm")
        .then(() => {
          const G = getG();
          if (G.instgrm?.Embeds?.process) {
            G.instgrm.Embeds.process();
          }
        })
        .catch(() => {});
      return;
    }
  }, [clip, autoplay]);

  return <div style={styles.embedMount} ref={mountRef} />;
};

// Inline Instagram embed (for grid) - use aspect ratio container approach
const InlineInstagramEmbed: React.FC<{ permalink: string }> = ({ permalink }) => {
  // Use the aspect ratio approach from the blog post
  // This creates a responsive container that maintains proportions
  return (
    <div style={{ 
      position: "relative", 
      width: "100%", 
      paddingTop: "177.78%", // 9:16 aspect ratio for reels/shorts
      overflow: "hidden", 
      borderTopLeftRadius: 14, 
      borderTopRightRadius: 14,
      background: "#000"
    }}>
                    <iframe
        src={`${permalink.replace(/\/$/, "")}/embed`}
        title="Instagram embed"
        style={{ 
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%", 
          height: "100%", 
          border: 0, 
          borderTopLeftRadius: 14, 
          borderTopRightRadius: 14
        }}
        allow="clipboard-write; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        scrolling="no"
        allowFullScreen
      />
    </div>
  );
};

// --- Modal ---
const PlayerModal: React.FC<{
  clip: Clip | null;
  onClose: () => void;
}> = ({ clip, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!clip) return null;
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
        <div style={styles.modalVideoWrap}>
          <ThirdPartyEmbed clip={clip} autoplay />
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ fontWeight: 600 }}>{clip.title || "Untitled"}</div>
          <div style={{ opacity: 0.8, marginTop: 4 }}>{clip.provider} · {clip.folder}</div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function Page() {
  const [query, setQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string>("All");
  const [openClip, setOpenClip] = useState<Clip | null>(null);
  // runtime thumbs discovered via oEmbed
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  const clips = useMemo(() => initialClips, []);

  // Try to auto-populate TikTok thumbnails
  useEffect(() => {
    (async () => {
      for (const c of clips) {
        if (c.provider === "tiktok" && c.tiktok?.citeUrl && !c.thumbUrl && !thumbs[c.id]) {
          const url = await fetchTikTokThumb(c.tiktok.citeUrl);
          if (url) setThumbs((t) => ({ ...t, [c.id]: url }));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clips]);

  const folders = useMemo(() => {
    const names = Array.from(new Set(clips.map((c) => c.folder)));
    return ["All", ...names];
  }, [clips]);

  const filtered = useMemo(() => {
    return clips.filter((c) => {
      const matchesFolder = activeFolder === "All" || c.folder === activeFolder;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || (c.title || "").toLowerCase().includes(q) || c.provider.includes(q);
      return matchesFolder && matchesQuery;
    });
  }, [clips, activeFolder, query]);

  const FILTERS = ["All", "YouTube", "TikTok", "Instagram"] as const;

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>VaultFeed</div>
        <div style={{ fontSize: 12, color: "#9a9ba1", marginBottom: 8 }}>Folders</div>
        {folders.map((f) => (
          <button
            key={f}
            style={{
              ...styles.folderBtn,
              outline: activeFolder === f ? "2px solid #3a3bf3" : "none",
            }}
            onClick={() => setActiveFolder(f)}
          >
            {f}
          </button>
        ))}
        <div style={{ marginTop: 16, fontSize: 12, color: "#9a9ba1" }}>
          Tip: add a `thumbUrl` for TikTok/Instagram for nicer previews.
        </div>
      </aside>

      {/* Content */}
      <main style={styles.content}>
        <div style={styles.toolbar}>
          <input
            style={styles.search}
            placeholder="Search by title or provider…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={styles.chips}>
            {(FILTERS).map((label) => (
              <button
                key={label}
                style={styles.chip}
                onClick={() => {
                  if (label === "All") setQuery("");
                  else setQuery(label.toLowerCase());
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <section style={styles.grid}>
          {filtered.map((clip) => {
            // Instagram: embed inline (no thumbnail/modal)
            if (clip.provider === "instagram" && clip.instagram) {
              return (
                <article key={clip.id} style={styles.card}>
                  <InlineInstagramEmbed permalink={clip.instagram.permalink} />
                  <div style={styles.meta}>
                    <div style={{ fontWeight: 600, color: "#e8e8ea" }}>{clip.title || "Untitled"}</div>
                    <div style={{ opacity: 0.85, marginTop: 4 }}>instagram · {clip.folder}</div>
                  </div>
                </article>
              );
            }

            // YouTube/TikTok: thumbnail + click-to-play modal
            const thumbSrc =
              clip.provider === "youtube" && clip.youtube
                ? youTubeThumb(clip.youtube.videoId)
                : thumbs[clip.id] || clip.thumbUrl || "";

            return (
              <article
                key={clip.id}
                style={{ ...styles.card, ...styles.clickable }}
                onClick={() => setOpenClip(clip)}
              >
                <div style={styles.thumbWrap}>
                  {thumbSrc ? (
                    <img alt="thumbnail" src={thumbSrc} style={styles.thumbImg} />
                  ) : (
                    <div
                      style={{
                        ...styles.thumbImg,
                        background:
                          clip.provider === "tiktok"
                            ? "linear-gradient(135deg, #111, #1f1f1f)"
                            : "linear-gradient(135deg, #0e0e0f, #1a1b1f)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        color: "#cfcfd4",
                      }}
                    >
                      {clip.provider.toUpperCase()}
                    </div>
                  )}
                  <div style={styles.thumbOverlay}>
                    <div style={styles.playBadge}>Play</div>
                  </div>
                </div>
                <div style={styles.meta}>
                  <div style={{ fontWeight: 600, color: "#e8e8ea" }}>{clip.title || "Untitled"}</div>
                  <div style={{ opacity: 0.85, marginTop: 4 }}>
                    {clip.provider} · {clip.folder}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <PlayerModal clip={openClip} onClose={() => setOpenClip(null)} />
    </div>
  );
}
