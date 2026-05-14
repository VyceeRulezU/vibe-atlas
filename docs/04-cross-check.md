# Cross-Check: Audit vs. Codebase

**Date:** 2026-05-14
**Scope:** Compare each claim in `03-audit.md` against the live source tree at commit `ee8984c`.

---

## 1. API Key Exposure

| Claim | Status | Evidence |
|---|---|---|
| "Uses Picsum Photos, no API keys" | ✅ **Confirmed** | `buildImageUrl.ts:24` — only `picsum.photos` URLs. Zero env vars in codebase. |
| "No secrets in source" | ✅ **Confirmed** | No `.env` files committed. `.gitignore:11` includes `.env` patterns. |

**Cross-check verdict:** PASS.

---

## 2. Race Conditions (Spam Clicking)

| Claim | Status | Evidence |
|---|---|---|
| "AbortController cancels in-flight requests" | ✅ **Confirmed** | `useVibeImages.ts:22-24` calls `abortRef.current.abort()`. Cleanup at line 99 calls abort on unmount. |
| "Same-mood guard prevents duplicate fetches" | ⚠️ **Has a Bug** | Guard at line 17: `if (isFetchingRef.current && mood === activeMood && shuffle === shuffleIndex)`. This will **block a legitimate re-fetch** after an abort because `isFetchingRef.current` is still `true` (the `finally` block at line 73 hasn't executed yet). |
| "Race condition is resolved" | ❌ **FALSE** | See below. |

### The Bug (Critical)

When a user clicks the same mood that is **already loaded**, the hook increments `shuffleIndex`. This triggers a `useEffect` re-run:
1. React runs the previous effect's cleanup → `abortRef.current.abort()`
2. React runs the new effect → calls `fetchImages(mood, newShuffle)`
3. Inside `fetchImages`: `isFetchingRef.current` is still `true` (the old fetch's `finally` hasn't resolved yet)
4. The guard **incorrectly blocks** the new fetch because `shuffle === shuffleIndex` matches the updated state
5. The old (aborted) `Promise.allSettled` resolves — all promises are rejected → throws `"All image requests failed."`
6. Since the error is NOT an `AbortError` (it's a generic `Error`), the catch block sets `status: 'error'`

**Result:** Rapid same-mood clicking can show a false "CONNECTION INTERRUPTED" error.

The same-mood guard's condition is wrong — it should only block when the *exact same* (mood, shuffle) pair is being fetched, not when `shuffleIndex` has already advanced.

### Fix needed

Replace the guard at line 17 with logic that checks the *arguments* against the *in-flight request's identity*, not against `activeMood`/`shuffleIndex` state which may have already updated:

```
// Before: state-dependent guard (broken)
if (isFetchingRef.current && mood === activeMood && shuffle === shuffleIndex) return;

// After: guard via stored identity ref
if (isFetchingRef.current && mood === currentFetchMoodRef.current && shuffle === currentFetchShuffleRef.current) return;
// Set refs at the start of fetch
currentFetchMoodRef.current = mood;
currentFetchShuffleRef.current = shuffle;
```

---

## 3. API Rate Limiting

| Claim | Status | Evidence |
|---|---|---|
| "Picsum has no strict rate limits" | ✅ **Confirmed** | Picsum docs confirm no documented caps. |
| "Fetches 5 images in parallel" | ✅ **Confirmed** | `useVibeImages.ts:33` — `Array.from({length: 5})`. |
| "ErrorState provides Retry button" | ✅ **Confirmed** | `ErrorState.tsx:15`. |

**Cross-check verdict:** PASS.

---

## 4. Accessibility (a11y)

| Claim | Status | Evidence |
|---|---|---|
| "Images have generic alt text" | ✅ **Confirmed** | `ImageCard.tsx:31` — `` `${mood} mood aesthetic` ``. |
| "aria-pressed on mood buttons" | ✅ **Confirmed** | `MoodBar.tsx:21` — `aria-pressed={activeMood === mood}`. |
| "Semantic landmarks used" | ✅ **Confirmed** | `App.tsx:11-30` — `<header>`, `<main>`, `<footer>`. |

**Cross-check verdict:** PASS.

---

## 5. Performance (Re-renders)

| Claim | Status | Evidence |
|---|---|---|
| "useCallback prevents unnecessary re-renders" | ⚠️ **Partially Correct** | `useCallback` wraps `setMood` and `retry` at lines 77 and 88, but the deps array (`[activeMood, status]`) means the callback **recreates on every state change anyway** — the `useCallback` is effectively a no-op for `setMood` because `activeMood` changes on every mood click. |
| "MoodBar won't re-render when images load" | ⚠️ **Not Actually Fixed** | `MoodBar` receives `status` as `isLoading`, and `App.tsx` re-renders entirely because all state lives in the hook at the app level. The `isLoading` prop changes when status changes, causing MoodBar to re-render regardless. |

**Cross-check verdict:** MINOR OVERSTATEMENT. The `useCallback` wrappers don't prevent MoodBar re-renders because `activeMood` is in the dependency array and changes on every mood click anyway.

---

## Summary

| # | Finding | Audit Status | Actual Status |
|---|---|---|---|
| 1 | API Key Exposure | ✅ SAFE | ✅ SAFE |
| 2 | Race Conditions | ✅ RESOLVED | ❌ **BUG: false error on rapid same-mood click** |
| 3 | Rate Limiting | ⚠️ MONITORED | ⚠️ MONITORED |
| 4 | Accessibility (a11y) | 🟡 IMPROVABLE | 🟡 IMPROVABLE |
| 5 | Performance | ✅ OPTIMIZED | ⚠️ OVERSTATED (useCallback is ineffectual) |
