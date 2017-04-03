'use strict';

var _got = require('got');

var _got2 = _interopRequireDefault(_got);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _toMarkdown = require('to-markdown');

var _toMarkdown2 = _interopRequireDefault(_toMarkdown);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _twilio = require('twilio');

var _twilio2 = _interopRequireDefault(_twilio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var twilioClient = (0, _twilio2.default)(accountSid, authToken);

var getDate = function getDate() {
  return (0, _moment2.default)().add(1, 'days').format('YYYY-MM-DD');
};

var markdownOptions = {
  converters: [{
    // only care about 'div.skillName'
    filter: function filter(node) {
      return node.classList.contains('skillName');
    },
    replacement: function replacement(content) {
      return content + '\n\n';
    }
  }, {
    // catch all the rest
    filter: ['a', 'div'],
    replacement: function replacement(content) {
      return content;
    }
  }]
};

var sendSMS = function sendSMS(body) {
  return twilioClient.messages.create({
    body: body,
    to: '+18083674380',
    from: '+18082011211'
  });
};

var url = 'https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=' + getDate();

(0, _got2.default)(url).then(function (res) {
  var $ = _cheerio2.default.load(res.body);
  var wodHTML = $('.workout').html();

  // no workout posted? bail.
  if (!wodHTML) throw ReferenceError('no workout posted');

  var html = (0, _toMarkdown2.default)(wodHTML, markdownOptions);
  var header = (0, _toMarkdown2.default)($('#idPage h2').html(), markdownOptions);

  return '# ' + header + '\n\n' + html;
}).then(function (markdown) {
  return console.log(markdown);
})
// .then(sendSMS)
// .then(() => console.log('SMS success?!'))
.catch(function (err) {
  if (err.message === 'no workout posted' && err instanceof ReferenceError) {
    return console.log('really?');
  }

  return console.error(err);
});