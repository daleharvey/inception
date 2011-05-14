define(function(require, exports, module) {

  exports.launch = function(env) {

    var Editor = require("ace/editor").Editor;
    var Renderer = require("ace/virtual_renderer").VirtualRenderer;
    var theme = require("ace/theme/twilight");

    var Router = require("router").Router;
    var FileTree = require("filetree").FileTree;
    var CouchData = require("couchdata").CouchData;

    var container = document.getElementById("editor");
    env.editor = new Editor(new Renderer(container, theme));

    var Buffers = require("buffers").Buffers;
    Buffers.setEditor(env.editor);

    window.onresize = function onResize() {
      env.editor.resize();
    }; window.onresize();

    // Intercept console.logs and display them in our own log as well
    (function() {
      var tmp = console.log || null,
      $log = $("#log");

      console.log = function(data) {
        if (tmp) {
          try {
            tmp.apply(null, arguments);
          } catch(err) { }
        }
        var $logmsg = $("<div class='logmsg'></div>").text(data && data.toString());
        $log.append($logmsg);
        $log.attr({scrollTop: $log.attr("scrollHeight") });
      };
    })();

    var localData = {};
    for (var x in localStorage) {
      localData[x] = JSON.parse(localStorage[x]);
    }

    function persistLocalStorage() {
      for (var x in localData) {
        localStorage[x] = JSON.stringify(localData[x]);
      }
      return true;
    }

    var width = $("#treepane").width();
    $("#hide").bind("mousedown", function() {
      var treepane = $("#treepane").toggleClass("minimised");
      $("#editor").css({left:treepane.is(".minimised") ? 32 : width});
    });

    function maximise() {
      var treepane = $("#treepane").removeClass("minimised");
      $("#editor").css({left:width});
    }


    FileTree.init('#files');

    FileTree.nodeSelected(function (node, expand) {
      var parents = $.makeArray($(node).parents("li"));
      parents.reverse();

      var x = _.map(parents, function(obj) {
        return $.trim($(obj).children("a").text());
      }).join("/");

      var id = localData.config.selectedDb + "/" +
        localData.config.selectedDdoc;

      if (!localData.config.selectedNodes) {
        localData.config.selectedNodes = {};
      }
      if (!localData.config.selectedNodes[id]) {
        localData.config.selectedNodes[id] = {};
      }

      localData.config.selectedNodes[id][x] = expand;
      persistLocalStorage();
    });

    CouchData.loadDatabases().then(function (databases) {
      var html = "<ul>";
      _.each(databases, function(db, dbname) {
        html += "<li class='db'><h3>" + dbname + "</h3><ul>";
        _.each(db, function(ddoc) {
          html += "<li><a class='ddoc' data-db='" + dbname + "' data-ddoc='"+ddoc.id+"'>" + ddoc.id + "</a></li>";
        });
        html += "</ul>";
      });
      html += "</ul>";
      $("#dblisting").append(html);
    });

    function loadddoc(database, ddoc) {
      couch.db(database).get(ddoc).then(function (data) {
        var x = CouchData.transformDDoc(data);
        html = "<div class='ddocheader'><h3>" + database + "</h3>" + ddoc + "</div>";
        html += CouchData.generateHTML(x, database, data._id);

        $("#inner > div").hide();
        $("#files").empty().append(html).show();

        var id = localData.config.selectedDb + "/" +
          localData.config.selectedDdoc;

        if (!localData.config.selectedNodes) {
          localData.config.selectedNodes = {};
        }
        if (!localData.config.selectedNodes[id]) {
          localData.config.selectedNodes[id] = {};
        }

        var files = $("#files");
        _.each(localData.config.selectedNodes[id], function(obj, key) {
          if (obj) {
            FileTree.expandNode(files.find("[data-name='" + key + "'] > a"));
          }
        });

      });
    }

    function ensureNotMinimised() {
      if ($("#treepane").is(".minimised")) {
        maximise();
      }
    }

    function setobj(arr, obj, val) {
      var x = arr.shift();
      if (typeof obj[x] === "undefined") {
        obj[x] = {};
      }
      if (arr.length === 0) {
        obj[x] = val;
      } else {
        setobj(arr, obj[x], val);
      }
    }

    function generateDDoc(db, docname, ddoc, buffers) {
      var attachments = [];
      _.each(buffers, function(val, key) {
        var match = Router.match("!/:db/_design/:ddoc/*rest", key);
        if (match[1] === db && "_design/" + match[2] === docname) {
          var arr = match[3].split("/");
          if (arr[0] === "_attachments") {
            arr.shift();
            attachments.push({
              name:arr.join("/"),
              data: val.content()
            });
          } else {
            setobj(arr, ddoc, val.content());
          }
       }
      });
      return {
        ddoc: ddoc,
        attachments: attachments
      };
    }

    function saveAttachments(attachments, orig, db, ddoc, rev, callback) {

      var promise;
      if (attachments.length === 0) {
        var defer = $.Deferred();
        promise = defer.promise();
        defer.resolveWith(this, [{rev:rev}, "success", promise]);
      } else {

        jQuery.each(attachments, function(_, requestData) {
          function makeRequest(data) {
            delete orig[requestData.name].revpos;
            return $.ajax({
              type: "PUT",
              contentType: orig[requestData.name].content_type,
              headers: {"Accept":"application/json"},
              url: "/" + db + "/" + ddoc + "/" + requestData.name + "?rev=" + data.rev,
              data: requestData.data,
              dataType:"json"
            });
          }
          if (!promise) {
            promise = makeRequest({rev:rev}).promise();
          } else {
            promise = promise.pipe(makeRequest);
          }
        });
      }
      return promise;
    }

    function render(tpl, data) {
      return Mustache.to_html($(tpl).html(), data);
    }


    function renderLogin() {
      $.ajax({url:"/_session", dataType: "json"}).then(function(data) {
        if (data.userCtx.name) {
          $("#settings").html(render("#loggedin", {name:data.userCtx.name}));
        } else {
          $("#settings").html(render("#loggedout", {}));
        }
      });
    }

    function showLogin(message, loggedIn) {

      var $dialog = $("<div class='dialog'>" + render("#login_dialog_tpl", {message: message }) + "</div>");
      var $overlay = $("<div id='overlay'>&nbsp;</div>");

      var closeDialog = function() {
        $dialog.remove();
        $overlay.remove();
      };

      $dialog.find(".close").bind('mousedown', function() {
        closeDialog();
      });

      $(document).bind("login", function() {
        closeDialog();
        if (loggedIn) {
          loggedIn();
        }
      });

      $("body").append($overlay).append($dialog);
    }

    function doPush() {

      Buffers.ensureUpdated();

      var hasConsole = $("body").hasClass("max_console");
      if (!hasConsole) {
        $("body").addClass("max_console");
      }

      if (!localData.config.selectedDb || !localData.config.selectedDdoc) {
        console.log("Nothing to push");
        return;
      }

      var db = localData.config.selectedDb;
      var ddoc = localData.config.selectedDdoc;

      console.log("Starting push " + ddoc + " to " + db);
      couch.db(db).get(ddoc).then(function (data) {
        var x = generateDDoc(db, ddoc, data, Buffers.dirtyBuffers());
        saveAttachments(x.attachments, x.ddoc._attachments, db, ddoc, data._rev)
          .done(function(newRev) {
            x.ddoc._rev = newRev.rev;
            console.log("=> " + ddoc);
            couch.db(db).put(ddoc, JSON.stringify(x.ddoc)).then(function() {
              couch.clearCache();
              console.log("Push complete!");
              if (!hasConsole) {
                setTimeout(function () {
                  $("body").removeClass("max_console");
                }, 2000);
              }
            }).fail(function() {
              showLogin("Please login to push this couchapp.", function() {
                doPush();
              })
            })
          }).fail(function() {
            showLogin("Please login to push this couchapp.", function() {
              doPush();
            });
          });
      });
    }

    $("#expandcontrolpanel").bind('mousedown', function () {
      $("body").toggleClass("max_console");
      localData.config.maxConsole = $("body").is(".max_console");
      persistLocalStorage();
    });

    $("#dblisting").live('mousedown', function(e) {
      var $el = $(e.target);
      if ($el.is("a.ddoc")) {
        localData.config.selectedDb = $el.data("db");
        localData.config.selectedDdoc = $el.data("ddoc");
        persistLocalStorage();
        loadddoc($el.data("db"), $el.data("ddoc"));
      }
    });

    $("#treeview").bind('mousedown', function() {
      ensureNotMinimised();
      loadddoc(localData.config.selectedDb, localData.config.selectedDdoc);
    });

    $("#settingsbtn").bind('mousedown', function() {
      ensureNotMinimised();
      $("#inner > div").hide();
      $("#settings").show();
    });

    $("#dblistbtn").bind('mousedown', function() {
      ensureNotMinimised();
      $("#inner > div").hide();
      $("#dblisting").show();
    });

    $("#push").bind('mousedown', function() {
      doPush();
    });

    $("#editor").bind("webkitTransitionEnd transitionend", function() {
      env.editor.resize();
    });

    $("#loginbtn").live('mousedown', function() {
        showLogin("");
    });

    $("#launch").bind('mousedown', function() {
      var match = Router.matchesCurrent("!/:db/_design/:ddoc/*rest");
      window.open("/" + match[1] + "/_design/" + match[2] + "/index.html");
    });

    // Load data from config
    if (!localData.config) {
      localData.config = {};
    }

    if (localData.config.selectedDdoc && localData.config.selectedDb) {
      loadddoc(localData.config.selectedDb, localData.config.selectedDdoc);
    }

    if (localData.config.maxConsole) {
        $("body").addClass("max_console");
    }

    // Setup Routes
    Router.get('!/:db/_design/:ddoc/_attachments/*file', function (db, ddoc, path) {
      CouchData.readAttachment(db, "_design/" + ddoc, path).then(function(data, status, xhr) {
        Buffers.openBuffer(Router.url(), data, xhr.getResponseHeader("Content-Type"));
      });
    });

    Router.get('!/:db/_design/:ddoc/*file', function (db, ddoc, path) {
      CouchData.readKey(db, "_design/" + ddoc, path.split("/")).then(function(data) {
        Buffers.openBuffer(Router.url(), data, "text/plain");
      });
    });

    Router.post('!/login/', function (ev, data) {
      $.ajax({
        url: "/_session",
        type: 'POST',
        data: {name: data.username, password:data.password}
      }).done(function() {
        $(document).trigger('login');
      }).fail(function() {
        $("#loginfeedback").text("Username or password was wrong");
      });
    });

    Router.post('!/logout/', function (ev, data) {
      $.ajax({url: "/_session", type: 'DELETE'}).done(function() {
        $(document).trigger('logout');
      });
    });


    $(document).bind('login logout', function() {
      renderLogin();
    }); renderLogin();

    Router.init();
  };

});
