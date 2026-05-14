# Architecture

> How The Vibe Atlas is structured, why each decision was made, and how the pieces connect.

---

## Table of Contents

- [Mental Model](#mental-model)
- [Component Tree](#component-tree)
- [Component Responsibilities](#component-responsibilities)
- [Data Flow](#data-flow)
- [State Machine](#state-machine)
- [Hook Contract — `useVibeImages`](#hook-contract--usevibeimages)
- [Deduplication Strategy](#deduplication-strategy)
- [CSS Architecture](#css-architecture)
- [Type Definitions](#type-definitions)
- [Key Design Decisions](#key-design-decisions)

---

## Mental Model

The app has one job: **mood in → images out**.

Everything else — loading states, error handling, dedup guards — exists to make that pipeline feel instant and reliable. The architecture is deliberately flat. There is no global store, no context provider, no external state library. A single custom hook owns all async logic. Components are pure renderers that branch on status.

---

## Component Tree

```
App
├── MoodBar
│   └── MoodButton × 5          (calm | loud | warm | lonely | bright)
└── ImageGrid
    ├── [status: loading]
    │   └── SkeletonCard × 5
    ├── [status: success]
    │   └── ImageCard × 5
    └── [status: error]
        └── ErrorState
```

All state lives in `App` via `useVibeImages`. No child component manages its own async state.

---

## Component Responsibilities

### `App.tsx`
- Instantiates `useVibeImages`
- Passes `activeMood`, `setMood`, `status`, `images`, and `retry` down as props
- Renders the page shell: header, `MoodBar`, `ImageGrid`
- Owns no visual logic — it is a wiring layer

### `MoodBar.tsx`
- Renders five `<button>` elements, one per mood
- Highlights the active mood via a CSS class
- Fires `onMoodSelect(mood)` on click
- Disabled state when `status === 'loading'` to prevent mid-flight changes (optional, configurable)

### `ImageGrid.tsx`
- Receives `status`, `images`, and `onRetry`
- Branches rendering:
  - `loading` → renders five `<SkeletonCard />`
  - `success` → maps `images` to five `<ImageCard />`
  - `error` → renders `<ErrorState onRetry={onRetry} />`
  - `idle` → renders the empty/welcome state (prompt to select a mood)

### `ImageCard.tsx`
- Receives a single `VibeImage` object
- Renders the image with lazy loading (`loading="lazy"`)
- Shows source attribution on hover
- Handles individual image load errors with a fallback

### `SkeletonCard.tsx`
- Purely presentational — no props required
- Renders an animated shimmer placeholder matching `ImageCard` dimensions
- Animation is CSS-only (`@keyframes shimmer`)

### `ErrorState.tsx`
- Receives `onRetry: () => void`
- Displays a human-readable error message
- Renders a retry button that calls `onRetry`
- Optionally surfaces the raw error message in a `<details>` tag for debugging

---

## Data Flow

```
User clicks MoodButton
        │
        ▼
App: setMood(mood) called
        │
        ▼
useVibeImages: checks dedup guard
  ├── same mood + loading in flight → no-op, return
  └── new mood (or retry) → proceed
        │
        ▼
status → 'loading'
images → []
        │
        ▼
buildImageUrl(mood, index) × 5
        │
        ▼
Promise.allSettled(fetches)
        │
  ┌─────┴─────┐
  ▼           ▼
fulfilled   rejected
  │               │
  ▼               ▼
status →      status →
'success'     'error'
images →      error →
VibeImage[]   Error
        │
        ▼
ImageGrid re-renders
```

`Promise.allSettled` is used intentionally — a single failed image does not kill the whole board. Partial success is handled gracefully; failed slots render their own fallback.

---

## State Machine

The hook operates as an implicit finite state machine with four states:

```
         setMood()
idle ─────────────────► loading
 ▲                          │
 │        success           │
 │   ◄────────────────── (fetch resolves)
 │
 │        error             │
 └───◄────────────────── (fetch rejects)
          │
          │  retry()
          └────────────► loading
```

| State | `status` value | `images` | `error` |
|---|---|---|---|
| Initial | `'idle'` | `[]` | `null` |
| Fetching | `'loading'` | `[]` | `null` |
| Resolved | `'success'` | `VibeImage[5]` | `null` |
| Failed | `'error'` | `[]` | `Error` |

Transitions are only valid in one direction per user action. There is no `success → success` shortcut; every new mood selection cycles back through `loading`.

---

## Hook Contract — `useVibeImages`

```typescript
function useVibeImages(): {
  status:     'idle' | 'loading' | 'success' | 'error';
  images:     VibeImage[];
  activeMood: Mood | null;
  error:      Error | null;
  setMood:    (mood: Mood) => void;
  retry:      () => void;
}
```

### Behaviour guarantees

- Calling `setMood` with the current `activeMood` while `status === 'loading'` is a **no-op**
- Calling `setMood` with a **different** mood while `status === 'loading'` cancels the in-flight request via `AbortController` and starts a new fetch
- `retry()` replays the last `activeMood` through the full fetch cycle
- The hook never throws — all errors are caught and surfaced via `status: 'error'`

### `AbortController` usage

```typescript
const abortRef = useRef<AbortController | null>(null);

// On each new fetch:
abortRef.current?.abort();                    // cancel previous
abortRef.current = new AbortController();     // create new
fetch(url, { signal: abortRef.current.signal });
```

Cleanup on unmount aborts any pending request to prevent state updates on an unmounted component.

---

## Deduplication Strategy

Three layers of protection against wasted fetches:

1. **Same-mood guard** — If `mood === activeMood && status === 'loading'`, `setMood` returns early immediately
2. **AbortController** — If mood changes mid-flight, the previous fetch is aborted at the network level
3. **Ref-based pending flag** — A `isFetchingRef` boolean prevents any race condition between the abort and the new fetch starting

This means a user can spam all five buttons as fast as they want. Only the last-clicked mood will resolve. No waterfall of stale state updates.

---

## CSS Architecture

Styles are co-located by component with a single global file for tokens and reset.

```
src/styles/
├── global.css        ← CSS custom properties, reset, base typography
├── MoodBar.css
├── ImageGrid.css
├── ImageCard.css
├── SkeletonCard.css
└── ErrorState.css
```

### Custom Properties (defined in `global.css`)

```css
:root {
  /* Color */
  --color-bg:        #f5f2eb;   /* off-white paper */
  --color-ink:       #1a1a18;   /* near-black */
  --color-muted:     #8a8680;   /* secondary text */
  --color-accent:    #c8501a;   /* warm rust */
  --color-border:    #d4cfc6;   /* subtle rule */
  --color-skeleton:  #e8e4dc;   /* shimmer base */

  /* Typography */
  --font-display:    'Playfair Display', Georgia, serif;
  --font-body:       'DM Mono', 'Courier New', monospace;

  /* Spacing */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;
  --space-2xl: 64px;

  /* Grid */
  --grid-cols:   5;
  --card-radius: 4px;
  --card-aspect: 3 / 4;
}
```

### Skeleton shimmer animation

```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-skeleton) 25%,
    #f0ece4 50%,
    var(--color-skeleton) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
```

---

## Type Definitions

```typescript
// src/types/index.ts

export type Mood = 'calm' | 'loud' | 'warm' | 'lonely' | 'bright';

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface VibeImage {
  id:          string;
  url:         string;         // full-resolution src
  thumbUrl:    string;         // low-res placeholder
  width:       number;
  height:      number;
  photographer?: string;       // attribution (Unsplash only)
  sourceUrl?:  string;         // link back to original
}

export interface MoodConfig {
  label:      string;
  seedRange:  [number, number];
  keywords:   string[];
}

export type MoodConfigMap = Record<Mood, MoodConfig>;
```

---

## Key Design Decisions

### Why Picsum Photos instead of Unsplash API?

Picsum requires zero authentication. No API key in `.env`, no rate limit concerns, no account setup friction for contributors. The trade-off is less semantic control over image content — we use seed ranges to impose tonal consistency rather than keyword queries. See [`API.md`](./API.md) for the full rationale and a swap guide.

### Why `Promise.allSettled` instead of `Promise.all`?

`Promise.all` fails fast — one rejected fetch kills the entire board. `Promise.allSettled` lets the board render partial results. A single slow or broken image URL doesn't blank the whole grid. Failed slots render an individual card-level fallback instead.

### Why no global state (Context / Zustand / Redux)?

The app has one piece of meaningful async state: the current fetch. There is no cross-component state sharing problem to solve. A single hook at the `App` level and props drilling one level deep is the simplest correct solution. Adding a store would be architecture for architecture's sake.

### Why vanilla CSS over Tailwind or CSS Modules?

The brief specifies vanilla CSS explicitly. Beyond spec compliance: this app's design identity lives in a tight set of custom properties and a few expressive animations. Utility classes would obscure the intentionality of those choices. The component-co-located CSS files are easy to navigate and keep cascade specificity flat.

### Why TypeScript?

The `Mood` union type is the backbone of the entire app's correctness. Without it, passing an arbitrary string to `buildImageUrl` or `useVibeImages` would be a silent bug. TypeScript makes invalid moods a compile error, not a runtime mystery.
