/**
 * @module cheerio
 */
var serialize = require('dom-serializer');
var defaultOptions = require('./options').default;
var flattenOptions = require('./options').flatten;
var select = require('css-select');
var parse5 = require('parse5');
var _ = {
  defaults: require('lodash/defaults')
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
