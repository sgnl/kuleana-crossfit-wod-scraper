'use strict';

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _toMarkdown = require('to-markdown');

var _toMarkdown2 = _interopRequireDefault(_toMarkdown);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getDate = function getDate() {
  return (0, _moment2.default)().add(1, 'days').format('YYYY-MM-DD');
};

var markdownOptions = {
  converters: [{
    filter: ['div', 'a'],
    replacement: function replacement(content) {
      return content;
    }
  }]
};

(0, _got2.default)('https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=' + getDate()).then(function (res) {
  var $ = _cheerio2.default.load(res.body);
  var html = (0, _toMarkdown2.default)($('.workout').html(), markdownOptions);
  var header = (0, _toMarkdown2.default)($('#idPage h2').html(), markdownOptions);
  return '# ' + header + '\n\n' + html;
}).then(function (markdown) {
  return console.log(markdown);
}).catch(function (err) {
  return console.error;
});