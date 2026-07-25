from django import template
from django.templatetags.static import static
from django.utils.html import format_html

register = template.Library()


@register.simple_tag
def rmeditor_media(auto=None):
    """Include rmeditor's CSS and JS.

    Use in templates that build their own ``<textarea class="rmeditor">`` markup
    (i.e. not going through a Django form/widget)::

        {% load rmeditor %}
        {% rmeditor_media %}

    Pass ``auto`` to turn EVERY matching textarea into an editor without adding a
    class (autochange mode, like tinymce's ``selector:'textarea'``)::

        {% rmeditor_media auto="textarea" %}

    Opt a textarea out with ``class="no-rmeditor"`` or ``data-rmeditor="off"``.
    """
    css = static("rmeditor/css/rmeditor.css")
    js = static("rmeditor/js/rmeditor.js")
    if auto:
        return format_html(
            '<link rel="stylesheet" href="{}">\n'
            '<script src="{}" data-auto="{}" defer></script>',
            css, js, auto,
        )
    return format_html(
        '<link rel="stylesheet" href="{}">\n<script src="{}" defer></script>',
        css, js,
    )
