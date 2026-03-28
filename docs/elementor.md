# Elementor Integration

How Animicro ensures compatibility with [Elementor](https://elementor.com/).

## How it works

| Layer | Detection | Behavior |
|-------|-----------|----------|
| **PHP** | `?elementor-preview` in URL | Skips printing the dynamic hiding CSS (`opacity: 0`) in the editor iframe |
| **JS** | `window.location.search.includes('elementor-preview')` | Skips loading animation modules inside the editor |
| **CSS** | `body:not(.elementor-editor-active)` selector | Hiding rules only apply on the live frontend, never in the editor |

## Result

- **In the editor**: elements with `.am-fade` (and other animation classes) remain fully visible at `opacity: 1`.
- **On the live site**: elements start hidden (`opacity: 0`) and animate in when they enter the viewport — no flicker.

## Key Elementor references

| Context | Identifier |
|---------|------------|
| Editor iframe URL | `?elementor-preview=POST_ID&ver=TIMESTAMP` |
| Editor body class | `elementor-editor-active` |
