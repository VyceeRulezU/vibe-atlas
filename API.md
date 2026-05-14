# API Reference

> How The Vibe Atlas fetches images, why Picsum was chosen, how URLs are constructed per mood, and how to swap to a different provider.

---

## Table of Contents

- [Provider Decision](#provider-decision)
- [Picsum Photos](#picsum-photos)
- [URL Construction](#url-construction)
- [Mood → Seed Mapping](#mood--seed-mapping)
- [Shuffle Mechanic](#shuffle-mechanic)
- [Error Cases](#error-cases)
- [Swapping to Unsplash](#swapping-to-unsplash)
- [Swapping to Pexels](#swapping-to-pexels)
- [Rate Limits & Caching](#rate-limits--caching)

---

## Provider Decision

Three candidates were evaluated:

| Provider | Auth Required | Free Tier | Keyword Support | Stable URLs |
|---|---|---|---|---|
| **Picsum Photos** | ❌ None | ✅ Unlimited | ❌ Seed-based | ✅ Yes |
| Unsplash Source | ❌ None | ✅ Limited | ✅ Yes | ⚠️ Deprecated |
| Unsplash API | ✅ API Key | ✅ 50 req/hr | ✅ Yes | ✅ Yes |
| Pexels API | ✅ API Key | ✅ 200 req/hr | ✅ Yes | ✅ Yes |

**Picsum Photos** was selected for the default implementation because:

1. **Zero authentication** — no `.env` file, no account, no key rotation, no contributor friction
2. **Stable, predictable URLs** — seed-based addressing means the same mood always feels tonally consistent across sessions
3. **No rate limits** — safe for dev, safe for demos, safe for production at this scale
4. **Reliable uptime** — maintained by David Marby & Nijiko Yonskai, widely used in the community

The trade-off: Picsum does not support keyword queries. Mood-to-seed mapping is used to impose tonal consistency. See [Mood → Seed Mapping](#mood--seed-mapping).

---

## Picsum Photos

**Base URL:** `https://picsum.photos`

**Docs:** [https://picsum.photos](https://picsum.photos)

### Core URL Patterns

```
# Random image at exact dimensions
https://picsum.photos/{width}/{height}

# Seeded image (deterministic — same seed = same image)
https://picsum.photos/seed/{seed}/{width}/{height}

# Image by specific ID
https://picsum.photos/id/{id}/{width}/{height}

# With grayscale
https://picsum.photos/seed/{seed}/{width}/{height}?grayscale

# With blur (1–10)
https://picsum.photos/seed/{seed}/{width}/{height}?blur=2

# Combine effects
https://picsum.photos/seed/{seed}/{width}/{height}?grayscale&blur=1
```

### Response

Picsum returns the image file directly — there is no JSON envelope. Each URL resolves to a `image/jpeg` or `image/webp` binary. Attribution metadata is available via the info endpoint:

```
https://picsum.photos/id/{id}/info
```

Example response:
```json
{
  "id": "237",
  "author": "André Spieker",
  "width": 3500,
  "height": 2095,
  "url": "https://unsplash.com/photos/...",
  "download_url": "https://picsum.photos/id/237/3500/2095"
}
```

---

## URL Construction

`buildImageUrl.ts` is the single point of truth for all URL assembly.

```typescript
// src/utils/buildImageUrl.ts

import type { Mood, MoodConfig, MoodConfigMap } from '../types';

const MOOD_CONFIG: MoodConfigMap = {
  calm:   { label: 'Calm',   seedRange: [10,  50],  effects: ['grayscale', 'blur=1'] },
  loud:   { label: 'Loud',   seedRange: [200, 250], effects: [] },
  warm:   { label: 'Warm',   seedRange: [100, 140], effects: [] },
  lonely: { label: 'Lonely', seedRange: [500, 540], effects: ['grayscale'] },
  bright: { label: 'Bright', seedRange: [300, 340], effects: [] },
};

const CARD_WIDTH  = 600;
const CARD_HEIGHT = 800;

export function buildImageUrl(
  mood:    Mood,
  index:   number,   // 0–4 for the five cards
  shuffle: number = 0  // offset to generate fresh sets
): string {
  const config = MOOD_CONFIG[mood];
  const [min, max] = config.seedRange;
  const range = max - min;
  const seed  = min + ((index + shuffle * 5) % range);

  const base    = `https://picsum.photos/seed/${seed}/${CARD_WIDTH}/${CARD_HEIGHT}`;
  const effects = config.effects.length > 0
    ? `?${config.effects.join('&')}`
    : '';

  return `${base}${effects}`;
}
```

### Example output

```
calm,  index 0 → https://picsum.photos/seed/10/600/800?grayscale&blur=1
loud,  index 0 → https://picsum.photos/seed/200/600/800
warm,  index 2 → https://picsum.photos/seed/102/600/800
lonely,index 4 → https://picsum.photos/seed/504/600/800?grayscale
bright,index 1 → https://picsum.photos/seed/301/600/800
```

---

## Mood → Seed Mapping

Seeds are not random. Each mood owns a slice of the Picsum seed space, chosen for tonal consistency:

| Mood | Seed Range | Effects Applied | Tonal Intent |
|---|---|---|---|
| `calm` | 10–50 | `grayscale`, `blur=1` | Desaturated nature, soft focus |
| `loud` | 200–250 | none | High-contrast, editorial colours |
| `warm` | 100–140 | none | Golden-hour tones, organic textures |
| `lonely` | 500–540 | `grayscale` | Empty architecture, long distances |
| `bright` | 300–340 | none | Overexposed, airy, high-key |

Seed ranges are spaced deliberately so no two moods share images. The ranges are intentionally narrow (40 seeds) so the five cards within one mood feel like a curated set rather than five random images.

---

## Shuffle Mechanic

A `shuffleIndex` integer increments each time the user clicks the same active mood or presses a future "shuffle" button. It offsets the seed calculation, producing a fresh set of five images while staying within the same mood's tonal range.

```typescript
// In useVibeImages.ts
const [shuffleIndex, setShuffleIndex] = useState(0);

// When same mood is clicked again (post-MVP) or shuffle button pressed:
setShuffleIndex(prev => prev + 1);

// buildImageUrl uses shuffleIndex as the offset:
const url = buildImageUrl(mood, cardIndex, shuffleIndex);
```

---

## Error Cases

Picsum is reliable, but network failures are real. Three error layers handle this:

### 1. Fetch-level failure

`useVibeImages` wraps all fetches in `Promise.allSettled`. A non-200 response or network timeout is caught and sets `status: 'error'`. The `ErrorState` component surfaces a retry button.

```typescript
const results = await Promise.allSettled(
  Array.from({ length: 5 }, (_, i) =>
    fetch(buildImageUrl(mood, i), { signal })
  )
);
```

### 2. Individual card failure

Each `<ImageCard>` handles its own `onError` event. If a single image fails to load after the URL is in the DOM (e.g. partial network failure), the card renders a fallback placeholder rather than a broken `<img>` tag.

```tsx
<img
  src={image.url}
  alt={`${mood} vibe`}
  onError={(e) => {
    e.currentTarget.src = '/fallback-card.svg';
  }}
/>
```

### 3. Abort signal

If a fetch is cancelled (new mood selected mid-flight), the `AbortError` is explicitly caught and silently swallowed — it is not an error worth surfacing to the user.

```typescript
try {
  const res = await fetch(url, { signal });
  // ...
} catch (err) {
  if (err instanceof DOMException && err.name === 'AbortError') return; // silent
  throw err; // real errors bubble up
}
```

---

## Swapping to Unsplash

If you want keyword-based queries (closer mood accuracy), swap to the Unsplash API.

### 1. Get an API key

Register at [https://unsplash.com/developers](https://unsplash.com/developers). The free tier allows **50 requests/hour**.

### 2. Add to `.env`

```env
VITE_UNSPLASH_ACCESS_KEY=your_access_key_here
```

### 3. Update `buildImageUrl.ts`

```typescript
const MOOD_KEYWORDS: Record<Mood, string> = {
  calm:   'minimal nature calm',
  loud:   'bold graphic editorial loud',
  warm:   'golden hour warm light',
  lonely: 'empty architecture lonely',
  bright: 'overexposed airy white bright',
};

export function buildImageUrl(mood: Mood, index: number): string {
  const key     = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  const query   = encodeURIComponent(MOOD_KEYWORDS[mood]);
  const page    = Math.floor(index / 5) + 1;
  const perPage = 5;

  return `https://api.unsplash.com/photos/random`
       + `?query=${query}&count=5`
       + `&client_id=${key}`;
}
```

### 4. Update `useVibeImages.ts`

The Unsplash API returns a **JSON array** rather than a direct image binary. Parse the response and map to `VibeImage`:

```typescript
const res  = await fetch(url, { signal });
const data = await res.json() as UnsplashPhoto[];

const images: VibeImage[] = data.map(photo => ({
  id:           photo.id,
  url:          photo.urls.regular,
  thumbUrl:     photo.urls.thumb,
  width:        photo.width,
  height:       photo.height,
  photographer: photo.user.name,
  sourceUrl:    photo.links.html,
}));
```

### 5. Required attribution

Unsplash requires photographer attribution when using the API. `ImageCard` already renders a hover-state attribution line — ensure `photographer` and `sourceUrl` are populated.

---

## Swapping to Pexels

### 1. Get an API key

Register at [https://www.pexels.com/api](https://www.pexels.com/api). Free tier: **200 requests/hour**.

### 2. Add to `.env`

```env
VITE_PEXELS_API_KEY=your_api_key_here
```

### 3. Update `buildImageUrl.ts`

```typescript
const MOOD_KEYWORDS: Record<Mood, string> = {
  calm:   'serene landscape',
  loud:   'vibrant abstract',
  warm:   'golden sunset',
  lonely: 'empty street',
  bright: 'white minimal',
};

export function buildQueryUrl(mood: Mood): string {
  const query = encodeURIComponent(MOOD_KEYWORDS[mood]);
  return `https://api.pexels.com/v1/search?query=${query}&per_page=5&page=1`;
}
```

### 4. Update fetch call

```typescript
const res = await fetch(queryUrl, {
  headers: {
    Authorization: import.meta.env.VITE_PEXELS_API_KEY
  },
  signal
});

const data = await res.json() as PexelsResponse;

const images: VibeImage[] = data.photos.map(photo => ({
  id:           String(photo.id),
  url:          photo.src.large,
  thumbUrl:     photo.src.small,
  width:        photo.width,
  height:       photo.height,
  photographer: photo.photographer,
  sourceUrl:    photo.url,
}));
```

---

## Rate Limits & Caching

### Picsum (default)

No rate limits documented. Responses are cached at the CDN edge. Repeated requests for the same seed URL will resolve from cache.

### Unsplash API

- Demo apps: 50 requests/hour
- Production apps (approved): 5,000 requests/hour
- Each "fetch five images" action = 1 API request (using `count=5`)

### Pexels API

- 200 requests/hour
- 20,000 requests/month

### Browser-side caching

The app does not implement its own cache layer. Browsers cache `<img>` `src` responses natively. If a user selects the same mood twice, the images resolve from the browser cache on the second click — no network round-trip.

Future improvement: a simple `Map<Mood, VibeImage[]>` in the hook could serve as an in-session cache, preventing repeat API calls entirely.
