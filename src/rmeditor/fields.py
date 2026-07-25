from django import forms
from django.db import models

from .widgets import RichTextWidget


class RichTextFormField(forms.CharField):
    """Form field that defaults to the rmeditor widget."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", RichTextWidget)
        super().__init__(*args, **kwargs)


class RichTextField(models.TextField):
    """A drop-in replacement for a plain ``TextField`` / tinymce ``HTMLField``.

    Stores plain HTML in a TEXT column (no schema/data difference from TextField),
    but renders the rmeditor widget in forms and the Django admin. Because the
    stored value is just HTML, existing content works with no data migration.
    """

    def formfield(self, **kwargs):
        kwargs.setdefault("form_class", RichTextFormField)
        kwargs.setdefault("widget", RichTextWidget)
        return super().formfield(**kwargs)
