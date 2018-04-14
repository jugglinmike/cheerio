/*
  Module dependencies
*/

var parse = require('./parse'),
    defaultOptions = require('./options').default,
    flattenOptions = require('./options').flatten,
    isHtml = require('./utils').isHtml,
    _ = {
      extend: require('lodash/assignIn'),
      bind: require('lodash/bind'),
      forEach: require('lodash/forEach'),
      defaults: require('lodash/defaults'),
      merge: require('lodash/merge')
    };
var staticMethods = require('./api/static');

/*
 * The API
 */
var api = [
  require('./api/attributes'),
  require('./api/traversing'),
  require('./api/manipulation'),
  require('./api/css'),
  require('./api/forms')
];

/**
 * Instance of cheerio. Methods are specified in the modules.
 * Usage of this constructor is not recommended. Please use $.load instead.
 *
 * @class
 * @hideconstructor
 *
 * @param {string|cheerio|node|node[]} selector - The new selection.
 * @param {string|cheerio|node|node[]} [context] - Context of the selection.
 * @param {string|cheerio|node|node[]} [root] - Sets the root node.
 * @param {Object} [options] - Options for the instance.
 */
var Cheerio = (module.exports = function(selector, context, root, options) {
  if (!(this instanceof Cheerio))
    return new Cheerio(selector, context, root, options);

  this.options = _.defaults(
    flattenOptions(options),
    this.options,
    defaultOptions
  );

  // $(), $(null), $(undefined), $(false)
  if (!selector) return this;

  if (root) {
    if (typeof root === 'string') root = parse(root, this.options, false);
    this._root = Cheerio.call(this, root);
  }

  // $($)
  if (selector.cheerio) return selector;

  // $(dom)
  if (isNode(selector)) selector = [selector];

  // $([dom])
  if (Array.isArray(selector)) {
    _.forEach(
      selector,
      _.bind(function(elem, idx) {
        this[idx] = elem;
      }, this)
    );
    this.length = selector.length;
    return this;
  }

  // $(<html>)
  if (typeof selector === 'string' && isHtml(selector)) {
    return Cheerio.call(this, parse(selector, this.options, false).children);
  }

  // If we don't have a context, maybe we have a root, from loading
  if (!context) {
    context = this._root;
  } else if (typeof context === 'string') {
    if (isHtml(context)) {
      // $('li', '<ul>...</ul>')
      context = parse(context, this.options, false);
      context = Cheerio.call(this, context);
    } else {
      // $('li', 'ul')
      selector = [context, selector].join(' ');
      context = this._root;
    }
  } else if (!context.cheerio) {
    // $('li', node), $('li', [nodes])
    context = Cheerio.call(this, context);
  }

  // If we still don't have a context, return
  if (!context) return this;

  // #id, .class, tag
  return context.find(selector);
});

/**
 * Mix in `static`
 */
_.extend(Cheerio, require('./api/static'));
_.extend(Cheerio, require('./render'));

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
Cheerio.load = function(content, options, isDocument) {
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
  initialize._load = Cheerio.load;

  // Add in the root
  initialize._root = root;
  // store options
  initialize._options = options;

  return initialize;
};

/*
 * Set a signature of the object
 */
Cheerio.prototype.cheerio = '[cheerio object]';

/*
 * Make cheerio an array-like object
 */
Cheerio.prototype.length = 0;
Cheerio.prototype.splice = Array.prototype.splice;

/*
 * Make a cheerio object
 *
 * @private
 */
Cheerio.prototype._make = function(dom, context) {
  var cheerio = new this.constructor(dom, context, this._root, this.options);
  cheerio.prevObject = this;
  return cheerio;
};

// Plug in the API
api.forEach(function(mod) {
  _.extend(Cheerio.prototype, mod);
});

var isNode = function(obj) {
  return obj.name || obj.type === 'text' || obj.type === 'comment';
};
