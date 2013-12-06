var expect = require('expect.js'),
    parse = require('../lib/parse'),
    render = require('../lib/render');

var html = function(str, options) {
  options = options || {};
  var dom = parse(str, options);
  return render(dom);
};

describe('render', function() {

  describe('(html)', function() {

    it('should render <br /> tags correctly', function() {
      var str = '<br />';
      expect(html(str)).to.equal('<html><br></html>');
    });

    it('should handle double quotes within single quoted attributes properly', function() {
      var str = '<hr class=\'an "edge" case\' />';
      expect(html(str)).to.equal('<html><hr class="an &quot;edge&quot; case"></html>');
    });

    it('should retain encoded HTML content within attributes', function() {
      var str = '<hr class="cheerio &amp; node = happy parsing" />';
      expect(html(str)).to.equal('<html><hr class="cheerio &amp; node = happy parsing"></html>');
    });

    it('should shorten the "checked" attribute when it contains the value "checked"', function() {
      var str = '<input checked/>';
      expect(html(str)).to.equal('<html><input checked></html>');
    });

    it('should not shorten the "name" attribute when it contains the value "name"', function() {
      var str = '<input name="name"/>';
      expect(html(str)).to.equal('<html><input name="name"></html>');
    });

    it('should render comments correctly', function() {
      var str = '<!-- comment -->';
      expect(html(str)).to.equal('<html><!-- comment --></html>');
    });

    it('should render whitespace by default', function() {
      var str = '<a href="./haha.html">hi</a> <a href="./blah.html">blah</a>';
      expect(html(str)).to.equal('<html>' + str + '</html>');
    });

    it('should normalize whitespace if specified', function() {
      var str = '<a href="./haha.html">hi</a> <a href="./blah.html">blah  </a>';
      expect(html(str, { normalizeWhitespace: true })).to.equal('<html><a href="./haha.html">hi</a> <a href="./blah.html">blah </a></html>');
    });

    it('should preserve multiple hyphens in data attributes', function() {
      var str = '<div data-foo-bar-baz="value"></div>';
      expect(html(str)).to.equal('<html><div data-foo-bar-baz="value"></div></html>');
    });

  });

});
