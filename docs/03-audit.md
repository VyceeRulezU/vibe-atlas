# Code Audit & Security Review 🔍

## 1. API Key Exposure
*   **Finding**: The current implementation uses **Picsum Photos**, which requires **no API keys**.
*   **Status**: ✅ SAFE. There are no secrets in the source code.
*   **Recommendation**: If the project swaps to Unsplash or Pexels in the future, use `.env` files and never commit them to Git.

## 2. Race Conditions (Spam Clicking)
*   **Finding**: Users clicking moods very quickly could trigger multiple fetches, leading to "stale" data appearing if a later request finishes before an earlier one.
*   **Fix Implemented**: 
    *   **AbortController**: The `useVibeImages` hook cancels previous in-flight requests.
    *   **Same-Mood Guard**: If a mood is already loading, clicking it again is a no-op.
*   **Status**: ✅ RESOLVED.

## 3. API Rate Limiting
*   **Finding**: Picsum does not have strict public rate limits, but standard browsers might throttle simultaneous connections.
*   **Behavior**: Our app fetches 5 images in parallel.
*   **Risk**: If a user switches moods 100 times in a minute, Picsum or the browser might temporarily block requests.
*   **Fix**: The `ErrorState` component provides a "Retry" button to handle these temporary blocks gracefully.
*   **Status**: ⚠️ MONITORED.

## 4. Accessibility (a11y)
*   **Finding**: Images currently have generic alt text (`${mood} mood aesthetic`).
*   **Risk**: Screen reader users won't get a descriptive sense of the image content (since the API returns random images).
*   **Fix**: Added `aria-pressed` states to mood buttons and ensured landmarks like `<nav>`, `<main>`, and `<footer>` are used.
*   **Status**: 🟡 IMPROVABLE. Descriptive alt text is hard with random images, but the current implementation follows best practices for "decorative/vibe" images.

## 5. Performance (Re-renders)
*   **Finding**: The `App` component re-renders whenever the hook state changes.
*   **Risk**: Unnecessary re-renders of the `MoodBar` when images are loading.
*   **Fix**: used `useCallback` for functions passed to children.
*   **Status**: ✅ OPTIMIZED.

---

## Recommended Fixes Applied

### Fix A: Accessibility Landmark Enhancement
Updated `App.tsx` to include semantic landmarks. (Completed)

### Fix B: Individual Image Error Handling
Enhanced `ImageCard.tsx` to show a placeholder if a specific image URL returns a 404. (Completed)

### Fix C: Prevent Scrolling on Re-render
Ensure the grid maintains its height during loading to prevent "layout shift" (CLS).
**Applied to `ImageGrid.css`**: Added `min-height: 400px` to the grid container.
