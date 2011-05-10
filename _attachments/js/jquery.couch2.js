(function($) {

  window.couch = {};

  var cache = {};

  // vhosts are when you mask couchapps behind a pretty URL
  var inVhost = function() {
    var vhost = false;
    if ( document.location.pathname.indexOf( "_design" ) === -1 ) {
      vhost = true;
    }
    return vhost;
  }

  couch.defaults = {
    vhost: true,
    dataType:"json",
    contentType: "application/json",
    type: "GET",
    couch: "couch", // needs to be defined in rewrites.json
    db: "api", // needs to be defined in rewrites.json
    design: "ddoc", // needs to be defined in rewrites.json
    url: "/",
    host: document.location.href.split( "/" )[ 2 ]
  };
  
  if ( !inVhost() ) {
    couch.defaults.vhost = false
    var real_db = document.location.href.split( '/' )[ 3 ],
        real_ddoc = unescape( document.location.href ).split( '/' )[ 5 ];
    couch.defaults.url = "/" + real_db + "/_design/" + real_ddoc + "/_rewrite/";
  }

  function makeRequest(opts) {
    var key = JSON.stringify(opts);
    if (cache[key]) {
      var dfd = $.Deferred();
      dfd.resolve(jQuery.extend(true, {}, cache[key]));
      return dfd.promise();
    } else {
      var ajaxOpts = $.extend({}, couch.defaults, opts);
      ajaxOpts.dataFilter = function (data) {
        cache[key] = JSON.parse(data);
        return data;
      };
      return $.ajax(ajaxOpts).promise();
    }
  }

  couch.clearCache = function() {
    cache = {};
  };
  
  couch.root = function() {
    return couch.defaults.url + couch.defaults.couch;
  }

  couch.get = function(url) {
    return makeRequest({url: couch.root() + url, type:'GET'});
  };
      
  couch.allDbs = function() {
    return makeRequest($.extend({}, couch.defaults, {
      url: couch.root() + "/_all_dbs"
    }));
  };

  couch.db = function(name) {
    return {
      name: name,
      uri: couch.root() + "/" + name + "/",

      get: function(id) {
        return makeRequest({url:this.uri + id, type:"GET"});
      },
      
      getAttachment: function(id) {
        var opts = {
          url:this.uri + id, 
          type:"GET", 
          contentType: "application/x-www-form-urlencoded", 
          dataType: null
        }
        return $.ajax($.extend({}, couch.defaults, opts)).promise();
      },

      put: function(id, data) {
        return makeRequest({url:this.uri + id, type:"PUT", data:data});
      },

      designDocs: function() {
        return makeRequest($.extend({}, couch.defaults, {
          url: this.uri + "/_all_docs",
          data: {startkey:'"_design/"', endkey:'"_design0"', include_docs:true}
        }));
      }
    };
  };

})(jQuery);
