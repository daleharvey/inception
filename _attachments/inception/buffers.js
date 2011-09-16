define(function(require, exports, module) {

  var Buffer = function(_name, _content) {

    var _dirty = false;

    function name() {
      return _name;
    }

    function content(data) {
      if (data) {
        if (data !== _content) {
          _content = data;
          _dirty = true;
        }
      } else {
        return _content;
      }
    }

    function dirty() {
      return _dirty;
    }

    return {
      name: name,
      dirty: dirty,
      content: content
    };
  };

  var Buffers = function() {

    var TextMode = require("ace/mode/text").Mode;
    var CssMode = require("ace/mode/css").Mode;
    var JavaScriptMode = require("ace/mode/javascript").Mode;
    var HtmlMode = require("ace/mode/html").Mode;
    var XmlMode = require("ace/mode/xml").Mode;

    var modes = {
      text: new TextMode(),
      xml: new XmlMode(),
      html: new HtmlMode(),
      css: new CssMode(),
      javascript: new JavaScriptMode()
    };

    var Editor = null;
    var _buffers = {},
    _length = 0,
    openBufferName = null;

    function getMode(contentType) {
      if(!contentType) {
        return "text";
      }
      contentType = contentType.split(";")[0];
      var tmp = {
          "application/x-javascript":"javascript",
          "application/javascript":"javascript",
          "text/css":"css",
          "text/html":"html"
      };
      return tmp[contentType] || "text";
    }

    function openBuffer(name, content, type) {
      ensureUpdated();
      if (typeof _buffers[name] === "undefined") {
        _length += 1;
        _buffers[name] = new Buffer(name, content);
      }
      openBufferName = name;
      Editor.getSelection().selectAll();
      Editor.onTextInput(_buffers[name].content());

      Editor.getSession().setMode(modes[getMode(type)]);
    }

    function setEditor(editor) {
      Editor = editor;
    }

    function length() {
      return length;
    }

    function dirtyBuffers() {
      var dirty = {};
      for(var x in _buffers) {
        if (_buffers[x].dirty()) {
          dirty[x] = _buffers[x];
        }
      }
      return dirty;
    }

    function ensureUpdated() {
      if (openBufferName) {
        _buffers[openBufferName].content(Editor.session.toString());
      }
    }

    return {
      setEditor:setEditor,
      ensureUpdated:ensureUpdated,
      length: length,
      openBuffer: openBuffer,
      dirtyBuffers: dirtyBuffers
    };

  };

  exports.Buffers = new Buffers();
});
