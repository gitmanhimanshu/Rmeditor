from django import forms


class RichTextWidget(forms.Textarea):
    """A Textarea that the rmeditor JS turns into a rich text editor.

    The widget only adds the ``rmeditor`` CSS class (and optional ``data-tools``)
    and pulls in the static JS/CSS. The actual editing UI is built client-side by
    ``rmeditor.js``, which reads/writes plain HTML from/to this textarea — so the
    submitted value is the same HTML string a normal textarea would submit.
    """

    class Media:
        css = {"all": ("rmeditor/css/rmeditor.css",)}
        js = ("rmeditor/js/rmeditor.js",)

    def __init__(self, attrs=None, tools=None):
        final = {"class": "rmeditor"}
        if tools:
            final["data-tools"] = tools
        if attrs:
            final.update(attrs)
            # Make sure the marker class survives a caller-supplied ``class``.
            classes = str(final.get("class", "")).split()
            if "rmeditor" not in classes:
                classes.append("rmeditor")
            final["class"] = " ".join(classes)
        super().__init__(final)
