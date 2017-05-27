var assign = require('lodash/assign');

/*
 * Cheerio default options for htmlparser2
 */

exports.default = {
  withDomLvl1: true,
  normalizeWhitespace: false,
  xmlMode: false,
  decodeEntities: true
};

exports.normalize = function(options) {
  var normalized = {};

  if (!options || (!options.htmlparser2 && !options.xml)) {
    return normalized;
  }

  if (options.htmlparser2 && options.xml) {
    throw new Error('Ambiguous parsing configuration.');
  }

  if (options.xml) {
    if (options.xml.xmlMode === false) {
      throw new Error('Contradictory parsing configuration.');
    }

    normalized.htmlparser2 = options.xml === true ? {} : options.xml;
    normalized.htmlparser2.xmlMode = true;
  } else {
    normalized.htmlparser2 = options.htmlparser2;
  }

  normalized.htmlparser2 = assign({}, exports.default, normalized.htmlparser2);

  return normalized;
};
