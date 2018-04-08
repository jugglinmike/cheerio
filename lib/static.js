/**
 * @module cheerio
 */
var defaultOptions = require('./options').default;
var flattenOptions = require('./options').flatten;
var parse = require('./parse');
var staticApi = require('./api/static');
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
  _.merge(initialize, staticApi);
  // Depecated; maintained for compatability with Cheerio version 0.x
  initialize._load = exports.load;

  // Add in the root
  initialize._root = root;
  // store options
  initialize._options = options;

  return initialize;
};

/**
 */
exports.text = staticApi.text;
