# Bricks Builder Integration

How Animicro ensures compatibility with [Bricks Builder](https://bricksbuilder.io/).

## How it works

| Layer | Detection | Behavior |
|-------|-----------|----------|
| **PHP** | `?bricks=run` in URL | Skips printing the dynamic hiding CSS (`opacity: 0`) in the editor iframe |
| **JS** | `window.location.search.includes('bricks=run')` | Skips loading animation modules inside the editor |
| **CSS** | `body:not(.bricks-is-builder)` selector | Hiding rules only apply on the live frontend, never in the editor |

## Result

- **In the editor**: elements with `.am-fade` (and other animation classes) remain fully visible at `opacity: 1`.
- **On the live site**: elements start hidden (`opacity: 0`) and animate in when they enter the viewport — no flicker.

## Key Bricks references

| Context | Identifier |
|---------|------------|
| Editor iframe URL | `?bricks=run` |
| Editor body class | `bricks-is-builder` |
| Frontend body class | `bricks-is-frontend` |
