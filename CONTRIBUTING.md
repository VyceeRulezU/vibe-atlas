# Contributing to The Vibe Atlas

> Setup instructions, code conventions, branch strategy, and pull request guidelines.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Dev Environment Setup](#dev-environment-setup)
- [Project Scripts](#project-scripts)
- [Branch Strategy](#branch-strategy)
- [Code Conventions](#code-conventions)
- [Component Guidelines](#component-guidelines)
- [CSS Guidelines](#css-guidelines)
- [Commit Message Format](#commit-message-format)
- [Pull Request Checklist](#pull-request-checklist)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

Before contributing, read:

- [`README.md`](../README.md) — project overview and feature list
- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) — component tree, state machine, data flow
- [`docs/API.md`](./API.md) — image API strategy and URL construction

Understanding the architecture before writing code prevents most structural mismatches in PRs.

---

## Dev Environment Setup

### Requirements

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | `18.0.0` | `node --version` |
| npm | `9.0.0` | `npm --version` |
| Git | `2.38.0` | `git --version` |

### First-time setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/vibe-atlas.git
cd vibe-atlas

# 2. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/vibe-atlas.git

# 3. Install dependencies
npm install

# 4. Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

### No `.env` required

The default Picsum Photos integration requires no API keys. If you are working on an Unsplash or Pexels integration, copy the example env file:

```bash
cp .env.example .env
# Then add your key
```

---

## Project Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with hot module replacement |
| `npm run build` | TypeScript compile + production Vite build to `dist/` |
| `npm run preview` | Serve the `dist/` build at `http://localhost:4173` |
| `npm run typecheck` | Run `tsc --noEmit` to check types without emitting files |
| `npm run lint` | ESLint across all `src/**/*.{ts,tsx}` files |
| `npm run lint:fix` | ESLint with `--fix` flag |

Run `npm run typecheck && npm run lint` before every commit. Both must pass cleanly.

---

## Branch Strategy

The repo uses a simple three-tier branch model:

```
main           ← production-ready, protected
  └── dev      ← integration branch, all PRs target here
        └── feature/your-feature-name   ← your work
```

### Branch naming

```
feature/mood-shuffle-button
fix/skeleton-card-overflow
chore/update-picsum-seed-ranges
docs/add-api-swap-guide
```

| Prefix | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Deps, config, tooling |
| `docs/` | Documentation only |
| `refactor/` | Code changes with no behaviour change |

### Workflow

```bash
# Start from an up-to-date dev branch
git checkout dev
git pull upstream dev

# Create your feature branch
git checkout -b feature/your-feature-name

# Do your work, commit often
git add .
git commit -m "feat: add shuffle button to MoodBar"

# Push to your fork
git push origin feature/your-feature-name

# Open a PR targeting dev (not main)
```

---

## Code Conventions

### TypeScript

- Enable strict mode — `tsconfig.json` has `"strict": true`
- No `any` types. Use `unknown` and narrow explicitly if needed
- All exported functions and components must have explicit return types
- Prefer `type` over `interface` for object shapes unless extension is needed

```typescript
// ✅ Good
export function buildImageUrl(mood: Mood, index: number): string { ... }

// ❌ Avoid
export function buildImageUrl(mood, index) { ... }
```

### React

- Functional components only — no class components
- Destructure props at the function signature
- Use named exports for components, default export only in `App.tsx`

```tsx
// ✅ Good
export function ImageCard({ image, mood }: ImageCardProps) { ... }

// ❌ Avoid
export default function(props: any) { ... }
```

- No inline styles. Use CSS classes. Exception: dynamic values that cannot be expressed as a class (e.g. `style={{ '--aspect': ratio }}` CSS custom property overrides)
- Avoid `useEffect` for data fetching — all async logic lives in `useVibeImages`

### File naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `ImageCard.tsx` |
| Hooks | camelCase, `use` prefix | `useVibeImages.ts` |
| Utilities | camelCase | `buildImageUrl.ts` |
| Types | camelCase | `index.ts` |
| CSS | Match component | `ImageCard.css` |

### Imports order

1. React and React-adjacent (`react`, `react-dom`)
2. Third-party libraries
3. Internal components (`../components/...`)
4. Internal hooks (`../hooks/...`)
5. Internal utils and types
6. CSS files (last)

---

## Component Guidelines

### Props

- Define a `Props` type for every component, even if it has only one prop
- Props names should be clear without needing a comment
- Callback props use the `on` prefix: `onMoodSelect`, `onRetry`

```typescript
type MoodBarProps = {
  activeMood:    Mood | null;
  onMoodSelect:  (mood: Mood) => void;
  disabled?:     boolean;
};
```

### Children

- Only use `children` when the component's purpose is layout or composition
- Avoid `React.FC` — it implicitly types `children` and hides return type

### Keys

- Never use array index as `key` when the list can reorder
- For the image grid, use `image.id` as key
- For skeleton cards (static, same order always), index keys are acceptable

---

## CSS Guidelines

Follow the patterns established in `src/styles/global.css`:

### Custom properties

- All design tokens live in `:root` in `global.css`
- Never hardcode colors, spacing, or font sizes in component CSS files — reference variables
- New tokens must be added to `global.css` before using them

### Specificity

- Aim for single-class selectors in component files: `.mood-button { ... }`
- Use modifier classes for state: `.mood-button--active`, `.mood-button--disabled`
- Never use `!important`
- Avoid element selectors except in `global.css`

### Animations

- All `@keyframes` definitions go in the component CSS file that uses them
- Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
```

### Responsive

- Mobile-first: default styles target small screens, media queries expand up
- The image grid collapses to a 2-column or 1-column layout on narrow viewports
- Breakpoints use `em` units, not `px`

```css
/* Mobile first */
.image-grid { grid-template-columns: 1fr 1fr; }

/* Desktop */
@media (min-width: 60em) {
  .image-grid { grid-template-columns: repeat(5, 1fr); }
}
```

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or visible behaviour change |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | CSS or formatting, no logic change |
| `refactor` | Code restructure with no behaviour change |
| `chore` | Deps, build config, tooling |
| `test` | Adding or updating tests |

### Examples

```
feat(MoodBar): add active mood highlight state
fix(useVibeImages): prevent duplicate fetches on rapid clicks
docs(API): add Pexels swap guide
style(SkeletonCard): fix shimmer gradient direction
chore: upgrade vite to 5.2.0
```

Scope is optional but encouraged for component-level changes. Keep the subject line under 72 characters.

---

## Pull Request Checklist

Before opening a PR, confirm all of the following:

### Code quality
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run lint` passes with no warnings
- [ ] No `console.log` statements left in production code
- [ ] No commented-out code blocks left in

### Behaviour
- [ ] Feature works end-to-end in the browser (`npm run dev`)
- [ ] Loading state renders correctly (skeletons visible before images resolve)
- [ ] Error state renders correctly (can be tested by disabling network in DevTools)
- [ ] Retry button works after an error state
- [ ] Rapid mood button clicking does not cause duplicate fetches or visual glitches

### Accessibility
- [ ] Interactive elements are keyboard-navigable (Tab, Enter, Space)
- [ ] Focus rings are visible on all interactive elements
- [ ] Images have descriptive `alt` text (minimum: mood + "vibe")
- [ ] Colour contrast meets WCAG AA (4.5:1 for normal text)

### Responsive
- [ ] Grid collapses gracefully on viewport widths below 480px
- [ ] No horizontal scroll introduced at any breakpoint

### Documentation
- [ ] If you added a new component, it is documented in `ARCHITECTURE.md`
- [ ] If you changed URL construction logic, `API.md` is updated
- [ ] If you changed the dev workflow, `CONTRIBUTING.md` is updated
- [ ] `README.md` updated if visible features changed

### PR description
- [ ] Title follows Conventional Commits format
- [ ] Description explains **what** changed and **why**
- [ ] Screenshots or screen recordings attached for visual changes
- [ ] Linked to the relevant issue (if applicable)

---

## Reporting Issues

Open an issue on GitHub with:

1. **Title** — short, specific (`Skeleton cards overflow on mobile at 320px`)
2. **Steps to reproduce** — exact clicks/interactions that trigger the bug
3. **Expected behaviour** — what should have happened
4. **Actual behaviour** — what actually happened
5. **Environment** — browser, OS, viewport width
6. **Screenshot or recording** — if it's a visual issue

Feature requests are welcome. Label them `enhancement` and describe the problem you are trying to solve, not just the solution you have in mind.
