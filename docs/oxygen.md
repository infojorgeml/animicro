# Oxygen Builder Integration

How Animicro ensures compatibility with [Oxygen Builder](https://oxygenbuilder.com/).

## How it works

| Layer | Detection | Behavior |
|-------|-----------|----------|
| **PHP** | `?ct_builder=true` in URL | Skips printing the dynamic hiding CSS (`opacity: 0`) in the editor |
| **JS** | `window.location.search.includes('ct_builder=true')` | Skips loading animation modules inside the editor |
| **CSS** | `body:not(.oxygen-builder-body)` selector | Hiding rules only apply on the live frontend, never in the editor |

## Result

- **In the editor**: elements with `.am-fade` (and other animation classes) remain fully visible at `opacity: 1`.
- **On the live site**: elements start hidden (`opacity: 0`) and animate in when they enter the viewport — no flicker.

## Key Oxygen references

| Context | Identifier |
|---------|------------|
| Editor URL | `?ct_builder=true` |
| Editor body class | `oxygen-builder-body` |
