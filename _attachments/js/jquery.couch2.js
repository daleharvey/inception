(function($) {

  window.couch = {};

  var cache = {};

  var defaults = {
    headers: {"Accept":"application/json"},
    dataType:"json",
    contentType: "application/json",
    type: "GET",
    url: "/"
  };

  couch.makeRequest = function(opts) {
    var key = JSON.stringify(opts);
    if (cache[key]) {
      var dfd = $.Deferred();
      dfd.resolve(jQuery.extend(true, {}, cache[key]));
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
    return couch.makeRequest({url:url, type:'GET'});
  };

  couch.db = function(name) {

    return {
      name: name,
      uri: "/" + encodeURIComponent(name) + "/",

      get: function(id) {
        return couch.makeRequest({url:this.uri + id, type:"GET"});
      },

      put: function(id, data) {
        return couch.makeRequest({url:this.uri + id, type:"PUT", data:data});
      },

      designDocs: function(opts) {
        return couch.makeRequest($.extend(defaults, {
          url: this.uri + "_all_docs",
          data: {startkey:'"_design/"', endkey:'"_design0"', include_docs:true}
        }));
      }

    };
  };

})(jQuery);

