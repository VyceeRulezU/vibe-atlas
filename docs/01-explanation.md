# How The Vibe Atlas Works (Explained for a 7-Year-Old) 🎨

Hi there! Let me tell you how this magic mood board works, step by step, just like a storybook.

## 1. The Custom Hook (`useVibeImages.ts`)
This is the "Brain" of the app. It remembers what mood you picked and goes to the internet to find pictures.

*   **`const [status, setStatus] = useState('idle')`**: This is like a traffic light.
    *   `idle` means "ready to go!"
    *   `loading` means "I'm busy finding pictures, please wait."
    *   `success` means "I found them! Look!"
    *   `error` means "Oh no, the internet is acting up."
*   **`useEffect`**: This is a special watcher. It says, "Every time the mood changes (like from 'Calm' to 'Loud'), I will run my code to fetch new pictures."
    *   **Dependencies (`[activeMood, shuffleIndex]`)**: This is the list of things the watcher looks at. If one of these changes, the watcher starts working.
*   **`fetch`**: This is like sending a letter to a giant library (Picsum) asking for 5 pictures.
*   **`AbortController` & `abort()`**: Imagine you asked for 'Calm' pictures, but then you immediately clicked 'Loud'. The `abort()` button tells the first request, "Never mind! Stop looking for 'Calm' pictures, I want 'Loud' ones now!" This keeps the Brain from getting confused.
*   **`isFetchingRef`**: This is a "Do Not Disturb" sign. If the Brain is already busy, it won't start a second job for the same mood.

## 2. The Components (The Building Blocks)

### `MoodBar.tsx` (The Buttons)
These are like flavor tabs on a box of cookies. When you click one, it tells the Brain, "Hey, I want this flavor!"

### `ImageGrid.tsx` (The Photo Album)
This is a big empty frame. Depending on the traffic light (`status`):
*   If it's **Loading**, it shows "Ghost" boxes (Skeletons) that wiggle while we wait.
*   If it's **Success**, it puts the real pictures in the frames.
*   If it's **Error**, it shows a sad face and a "Try Again" button.

### `SkeletonCard.tsx` (The Ghost Boxes)
These are gray boxes with a "shimmer" (like a shiny light) that moves across them. It tells you, "Something is coming!"

### `ImageCard.tsx` (The Frame)
Each picture gets its own frame.
*   **`onLoad`**: When the picture finally arrives, it fades in smoothly so it doesn't just "pop" in and scare you.
*   **`onError`**: If one specific picture gets lost on the way, the frame shows a "Picture Missing" icon instead of a broken link.

## 3. The Utility (`buildImageUrl.ts`)
This is the "Address Book". It takes your mood and calculates a secret address for each picture so the giant library knows exactly which ones to send.

---

And that's it! You click a mood, the Brain sends a letter, the Ghost boxes wait for the mail, and then—*Tada!*—your mood board is ready! 🌟
