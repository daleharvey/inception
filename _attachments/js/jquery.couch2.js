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

  var defaults = {
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
    defaults.vhost = false
    var real_db = document.location.href.split( '/' )[ 3 ],
        real_ddoc = unescape( document.location.href ).split( '/' )[ 5 ];
    defaults.url = "/" + real_db + "/_design/" + real_ddoc + "/_rewrite/";
  }

  function makeRequest(opts) {
    var key = JSON.stringify(opts);
    if (cache[key]) {
      var dfd = $.Deferred();
      dfd.resolve(cache[key]);
      return dfd.promise();
    } else {
      var ajaxOpts = $.extend({}, defaults, opts);
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

  couch.get = function(url) {
    return makeRequest({url: defaults.url + defaults.couch + url, type:'GET'});
  };
      
  couch.allDbs = function() {
    return makeRequest($.extend({}, defaults, {
      url: defaults.url + defaults.couch + "/_all_dbs"
    }));
  };

  couch.db = function(name) {
    return {
      name: name,
      uri: defaults.url + defaults.couch + "/" + name + "/",

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
        return $.ajax($.extend({}, defaults, opts)).promise();
      },

      put: function(id, data) {
        return makeRequest({url:this.uri + id, type:"PUT", data:data});
      },

      designDocs: function() {
        return makeRequest($.extend({}, defaults, {
          url: this.uri + "/_all_docs",
          data: {startkey:'"_design/"', endkey:'"_design0"', include_docs:true}
        }));
      }
    };
  };

})(jQuery);