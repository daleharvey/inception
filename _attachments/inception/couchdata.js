define(function(require, exports, module) {

  var CouchData = function($db) {

    var databases = {};

    function designDocs(database) {
      return couch.db(database).designDocs();
    }

    function setobj(arr, obj) {
      var x = arr.shift();
      if (typeof obj[x] === "undefined") {
        obj[x] = {};
      }
      if (arr.length > 0) {
        setobj(arr, obj[x]);
      }
    }

    function transformDDoc(ddoc) {
      var obj = {};
      for (var attachment in ddoc._attachments) {
        setobj(attachment.split("/"), obj);
      }
      ddoc._attachments = obj;
      return ddoc;
    }

    function generateHTML(data, db, ddoc, arr) {
      var arr = arr || [];
      var html = "<ul>";
      _.each(data, function(val, key) {
        if($.inArray(key, ["couchapp", "_id", "_rev"]) !== -1) {
          return;
        }
        var newarr = arr.slice();
        newarr.push(key);
        var isEmpty = typeof val !== "object" || $.isEmptyObject(val);
        var href = isEmpty ? 'href="#!/' + db + '/' + ddoc + '/' + newarr.join('/') + '" ' : '';
        var arrow = !isEmpty ? '<div class="arrow open">&nbsp;</div>' : '';
        html += "<li data-name='"+newarr.join('/')+"'><a " + href + "class='" +
          (isEmpty ? 'file' : 'folder node') + "'>" + arrow + key + "</a>";
        if (typeof val == "object") {
          html += generateHTML(val, db, ddoc, newarr);
        }
      });
      return html + "</ul>";
    }

    function readView(db, ddoc, view, key) {
      var dfd = $.Deferred();
      couch.db(db).get(ddoc).done(function (data) {
        dfd.resolve(data.views[view][key]);
      });
      return dfd.promise();
    }

    function readFilter(db, ddoc, filter) {
      var dfd = $.Deferred();
      couch.db(db).get(ddoc).done(function (data) {
        dfd.resolve(data.filters[filter]);
      });
      return dfd.promise();
    }

    function readUpdate(db, ddoc, update) {
      var dfd = $.Deferred();
      couch.db(db).get(ddoc).done(function (data) {
        dfd.resolve(data.updates[update]);
      });
      return dfd.promise();
    }

    function loadDatabases() {
      return $.Deferred(function (deferred) {
        couch.allDbs().then(function (dbs) {
          var dbNames = _.filter(dbs, function (name) {
            return name.charAt(0) !== "_";
          });

          $.when.apply(this, _.map(dbNames, designDocs)).then(function () {
            _.each(arguments, function(ddoc, i) {
              databases[dbNames[i]] = ddoc[0].rows;
            });
            deferred.resolve(databases);
          });

        });

      }).promise();
    }

    function asHTML() {

      var html = "<ul>";
      _.map(databases, function(ddocs, db) {
        html += '<li class="db"><a class="folder node">' +
          '<div class="arrow open">&nbsp;</div>' + db + '</a><ul>';
        _.map(ddocs, function(ddoc) {
          html += "<li><a class='design_doc folder node' data-db='" + db +
            "' data-ddoc='" + ddoc.id +
            "'><div class='arrow open'>&nbsp;</div>" + ddoc.id + "</a></li>";
        });
        html += '</ul></li>';
      });

      return html + "</ul>";
    }

    function fetchddoc(db, ddoc) {
      var dfd = $.Deferred();
      couch.db(db).get(ddoc).then(function (data) {
        var obj = {};
        for (var attachment in data._attachments) {
          setobj(attachment.split("/"), obj);
        }
        dfd.resolve({
          _attachments:obj,
          views:data.views,
          filters:data.filters
        });
      });
      return dfd.promise();
    }

    return {
      fetchddoc:fetchddoc,
      loadDatabases: loadDatabases,
      generateHTML: generateHTML,
      readView:readView,
      readFilter:readFilter,
      readUpdate:readUpdate,
      asHTML: asHTML,
      transformDDoc:transformDDoc
    };
  };

  exports.CouchData = new CouchData();

});
