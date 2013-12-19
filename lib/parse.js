/*
  Module Dependencies
*/
var htmlparser = require('htmlparser2'),
    _ = require('underscore'),
    isTag = require('./utils').isTag,
    camelCase = require('./utils').camelCase;

/*
  Parser
*/
exports = module.exports = function(content, options) {
  var dom = evaluate(content, options);

  // Generic root element
  var root = {
    type: 'root',
    name: 'root',
    parent: null,
    prev: null,
    next: null,
    children: []
  };

  // Update the dom using the root
  update(dom, root);

  return root;
};

var evaluate = exports.evaluate = function(content, options) {
  // options = options || $.fn.options;

  var handler = new htmlparser.DomHandler(options),
      parser = new htmlparser.Parser(handler, options);

  parser.write(content);
  parser.done();

  return connect(handler.dom);
};

var connect = exports.connect = function(dom, parent) {
  parent = parent || null;

  var prevElem = null;

  _.each(dom, function(elem) {

    if (isTag(elem.type)) {
      // If tag and no attributes, add empty object
      if (elem.attribs === undefined) {
        elem.attribs = {};
      } else {
        // If there are already attributes, add them to the data list.
        elem.data = parseData(elem);
      }
    }

    // Set parent
    elem.parent = parent;

    // Previous Sibling
    elem.prev = prevElem;

    // Next sibling
    elem.next = null;
    if (prevElem) prevElem.next = elem;

    // Run through the children
    if (elem.children)
      connect(elem.children, elem);
    else if (isTag(elem.type))
      elem.children = [];

    // Get ready for next element
    prevElem = elem;
  });

  return dom;
};

/*
  Update the dom structure, for one changed layer

  * Much faster than reconnecting
*/
var update = exports.update = function(arr, parent) {
  // normalize
  if (!Array.isArray(arr)) arr = [arr];

  // Update parent
  if (parent) {
    parent.children = arr;
  } else {
    parent = null;
  }

  // Update neighbors
  for (var i = 0; i < arr.length; i++) {
    var node = arr[i];

    // Cleanly remove existing nodes from their previous structures.
    var oldSiblings = node.parent && node.parent.children;
    if (oldSiblings && oldSiblings !== arr) {
      oldSiblings.splice(oldSiblings.indexOf(node), 1);
      if (node.prev) {
        node.prev.next = node.next;
      }
      if (node.next) {
        node.next.prev = node.prev;
      }
    }

    node.prev = arr[i - 1] || null;
    node.next = arr[i + 1] || null;
    node.parent = parent;
  }

  return parent;
};

/**
 * Extract data by using element attributes.
 * @param  {Object} elem Element
 * @return {Object}      `element.data` object
 */
var parseData = exports.parseData = function(elem) {
  if (elem.data === undefined) elem.data = {};
  var value;
  for (var key in elem.attribs) {
    if (key.substr(0, 5) === 'data-') {
      value = elem.attribs[key];
      key = key.slice(5);
      key = camelCase(key);
      elem.data[key] = value;
    }
  }
  return elem.data;
};

// module.exports = $.extend(exports);
