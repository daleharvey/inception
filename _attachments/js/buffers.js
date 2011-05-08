var IBuffers = {};

IBuffers.Buffer = function(_name, _content) {

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

IBuffers.Buffers = function(Editor) {

  var _buffers = {},
  _length = 0,
  openBufferName = null;

  function openBuffer(name, content) {
    ensureUpdated();
    if (typeof _buffers[name] === "undefined") {
      _length += 1;
      _buffers[name] = new IBuffers.Buffer(name, content);
    }
    openBufferName = name;
    Editor.getSelection().selectAll();
    Editor.onTextInput(_buffers[name].content());
  }

  function length() {
    return length;
  }

  function dirtyBuffers() {
    // return _(_buffers).chain().filter(function(val, key) { return val.dirty(); })
    //   .map(function(val, key) { console.log(arguments);return {key:key, val:val}; })
    //   .value();
    return _buffers;
  }

  function ensureUpdated() {
    if (openBufferName) {
      _buffers[openBufferName].content(Editor.session.toString());
    }
  }

  return {
    ensureUpdated:ensureUpdated,
    length: length,
    openBuffer: openBuffer,
    dirtyBuffers: dirtyBuffers
  };

};