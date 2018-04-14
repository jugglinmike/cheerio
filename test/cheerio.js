var expect = require('expect.js'),
    htmlparser2 = require('htmlparser2'),
    $ = require('../'),
    fixtures = require('./fixtures'),
    fruits = fixtures.fruits,
    food = fixtures.food,
    _ = {
      filter: require('lodash/filter')
    };

// HTML
var script = '<script src="script.js" type="text/javascript"></script>',
    multiclass = '<p><a class="btn primary" href="#">Save</a></p>';

describe('cheerio', function() {
  it('should get the version', function() {
    expect(/\d+\.\d+\.\d+/.test($.version)).to.be.ok();
  });

  it('$(null) should return be empty', function() {
    expect($(null)).to.be.empty();
  });

  it('$(undefined) should be empty', function() {
    expect($(undefined)).to.be.empty();
  });

  it('$(null) should be empty', function() {
    expect($('')).to.be.empty();
  });

  it('$(selector) with no context or root should be empty', function() {
    expect($('.h2')).to.be.empty();
    expect($('#fruits')).to.be.empty();
  });

  it('$(node) : should override previously-loaded nodes', function() {
    var C = $.load('<div><span></span></div>');
    var spanNode = C('span')[0];
    var $span = C(spanNode);
    expect($span[0]).to.equal(spanNode);
  });

  it('should be able to create html without a root or context', function() {
    var $h2 = $('<h2>');
    expect($h2).to.not.be.empty();
    expect($h2).to.have.length(1);
    expect($h2[0].tagName).to.equal('h2');
  });

  it('should be able to create complicated html', function() {
    var $script = $(script);
    expect($script).to.not.be.empty();
    expect($script).to.have.length(1);
    expect($script[0].attribs.src).to.equal('script.js');
    expect($script[0].attribs.type).to.equal('text/javascript');
    expect($script[0].childNodes).to.be.empty();
  });

  var testAppleSelect = function($apple) {
    expect($apple).to.have.length(1);
    $apple = $apple[0];
    expect($apple.parentNode.tagName).to.equal('ul');
    expect($apple.prev).to.be(null);
    expect($apple.next.attribs['class']).to.equal('orange');
    expect($apple.childNodes).to.have.length(1);
    expect($apple.childNodes[0].data).to.equal('Apple');
  };

  it('should be able to select .apple with only a context', function() {
    var $apple = $('.apple', fruits);
    testAppleSelect($apple);
  });

  it('should be able to select .apple with a node as context', function() {
    var $apple = $('.apple', $(fruits)[0]);
    testAppleSelect($apple);
  });

  it('should be able to select .apple with only a root', function() {
    var $apple = $('.apple', null, fruits);
    testAppleSelect($apple);
  });

  it('should be able to select an id', function() {
    var $fruits = $('#fruits', null, fruits);
    expect($fruits).to.have.length(1);
    expect($fruits[0].attribs.id).to.equal('fruits');
  });

  it('should be able to select a tag', function() {
    var $ul = $('ul', fruits);
    expect($ul).to.have.length(1);
    expect($ul[0].tagName).to.equal('ul');
  });

  it('should accept a node reference as a context', function() {
    var $elems = $('<div><span></span></div>');
    expect($('span', $elems[0])).to.have.length(1);
  });

  it('should accept an array of node references as a context', function() {
    var $elems = $('<div><span></span></div>');
    expect($('span', $elems.toArray())).to.have.length(1);
  });

  it('should select only elements inside given context (Issue #193)', function() {
    var q = $.load(food),
        $fruits = q('#fruits'),
        fruitElements = q('li', $fruits);

    expect(fruitElements).to.have.length(3);
  });

  it('should be able to select multiple tags', function() {
    var $fruits = $('li', null, fruits);
    expect($fruits).to.have.length(3);
    var classes = ['apple', 'orange', 'pear'];
    $fruits.each(function(idx, $fruit) {
      expect($fruit.attribs['class']).to.equal(classes[idx]);
    });
  });

  it('should be able to do: $("#fruits .apple")', function() {
    var $apple = $('#fruits .apple', fruits);
    testAppleSelect($apple);
  });

  it('should be able to do: $("li.apple")', function() {
    var $apple = $('li.apple', fruits);
    testAppleSelect($apple);
  });

  it('should be able to select by attributes', function() {
    var $apple = $('li[class=apple]', fruits);
    testAppleSelect($apple);
  });

  it('should be able to select multiple classes: $(".btn.primary")', function() {
    var $a = $('.btn.primary', multiclass);
    expect($a).to.have.length(1);
    expect($a[0].childNodes[0].data).to.equal('Save');
  });

  it('should not create a top-level node', function() {
    var $elem = $('* div', '<div>');
    expect($elem).to.have.length(0);
  });

  it('should be able to select multiple elements: $(".apple, #fruits")', function() {
    var $elems = $('.apple, #fruits', fruits);
    expect($elems).to.have.length(2);

    var $apple = _.filter($elems, function(elem) {
      return elem.attribs['class'] === 'apple';
    });
    var $fruits = _.filter($elems, function(elem) {
      return elem.attribs.id === 'fruits';
    });
    testAppleSelect($apple);
    expect($fruits[0].attribs.id).to.equal('fruits');
  });

  it('should select first element $(:first)');
  // var $elem = $(':first', fruits);
  // var $h2 = $('<h2>fruits</h2>');
  // console.log($elem.before('hi'));
  // console.log($elem.before($h2));

  it('should be able to select immediate children: $("#fruits > .pear")', function() {
    var $food = $(food);
    $('.pear', $food).append('<li class="pear">Another Pear!</li>');
    expect($('#fruits .pear', $food)).to.have.length(2);
    var $elem = $('#fruits > .pear', $food);
    expect($elem).to.have.length(1);
    expect($elem.attr('class')).to.equal('pear');
  });

  it('should be able to select immediate children: $(".apple + .pear")', function() {
    var $elem = $('.apple + li', fruits);
    expect($elem).to.have.length(1);
    $elem = $('.apple + .pear', fruits);
    expect($elem).to.have.length(0);
    $elem = $('.apple + .orange', fruits);
    expect($elem).to.have.length(1);
    expect($elem.attr('class')).to.equal('orange');
  });

  it('should be able to select immediate children: $(".apple ~ .pear")', function() {
    var $elem = $('.apple ~ li', fruits);
    expect($elem).to.have.length(2);
    $elem = $('.apple ~ .pear', fruits);
    expect($elem.attr('class')).to.equal('pear');
  });

  it('should handle wildcards on attributes: $("li[class*=r]")', function() {
    var $elem = $('li[class*=r]', fruits);
    expect($elem).to.have.length(2);
    expect($elem.eq(0).attr('class')).to.equal('orange');
    expect($elem.eq(1).attr('class')).to.equal('pear');
  });

  it('should handle beginning of attr selectors: $("li[class^=o]")', function() {
    var $elem = $('li[class^=o]', fruits);
    expect($elem).to.have.length(1);
    expect($elem.eq(0).attr('class')).to.equal('orange');
  });

  it('should handle beginning of attr selectors: $("li[class$=e]")', function() {
    var $elem = $('li[class$=e]', fruits);
    expect($elem).to.have.length(2);
    expect($elem.eq(0).attr('class')).to.equal('apple');
    expect($elem.eq(1).attr('class')).to.equal('orange');
  });

  it('should gracefully degrade on complex, unmatched queries', function() {
    var $elem = $('Eastern States Cup #8-fin&nbsp;<br>Downhill&nbsp;');
    expect($elem).to.have.length(0); // []
  });

  it('(extended Array) should not interfere with prototype methods (issue #119)', function() {
    var extended = [];
    extended.find = extended.children = extended.each = function() {};
    var $empty = $(extended);

    expect($empty.find).to.be($.prototype.find);
    expect($empty.children).to.be($.prototype.children);
    expect($empty.each).to.be($.prototype.each);
  });

  it('should set html(number) as a string', function() {
    var $elem = $('<div>');
    $elem.html(123);
    expect(typeof $elem.text()).to.equal('string');
  });

  it('should set text(number) as a string', function() {
    var $elem = $('<div>');
    $elem.text(123);
    expect(typeof $elem.text()).to.equal('string');
  });

  describe('.merge', function() {
    var arr1, arr2;
    beforeEach(function() {
      arr1 = [1, 2, 3];
      arr2 = [4, 5, 6];
    });

    it('should be a function', function() {
      expect(typeof $.merge).to.equal('function');
    });

    it('(arraylike, arraylike) : should return an array', function() {
      var ret = $.merge(arr1, arr2);
      expect(typeof ret).to.equal('object');
      expect(ret instanceof Array).to.be.ok();
    });

    it('(arraylike, arraylike) : should modify the first array', function() {
      $.merge(arr1, arr2);
      expect(arr1).to.have.length(6);
    });

    it('(arraylike, arraylike) : should not modify the second array', function() {
      $.merge(arr1, arr2);
      expect(arr2).to.have.length(3);
    });

    it('(arraylike, arraylike) : should handle objects that arent arrays, but are arraylike', function() {
      arr1 = {};
      arr2 = {};
      arr1.length = 3;
      arr1[0] = 'a';
      arr1[1] = 'b';
      arr1[2] = 'c';
      arr2.length = 3;
      arr2[0] = 'd';
      arr2[1] = 'e';
      arr2[2] = 'f';
      $.merge(arr1, arr2);
      expect(arr1).to.have.length(6);
      expect(arr1[3]).to.equal('d');
      expect(arr1[4]).to.equal('e');
      expect(arr1[5]).to.equal('f');
      expect(arr2).to.have.length(3);
    });

    it('(?, ?) : should gracefully reject invalid inputs', function() {
      var ret = $.merge([4], 3);
      expect(ret).to.not.be.ok();
      ret = $.merge({}, {});
      expect(ret).to.not.be.ok();
      ret = $.merge([], {});
      expect(ret).to.not.be.ok();
      ret = $.merge({}, []);
      expect(ret).to.not.be.ok();
      var fakeArray1 = { length: 3 };
      fakeArray1[0] = 'a';
      fakeArray1[1] = 'b';
      fakeArray1[3] = 'd';
      ret = $.merge(fakeArray1, []);
      expect(ret).to.not.be.ok();
      ret = $.merge([], fakeArray1);
      expect(ret).to.not.be.ok();
      fakeArray1 = {};
      fakeArray1.length = '7';
      ret = $.merge(fakeArray1, []);
      expect(ret).to.not.be.ok();
      fakeArray1.length = -1;
      ret = $.merge(fakeArray1, []);
      expect(ret).to.not.be.ok();
    });

    it('(?, ?) : should no-op on invalid inputs', function() {
      var fakeArray1 = { length: 3 };
      fakeArray1[0] = 'a';
      fakeArray1[1] = 'b';
      fakeArray1[3] = 'd';
      $.merge(fakeArray1, []);
      expect(fakeArray1).to.have.length(3);
      expect(fakeArray1[0]).to.equal('a');
      expect(fakeArray1[1]).to.equal('b');
      expect(fakeArray1[3]).to.equal('d');
      $.merge([], fakeArray1);
      expect(fakeArray1).to.have.length(3);
      expect(fakeArray1[0]).to.equal('a');
      expect(fakeArray1[1]).to.equal('b');
      expect(fakeArray1[3]).to.equal('d');
    });
  });

  describe('.html - deprecated API', function() {
    it('() : of empty cheerio object should return null', function() {
      // Note: the direct invocation of the Cheerio constructor function is
      // also deprecated.
      var q = $();
      expect(q.html()).to.be(null);
    });

    it('(selector) : should return the outerHTML of the selected element', function() {
      var q = $.load(fixtures.fruits);
      expect(q.html('.pear')).to.equal('<li class="pear">Pear</li>');
    });
  });

  describe('.xml  - deprecated API', function() {
    it('() :  renders XML', function() {
      var q = $.load('<foo></foo>', { xmlMode: true });
      expect(q.xml()).to.equal('<foo/>');
    });
  });

  describe('.text  - deprecated API', function() {
    it('(cheerio object) : should return the text contents of the specified elements', function() {
      var q = $.load('<a>This is <em>content</em>.</a>');
      expect(q.text(q('a'))).to.equal('This is content.');
    });

    it('(cheerio object) : should omit comment nodes', function() {
      var q = $.load('<a>This is <!-- a comment --> not a comment.</a>');
      expect(q.text(q('a'))).to.equal('This is  not a comment.');
    });

    it('(cheerio object) : should include text contents of children recursively', function() {
      var q = $.load(
        '<a>This is <div>a child with <span>another child and <!-- a comment --> not a comment</span> followed by <em>one last child</em> and some final</div> text.</a>'
      );
      expect(q.text(q('a'))).to.equal(
        'This is a child with another child and  not a comment followed by one last child and some final text.'
      );
    });

    it('() : should return the rendered text content of the root', function() {
      var q = $.load(
        '<a>This is <div>a child with <span>another child and <!-- a comment --> not a comment</span> followed by <em>one last child</em> and some final</div> text.</a>'
      );
      expect(q.text()).to.equal(
        'This is a child with another child and  not a comment followed by one last child and some final text.'
      );
    });

    it('(cheerio object) : should omit script tags', function() {
      var q = $.load('<script>console.log("test")</script>');
      expect(q.text()).to.equal('');
    });

    it('(cheerio object) : should omit style tags', function() {
      var q = $.load(
        '<style type="text/css">.cf-hidden { display: none; } .cf-invisible { visibility: hidden; }</style>'
      );
      expect(q.text()).to.equal('');
    });

    it('(cheerio object) : should include text contents of children omiting style and script tags', function() {
      var q = $.load(
        '<body>Welcome <div>Hello, testing text function,<script>console.log("hello")</script></div><style type="text/css">.cf-hidden { display: none; }</style>End of messege</body>'
      );
      expect(q.text()).to.equal(
        'Welcome Hello, testing text function,End of messege'
      );
    });
  });

  describe('.load', function() {
    it('should generate selections as proper instances', function() {
      var q = $.load(fruits);

      expect(q('.apple')).to.be.a(q);
    });

    it('should be able to filter down using the context', function() {
      var q = $.load(fruits),
          apple = q('.apple', 'ul'),
          lis = q('li', 'ul');

      expect(apple).to.have.length(1);
      expect(lis).to.have.length(3);
    });

    it('should be available as a static method on the "loaded" factory function (deprecated API)', function() {
      var q = $.load(fruits);
      var q2 = q.load('<div><p>Some <a>text</a>.</p></div>');

      expect(q2('a')).to.have.length(1);
    });

    it('should allow loading a pre-parsed DOM', function() {
      var dom = htmlparser2.parseDOM(food),
          q = $.load(dom);

      expect(q('ul')).to.have.length(3);
    });

    it('should render xml in html() when options.xml = true', function() {
      var str = '<MixedCaseTag UPPERCASEATTRIBUTE=""></MixedCaseTag>',
          expected = '<MixedCaseTag UPPERCASEATTRIBUTE=""/>',
          dom = $.load(str, { xml: true });

      expect(dom('MixedCaseTag').get(0).tagName).to.equal('MixedCaseTag');
      expect(dom.html()).to.be(expected);
    });

    it('should render xml in html() when options.xml = true passed to html()', function() {
      var str = '<MixedCaseTag UPPERCASEATTRIBUTE=""></MixedCaseTag>',
          // since parsing done without xml flag, all tags converted to lowercase
          expectedXml =
          '<html><head/><body><mixedcasetag uppercaseattribute=""/></body></html>',
          expectedNoXml =
          '<html><head></head><body><mixedcasetag uppercaseattribute=""></mixedcasetag></body></html>',
          dom = $.load(str);

      expect(dom('MixedCaseTag').get(0).tagName).to.equal('mixedcasetag');
      expect(dom.html()).to.be(expectedNoXml);
      expect(dom.html({ xml: true })).to.be(expectedXml);
    });

    it('should respect options on the element level', function() {
      var str =
          '<!doctype html><html><head><title>Some test</title></head><body><footer><p>Copyright &copy; 2003-2014</p></footer></body></html>',
          expectedHtml = '<p>Copyright &copy; 2003-2014</p>',
          expectedXml = '<p>Copyright © 2003-2014</p>',
          domNotEncoded = $.load(str, { xml: { decodeEntities: false } }),
          domEncoded = $.load(str);

      expect(domNotEncoded('footer').html()).to.be(expectedHtml);
      // TODO: Make it more html friendly, maybe with custom encode tables
      expect(domEncoded('footer').html()).to.be(expectedXml);
    });

    it('should return a fully-qualified Function', function() {
      var $c = $.load('<div>');

      expect($c).to.be.a(Function);
    });

    describe('prototype extensions', function() {
      it('should honor extensions defined on `prototype` property', function() {
        var $c = $.load('<div>');
        var $div;
        $c.prototype.myPlugin = function() {
          return {
            context: this,
            args: arguments
          };
        };

        $div = $c('div');

        expect($div.myPlugin).to.be.a('function');
        expect($div.myPlugin().context).to.be($div);
        expect(Array.prototype.slice.call($div.myPlugin(1, 2, 3).args)).to.eql([
          1,
          2,
          3
        ]);
      });

      it('should honor extensions defined on `fn` property', function() {
        var $c = $.load('<div>');
        var $div;
        $c.fn.myPlugin = function() {
          return {
            context: this,
            args: arguments
          };
        };

        $div = $c('div');

        expect($div.myPlugin).to.be.a('function');
        expect($div.myPlugin().context).to.be($div);
        expect(Array.prototype.slice.call($div.myPlugin(1, 2, 3).args)).to.eql([
          1,
          2,
          3
        ]);
      });

      it('should isolate extensions between loaded functions', function() {
        var $a = $.load('<div>');
        var $b = $.load('<div>');

        $a.prototype.foo = function() {};

        expect($b('div').foo).to.be(undefined);
      });
    });
  });
});
