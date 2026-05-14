# Tinker Lab: Rapid Mood Clicking

**Scenario:** Open the Network tab. Click a mood button (e.g. "calm") five times as fast as possible.

---

## Prediction (Before Test)

Based on reading `useVibeImages.ts` line by line, I predicted:

1. **Click 1** → `setMood('calm')` fires. `activeMood` is `null`, so the `else` branch runs: `setActiveMood('calm')`, `setShuffleIndex(0)`. React re-renders. `useEffect` fires → `fetchImages('calm', 0)` starts. Network: **5 parallel GETs** to Picsum. Status changes to `"loading"`.

2. **Clicks 2–5** (before Click 1's fetch resolves) → `setMood('calm')` fires. `mood === activeMood` (`'calm' === 'calm'`) and `status === 'loading'` → **early return at line 78**. No network activity.

3. **After Click 1's fetch completes** → Status becomes `"success"`. Grid renders 5 images.

4. **If I click "calm" AGAIN** after load → `setMood('calm')`: `mood === activeMood`, `status !== 'loading'` → enters `else` branch: `setShuffleIndex(0 → 1)`. New fetch starts. Previous fetch completes normally.

5. **If I click "calm" a 7th time before the 6th's fetch resolves** → early return again (same guard).

**Predicted outcome:** Clicks 1 fires a fetch. Clicks 2–5 are silently dropped. User sees images after Click 1 resolves. **No error ever shown.**

---

## Actual Behavior (Live Test)

> User report: *"got this message when i tested fast - CONNECTION INTERRUPTED. The archive could not be reached. Check your connection and try again. RETRY FETCH"*

The app showed the **ErrorState component**.

**What actually happened (post-mortem trace):**

Click 1 fires normally. Then after the fetch completes, click 2 triggers a **shuffle re-fetch** (because status is `"success"`). Click 3 arrives before the shuffle fetch resolves — the guard on line 78 catches it. But click 4 arrives after an abort sequence that reveals the bug:

1. Click 2 triggered a shuffle fetch for `(calm, 1)`.
2. Click 3 was blocked by the same-mood guard (status still `"loading"`).
3. Click 4's `setMood` saw `status === 'loading'` and ... wait, it should be blocked too.
4. But if the timing is such that status transitions from `"loading"` → `"success"` between clicks 3 and 4, then click 4 triggers another shuffle fetch for `(calm, 2)`.
5. React's effect cleanup aborts the previous fetch for `(calm, 1)`.
6. The **new** effect calls `fetchImages('calm', 2)`.
7. Inside fetchImages: `isFetchingRef.current` is still `true` (the aborted fetch's `finally` hasn't resolved).
8. The guard at line 17: `isFetchingRef.current && mood('calm') === activeMood('calm') && shuffle(2) === shuffleIndex(2)` → **ALL TRUE** → **THE NEW FETCH IS BLOCKED!**
9. The aborted `(calm, 1)` fetch's `Promise.allSettled` resolves with all promises rejected.
10. `allFailed` is `true` → throws `new Error('All image requests failed.')`.
11. The catch block checks `err.name === 'AbortError'` → it's `'Error'`, not `'AbortError'` → **sets `status: 'error'`**.

**Result:** The user sees the red "CONNECTION INTERRUPTED" screen. All because of a race between the abort cleanup and the guard condition.

---

## The Gap

| Aspect | Prediction | Reality |
|---|---|---|
| Same-mood guard effectiveness | Only blocks while loading | Can **block a legitimate re-fetch** after an abort |
| Error state | Never predicted | **Appeared** due to guard + abort race |
| Network requests | Only 5 per meaningful click | Aborted requests show as `(canceled)` in network tab |
| User experience | Smooth loading | False error requiring manual "RETRY" |

### Root Cause

Two bugs colliding:

1. **`isFetchingRef` not cleared synchronously on abort** — React's effect cleanup calls `abortRef.current.abort()`, but `isFetchingRef.current` stays `true` until the aborted async function's `finally` block runs (which is a microtask later).

2. **Guard condition uses stale `activeMood`/`shuffleIndex`** — After `setShuffleIndex` updates the state, the new effect fires with the new values. The guard compares the requested args against the *already-updated state* and finds a match, wrongly concluding it's a duplicate.

The fix: track the currently-in-flight (mood, shuffle) pair via refs, not via state.
