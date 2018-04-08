/**
 * @module cheerio
 */
var serialize = require('dom-serializer');
var defaultOptions = require('./options').default;
var flattenOptions = require('./options').flatten;
var select = require('css-select');
var parse5 = require('parse5');
var parse = require('./parse');
var staticMethods = require('./api/static');
var _ = {
  merge: require('lodash/merge'),
  defaults: require('lodash/defaults')
};

/**
 * Create a querying function, bound to a document created from the provided
 * markup. Note that similar to web browser contexts, this operation may
 * introduce `<html>`, `<head>`, and `<body>` elements. See the previous
 * section titled "Loading" for usage information.
 *
 * @param {string} content - Markup to be loaded.
 * @param {Object} [options] - Options for the created instance.
 * @param {boolean} [isDocument] - Allows parser to be switched to fragment mode.
 *
 */
exports.load = function(content, options, isDocument) {
  if (content === null || content === undefined) {
    throw new Error('cheerio.load() expects a string');
  }

  var Cheerio = require('./cheerio');

  options = _.defaults(flattenOptions(options || {}), defaultOptions);

  if (isDocument === void 0) isDocument = true;

  var root = parse(content, options, isDocument);

  var initialize = function(selector, context, r, opts) {
    if (!(this instanceof initialize)) {
      return new initialize(selector, context, r, opts);
    }
    opts = _.defaults(opts || {}, options);
    return Cheerio.call(this, selector, context, r || root, opts);
  };

  // Ensure that selections created by the "loaded" `initialize` function are
  // true Cheerio instances.
  initialize.prototype = Object.create(Cheerio.prototype);
  initialize.prototype.constructor = initialize;

  // Mimic jQuery's prototype alias for plugin authors.
  initialize.fn = initialize.prototype;

  // Keep a reference to the top-level scope so we can chain methods that implicitly
  // resolve selectors; e.g. $("<span>").(".bar"), which otherwise loses ._root
  initialize.prototype._originalRoot = root;

  // Add in the static methods
  _.merge(initialize, staticMethods);

  // The following static methods of the "loaded" factory function are defined
  // for compatability with pre-1.0 releases of Cheerio. They are implemented
  // with proxying functions so that the API's deprecated status can be
  // expressed in a more intuitive manner.
  initialize._load = exports.load;
  initialize._html = exports.html;
  initialize._xml = exports.xml;
  initialize._text = exports.text;

  // Add in the root
  initialize._root = root;
  // store options
  initialize._options = options;

  return initialize;
};

/*
* Helper function
*/

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
