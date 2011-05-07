/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define(function(require, exports, module) {

// Should be the first thing, as we want to use that in this module.
if (!Function.prototype.bind) {
    // from MDC
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
    Function.prototype.bind = function (obj) {
        var slice = [].slice;
        var args = slice.call(arguments, 1);
        var self = this;
        var nop = function () {};

        // optimize common case
        if (arguments.length == 1) {
          var bound = function() {
              return self.apply(this instanceof nop ? this : obj, arguments);
          };
        }
        else {
          var bound = function () {
              return self.apply(
                  this instanceof nop ? this : ( obj || {} ),
                  args.concat( slice.call(arguments) )
              );
          };
        }

        nop.prototype = self.prototype;
        bound.prototype = new nop();

        // From Narwhal
        bound.name = this.name;
        bound.displayName = this.displayName;
        bound.length = this.length;
        bound.unbound = self;

        return bound;
    };
}


var F = function() {}
var call = Function.prototype.call;
// Shortcut for `Object.prototype.hasOwnProperty.call`.
var owns = call.bind(Object.prototype.hasOwnProperty);

// Shortcuts for getter / setter utilities if supported by JS engine.
var getGetter, getSetter, setGetter, setSetter
getGetter = getSetter = setGetter = setSetter = F;

if (Object.prototype.__lookupGetter__)
    getGetter = call.bind(Object.prototype.__lookupGetter__);
if (Object.prototype.__lookupSetter__)
    getSetter = call.bind(Object.prototype.__lookupSetter__);
if (Object.prototype.__defineGetter__)
    setGetter = call.bind(Object.prototype.__defineGetter__);
if (Object.prototype.__defineSetter__)
    setSetter = call.bind(Object.prototype.__defineSetter__);

/**
 * Array detector.
 * Firefox 3.5 and Safari 4 have this already. Chrome 4 however ...
 * Note to Dojo - your isArray is still broken: instanceof doesn't work with
 * Arrays taken from a different frame/window.
 */
// ES5 15.4.3.2
if (!Array.isArray) {
    Array.isArray = function(data) {
        return data && Object.prototype.toString.call(data) === "[object Array]";
    };
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(searchElement /*, fromIndex */)
  {
    if (this === void 0 || this === null)
        throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0)
        return -1;

    var n = 0, zero = n;
    if (arguments.length > 0) {
        n = Number(arguments[1]);
        if (n !== n)
            n = 0;
        else if (n !== 0 && n !== (1 / zero) && n !== -(1 / zero))
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }

    if (n >= len)
        return -1;

    var k = n >= 0
        ? n
        : Math.max(len - Math.abs(n), 0);

    for (; k < len; k++) {
      if (k in t && t[k] === searchElement)
          return k;
    }
    return -1;
  };
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
if (!Array.prototype.lastIndexOf)
{
  Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0)
      return -1;

    var n = len, zero = false | 0;
    if (arguments.length > 0)
    {
      n = Number(arguments[1]);
      if (n !== n)
        n = 0;
      else if (n !== 0 && n !== (1 / zero) && n !== -(1 / zero))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }

    var k = n >= 0
          ? Math.min(n, len - 1)
          : len - Math.abs(n);

    while (k >= 0)
    {
      if (k in t && t[k] === searchElement)
        return k;
    }
    return -1;
  };
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
// ES5 15.4.4.19
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp */) {
    if (this === void 0 || this === null)
        throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
        throw new TypeError();

      res = new Array(len);
    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in t)
          res[i] = fun.call(thisp, t[i], i, t);
    }

      return res;
  };
}

// from MDC
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
// ES5 15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fun /*, thisp */) {
    if (this === void 0 || this === null)
        throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
        throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++) {
      if (i in t)
          fun.call(thisp, t[i], i, t);
    }
  };
}

// ES5 15.4.4.20
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(callback, scope) {
        var values = [], i, ii;
        for (i = 0, ii = this.length; i < ii; i++) {
            if (callback.call(scope, this[i])) values.push(this[i]);
        }
        return values;
    };
}

// ES5 15.4.4.16
if (!Array.prototype.every) {
    Array.prototype.every = function every(callback, scope) {
        var i, ii;
        for (i = 0, ii = this.length; i < ii; i++) {
            if (!callback.call(scope, this[i])) return false;
        }
        return true;
    };
}

// ES5 15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (callback, scope) {
        var i, ii;
        for (i = 0, ii = this.length; i < ii; i++) {
            if (callback.call(scope, this[i])) return true;
        }
        return false;
    };
}

// ES5 15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value and an empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = 0;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }

        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}

// ES5 15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        // no value to return if no initial value, empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();

        var i = len - 1;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);
        }

        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }

        return rv;
    };
}


/**
 * Retrieves the list of keys on an object.
 */
if (!Object.keys) {
    Object.keys = function keys(object) {
        var name, names = [];
        for (name in object)
            if (owns(object, name)) names.push(name);

        return names;
    };
}

// Can not be implemented so we default to the Object.keys
// ES5 15.2.3.4
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = Object.keys;
}

// ES5 15.2.3.3
var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a non-object"
if (!Object.getOwnPropertyDescriptor) {
    Object.getOwnPropertyDescriptor =
        function getOwnPropertyDescriptor(object, name) {
            var descriptor, getter, setter;

            if (typeof object !== "object" && typeof object !== "function"
                || object === null) throw new TypeError(ERR_NON_OBJECT);

            if (owns(object, name)) {
                descriptor = { configurable: true, enumerable: true };
                getter = descriptor.get = getGetter(object, name);
                setter = descriptor.set = getSetter(object, name);
                // If nor getter nor setter is not defined we default to
                // normal value. This can mean that either it's data
                // property or js engine does not supports getters / setters.
                if (!getter && !setter) {
                    descriptor.writeable = true;
                    descriptor.value = object[name]
                }
            }
            return descriptor
        }
}

// Returning `__proto__` of an object or `object.constructor.prototype` for IE.
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || object.constructor.prototype;
    }
}

// ES5 15.2.3.5
if (!Object.create) {
    Object.create = function create(prototype, properties) {
        var object;

        if (prototype === null) {
            object = { __proto__: null };
        } else if (typeof prototype !== "object") {
            throw new TypeError(prototype + " is not an object or null");
        } else {
            F.prototype = prototype;
            object = new F();
        }

        if (typeof properties !== "undefined")
            Object.defineProperties(object, properties);

        return object;
    };
}

// ES5 15.2.3.6
if (!Object.defineProperty) {
    Object.defineProperty = function defineProperty(object, name, descriptor) {
        var proto, setter, getter;

        if ("object" !== typeof object && "function" !== typeof object)
            throw new TypeError(object + "is not an object");
        if (descriptor && 'object' !== typeof descriptor)
            throw new TypeError('Property descriptor map must be an object');
        if ('value' in descriptor) { // if it's a data property
            if ('get' in descriptor || 'set' in descriptor) {
                throw new TypeError('Invalid property. "value" present on '
                    + 'property with getter or setter.');
            }

            // Swapping __proto__ with default one to avoid calling inherited
            // getters / setters with this `name`.
            if (proto = object.__proto__) object.__proto__ = Object.prototype;
            // Delete property cause it may be a setter.
            delete object[name];
            object[name] = descriptor.value;
            // Return __proto__ back.
            if (proto) object.__proto__ = proto;
        } else {
            if (getter = descriptor.get) setGetter(object, getter);
            if (setter = descriptor.set) setSetter(object, setter);
        }
        return object;
    };
}

// ES5 15.2.3.7
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        Object.getOwnPropertyNames(properties).forEach(function (name) {
            Object.defineProperty(object, name, properties[name]);
        });
        return object;
    };
}

var passThrough = function(object) { return object };
// ES5 15.2.3.8
if (!Object.seal) Object.seal = passThrough;

// ES5 15.2.3.9
if (!Object.freeze) Object.freeze = passThrough;

// ES5 15.2.3.10
if (!Object.preventExtensions) Object.preventExtension = passThrough;

var no = function() { return false };
var yes = function() { return true };

// ES5 15.2.3.11
if (!Object.isSealed) Object.isSealed = no;
// ES5 15.2.3.12
if (!Object.isFrozen) Object.isFrozen = no;
// ES5 15.2.3.13
if (!Object.isExtensible) Object.isExtensible = yes;

if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.trimLeft().trimRight();
    }
}

if (!String.prototype.trimRight) {
    String.prototype.trimRight = function() {
        return this.replace(/[\t\v\f\s\u00a0\ufeff]+$/, "");
    }
}

if (!String.prototype.trimLeft) {
    String.prototype.trimLeft = function() {
        return this.replace(/^[\t\v\f\s\u00a0\ufeff]+/, "");
    }
}

exports.globalsLoaded = true;

});
