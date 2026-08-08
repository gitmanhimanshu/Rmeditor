# django-rmeditor

[![PyPI Downloads](https://static.pepy.tech/personalized-badge/django-rmeditor?period=total&units=INTERNATIONAL_SYSTEM&left_color=BLACK&right_color=GREEN&left_text=downloads)](https://pepy.tech/projects/django-rmeditor)
[![PyPI version](https://img.shields.io/pypi/v/django-rmeditor.svg)](https://pypi.org/project/django-rmeditor/)
[![Python Versions](https://img.shields.io/pypi/pyversions/django-rmeditor.svg)](https://pypi.org/project/django-rmeditor/)
[![License](https://img.shields.io/github/license/gitmanhimanshu/Rmeditor)](https://github.com/gitmanhimanshu/Rmeditor/blob/main/LICENSE)

A customizable, self-hosted rich text editor for Django — a drop-in **TinyMCE alternative**
with extra features and full customization, and no CDN, API key, or usage limits.

A lightweight, **self-hosted** rich text editor for Django. It outputs plain **HTML**,
so it is a drop-in replacement for a `TextField` / tinymce `HTMLField` with **no data
migration**. No CDN, no API key, no branding, no word/usage limits.

- Pure vanilla JS (no jQuery, no build step).
- Auto-enhances any `<textarea class="rmeditor">`.
- Existing content is loaded as-is (HTML in / HTML out).
- Configurable toolbar per field.
- Paste cleaning (strips Word/Office junk) + basic XSS sanitize.
- Works with Django forms, the admin, or hand-written templates.

## Install

```bash
pip install django-rmeditor
```

```python
# settings.py
INSTALLED_APPS = [
    ...,
    "rmeditor",
]
```

Make sure `django.contrib.staticfiles` is set up (it is by default) and run
`collectstatic` in production.

## Usage

### 1. Hand-written templates (no form/widget)

```django
{% load rmeditor %}
{% rmeditor_media %}   {# include once per page, e.g. in your base template #}

<form method="post">
  {% csrf_token %}
  <textarea name="body" class="rmeditor"
            data-tools="format fontsize | bold italic underline | bullist numlist | link image | removeformat">
    {{ object.body }}
  </textarea>
  <button type="submit">Save</button>
</form>
```

The textarea stays in the form (hidden) and always holds the current HTML, so your
existing view code that reads `request.POST["body"]` keeps working unchanged.

### Autochange — enhance every textarea (no class needed)

To convert **all** textareas on a page into editors without touching each one
(like tinymce's `selector:'textarea'`), enable autochange:

```django
{% load rmeditor %}
{% rmeditor_media auto="textarea" %}   {# every <textarea> becomes an editor #}
```

or from JS:

```html
<script src="/static/rmeditor/js/rmeditor.js"></script>
<script>RMEditor.auto("textarea");</script>   <!-- or any CSS selector -->
```

or globally before the script loads:

```html
<script>window.RMEDITOR_AUTO = "textarea.rich";</script>
```

Opt a textarea out of autochange with `class="no-rmeditor"` or `data-rmeditor="off"`.
This makes replacing tinymce a one-line change: swap the tinymce script/`init` for
`{% rmeditor_media auto="textarea" %}`.

### 2. Model field

```python
from django.db import models
from rmeditor.fields import RichTextField

class Article(models.Model):
    body = RichTextField(blank=True, default="")
```

`RichTextField` is a `TextField` subclass — same column, no data difference. Switching
an existing `TextField`/`HTMLField` to it needs only a no-op migration.

### 3. Form widget

```python
from django import forms
from rmeditor.widgets import RichTextWidget

class ArticleForm(forms.ModelForm):
    class Meta:
        model = Article
        fields = ["body"]
        widgets = {"body": RichTextWidget(tools="bold italic link")}
```

## Toolbar tokens

`format` (paragraph/H1/H2/H3 dropdown), `fontsize` (px-based dropdown), `bold`, `italic`,
`underline`, `strike`, `forecolor`, `bullist`, `numlist`, `indent`, `outdent`, `alignleft`,
`aligncenter`, `alignright`, `justify`, `link`, `unlink`, `image`, `table`, `rowadd`,
`rowdel`, `coladd`, `coldel`, `removeformat`, `source` (view HTML), `undo`, `redo`.

Table tokens: `table` inserts a table (prompts for rows,columns); `rowadd`/`rowdel`
add/delete a row and `coladd`/`coldel` add/delete a column relative to the cell the
caret is in.
Use `|` for a separator. Set per field with `data-tools="..."` or on the widget with
`RichTextWidget(tools="...")`.

## Pasting from ChatGPT, Google Docs and Word

Paste is cleaned automatically. Styles, classes, ids and Office junk are stripped,
and the structure is tidied so the result matches text typed directly into the
editor rather than carrying the source document's layout:

- the wrapper element around the whole paste is unwrapped
- `<div>`s used as paragraphs become `<p>`; `<div>`s that only wrap block content
  are unwrapped
- `<b>`/`<i>` become `<strong>`/`<em>`
- empty blocks left over from unwrapping are dropped

**Heading levels are kept exactly as copied.** What changes is that the wrapper and
the stray divs stop interfering with spacing, so the result reads the way it did in
the source instead of collapsing into one block.

If pasted content needs to sit under a page's own `h1`, headings can be shifted
down instead:

```html
<!-- source h1 becomes h3, h2 becomes h4, and so on -->
<script src="{% static 'rmeditor/js/rmeditor.js' %}" data-paste-headings="demote" defer></script>

<!-- headings become bold paragraphs -->
<script src="{% static 'rmeditor/js/rmeditor.js' %}" data-paste-headings="flatten" defer></script>
```

Or set `window.RMEDITOR_PASTE_HEADINGS = "demote"` before the script loads.

Only paste is affected — content already stored, and anything typed or formatted
with the toolbar, is left exactly as-is.

## JavaScript API

```js
RMEditor.get(el)            // instance for a textarea node or its id ("" if none)
RMEditor.getHTML(el)        // current HTML
RMEditor.setHTML(el, html)  // replace content
RMEditor.getText(el)        // plain text, trimmed
RMEditor.cleanPaste(html)   // run the paste cleaner over a string (no paste)
RMEditor.syncAll()          // flush every editor into its textarea
```

`el` may be the textarea DOM node or its `id` string.

## Migrating from tinymce

- Replace the tinymce script/`tinymce.init(...)` with `{% rmeditor_media %}` and add
  `class="rmeditor"` to the textareas.
- `tinymce.get("x").setContent(html)` → `RMEditor.setHTML("x", html)`
- `tinymce.get("x").getContent({format:"text"})` → `RMEditor.getText("x")`

Storage stays HTML, so rendered pages (`{{ field|safe }}`), PDFs, and API/mobile
consumers are unaffected.

## Notes / limits (v0.1)

- Uses `document.execCommand` (deprecated but supported in all current browsers).
- Tables support insert plus add/remove row and column. Cell merging/splitting and
  media (video/embed) editing are out of scope; existing such content is preserved
  and still renders.
- Client-side sanitize is a basic guard. For untrusted authors, also sanitize on the
  server (e.g. `bleach`) before rendering with `|safe`.

## License

MIT
