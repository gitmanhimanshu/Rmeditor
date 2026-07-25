from django import template
from django.templatetags.static import static
from django.utils.html import format_html

register = template.Library()


@register.simple_tag
def rmeditor_media():
    """Include rmeditor's CSS and JS.

    Use in templates that build their own ``<textarea class="rmeditor">`` markup
    (i.e. not going through a Django form/widget)::

        {% load rmeditor %}
        {% rmeditor_media %}
    """
    css = static("rmeditor/css/rmeditor.css")
    js = static("rmeditor/js/rmeditor.js")
    return format_html(
        '<link rel="stylesheet" href="{}">\n<script src="{}" defer></script>',
        css,
        js,
    )
