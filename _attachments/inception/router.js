define(function(require, exports, module) {

  var Router = function() {

    var PATH_REPLACER = "([^\/]+)",
        PATH_MATCHER  = /:([\w\d]+)/g,
        WILD_MATCHER  = /\*([\w\d]+)/g,
        WILD_REPLACER  = "(.*?)",
        preRouterFun  = null,
        fun404        = null,
        history       = [],
        routes        = {GET: [], POST: []};

    // Needs namespaced and decoupled and stuff
    function init() {
      $(window).bind("hashchange", urlChanged).trigger("hashchange");
      $(document).bind("submit", formSubmitted);
    }

    function back() {
      history.pop(); // current url
      if (history.length > 0) {
        document.location.href = "#" + history.pop();
      } else {
        document.location.href = "#";
      }
    }

    function get(path, cb) {
      route("GET", path, cb);
    }

    function post(path, cb) {
      route("POST", path, cb);
    }

    function refresh(maintainScroll) {
      urlChanged(maintainScroll);
    }

    function preRouter(fun) {
      preRouterFun = fun;
    }

    function error404(fun) {
      fun404 = fun;
    }

    function go(url) {
      document.location.hash = url;
      window.scrollTo(0,0);
    }

    function toRegex(path) {
      if (path.constructor == String) {
        return new RegExp("^" + path.replace(PATH_MATCHER, PATH_REPLACER)
                          .replace(WILD_MATCHER, WILD_REPLACER) +"$");
      } else {
        return path;
      }
    }

    function route(verb, path, cb) {
      routes[verb].push({
        path     : toRegex(path),
        callback : cb
      });
    }

    function urlChanged(maintainScroll) {
      history.push(url());
      trigger("GET", url());
      if (maintainScroll !== true) {
        //window.scrollTo(0,0);
      }
    }

    function formSubmitted(e) {

      e.preventDefault();
      var action = e.target.getAttribute("action");

      if (action[0] === "#") {
        trigger("POST", action.slice(1), e, serialize(e.target));
      }
    }

    function trigger(verb, url, ctx, data) {
      if (preRouterFun) {
        if (!preRouterFun(verb, url, ctx)) {
          return;
        }
      }
      var match = matchPath(verb, url);
      if (match) {
        var args = match.match.slice(1);
        if (verb === "POST") {
          args.unshift(data);
          args.unshift(ctx);
        }
        match.details.callback.apply(this, args);
      } else {
        if (fun404) {
          fun404(verb, url);
        }
      }
    }

    function matchesCurrent(needle) {
      return url().match(toRegex(needle));
    }

    function match(needle, uri) {
      return (uri || url()).match(toRegex(needle));
    }

    function url() {
      return window.location.hash.slice(1);
    }

    function matchPath(verb, path) {
      var i, tmp, arr = routes[verb];
      for (i = 0; i < arr.length; i += 1) {
        tmp = path.match(arr[i].path);
        if (tmp) {
          return {"match":tmp, "details":arr[i]};
        }
      }
      return false;
    }

    function serialize(obj) {
      var o = {};
      var a = $(obj).serializeArray();
      $.each(a, function() {
        if (o[this.name]) {
          if (!o[this.name].push) {
            o[this.name] = [o[this.name]];
          }
          o[this.name].push(this.value || '');
        } else {
          o[this.name] = this.value || '';
        }
      });
      return o;
    }

    return {
      go      : go,
      back    : back,
      get     : get,
      post    : post,
      init    : init,
      match   : match,
      matchesCurrent : matchesCurrent,
      pre     : preRouter,
      refresh : refresh,
      error404 : error404,
      url:url
    };

  };

  exports.Router = new Router();

});
