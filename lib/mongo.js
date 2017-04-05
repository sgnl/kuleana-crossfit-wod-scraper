'use strict';

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = _bluebird2.default;

var dbURL = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASSWORD + '@' + process.env.MONGO_URL;
var mongooseOptions = { promiseLibrary: _bluebird2.default };

_mongoose2.default.connect(dbURL, mongooseOptions);

var Schema = _mongoose2.default.Schema;

var phoneNumbersSubSchema = new Schema({
  phoneNumber: { required: true, type: String }
});

var PhoneNumberSubscriber = _mongoose2.default.model('PhoneNumberSubscriber', phoneNumbersSubSchema);

var getAllSubscribers = function getAllSubscribers() {
  return PhoneNumberSubscriber.find();
};

module.exports = {
  getAllSubscribers: getAllSubscribers
};