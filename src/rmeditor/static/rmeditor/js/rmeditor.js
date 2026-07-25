/*!
 * rmeditor 0.1.0 — a lightweight, self-hosted HTML rich text editor.
 * HTML in / HTML out. No CDN, no API key, no branding, no limits. MIT License.
 *
 * Usage (plain HTML / Django templates):
 *   <textarea class="rmeditor" name="body" data-tools="bold italic h2 bullist link">...</textarea>
 *   plus rmeditor.css + rmeditor.js on the page.
 *
 * The original <textarea> stays in the form (hidden) and always holds the current
 * HTML, so anything that read that field before keeps working unchanged.
 *
 * JS API (drop-in for the few tinymce.get(...) calls):
 *   RMEditor.get(el)            -> instance or null   (el = textarea node or id)
 *   RMEditor.getHTML(el)        -> current HTML string
 *   RMEditor.setHTML(el, html)  -> replace content
 *   RMEditor.getText(el)        -> plain text (trimmed)
 *   RMEditor.syncAll()          -> flush every editor into its textarea
 */
(function (window, document) {
  "use strict";

  var VERSION = "0.1.2";
  var SCRIPT = document.currentScript; // captured now, used for data-auto config

  // ---- icons (inline SVG so they render identically everywhere) ----------
  function svg(inner) {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + inner + "</svg>"
    );
  }
  var ICON = {
    undo: svg('<path d="M9 7H15a4 4 0 0 1 0 8H8"/><path d="M9 4 6 7l3 3"/>'),
    redo: svg('<path d="M15 7H9a4 4 0 0 0 0 8h7"/><path d="M15 4l3 3-3 3"/>'),
    bullist: svg('<circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/><path d="M9 7h11M9 12h11M9 17h11"/>'),
    numlist: svg('<path d="M10 7h10M10 12h10M10 17h10"/><path d="M4 6h1v4M4 10h2"/><path d="M4 15h2v1l-2 2h2"/>'),
    indent: svg('<path d="M4 6h16M10 12h10M10 18h16M4 10l3 2-3 2"/>'),
    outdent: svg('<path d="M4 6h16M10 12h10M10 18h16M7 10l-3 2 3 2"/>'),
    alignleft: svg('<path d="M4 6h16M4 12h10M4 18h13"/>'),
    aligncenter: svg('<path d="M4 6h16M7 12h10M6 18h12"/>'),
    alignright: svg('<path d="M4 6h16M10 12h10M7 18h13"/>'),
    justify: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    link: svg('<path d="M9 15l6-6"/><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1"/>'),
    unlink: svg('<path d="M9 15l6-6"/><path d="M12 5l1-1a4 4 0 0 1 6 6l-1 1M5 5l14 14"/>'),
    image: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/>'),
    removeformat: svg('<path d="M7 6h11M11 6l-3 12M5 20h6"/><path d="M17 14l4 4M21 14l-4 4"/>'),
    table: svg('<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M3 9.5h18M3 15h18M9 4v16M15 4v16"/>'),
  };

  // ---- toolbar buttons ----------------------------------------------------
  // Each: exec via `cmd` (document.execCommand) or a custom `fn`.
  var BUTTONS = {
    undo:        { title: "Undo",            icon: ICON.undo,   cmd: "undo" },
    redo:        { title: "Redo",            icon: ICON.redo,   cmd: "redo" },
    bold:        { title: "Bold",            text: "B", cls: "rme-b", cmd: "bold" },
    italic:      { title: "Italic",          text: "I", cls: "rme-i", cmd: "italic" },
    underline:   { title: "Underline",       text: "U", cls: "rme-u", cmd: "underline" },
    strike:      { title: "Strikethrough",   text: "S", cls: "rme-s", cmd: "strikeThrough" },
    forecolor:   { title: "Text color",      text: "A", fn: "forecolor" },
    bullist:     { title: "Bulleted list",   icon: ICON.bullist,     cmd: "insertUnorderedList" },
    numlist:     { title: "Numbered list",   icon: ICON.numlist,     cmd: "insertOrderedList" },
    indent:      { title: "Increase indent", icon: ICON.indent,      cmd: "indent" },
    outdent:     { title: "Decrease indent", icon: ICON.outdent,     cmd: "outdent" },
    alignleft:   { title: "Align left",      icon: ICON.alignleft,   cmd: "justifyLeft" },
    aligncenter: { title: "Align center",    icon: ICON.aligncenter, cmd: "justifyCenter" },
    alignright:  { title: "Align right",     icon: ICON.alignright,  cmd: "justifyRight" },
    justify:     { title: "Justify",         icon: ICON.justify,     cmd: "justifyFull" },
    link:        { title: "Insert link",     icon: ICON.link,        fn: "link" },
    unlink:      { title: "Remove link",     icon: ICON.unlink,      cmd: "unlink" },
    image:       { title: "Insert image",    icon: ICON.image,       fn: "image" },
    removeformat:{ title: "Clear formatting",icon: ICON.removeformat,cmd: "removeFormat" },
    table:       { title: "Insert table",    icon: ICON.table, fn: "table" },
    rowadd:      { title: "Add row below",    text: "+R", fn: "rowadd" },
    rowdel:      { title: "Delete row",       text: "−R", fn: "rowdel" },
    coladd:      { title: "Add column right", text: "+C", fn: "coladd" },
    coldel:      { title: "Delete column",    text: "−C", fn: "coldel" },
  };

  // "format" is a special dropdown token (block format select).
  var DEFAULT_TOOLS =
    "format | bold italic underline strike forecolor | bullist numlist indent outdent | " +
    "alignleft aligncenter alignright | link image | table rowadd rowdel coladd coldel | " +
    "removeformat | undo redo";

  var instances = []; // all live editors

  // ---- helpers ------------------------------------------------------------
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function resolve(target) {
    var node = typeof target === "string" ? document.getElementById(target) : target;
    if (!node) return null;
    return node._rmeditor || null;
  }

  // Basic HTML cleaner. `paste` = aggressive (strip Word/Office junk).
  function clean(html, paste) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html || "";

    // Remove dangerous / unwanted elements entirely.
    var kill = tmp.querySelectorAll("script, style, meta, link, title, o\\:p");
    for (var i = 0; i < kill.length; i++) kill[i].parentNode.removeChild(kill[i]);

    var all = tmp.querySelectorAll("*");
    for (var j = 0; j < all.length; j++) {
      var node = all[j];
      // Strip event handlers + javascript: URLs (XSS guard, since output is |safe).
      for (var a = node.attributes.length - 1; a >= 0; a--) {
        var attr = node.attributes[a];
        var name = attr.name.toLowerCase();
        var val = (attr.value || "").toLowerCase();
        if (name.indexOf("on") === 0) node.removeAttribute(attr.name);
        else if ((name === "href" || name === "src") && val.replace(/\s/g, "").indexOf("javascript:") === 0)
          node.removeAttribute(attr.name);
        else if (paste && (name === "style" || name === "class" || name === "id" ||
                 name === "lang" || name.indexOf("mso-") === 0 || name.indexOf("data-") === 0))
          node.removeAttribute(attr.name);
      }
      // On paste, unwrap presentational span/font wrappers Word loves.
      if (paste && (node.tagName === "SPAN" || node.tagName === "FONT")) {
        var parent = node.parentNode;
        while (node.firstChild) parent.insertBefore(node.firstChild, node);
        parent.removeChild(node);
      }
    }
    return tmp.innerHTML;
  }

  // ---- editor instance ----------------------------------------------------
  function Editor(textarea) {
    if (textarea._rmeditor) return textarea._rmeditor;

    var self = this;
    this.textarea = textarea;

    var toolsStr = textarea.getAttribute("data-tools") || DEFAULT_TOOLS;
    var placeholder = textarea.getAttribute("data-placeholder") ||
      textarea.getAttribute("placeholder") || "";

    // Build DOM: wrap > (toolbar, area); textarea kept hidden inside wrap.
    var wrap = el("div", "rmeditor-wrap");
    if (textarea.getAttribute("data-theme")) wrap.setAttribute("data-theme", textarea.getAttribute("data-theme"));
    var toolbar = el("div", "rme-toolbar");
    var area = el("div", "rme-area");
    area.setAttribute("contenteditable", "true");
    area.setAttribute("data-placeholder", placeholder);
    if (textarea.getAttribute("data-height")) area.style.minHeight = textarea.getAttribute("data-height");

    // Pre-fill from the existing textarea value (existing content shows up).
    // Whitespace-only values become empty so the placeholder shows and no junk
    // gets synced back.
    var initial = clean(textarea.value, false);
    area.innerHTML = initial && initial.trim() ? initial : "";

    textarea.parentNode.insertBefore(wrap, textarea);
    wrap.appendChild(toolbar);
    wrap.appendChild(area);
    wrap.appendChild(textarea);
    textarea.classList.add("rme-hidden");

    this.wrap = wrap;
    this.area = area;
    this.buttons = {};

    buildToolbar(self, toolbar, toolsStr);

    // Keep the textarea in sync so the form submits current HTML.
    function sync() { textarea.value = area.innerHTML; }
    this.sync = sync;

    area.addEventListener("input", function () {
      sync();
      updateActive(self);
    });
    area.addEventListener("focus", function () { wrap.classList.add("rme-focused"); });
    area.addEventListener("blur", function () { wrap.classList.remove("rme-focused"); sync(); });
    area.addEventListener("keyup", function () { updateActive(self); });
    area.addEventListener("mouseup", function () { updateActive(self); });

    // Clean pasted content.
    area.addEventListener("paste", function (e) {
      e.preventDefault();
      var cb = e.clipboardData || window.clipboardData;
      var html = cb && cb.getData ? cb.getData("text/html") : "";
      var text = cb && cb.getData ? cb.getData("text/plain") : "";
      if (html) document.execCommand("insertHTML", false, clean(html, true));
      else if (text) document.execCommand("insertText", false, text);
      sync();
    });

    // Flush on the owning form's submit (covers programmatic submits).
    var form = textarea.closest ? textarea.closest("form") : null;
    if (form && !form._rmeditorHooked) {
      form._rmeditorHooked = true;
      form.addEventListener("submit", function () { RMEditor.syncAll(); });
    }

    textarea._rmeditor = this;
    instances.push(this);
    sync();
  }

  Editor.prototype.getHTML = function () { return this.area.innerHTML; };
  Editor.prototype.getText = function () { return (this.area.innerText || "").trim(); };
  Editor.prototype.setHTML = function (html) {
    this.area.innerHTML = clean(html, false) || "";
    this.sync();
  };
  Editor.prototype.exec = function (cmd, value) {
    this.area.focus();
    try { document.execCommand(cmd, false, value == null ? null : value); }
    catch (e) { /* ignore unsupported */ }
    this.sync();
    updateActive(this);
  };

  // ---- toolbar building ---------------------------------------------------
  function buildToolbar(self, toolbar, toolsStr) {
    var tokens = toolsStr.split(/\s+/);
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (!t) continue;
      if (t === "|") { toolbar.appendChild(el("span", "rme-sep")); continue; }
      if (t === "format") { toolbar.appendChild(makeFormatSelect(self)); continue; }
      var def = BUTTONS[t];
      if (!def) continue;
      toolbar.appendChild(makeButton(self, t, def));
    }
  }

  function makeButton(self, key, def) {
    var b = el("button", "rme-btn" + (def.cls ? " " + def.cls : ""));
    b.type = "button";
    b.title = def.title;
    b.innerHTML = def.icon || def.text || key;
    // mousedown preventDefault keeps the editor selection intact.
    b.addEventListener("mousedown", function (e) { e.preventDefault(); });
    b.addEventListener("click", function (e) {
      e.preventDefault();
      if (def.fn) HANDLERS[def.fn](self);
      else self.exec(def.cmd);
    });
    self.buttons[key] = { node: b, def: def };
    return b;
  }

  function makeFormatSelect(self) {
    var sel = el("select", "rme-select");
    sel.title = "Paragraph format";
    var opts = [
      ["p", "Paragraph"], ["h1", "Heading 1"],
      ["h2", "Heading 2"], ["h3", "Heading 3"],
    ];
    for (var i = 0; i < opts.length; i++) {
      var o = el("option");
      o.value = opts[i][0];
      o.textContent = opts[i][1];
      sel.appendChild(o);
    }
    sel.addEventListener("mousedown", function (e) { e.stopPropagation(); });
    sel.addEventListener("change", function () {
      // Angle-bracket form ("<h1>") is what execCommand expects across browsers.
      self.exec("formatBlock", "<" + sel.value + ">");
    });
    self._formatSelect = sel;
    return sel;
  }

  // Reflect current selection state on the buttons + format dropdown.
  function updateActive(self) {
    var checks = {
      bold: "bold", italic: "italic", underline: "underline",
      strike: "strikeThrough", bullist: "insertUnorderedList",
      numlist: "insertOrderedList", alignleft: "justifyLeft",
      aligncenter: "justifyCenter", alignright: "justifyRight", justify: "justifyFull",
    };
    for (var key in self.buttons) {
      if (!checks[key]) continue;
      var on = false;
      try { on = document.queryCommandState(checks[key]); } catch (e) {}
      self.buttons[key].node.classList.toggle("rme-active", !!on);
    }
    if (self._formatSelect) {
      var block = "p";
      try {
        var v = document.queryCommandValue("formatBlock");
        if (v) block = String(v).toLowerCase().replace(/[<>]/g, "");
      } catch (e) {}
      if (!/^h[1-3]$/.test(block)) block = "p";
      self._formatSelect.value = block;
    }
  }

  // ---- table helpers ------------------------------------------------------
  var CELL_STYLE = "border:1px solid #ccc;padding:4px 8px";

  // The <td>/<th> containing the caret, or null if the caret isn't in a table.
  function currentCell(area) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var node = sel.getRangeAt(0).startContainer;
    if (node.nodeType === 3) node = node.parentNode;
    var cell = node && node.closest ? node.closest("td, th") : null;
    return cell && area.contains(cell) ? cell : null;
  }

  function newCell(row, index) {
    var c = row.insertCell(index);
    c.setAttribute("style", CELL_STYLE);
    c.innerHTML = "&nbsp;";
    return c;
  }

  // Add/remove a row or column relative to the caret's cell (native table DOM API).
  function tableOp(self, op) {
    var cell = currentCell(self.area);
    if (!cell) { window.alert("Put the cursor inside a table cell first."); return; }
    var tr = cell.parentNode;
    var table = cell.closest("table");
    var ci = cell.cellIndex, ri = tr.rowIndex, r;
    if (op === "rowadd") {
      var nr = table.insertRow(ri + 1);
      for (var i = 0; i < tr.cells.length; i++) newCell(nr, i);
    } else if (op === "rowdel") {
      if (table.rows.length > 1) table.deleteRow(ri);
    } else if (op === "coladd") {
      for (r = 0; r < table.rows.length; r++) newCell(table.rows[r], ci + 1);
    } else if (op === "coldel") {
      if (table.rows[0].cells.length > 1) {
        for (r = 0; r < table.rows.length; r++)
          if (table.rows[r].cells[ci]) table.rows[r].deleteCell(ci);
      }
    }
    self.sync();
  }

  // ---- custom handlers ----------------------------------------------------
  var HANDLERS = {
    table: function (self) {
      var dims = window.prompt("Table size (rows,columns):", "2,2");
      if (!dims) return;
      var p = dims.split(",");
      var rows = Math.max(1, parseInt(p[0], 10) || 2);
      var cols = Math.max(1, parseInt(p[1], 10) || 2);
      var html = '<table style="border-collapse:collapse"><tbody>';
      for (var r = 0; r < rows; r++) {
        html += "<tr>";
        for (var c = 0; c < cols; c++) html += '<td style="' + CELL_STYLE + '">&nbsp;</td>';
        html += "</tr>";
      }
      html += "</tbody></table><p><br></p>";
      self.area.focus();
      document.execCommand("insertHTML", false, html);
      self.sync();
    },
    rowadd: function (self) { tableOp(self, "rowadd"); },
    rowdel: function (self) { tableOp(self, "rowdel"); },
    coladd: function (self) { tableOp(self, "coladd"); },
    coldel: function (self) { tableOp(self, "coldel"); },
    link: function (self) {
      var url = window.prompt("Link URL:", "https://");
      if (!url) return;
      self.exec("createLink", url);
    },
    image: function (self) {
      var url = window.prompt("Image URL:", "https://");
      if (!url) return;
      self.exec("insertImage", url);
    },
    forecolor: function (self) {
      var input = self._color;
      if (!input) {
        input = document.createElement("input");
        input.type = "color";
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.addEventListener("input", function () {
          self.exec("foreColor", input.value);
        });
        self._color = input;
      }
      input.click();
    },
  };

  // ---- autochange (auto-enhance textareas without a class) ----------------
  var autoSelector = null; // when set, every matching <textarea> becomes an editor

  function optedOut(ta) {
    return ta.classList.contains("no-rmeditor") ||
           ta.getAttribute("data-rmeditor") === "off";
  }

  function enhanceMatch(scope, selector) {
    var list = scope.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      var ta = list[i];
      if (ta.tagName !== "TEXTAREA" || ta._rmeditor || optedOut(ta)) continue;
      new Editor(ta);
    }
  }

  // Read the auto selector from window.RMEDITOR_AUTO or <script ... data-auto="...">.
  function readAutoConfig() {
    if (window.RMEDITOR_AUTO) return window.RMEDITOR_AUTO;
    var s = SCRIPT;
    if (!s) {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && all[i].src.indexOf("rmeditor.js") !== -1) { s = all[i]; break; }
      }
    }
    return s && s.getAttribute("data-auto") ? s.getAttribute("data-auto") : null;
  }

  // ---- public API ---------------------------------------------------------
  var RMEditor = {
    version: VERSION,
    enhance: function (node) {
      if (node && node.tagName === "TEXTAREA" && !node._rmeditor && !optedOut(node))
        return new Editor(node);
    },
    enhanceAll: function (root) {
      var scope = root || document;
      enhanceMatch(scope, "textarea.rmeditor");
      if (autoSelector) enhanceMatch(scope, autoSelector);
    },
    // autochange: turn EVERY matching textarea into an editor without adding a
    // class (like tinymce's selector:'textarea'). Opt a textarea out with
    // class "no-rmeditor" or attribute data-rmeditor="off".
    auto: function (selector) {
      autoSelector = selector || "textarea";
      RMEditor.enhanceAll();
      return RMEditor;
    },
    get: resolve,
    getHTML: function (t) { var e = resolve(t); return e ? e.getHTML() : ""; },
    setHTML: function (t, html) { var e = resolve(t); if (e) e.setHTML(html); },
    getText: function (t) { var e = resolve(t); return e ? e.getText() : ""; },
    syncAll: function () { for (var i = 0; i < instances.length; i++) instances[i].sync(); },
  };

  window.RMEditor = RMEditor;

  // Boot: pick up autochange config, then enhance.
  function boot() {
    var cfg = readAutoConfig();
    if (cfg) autoSelector = cfg;
    RMEditor.enhanceAll();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window, document);
