define(function(require, exports, module) {

exports.launch = function(env) {

    var Editor = require("ace/editor").Editor;
    var Renderer = require("ace/virtual_renderer").VirtualRenderer;
    var theme = require("ace/theme/twilight");

    var $db = null,
        designDocName = null,
        designDocObj = null,
        openFile;

    var Buffer = function(_name, _content) {

        //console.log(arguments);

        function push(callback) {
            var url = "/" + $db.name + "/" + designDocName + "/" + openFile +
                "?rev=" + designDocObj._rev;
            console.log();
            $.ajax({
                type: "PUT",
                contentType : "application/json",
                dataType: "json",
                url:url,
                data: env.editor.selection.session.toString(),
                'beforeSend': function(xhr) {
                    var user = $("#username").val(),
                        pass = $("#password").val();
                    if (user !== "" && pass !== "") {
                        var auth = Base64.encode(user + ":" + pass);
                        xhr.setRequestHeader("Authorization", "Basic " + auth);
                    }
                },
                success: function (data) {
                    designDocObj._rev = data.rev;
                    callback();
                }
            });
        };

        function name() {
            return _name;
        };

        function content() {
            return _content;
        };

        function dirty() {
            return true;
        };

        return {
            push: push,
            name: name,
            dirty: dirty,
            content: content
        };
    };

    var Buffers = (function(Editor) {

        var _buffers = {}, _length = 0;
        
        function openBuffer(name, content) {
            if (typeof _buffers[name] === "undefined") {
                _length += 1;
                _buffers[name] = new Buffer(name, content);
            }
            console.log(_buffers[name]);
            env.editor.getSelection().selectAll();
            env.editor.onTextInput(_buffers[name].content());
        };

        function length() {
            return length;
        };

        function dirtyBuffers() {
            var dirty = [];
            for each (var buffer in _buffers) {
                if (buffer.dirty()) {
                    dirty.push(buffer);
                }
            }
            return dirty;
        };
        
        return {
            length: length,
            openBuffer: openBuffer,
            dirtyBuffers: dirtyBuffers
        };
        
    })(Editor);

    function push() {
        $("#push span").text("Saving ...");
        doPush(Buffers.dirtyBuffers(), function () {
            $("#push span").text("Push");
            console.log("yay");
        });
    };

    function doPush(arr, complete) {
        if (arr.length === 0) {
            complete();
        } else {
            var buf = arr.pop();
            buf.push(function () {
                doPush(arr, complete);
            });
        }
    }

    function selectDDoc(name) {
        designDocName = name;
        $db.openDoc(designDocName, {
            success: function (data) {
                designDocObj = data;
                var html = "";
                for (var attachment in designDocObj._attachments) {
                    html += "<li><a data-name=\"file\">" + attachment
                        + "</a></li>";
                }
                $("#files li[data-name=" + designDocName + "] ul").html(html);
            }
        });
    };

    $.couch.allDbs({
        success: function(databases) {
            for (var i = 0; i < databases.length; i++) {
                $("#databases").append("<option>" + databases[i] + "</option>");
            }
        }
    });

    $("#databases").bind("change", function () {
        if ($(this).attr("data-noselect") === "true") {
            return;
        }
        $db = $.couch.db($(this).val());
        $db.allDesignDocs({
            success: function(data) {
                if (data.rows.length > 0) {
                    selectDDoc(data.rows[0].id);
                }
                for (var i = 0, html=""; i < data.rows.length; i++) {
                    html += "<li data=type='ddoc' data-name='" +
                        data.rows[i].id + "'><h3>" +
                        data.rows[i].id + "</h3><ul class='files'></li>";
                }
                $("#files").html(html);
            }
        });
    });

    $("#ddocs").bind("change", function () {
        selectDDoc($(this).val());
    });

    $("#files").bind("mousedown", function (e) {
        if (e.target.nodeName !== "A") {
            return;
        }
        $("#files a.selected").removeClass("selected");
        $(e.target).addClass("selected");
        openFile = $(e.target).text();
        $.ajax({
            type:"GET",
            dataType: "text",
            url: "/" + $db.name + "/" + designDocName + "/" + openFile,
            success: function(data) {
                console.log(data);
                Buffers.openBuffer(openFile, data);
            },
            error: function() {
                console.log(arguments);
            }
        });
    });

    $("#push").bind("mousedown", push);
    var container = document.getElementById("editor");
    env.editor = new Editor(new Renderer(container, theme));

    $("#properties").bind("mousedown", function() {
        $("#overlay, #properties_dlg").show();
    });

    $("#overlay").bind("mousedown", function() {
        console.log("hello");
        $("#overlay, .dialog").hide();
    });
    
    function onResize() {
       env.editor.resize();
    };
    window.onresize = onResize;
    onResize();

};

});
