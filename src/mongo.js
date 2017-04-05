
import mongoose from 'mongoose'
import Promise from 'bluebird'

mongoose.Promise = Promise

const dbURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}`
const mongooseOptions = { promiseLibrary: Promise }

mongoose.connect(dbURL, mongooseOptions)

const Schema = mongoose.Schema

const phoneNumbersSubSchema = new Schema({
  phoneNumber: { required: true, type: String }
})

const PhoneNumberSubscriber = mongoose.model('PhoneNumberSubscriber', phoneNumbersSubSchema)

const getAllSubscribers = () => {
  return PhoneNumberSubscriber.find()
}

module.exports = {
  getAllSubscribers
}
