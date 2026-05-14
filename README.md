# The Vibe Atlas

> A mood board that pulls random aesthetics from the open web.

---

## What It Is

Designers steal vibes for a living. They scroll for hours, pull screenshots, build mood boards, and call it research.

**The Vibe Atlas** gives them a button.

One press and the page fills with five fresh images in a chosen mood — calm, loud, warm, lonely, bright. The mood is the input. The web is the source. The board is the output.

---

## Live Demo

[View The Vibe Atlas Live](https://vyceerulezu.github.io/vibe-atlas/)

---

## Preview

<!-- Screenshot coming soon -->


---

## Features

- **Five mood categories** — Calm · Loud · Warm · Lonely · Bright
- **Instant image grid** — Five curated images surface on every mood selection
- **Skeleton shimmer loading** — Graceful loading states while images resolve
- **Deduplication guard** — Spamming a button won't fire duplicate fetches
- **Clean error state** — Fetch failures surface a retry button, not a blank page
- **No API key required** — Powered by Picsum Photos, open and free

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 18 + Vite | Fast dev server, native ESM, minimal config |
| Language | TypeScript | Type-safe mood unions, image interfaces, hook contracts |
| Data fetching | Native `fetch` | No dependency overhead for simple GET requests |
| Image API | [Picsum Photos](https://picsum.photos) | Zero auth, stable URLs, consistent image quality |
| Styles | Vanilla CSS (modular) | No build-time overhead, explicit cascade, portable |

---

## Project Structure

```
vibe-atlas/
├── public/
├── src/
│   ├── components/
│   │   ├── MoodBar.tsx
│   │   ├── ImageGrid.tsx
│   │   ├── ImageCard.tsx
│   │   ├── SkeletonCard.tsx
│   │   └── ErrorState.tsx
│   ├── hooks/
│   │   └── useVibeImages.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── buildImageUrl.ts
│   ├── styles/
│   │   ├── global.css
│   │   ├── MoodBar.css
│   │   ├── ImageGrid.css
│   │   ├── ImageCard.css
│   │   ├── SkeletonCard.css
│   │   └── ErrorState.css
│   ├── App.tsx
│   └── main.tsx
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── CONTRIBUTING.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Full explanation of every layer lives in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## Quick Start

### Prerequisites

- Node.js `>=18.0.0`
- npm `>=9.0.0` or pnpm `>=8.0.0`

### Install & Run

```bash
# Clone the repo
git clone https://github.com/vyceerulezu/vibe-atlas.git
cd vibe-atlas

# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at `http://localhost:5173` by default.

### Build for Production

```bash
npm run build
npm run preview   # preview the production build locally
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Serve the `dist/` output locally |
| `npm run typecheck` | Run `tsc --noEmit` without building |
| `npm run lint` | ESLint across `src/` |

---

## Environment Variables

No environment variables are required. The Picsum Photos API is fully open.

If you swap to Unsplash or Pexels, you will need an API key. See [`docs/API.md`](./docs/API.md) for the swap guide.

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 112+ | ✅ Full |
| Firefox 113+ | ✅ Full |
| Safari 16.4+ | ✅ Full |
| Edge 112+ | ✅ Full |

---

## Roadmap

- [ ] Save / export mood board as PNG
- [ ] Shuffle button within an active mood
- [ ] Custom mood — type any keyword
- [ ] Drag to reorder cards
- [ ] Dark / light theme toggle

---

## Contributing

See [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) for setup instructions, branch conventions, and PR guidelines.

---

## License

MIT — do whatever you want, just don't ship it as your own product without the vibe.
