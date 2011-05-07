define(function(require, exports, module) {

  var FileTree = function() {

    var $wrapper;
    var nodeSelectedCB;

    function init(id) {
      $wrapper = $(id);
      $wrapper.bind("mousedown", function(e) {
        if ($(e.target).is(".node")) {
          expandNode($(e.target));
        }
      });
    }

    function setHTML(html) {
      $wrapper.html(html);
    }

    function nodeSelected(callback) {
      nodeSelectedCB = callback;
    }

    function expandNode(node) {
      nodeSelectedCB(node);
      var subtree = node.parent("li").children("ul");
      var arrow = node.find(".arrow");
      if (subtree.is(":visible")) {
        arrow.removeClass("expanded");
      } else {
        arrow.addClass("expanded");
      }
      subtree.toggle();
    }

    function appendNode(node, html) {
      node.parent("li").append(html);
    }

    return {
      init:init,
      nodeSelected:nodeSelected,
      setHTML: setHTML,
      appendNode:appendNode
    };

  };

  exports.FileTree = new FileTree();

});