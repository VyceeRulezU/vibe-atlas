# Lie Detector

## The Five Statements

Five assertions about the Vibe Atlas codebase at commit `ee8984c`. Exactly one is false.

---

**A.** The `MoodBar` component wraps mood buttons in a `<nav>` element for semantic accessibility.

**B.** The `buildImageUrl` function applies `grayscale` and `blur=1` effects to the `bright` mood.

**C.** The `useVibeImages` hook stores a mutable ref (`abortRef`) to cancel in-flight fetch requests.

**D.** The `SkeletonCard` component uses a CSS `shimmer` animation via a `@keyframes` rule.

**E.** The `setMood` callback resets `shuffleIndex` to `0` when the user selects a mood different from the current one.

---

## Third-Party Review

### Statement A — `<nav>` wrapper
Source: `src/components/MoodBar.tsx:14`
```
<nav className="mood-bar">
```
**Verdict: TRUE.** The outermost element is `<nav>`, confirming the semantic landmark claimed in the audit.

### Statement B — `bright` mood effects
Source: `src/utils/buildImageUrl.ts:8`
```typescript
bright: { label: 'Bright', seedRange: [300, 340], effects: [] },
```
**Verdict: FALSE.** The `bright` mood has an **empty effects array**. It is the `calm` mood (line 4) that receives `['grayscale', 'blur=1']`. Statement B is the lie.

### Statement C — mutable ref for abort
Source: `src/hooks/useVibeImages.ts:12`
```typescript
const abortRef = useRef<AbortController | null>(null);
```
And lines 22-24 show `abortRef.current.abort()` being called.
**Verdict: TRUE.** The ref pattern is present and functional.

### Statement D — shimmer keyframes
Source: `src/styles/SkeletonCard.css:27-33`
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
And line 24 applies `animation: shimmer 1.5s infinite;`.
**Verdict: TRUE.** The animation is defined and applied to the `.shimmer` child element.

### Statement E — shuffleIndex reset on mood switch
Source: `src/hooks/useVibeImages.ts:83-85`
```typescript
setActiveMood(mood);
setShuffleIndex(0);
```
**Verdict: TRUE.** When `mood !== activeMood`, `shuffleIndex` is explicitly reset to `0`.

---

## Conclusion

| Statement | Truth Value |
|---|---|
| A | ✅ True |
| B | ❌ **Lie** |
| C | ✅ True |
| D | ✅ True |
| E | ✅ True |

**The lie is Statement B.** The `bright` mood has no image effects. The statement describes the `calm` mood configuration instead.
