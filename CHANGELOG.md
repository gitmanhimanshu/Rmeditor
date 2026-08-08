# Changelog

## 0.1.9

- Fix: pasted content from ChatGPT, Google Docs and similar arrived with its
  structure intact but nothing holding it together. `clean()` removed every style
  and class, which is right, but left behind the wrapper `<div>` around the whole
  paste, the `<div>`s used in place of paragraphs, and headings sized for a full
  page. Bare divs have no rule in the stylesheet, so those lines collapsed against
  each other, and a pasted `h1` rendered at 1.6em against 14px body text.

  Paste now also normalises structure: the outer wrapper is unwrapped, divs become
  paragraphs (or are unwrapped when they only contain block content), headings are
  demoted two levels by default so a source `h1` lands at `h3`, `<b>`/`<i>` become
  `<strong>`/`<em>`, and empty blocks left by the unwrapping are dropped.

- New: `data-paste-headings` on the script tag, or `window.RMEDITOR_PASTE_HEADINGS`,
  choosing `demote` (default), `flatten` (headings become bold paragraphs) or
  `keep` (previous behaviour).

- Fix: `h4`–`h6`, `div`, `blockquote`, `pre` and `code` had no styles at all, so
  they fell back to browser defaults — `h4` matched body text and `h5`/`h6` came
  out smaller than it. Now styled in keeping with `h1`–`h3`.

- Fix: the banner comment at the top of `rmeditor.js` still read 0.1.0.

## 0.1.8

- Fix: the hidden source textarea (and source-mode show rule) was scoped to
  `textarea.rmeditor`, so autochange-enhanced textareas (which lack that class)
  were never hidden — the raw HTML showed under every editor. Now scoped to
  `.rmeditor-wrap textarea.rme-hidden`, so the HTML only shows in source mode.

## 0.1.7

- Fix: `rmeditor.__version__` was stale (0.1.3); now matches the package version.

## 0.1.6

- New: `source` toolbar token to toggle HTML source view. When active, it displays
  the underlying raw HTML in a monospace textarea, allowing manual editing. Other
  toolbar buttons are disabled while in source mode.

## 0.1.5

- Improved: `fontsize` dropdown now shows real px numbers (8, 10, 12, 14, 16,
  18, 20, 24, 28, 32, 36, 48, 72) like TinyMCE / CKEditor instead of labels.
  Applies sizes via clean `<span style="font-size:Xpx">` output. The dropdown
  auto-detects the current selection's font size.

## 0.1.4

- New: `fontsize` toolbar dropdown (Small / Normal / Large / Larger / Huge /
  Massive). Uses `document.execCommand("fontSize")` with browser size values
  2–7. Added to the default toolbar after `format`. The dropdown syncs to
  reflect the current selection's font size.

## 0.1.3

- Fix: toolbar actions now restore the editor selection first, so commands run on
  the text you had selected even after clicking a button. This fixes column delete
  removing the wrong column and text colour not applying.
- New: text colour is now a visible swatch palette (with a custom hex option)
  instead of a hidden native colour input that dropped the selection.

## 0.1.2

- New: table support. `table` inserts a table (rows,columns prompt); `rowadd`,
  `rowdel`, `coladd`, `coldel` add/remove rows and columns at the caret's cell.
  Added to the default toolbar. Inserted cells carry inline borders so they
  render the same on the front end.
- Metadata: set author to Himanshu.

## 0.1.1

- Fix: paragraph/heading dropdown now uses the angle-bracket `formatBlock`
  value (`<h1>`), so headings apply reliably across browsers.
- Fix: whitespace-only initial content is treated as empty (placeholder shows,
  no stray whitespace saved).
- Fix: correct project URLs (repository / issues) in package metadata.

## 0.1.0

- First version.
- Self-hosted `contenteditable` rich text editor. HTML in / HTML out.
- Auto-enhances any `<textarea class="rmeditor">`.
- Toolbar: undo/redo, headings, bold/italic/underline/strike, text color,
  ordered/unordered lists, indent/outdent, align, link, image, remove format.
- Configurable toolbar per field via `data-tools`.
- Autochange mode: auto-enhance every matching textarea without a class
  (`{% rmeditor_media auto="textarea" %}`, `RMEditor.auto(selector)`, or
  `window.RMEDITOR_AUTO`), like tinymce's `selector:'textarea'`. Opt out with
  `class="no-rmeditor"` or `data-rmeditor="off"`.
- Existing content pre-fill; multiple editors per page.
- Paste cleaning (strips Word/Office/pasted junk) + basic XSS sanitize on save.
- Django form widget `RichTextWidget`, model field `RichTextField`,
  and `{% rmeditor_media %}` template tag.
- No CDN, no API key, no branding, no usage limits.
