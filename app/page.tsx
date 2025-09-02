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
    paddingTop: "177.78%", // 9:16 aspect ratio to match thumbnails
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
  // Instagram Posts
  {
    id: "ig1",
    provider: "instagram",
    folder: "Cooking",
    title: "Cooking Inspiration",
    instagram: { permalink: "https://www.instagram.com/p/DBoro_cyXas/" },
  },
  {
    id: "ig2",
    provider: "instagram",
    folder: "Cooking",
    title: "Recipe Ideas",
    instagram: { permalink: "https://www.instagram.com/p/DDvC7LMoDCN/" },
  },
  {
    id: "ig3",
    provider: "instagram",
    folder: "Cooking",
    title: "Food Photography",
    instagram: { permalink: "https://www.instagram.com/p/DLqJ2FZIZbp/" },
  },
  {
    id: "ig4",
    provider: "instagram",
    folder: "Cooking",
    title: "Culinary Tips",
    instagram: { permalink: "https://www.instagram.com/p/DB3rENOSiCO/" },
  },
  {
    id: "ig5",
    provider: "instagram",
    folder: "Cooking",
    title: "Kitchen Hacks",
    instagram: { permalink: "https://www.instagram.com/p/DF2xsnEy-l6/" },
  },
  {
    id: "ig6",
    provider: "instagram",
    folder: "Cooking",
    title: "Chef Secrets",
    instagram: { permalink: "https://www.instagram.com/p/DFlDvYQM8G_/" },
  },
  {
    id: "ig7",
    provider: "instagram",
    folder: "Cooking",
    title: "Cooking Techniques",
    instagram: { permalink: "https://www.instagram.com/p/DIOdhZUSyX-/" },
  },
  {
    id: "ig8",
    provider: "instagram",
    folder: "Cooking",
    title: "Food Art",
    instagram: { permalink: "https://www.instagram.com/p/DLkk4_AvwFH/" },
  },
  {
    id: "ig9",
    provider: "instagram",
    folder: "Cooking",
    title: "Recipe Collection",
    instagram: { permalink: "https://www.instagram.com/p/DMZnXPJzDhD/" },
  },
  {
    id: "ig10",
    provider: "instagram",
    folder: "Cooking",
    title: "Cooking Inspiration",
    instagram: { permalink: "https://www.instagram.com/p/DG0lAPYphh5/" },
  },

  // TikTok Videos
  {
    id: "tt1",
    provider: "tiktok",
    folder: "Cooking",
    title: "Tagesrezept Cooking",
    tiktok: {
      videoId: "7460528404337610006",
      citeUrl: "https://www.tiktok.com/@tagesrezept/video/7460528404337610006",
    },
  },
  {
    id: "tt2",
    provider: "tiktok",
    folder: "Cooking",
    title: "Chef Bae Recipes",
    tiktok: {
      videoId: "7453149126176394528",
      citeUrl: "https://www.tiktok.com/@chef_baeee/video/7453149126176394528",
    },
  },
  {
    id: "tt3",
    provider: "tiktok",
    folder: "Cooking",
    title: "Kenny's Cooking",
    tiktok: {
      videoId: "7413528717877595397",
      citeUrl: "https://www.tiktok.com/@kennylsong/video/7413528717877595397",
    },
  },
  {
    id: "tt4",
    provider: "tiktok",
    folder: "Cooking",
    title: "Cook with Ay",
    tiktok: {
      videoId: "7223345377905331483",
      citeUrl: "https://www.tiktok.com/@cookwithay/video/7223345377905331483",
    },
  },
  {
    id: "tt5",
    provider: "tiktok",
    folder: "Cooking",
    title: "Very Hungry Greek",
    tiktok: {
      videoId: "7398241206515322144",
      citeUrl: "https://www.tiktok.com/@veryhungrygreek/video/7398241206515322144",
    },
  },
  {
    id: "tt6",
    provider: "tiktok",
    folder: "Cooking",
    title: "Foodie Randy",
    tiktok: {
      videoId: "7488046268854455558",
      citeUrl: "https://www.tiktok.com/@foodierandy/video/7488046268854455558",
    },
  },
  {
    id: "tt7",
    provider: "tiktok",
    folder: "Cooking",
    title: "Connie Cooks",
    tiktok: {
      videoId: "7524908918082948358",
      citeUrl: "https://www.tiktok.com/@conniecooks/video/7524908918082948358",
    },
  },
  {
    id: "tt8",
    provider: "tiktok",
    folder: "Cooking",
    title: "Baking Fey",
    tiktok: {
      videoId: "7480967376327003414",
      citeUrl: "https://www.tiktok.com/@bakingfey/video/7480967376327003414?q=cooking&t=1756074406244",
    },
  },

  // YouTube Videos
  {
    id: "yt1",
    provider: "youtube",
    folder: "Cooking",
    title: "Bayashi TV Cooking",
    youtube: { videoId: "IHDX1eVP-_Q" },
  },
  {
    id: "yt2",
    provider: "youtube",
    folder: "Cooking",
    title: "Owen Han Recipes",
    youtube: { videoId: "qFlw0h2-bDI" },
  },
  {
    id: "yt3",
    provider: "youtube",
    folder: "Cooking",
    title: "Home Chef Geoff",
    youtube: { videoId: "xH8RaNpM854" },
  },
  {
    id: "yt4",
    provider: "youtube",
    folder: "Cooking",
    title: "Yumekenguru Cooking",
    youtube: { videoId: "0lOM9PwLmHI" },
  },
  {
    id: "yt5",
    provider: "youtube",
    folder: "Cooking",
    title: "Sara - Nutrient Matters",
    youtube: { videoId: "prdBJIuj6LI" },
  },
  {
    id: "yt6",
    provider: "youtube",
    folder: "Cooking",
    title: "Food with Bear Hands",
    youtube: { videoId: "RZ1614pRkxI" },
  },
  {
    id: "yt7",
    provider: "youtube",
    folder: "Cooking",
    title: "Home Chef Geoff Tips",
    youtube: { videoId: "jp_5tJo4zCw" },
  },
  {
    id: "yt8",
    provider: "youtube",
    folder: "Cooking",
    title: "Sam Eats",
    youtube: { videoId: "3qlzEI-mrRk" },
  },
  {
    id: "yt9",
    provider: "youtube",
    folder: "Cooking",
    title: "Fork the People",
    youtube: { videoId: "STE6LZAXPU8" },
  },
  {
    id: "yt10",
    provider: "youtube",
    folder: "Cooking",
    title: "Cooking Shorts",
    youtube: { videoId: "vZk-nsUJoEM" },
  },

  // Fashion Content
  // YouTube Fashion Videos
  {
    id: "yt_fashion_1",
    provider: "youtube",
    folder: "Fashion",
    title: "Fly With Johnny Thai Fashion",
    youtube: { videoId: "ANpDbLtTxWA" },
  },
  {
    id: "yt_fashion_2",
    provider: "youtube",
    folder: "Fashion",
    title: "Streetwear, Lifestyles and Looks",
    youtube: { videoId: "M_A5xHe3HVU" },
  },
  {
    id: "yt_fashion_3",
    provider: "youtube",
    folder: "Fashion",
    title: "Lean Ortiz Style",
    youtube: { videoId: "qzcfG9U4FjQ" },
  },
  {
    id: "yt_fashion_4",
    provider: "youtube",
    folder: "Fashion",
    title: "Fashion Fixers",
    youtube: { videoId: "dkAY3qAYkyU" },
  },
  {
    id: "yt_fashion_5",
    provider: "youtube",
    folder: "Fashion",
    title: "Pierre Dalati Fashion",
    youtube: { videoId: "UBYe7Rmrn2Y" },
  },
  {
    id: "yt_fashion_6",
    provider: "youtube",
    folder: "Fashion",
    title: "Robbi Jan Style",
    youtube: { videoId: "UA_jCK4og_4" },
  },
  {
    id: "yt_fashion_7",
    provider: "youtube",
    folder: "Fashion",
    title: "Bebostylee Fashion",
    youtube: { videoId: "xj4ulkl7tSo" },
  },
  {
    id: "yt_fashion_8",
    provider: "youtube",
    folder: "Fashion",
    title: "Pierre Dalati Tips",
    youtube: { videoId: "GcAe6Kt0TFY" },
  },
  {
    id: "yt_fashion_9",
    provider: "youtube",
    folder: "Fashion",
    title: "Milivine Boutique",
    youtube: { videoId: "EHiWjQG66qo" },
  },
  {
    id: "yt_fashion_10",
    provider: "youtube",
    folder: "Fashion",
    title: "Japan Street Style",
    youtube: { videoId: "5pDoJLvQaU8" },
  },
  {
    id: "yt_fashion_11",
    provider: "youtube",
    folder: "Fashion",
    title: "Helen Peng Fashion",
    youtube: { videoId: "StPqhnSBe44" },
  },

  // Instagram Fashion Posts
  {
    id: "ig_fashion_1",
    provider: "instagram",
    folder: "Fashion",
    title: "Fashion Inspiration",
    instagram: { permalink: "https://www.instagram.com/p/DD0aB4xyfc-/" },
  },
  {
    id: "ig_fashion_2",
    provider: "instagram",
    folder: "Fashion",
    title: "Style Guide",
    instagram: { permalink: "https://www.instagram.com/p/C7SYAxHJWxQ/" },
  },
  {
    id: "ig_fashion_3",
    provider: "instagram",
    folder: "Fashion",
    title: "Fashion Trends",
    instagram: { permalink: "https://www.instagram.com/p/DHaoqFSRdyQ/" },
  },
  {
    id: "ig_fashion_4",
    provider: "instagram",
    folder: "Fashion",
    title: "Outfit Ideas",
    instagram: { permalink: "https://www.instagram.com/p/DM3Yi4tBvBa/" },
  },
  {
    id: "ig_fashion_5",
    provider: "instagram",
    folder: "Fashion",
    title: "Street Style",
    instagram: { permalink: "https://www.instagram.com/p/DDvDEVjSAQq/" },
  },
  {
    id: "ig_fashion_6",
    provider: "instagram",
    folder: "Fashion",
    title: "Fashion Photography",
    instagram: { permalink: "https://www.instagram.com/p/DIJPHGCM4ID/" },
  },
  {
    id: "ig_fashion_7",
    provider: "instagram",
    folder: "Fashion",
    title: "Style Tips",
    instagram: { permalink: "https://www.instagram.com/p/DJZrMPvuiX3/" },
  },
  {
    id: "ig_fashion_8",
    provider: "instagram",
    folder: "Fashion",
    title: "Fashion Collection",
    instagram: { permalink: "https://www.instagram.com/p/DCojT0ASySO/" },
  },
  {
    id: "ig_fashion_9",
    provider: "instagram",
    folder: "Fashion",
    title: "Trendy Looks",
    instagram: { permalink: "https://www.instagram.com/p/DHDLVXyvF7V/" },
  },
  {
    id: "ig_fashion_10",
    provider: "instagram",
    folder: "Fashion",
    title: "Fashion Inspiration",
    instagram: { permalink: "https://www.instagram.com/p/C1-Kvg3u1G3/" },
  },

  // TikTok Fashion Videos
  {
    id: "tt_fashion_1",
    provider: "tiktok",
    folder: "Fashion",
    title: "Jann Outfits",
    tiktok: {
      videoId: "7309834149840391432",
      citeUrl: "https://www.tiktok.com/@jann.outfits/video/7309834149840391432?q=cool%20fashion%20man&t=1756077993746",
    },
  },
  {
    id: "tt_fashion_2",
    provider: "tiktok",
    folder: "Fashion",
    title: "Street Fashion 73",
    tiktok: {
      videoId: "7496519391438228758",
      citeUrl: "https://www.tiktok.com/@streetfashion73/video/7496519391438228758",
    },
  },
  {
    id: "tt_fashion_3",
    provider: "tiktok",
    folder: "Fashion",
    title: "Kerina Wang Style",
    tiktok: {
      videoId: "7333699162585730310",
      citeUrl: "https://www.tiktok.com/@kerina.wang/video/7333699162585730310",
    },
  },
  {
    id: "tt_fashion_4",
    provider: "tiktok",
    folder: "Fashion",
    title: "Chic Outfi",
    tiktok: {
      videoId: "7475043504608120069",
      citeUrl: "https://www.tiktok.com/@chic.outfi/video/7475043504608120069",
    },
  },
  {
    id: "tt_fashion_5",
    provider: "tiktok",
    folder: "Fashion",
    title: "Lina Noory Fashion",
    tiktok: {
      videoId: "7487351553146260778",
      citeUrl: "https://www.tiktok.com/@lina.noory/video/7487351553146260778",
    },
  },
  {
    id: "tt_fashion_6",
    provider: "tiktok",
    folder: "Fashion",
    title: "Blackstreet Official",
    tiktok: {
      videoId: "7518827970635631880",
      citeUrl: "https://www.tiktok.com/@blackstreet_official/video/7518827970635631880",
    },
  },
  {
    id: "tt_fashion_7",
    provider: "tiktok",
    folder: "Fashion",
    title: "Blackstreet Style",
    tiktok: {
      videoId: "7462414713821990152",
      citeUrl: "https://www.tiktok.com/@blackstreet_official/video/7462414713821990152",
    },
  },
  {
    id: "tt_fashion_8",
    provider: "tiktok",
    folder: "Fashion",
    title: "CMS Edits",
    tiktok: {
      videoId: "7527780613475110157",
      citeUrl: "https://www.tiktok.com/@cms.edits711/video/7527780613475110157",
    },
  },
  {
    id: "tt_fashion_9",
    provider: "tiktok",
    folder: "Fashion",
    title: "Fashion Creator",
    tiktok: {
      videoId: "7505807098299632918",
      citeUrl: "https://www.tiktok.com/@username12345678848494/video/7505807098299632918",
    },
  },
  {
    id: "tt_fashion_10",
    provider: "tiktok",
    folder: "Fashion",
    title: "Marco LSTN",
    tiktok: {
      videoId: "7419763735339748641",
      citeUrl: "https://www.tiktok.com/@marco.lstn/video/7419763735339748641",
    },
  },

  // Gaming Content
  // YouTube Gaming Videos
  {
    id: "yt_gaming_1",
    provider: "youtube",
    folder: "Gaming",
    title: "Shah Enterprises Gaming",
    youtube: { videoId: "flUB1nfGFYA" },
  },
  {
    id: "yt_gaming_2",
    provider: "youtube",
    folder: "Gaming",
    title: "Chase After The Right Price",
    youtube: { videoId: "xoiAz5CF4YI" },
  },
  {
    id: "yt_gaming_3",
    provider: "youtube",
    folder: "Gaming",
    title: "Teamfight Tactics",
    youtube: { videoId: "2Zg8_cqNYrs" },
  },
  {
    id: "yt_gaming_4",
    provider: "youtube",
    folder: "Gaming",
    title: "Game Facts",
    youtube: { videoId: "wEbG1kHrSoQ" },
  },
  {
    id: "yt_gaming_5",
    provider: "youtube",
    folder: "Gaming",
    title: "Jae AIK Gaming",
    youtube: { videoId: "dLjkc67T0EM" },
  },
  {
    id: "yt_gaming_6",
    provider: "youtube",
    folder: "Gaming",
    title: "Mighty Noob",
    youtube: { videoId: "Tehz-lXlPTE" },
  },
  {
    id: "yt_gaming_7",
    provider: "youtube",
    folder: "Gaming",
    title: "Jakeski TFT",
    youtube: { videoId: "5eQepYs1CXg" },
  },
  {
    id: "yt_gaming_8",
    provider: "youtube",
    folder: "Gaming",
    title: "Gaming with Abyss",
    youtube: { videoId: "vZnq7wk7OcI" },
  },
  {
    id: "yt_gaming_9",
    provider: "youtube",
    folder: "Gaming",
    title: "Shawn TFT",
    youtube: { videoId: "5QnQU1emdIk" },
  },
  {
    id: "yt_gaming_10",
    provider: "youtube",
    folder: "Gaming",
    title: "Chato Gaming",
    youtube: { videoId: "pRw4aJznSBA" },
  },

  // Instagram Gaming Posts
  {
    id: "ig_gaming_1",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Inspiration",
    instagram: { permalink: "https://www.instagram.com/p/DEbAwvkyNmV/" },
  },
  {
    id: "ig_gaming_2",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Content",
    instagram: { permalink: "https://www.instagram.com/p/DI4yZ1fpwlP/" },
  },
  {
    id: "ig_gaming_3",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Tips",
    instagram: { permalink: "https://www.instagram.com/p/DExYs8GxTfG/" },
  },
  {
    id: "ig_gaming_4",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Strategy",
    instagram: { permalink: "https://www.instagram.com/p/DKIYk0PhjRx/" },
  },
  {
    id: "ig_gaming_5",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming News",
    instagram: { permalink: "https://www.instagram.com/p/DL02BZyNiwx/" },
  },
  {
    id: "ig_gaming_6",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Community",
    instagram: { permalink: "https://www.instagram.com/p/DKK4faJSd7b/" },
  },
  {
    id: "ig_gaming_7",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Highlights",
    instagram: { permalink: "https://www.instagram.com/p/DI9nBHoIAj4/" },
  },
  {
    id: "ig_gaming_8",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Setup",
    instagram: { permalink: "https://www.instagram.com/p/C7eY1qANpv0/" },
  },
  {
    id: "ig_gaming_9",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Stream",
    instagram: { permalink: "https://www.instagram.com/p/DNqchtXN9f7/" },
  },
  {
    id: "ig_gaming_10",
    provider: "instagram",
    folder: "Gaming",
    title: "Gaming Content",
    instagram: { permalink: "https://www.instagram.com/p/C58Kkt5OLsw/" },
  },

  // TikTok Gaming Videos
  {
    id: "tt_gaming_1",
    provider: "tiktok",
    folder: "Gaming",
    title: "Inlighte Gaming",
    tiktok: {
      videoId: "7398413070705511686",
      citeUrl: "https://www.tiktok.com/@inlighte/video/7398413070705511686",
    },
  },
  {
    id: "tt_gaming_2",
    provider: "tiktok",
    folder: "Gaming",
    title: "Gamer TikTok",
    tiktok: {
      videoId: "7130169073979231494",
      citeUrl: "https://www.tiktok.com/@gamer/video/7130169073979231494",
    },
  },
  {
    id: "tt_gaming_3",
    provider: "tiktok",
    folder: "Gaming",
    title: "Wind Zone Gaming",
    tiktok: {
      videoId: "7541873467054951702",
      citeUrl: "https://www.tiktok.com/@wind.zone1/video/7541873467054951702",
    },
  },
  {
    id: "tt_gaming_4",
    provider: "tiktok",
    folder: "Gaming",
    title: "JHF Gaming",
    tiktok: {
      videoId: "7521694239118331149",
      citeUrl: "https://www.tiktok.com/@jhf1589/video/7521694239118331149",
    },
  },
  {
    id: "tt_gaming_5",
    provider: "tiktok",
    folder: "Gaming",
    title: "Bando Gaming",
    tiktok: {
      videoId: "7442713076454968607",
      citeUrl: "https://www.tiktok.com/@bando.aae/video/7442713076454968607",
    },
  },
  {
    id: "tt_gaming_6",
    provider: "tiktok",
    folder: "Gaming",
    title: "Maidenless Manga Gaming",
    tiktok: {
      videoId: "7177448029082094894",
      citeUrl: "https://www.tiktok.com/@maidenlessmanga/video/7177448029082094894",
    },
  },
  {
    id: "tt_gaming_7",
    provider: "tiktok",
    folder: "Gaming",
    title: "Oslith Gaming",
    tiktok: {
      videoId: "7125468191001709866",
      citeUrl: "https://www.tiktok.com/@oslith/video/7125468191001709866",
    },
  },
  {
    id: "tt_gaming_8",
    provider: "tiktok",
    folder: "Gaming",
    title: "Luis Lima Gaming",
    tiktok: {
      videoId: "7289101305992187168",
      citeUrl: "https://www.tiktok.com/@luislima4394/video/7289101305992187168",
    },
  },
  {
    id: "tt_gaming_9",
    provider: "tiktok",
    folder: "Gaming",
    title: "Daily Mail Gaming",
    tiktok: {
      videoId: "7384425150193618209",
      citeUrl: "https://www.tiktok.com/@dailymailgaming/video/7384425150193618209",
    },
  },
  {
    id: "tt_gaming_10",
    provider: "tiktok",
    folder: "Gaming",
    title: "Endless Possibility Gaming",
    tiktok: {
      videoId: "7445414009114840350",
      citeUrl: "https://www.tiktok.com/@endless__possibility/video/7445414009114840350",
    },
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
      
      // Use TikTok's embed URL format that's designed for iframes
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.tiktok.com/embed/${videoId}`;
      iframe.title = "TikTok video";
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      
      el.appendChild(iframe);
      return;
    }

    if (clip.provider === "instagram" && clip.instagram) {
      const { permalink } = clip.instagram;
      
      // Use direct iframe approach for consistent behavior
      const iframe = document.createElement("iframe");
      iframe.src = `${permalink.replace(/\/$/, "")}/embed`;
      iframe.title = "Instagram post";
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.allow = "clipboard-write; encrypted-media; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      
      el.appendChild(iframe);
      return;
    }

    // Cleanup function to remove any leftover embeds when component unmounts or clip changes
    return () => {
      if (el) {
        el.innerHTML = "";
      }
    };
  }, [clip, autoplay]);

  return <div style={styles.embedMount} ref={mountRef} />;
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

  const clips = useMemo(() => {
    // Use a seeded shuffle to ensure consistent order between server and client
    const shuffled = [...initialClips];
    let seed = 42; // Fixed seed for consistent randomization
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed = (seed * 9301 + 49297) % 233280; // Simple PRNG
      const j = seed % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

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
            // Instagram: show actual embed content in grid + clickable for popup
            if (clip.provider === "instagram" && clip.instagram) {
              return (
                <article 
                  key={clip.id} 
                  style={{ ...styles.card, ...styles.clickable }}
                  onClick={() => setOpenClip(clip)}
                >
                  <div style={styles.thumbWrap}>
                    <iframe
                      src={`${clip.instagram.permalink.replace(/\/$/, "")}/embed`}
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
                    <div style={styles.thumbOverlay}>
                      <div style={styles.playBadge}>Play</div>
                    </div>
                  </div>
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
