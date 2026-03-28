# Divi Integration

How Animicro ensures compatibility with [Divi](https://www.elegantthemes.com/gallery/divi/).

## How it works

| Layer | Detection | Behavior |
|-------|-----------|----------|
| **PHP** | `?et_fb=1` in URL | Skips printing the dynamic hiding CSS (`opacity: 0`) in the frontend editor |
| **JS** | `window.location.search.includes('et_fb=1')` | Skips loading animation modules inside the editor |
| **CSS** | `body:not(.et_pb_pagebuilder_layout)` selector | Hiding rules only apply on the live frontend, never in the editor |

## Result

- **In the editor**: elements with `.am-fade` (and other animation classes) remain fully visible at `opacity: 1`.
- **On the live site**: elements start hidden (`opacity: 0`) and animate in when they enter the viewport — no flicker.

## Key Divi references

| Context | Identifier |
|---------|------------|
| Frontend editor URL | `?et_fb=1` |
| Editor body class | `et_pb_pagebuilder_layout` |
| Preview URL param | `?et_pb_preview=true` |
