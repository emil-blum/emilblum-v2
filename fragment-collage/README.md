# Fragment Collage v4

A generative image collage tool. Loads one photo at a time, splits it across a randomised 12×8 grid of cropped tiles and extracted colour blocks, with a Refresh button that cycles to a new photo and layout.

Built with React + Vite + Tailwind v4 + Motion.

---

## Project structure

```
fragment-collage-v4/
├── public/
│   └── images/          ← drop your photos here
├── src/
│   ├── App.tsx          ← all logic and rendering
│   ├── index.css        ← Tailwind import only
│   └── main.tsx         ← React entry point
├── index.html
├── package.json
└── vite.config.ts
```

---

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000` (or next available port).

---

## Adding or removing images

Drop any `.jpg`, `.jpeg`, `.png`, or `.webp` file into `public/images/` and rebuild. Filenames with spaces or special characters (including `#`) are handled automatically.

**No code changes needed.** The image list is auto-discovered at build time via `import.meta.glob`.

After adding images, rebuild:

```bash
npm run build
```

---

## Production build

```bash
npm run build
```

Output lands in `dist/`. This folder is fully self-contained — serve it from any static host (Netlify, Vercel, GitHub Pages, your own server).

---

## Embedding in a website

The component fills its container using a cover-scaling approach (always fills, never letterboxes). The simplest embed is an `<iframe>`.

### Option A — iframe (recommended for isolated embedding)

```html
<iframe
  src="/path/to/fragment-collage/index.html"
  style="width: 100%; height: 56.25vw; max-height: 100vh; border: none; display: block;"
  title="Fragment Collage"
></iframe>
```

`56.25vw` = full viewport width × 9/16. Adjust the ratio to taste. For a 3:2 grid feel use `66.67vw`.

If the collage is hosted on a separate subdomain or URL:

```html
<iframe
  src="https://your-collage-url.com"
  style="width: 100%; height: 66.67vw; border: none; display: block;"
  title="Fragment Collage"
  loading="lazy"
></iframe>
```

### Option B — inline section (same codebase)

If your website already uses React + Vite, copy `src/App.tsx` and `public/images/` into your project and render `<FragmentCollage />` directly as a section:

```tsx
import FragmentCollage from './components/FragmentCollage';

// In your page:
<section style={{ width: '100%', height: '66.67vw', maxHeight: '100vh', overflow: 'hidden' }}>
  <FragmentCollage />
</section>
```

You'll need `motion` and `lucide-react` in your project's dependencies:

```bash
npm install motion lucide-react
```

---

## Behaviour notes

- On **load**, a random image is selected automatically — no interaction needed.
- **Refresh** picks a new random image (never the same one twice in a row) and generates a new layout.
- The main feature tile changes **size and position** every refresh — it can land anywhere from top-left to bottom-right.
- On **portrait/mobile** viewports the grid scales to cover the full screen (sides crop), preserving cell proportions.
- **Colour tiles** are sampled from the loaded photo, so they always harmonise with it.

---

## Tweakable values in App.tsx

| Thing | Where | Notes |
|---|---|---|
| Grid dimensions | `cols = 12`, `rows = 8` | Changing these also needs the Tailwind classes `grid-cols-12 grid-rows-8` updated |
| Main tile size options | `MAIN_SIZES` array | Add/remove `{ w, h }` entries |
| Peripheral tile zoom range | `zoom: Math.random() * 2.5 + 1.5` | Min zoom 1.5×, max 4× on top of cover |
| Colour tile frequency | `Math.random() > 0.25` | Lower threshold = more colour tiles |
| Fade-in speed | `duration: 0.7` on the motion.div | In seconds |
| Stagger spread | `delay: Math.random() * 0.5` | Max stagger delay in seconds |
