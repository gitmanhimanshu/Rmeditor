# Changelog

## 0.1.0 (unreleased)

- First version.
- Self-hosted `contenteditable` rich text editor. HTML in / HTML out.
- Auto-enhances any `<textarea class="rmeditor">`.
- Toolbar: undo/redo, headings, bold/italic/underline/strike, text color,
  ordered/unordered lists, indent/outdent, align, link, image, remove format.
- Configurable toolbar per field via `data-tools`.
- Existing content pre-fill; multiple editors per page.
- Paste cleaning (strips Word/Office/pasted junk) + basic XSS sanitize on save.
- Django form widget `RichTextWidget`, model field `RichTextField`,
  and `{% rmeditor_media %}` template tag.
- No CDN, no API key, no branding, no usage limits.
