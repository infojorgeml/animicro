# Breakdance Integration

How Animicro ensures compatibility with [Breakdance](https://breakdance.com/).

## How it works

| Layer | Detection | Behavior |
|-------|-----------|----------|
| **PHP** | `?breakdance=builder` in URL | Skips printing the dynamic hiding CSS (`opacity: 0`) in the editor |
| **JS** | `window.location.search.includes('breakdance=builder')` | Skips loading animation modules inside the editor |
| **CSS** | `body:not(.breakdance)` selector | Hiding rules only apply on the live frontend, never in the editor |

## Result

- **In the editor**: elements with `.am-fade` (and other animation classes) remain fully visible at `opacity: 1`.
- **On the live site**: elements start hidden (`opacity: 0`) and animate in when they enter the viewport — no flicker.

## Key Breakdance references

| Context | Identifier |
|---------|------------|
| Editor URL | `?breakdance=builder&id=POST_ID` |
| Editor body class | `breakdance` |
