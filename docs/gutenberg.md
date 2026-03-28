# Gutenberg Integration

How Animicro ensures compatibility with [Gutenberg](https://wordpress.org/gutenberg/) (WordPress Block Editor).

## How it works

| Layer | Detection | Behavior |
|-------|-----------|----------|
| **CSS** | `body:not(.block-editor-page)` selector | Hiding rules only apply on the live frontend, never in the admin editor |

## Why no URL check is needed

Unlike Bricks or Breakdance, Gutenberg lives entirely inside `wp-admin`. Animicro's frontend scripts are enqueued via `wp_enqueue_scripts`, which does **not** run on admin pages. This means the JS modules never load inside the block editor, and no URL parameter check is required.

The CSS selector `body:not(.block-editor-page)` handles the rare case where the dynamic CSS might otherwise affect the admin.

## Result

- **In the editor**: elements with `.am-fade` (and other animation classes) remain fully visible at `opacity: 1`.
- **On the live site**: elements start hidden (`opacity: 0`) and animate in when they enter the viewport — no flicker.

## Key Gutenberg references

| Context | Identifier |
|---------|------------|
| Editor body class | `block-editor-page` |
| Site Editor (FSE) body class | `block-editor-page` |
