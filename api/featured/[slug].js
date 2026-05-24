export const config = { runtime: "edge" };

const STUDIES = {
  "hard-rock-hotel": {
    title:   "Hard Rock Hotel — Paper Vinyl Record Player — Emīl Blūm",
    desc:    "A hand-made paper record player with a custom-pressed vinyl, designed and produced from scratch in 10 days for Hard Rock Hotel Tenerife's Rock Om campaign.",
    ogTitle: "Hard Rock Hotel — Paper Vinyl Record Player",
    ogDesc:  "Ten functional paper record players, each housing a custom-pressed vinyl, hand-assembled in 10 days. A craft project that had no template to follow.",
    image:   "https://emilblum.com/assets/og/og-hard-rock-hotel.webp",
  },
  "oxfam-republic-of-you": {
    title:   "Oxfam Republic of You — Emīl Blūm",
    desc:    "A retro 8-bit political simulation for Oxfam that let anyone step into the shoes of a national leader. Scottish Design Awards 2016 Commendation.",
    ogTitle: "Oxfam: Republic of You — Political Simulation Game",
    ogDesc:  "10 questions. Your country. An 8-bit game that made inequality feel personal — and won a Scottish Design Awards commendation in 2016.",
    image:   "https://emilblum.com/assets/og/og-oxfam-republic-of-you.webp",
  },
  "daydream-believers": {
    title:   "Daydream Believers — Brand Identity — Emīl Blūm",
    desc:    "Brand identity and web design for an award-winning educational platform. Now reaching 50,000+ students globally. HundrED Top 100 Education Innovators 2023.",
    ogTitle: "Daydream Believers — Brand Identity &amp; Web Design",
    ogDesc:  "A bold, layered brand that helped an educational platform earn recognition from HundrED, LEGO, D&amp;AD, and the Ellen MacArthur Foundation.",
    image:   "https://emilblum.com/assets/og/og-daydream-believers.webp",
  },
  "unseen": {
    title:   "Unseen — 360° VR Awareness Campaign — Emīl Blūm",
    desc:    "A 360° immersive experience placing the viewer inside the world of a child living with abuse. Scotland's 100 Disruptors 2018, The Hunter Foundation.",
    ogTitle: "Unseen — 360° Social Awareness Campaign",
    ogDesc:  "A VR experience designed to change politicians' minds. Emotionally honest. Technically ambitious. Recognised by The Hunter Foundation in 2018.",
    image:   "https://emilblum.com/assets/og/og-unseen.webp",
  },
  "fisga": {
    title:   "FISGA Spaces — Brand Identity — Emīl Blūm",
    desc:    "A modular brand identity for a creative hub in Porto that refuses to stand still — flexible enough to stretch across locations, formats, and audiences.",
    ogTitle: "FISGA Spaces — Brand Identity &amp; Web Design",
    ogDesc:  "A geometric, reconfigurable identity for one of Porto's most celebrated creative spaces. Flexible enough for every location, every event, every audience.",
    image:   "https://emilblum.com/assets/og/og-fisga.webp",
  },
  "stewart-brewing": {
    title:   "Stewart Brewing — Packaging Design &amp; AR — Emīl Blūm",
    desc:    "Beer labels designed from the inside out — 3D molecular forms derived from each brew's ingredients. SIBA Best Concept Design 2019. 19 beers, one system.",
    ogTitle: "Stewart Brewing — Packaging Design &amp; AR App",
    ogDesc:  "Each label is a molecular fingerprint of the brew inside. 19 beers, 19 unique forms — extended into an AR experience that reveals each element.",
    image:   "https://emilblum.com/assets/og/og-stewart-brewing.webp",
  },
  "game-masters": {
    title:   "Game Masters — NMS Exhibition Campaign — Emīl Blūm",
    desc:    "Campaign for the European debut of Game Masters at the National Museum of Scotland. 65,000 visitors, 58% first-timers. Scottish Creative Awards 2015.",
    ogTitle: "Game Masters — National Museum of Scotland Campaign",
    ogDesc:  "Neon circuit illustrations of iconic game characters. A campaign that drew 65,000 visitors and won the Scottish Creative Awards 2015 for Use of Visual Design.",
    image:   "https://emilblum.com/assets/og/og-game-masters.webp",
  },
};

function buildJsonLd(slug, data) {
  const canonical = `https://emilblum.com/featured/${slug}`;
  return `<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": "${canonical}",
    "name": "${data.ogTitle.replace(/&amp;/g, '&')} — Emīl Blūm",
    "description": "${data.desc.replace(/&amp;/g, '&')}",
    "author": { "@id": "https://emilblum.com/#person" }
  }
  <\/script>`; // eslint-disable-line no-useless-escape
}

export default async function handler(request) {
  const url  = new URL(request.url);
  const slug = url.pathname.replace(/^\/featured\//, "").replace(/\/$/, "");

  // Fetch the static HTML template from the same origin (/case-study, not /featured/:slug)
  const templateRes = await fetch(new URL("/case-study", url.origin).toString());
  if (!templateRes.ok) return new Response("Not found", { status: 404 });

  let html = await templateRes.text();
  const data = STUDIES[slug];

  if (data) {
    const canonical = `https://emilblum.com/featured/${slug}`;
    html = html
      .replace(
        "<title>Case Study — Emīl Blūm</title>",
        `<title>${data.title}</title>`
      )
      .replace(
        '<meta name="description" content="A project case study by Emīl Blūm — creative director working across brand identity, art direction, and interactive media.">',
        `<meta name="description" content="${data.desc}">`
      )
      .replace(
        '<link rel="canonical" href="https://emilblum.com/featured">',
        `<link rel="canonical" href="${canonical}">`
      )
      .replace(
        '<meta property="og:title" content="Emīl Blūm — Case Study">',
        `<meta property="og:title" content="${data.ogTitle}">`
      )
      .replace(
        '<meta property="og:description" content="Craft, strategy, and creative direction. A project case study by Emīl Blūm.">',
        `<meta property="og:description" content="${data.ogDesc}">`
      )
      .replace(
        '<meta property="og:url" content="https://emilblum.com/featured">',
        `<meta property="og:url" content="${canonical}">`
      )
      .replace(
        '<meta property="og:image" content="https://emilblum.com/assets/og/og-featured.webp">',
        `<meta property="og:image" content="${data.image}">`
      )
      .replace(
        '<meta name="twitter:title" content="Emīl Blūm — Case Study">',
        `<meta name="twitter:title" content="${data.ogTitle}">`
      )
      .replace(
        '<meta name="twitter:description" content="Craft, strategy, and creative direction. A project case study by Emīl Blūm.">',
        `<meta name="twitter:description" content="${data.ogDesc}">`
      )
      .replace(
        '<meta name="twitter:image" content="https://emilblum.com/assets/og/og-featured.webp">',
        `<meta name="twitter:image" content="${data.image}">`
      )
      .replace(
        '<!-- JSONLD_PLACEHOLDER -->',
        buildJsonLd(slug, data)
      );
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
