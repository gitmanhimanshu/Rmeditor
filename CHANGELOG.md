# Changelog

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
