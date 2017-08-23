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

var _mongo = require('./mongo');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// setup twilio credentials and client
var twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
var accountSid = process.env.TWILIO_ACCOUNT_SID;
var authToken = process.env.TWILIO_AUTH_TOKEN;
var twilioClient = (0, _twilio2.default)(accountSid, authToken);

var date = (0, _moment2.default)().add(1, 'days').format('YYYY-MM-DD');

var toMarkdownOptions = {
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

var sendSMS = function sendSMS(_ref, cb) {
  var smsBody = _ref.smsBody,
      phoneNumber = _ref.phoneNumber;

  return twilioClient.messages.create({
    body: smsBody,
    to: '+' + phoneNumber,
    from: twilioPhoneNumber
  }, cb);
};

var baseUrl = 'https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=' + date;
var actualUrl = function actualUrl(programId) {
  return 'https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?programid=' + programId + '&date=' + date;
};

(0, _got2.default)(baseUrl).then(function (res) {
  var $ = _cheerio2.default.load(res.body);
  var optionElements = $('#objectid option');

  var allLevelsSelectable = optionElements.filter(function (_, element) {
    return element.children.some(function (html) {
      return (/All Levels/gmi.test(html.data)
      );
    });
  });

  return actualUrl(allLevelsSelectable[0].attribs.value);
}).then(_got2.default).then(function (res) {
  var $ = _cheerio2.default.load(res.body);
  var wodHTML = $('.workout').html();
  var wodHeader = $('#idPage h2').html();

  if (!wodHTML) throw ReferenceError('no workout posted');
  if (!wodHeader) throw ReferenceError('no header found');

  var html = (0, _toMarkdown2.default)(wodHTML, toMarkdownOptions);
  var header = (0, _toMarkdown2.default)(wodHeader, toMarkdownOptions);

  return '# ' + header + '\n---\n\n' + html;
}).then(function (smsBody) {
  return (0, _mongo.getAllSubscribers)().then(function (subs) {
    return subs.forEach(function (_ref2) {
      var phoneNumber = _ref2.phoneNumber;

      return sendSMS({ smsBody: smsBody, phoneNumber: phoneNumber }, function (err, text) {
        console.log('sms sent!');
        process.exit();
      });
    });
  });
}).catch(function (err) {
  if (err.message === 'no workout posted' && err instanceof ReferenceError) {
    return console.log('really?');
  }

  return console.error(err);
});