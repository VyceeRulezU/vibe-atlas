# Engineering Principles in The Vibe Atlas 🏛️

The Vibe Atlas is built with clean code principles to ensure it is easy to read, maintain, and scale.

## 1. Separation of Concerns (SoC)
We keep different "jobs" in different files:
*   **Data Fetching Logic**: Encapsulated in the `useVibeImages` hook. The components don't know *how* images are fetched; they just receive the results.
*   **UI Components**: Focused purely on rendering. `MoodBar` handles the buttons, `ImageGrid` handles the layout, and `ImageCard` handles individual visuals.
*   **Business Logic/Utilities**: `buildImageUrl.ts` handles the mapping of moods to specific API parameters, keeping this logic out of the UI and hooks.

## 2. State Management & The State Machine
The app uses an implicit **Finite State Machine** via the `status` state:
*   `idle` → `loading` → `success` OR `error`
*   Transitions are predictable: clicking a mood always triggers `loading`.
*   This prevents "impossible states" (like showing images and an error message at the same time).

## 3. Dependency Injection (via Props)
Components like `ImageGrid` and `MoodBar` receive their data and functions as **props**.
*   This makes them "Pure Components" that are easy to test.
*   The `App` component acts as the "Orchestrator," injecting the necessary state from the hook into the components.

## 4. Immutability of Data
When new images are fetched, we don't change the old list; we replace it with a **completely new array** (`setImages(successfulImages)`).
*   In React, this is crucial for the UI to know that something changed and it needs to re-render.

## 5. Graceful Degradation & Error Boundaries
While we didn't use a formal React `ErrorBoundary` class component, we implemented **Component-Level Error Handling**:
*   If the whole fetch fails, `ErrorState` handles it.
*   If a single image fails to load, `ImageCard` handles it with a local fallback.
*   This ensures a single failure doesn't break the entire user experience.

## 6. Defensive Programming (Fetch Guards)
*   **AbortController**: Automatically cancels stale network requests.
*   **Deduplication**: Prevents the user from accidentally firing multiple identical requests if they double-click a button.
*   **Loading-State Disabling**: The `MoodBar` disables buttons while loading to prevent race conditions (optional but implemented in logic).
