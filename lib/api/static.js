/**
 * Methods for working with the loaded document. These method are defined on
 * the "loaded" Cheerio factory function created by [`cheerio.load`]{@link
 * module:cheerio.load}.
 *
 * @module static
 */
var defaultOptions = require('../options').default,
    flattenOptions = require('../options').flatten,
    parse5 = require('parse5'),
    select = require('css-select'),
    serialize = require('dom-serializer'),
    _ = {
      flatten: require('lodash/flatten'),
      defaults: require('lodash/defaults')
    };

function render(that, dom, options) {
  if (!dom) {
    if (that._root && that._root.children) {
      dom = that._root.children;
    } else {
      return '';
    }
  } else if (typeof dom === 'string') {
    dom = select(dom, that._root, options);
  }

  var useHtmlParser2 = options.xmlMode || options._useHtmlParser2;

  return useHtmlParser2
    ? serialize(dom, options)
    : parse5.serialize(
      { children: 'length' in dom ? dom : [dom] },
      {
        treeAdapter: parse5.treeAdapters.htmlparser2
      }
    );
}

/**
 * Render the document as XML.
 *
 * @param {string|cheerio|node} [dom] - Element to render.
 */
exports.xml = function(dom) {
  var options = _.defaults({ xml: true }, this._options);

  return render(this, dom, options);
};

/**
 * Render the document as text.
 *
 * @param {string|cheerio|node} [elems] - Elements to render.
 */
exports.text = function(elems) {
  if (!elems) {
    elems = this.root();
  }

  var ret = '',
      len = elems.length,
      elem;

  for (var i = 0; i < len; i++) {
    elem = elems[i];
    if (elem.type === 'text') ret += elem.data;
    else if (
      elem.children &&
      elem.type !== 'comment' &&
      elem.tagName !== 'script' &&
      elem.tagName !== 'style'
    ) {
      ret += exports.text(elem.children);
    }
  }

  return ret;
};

/**
 * Renders the document.
 *
 * @param {string|cheerio|node} [dom] - Element to render.
 * @param {Object} [options] - Options for the renderer.
 */
exports.html = function(dom, options) {
  // be flexible about parameters, sometimes we call html(),
  // with options as only parameter
  // check dom argument for dom element specific properties
  // assume there is no 'length' or 'type' properties in the options object
  if (
    Object.prototype.toString.call(dom) === '[object Object]' &&
    !options &&
    !('length' in dom) &&
    !('type' in dom)
  ) {
    options = dom;
    dom = undefined;
  }

  // sometimes $.html() used without preloading html
  // so fallback non existing options to the default ones
  options = _.defaults(
    flattenOptions(options || {}),
    this._options,
    defaultOptions
  );

  return render(this, dom, options);
};

/**
 * Parses a string into an array of DOM nodes. The `context` argument has no
 * meaning for Cheerio, but it is maintained for API compatibility with jQuery.
 *
 * @param {string} data - Markup that will be parsed.
 * @param {any|boolean} [context] - Will be ignored. If it is a boolean it will be used as the value of `keepScripts`.
 * @param {boolean} [keepScripts] - If false all scripts will be removed.
 *
 * @see {@link https://api.jquery.com/jQuery.parseHTML/}
 */
exports.parseHTML = function(data, context, keepScripts) {
  var parsed;

  if (!data || typeof data !== 'string') {
    return null;
  }

  if (typeof context === 'boolean') {
    keepScripts = context;
  }

  parsed = this.load(data, defaultOptions, false);
  if (!keepScripts) {
    parsed('script').remove();
  }

  // The `children` array is used by Cheerio internally to group elements that
  // share the same parents. When nodes created through `parseHTML` are
  // inserted into previously-existing DOM structures, they will be removed
  // from the `children` array. The results of `parseHTML` should remain
  // constant across these operations, so a shallow copy should be returned.
  return parsed.root()[0].children.slice();
};

/**
 * Sometimes you need to work with the top-level root element. To query it, you
 * can use `$.root()`.
 *
 * @example
 * ```js
 * $.root().append('<ul id="vegetables"></ul>').html();
 * //=> <ul id="fruits">...</ul><ul id="vegetables"></ul>
 * ```
 */
exports.root = function() {
  return this(this._root);
};

/**
 * Checks to see if the `contained` DOM element is a descendant of the
 * `container` DOM element.
 *
 * @param {node} container - Potential parent node.
 * @param {node} contained - Potential child node.
 *
 * @see {@link https://api.jquery.com/jQuery.contains}
 */
exports.contains = function(container, contained) {
  // According to the jQuery API, an element does not "contain" itself
  if (contained === container) {
    return false;
  }

  // Step up the descendants, stopping when the root element is reached
  // (signaled by `.parent` returning a reference to the same object)
  while (contained && contained !== contained.parent) {
    contained = contained.parent;
    if (contained === container) {
      return true;
    }
  }

  return false;
};

/**
 * $.merge().
 *
 * @param {Array|cheerio} arr1 - First array.
 * @param {Array|cheerio} arr2 - Second array.
 *
 * @see {@link https://api.jquery.com/jQuery.merge}
 */
exports.merge = function(arr1, arr2) {
  if (!(isArrayLike(arr1) && isArrayLike(arr2))) {
    return;
  }
  var newLength = arr1.length + arr2.length;
  var i = 0;
  while (i < arr2.length) {
    arr1[i + arr1.length] = arr2[i];
    i++;
  }
  arr1.length = newLength;
  return arr1;
};

function isArrayLike(item) {
  if (Array.isArray(item)) {
    return true;
  }
  if (typeof item !== 'object') {
    return false;
  }
  if (!item.hasOwnProperty('length')) {
    return false;
  }
  if (typeof item.length !== 'number') {
    return false;
  }
  if (item.length < 0) {
    return false;
  }
  var i = 0;
  while (i < item.length) {
    if (!(i in item)) {
      return false;
    }
    i++;
  }
  return true;
}

/**
 * This method is defined for backwards compatibility with pre-1.0 releases of
 * Cheerio. Please use [the `load` method exported by the module]{@link
 * module:cheerio.load} instead.
 *
 * @deprecated
 */
exports.load = function() {
  console.log(this);
  return this._load.apply(this, arguments);
};
