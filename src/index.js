import got from 'got'
import cheerio from 'cheerio'
import toMarkdown from 'to-markdown'
import moment from 'moment'
import twilio from 'twilio'

import { getAllSubscribers } from './mongo'

// setup twilio credentials and client
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = twilio(accountSid, authToken)

const getDate = () => {
  return moment().add(0, 'days').format('YYYY-MM-DD')
}

const toMarkdownOptions = {
  converters: [
    {
      // only care about 'div.skillName'
      filter: node => {
        return node.classList.contains('skillName')
      },
      replacement: content => {
        return `${content}\n\n`
      }
    },
    {
      // catch all the rest
      filter: ['a', 'div'],
      replacement: content => {
        return content
      }
    }
  ]
}

const sendSMS = ({ smsBody, phoneNumber }) => {
  return twilioClient.messages.create({
      body: smsBody,
      to: `+${phoneNumber}`,
      from: twilioPhoneNumber,
  })
}

const url = `https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=${getDate()}`

console.log(url)

got(url)
  .then(res => {
    const $ = cheerio.load(res.body)
    const wodHTML = $('.workout').html()
    const wodHeader = $('#idPage h2').html()

    if (!wodHTML) throw ReferenceError('no workout posted')
    if (!wodHeader) throw ReferenceError('no header found')

    const html = toMarkdown(wodHTML, toMarkdownOptions)
    const header = toMarkdown(wodHeader, toMarkdownOptions)

    return `# ${header}\n---\n\n${html}`
  })
  .then(smsBody => {
    return getAllSubscribers()
      .then(subs => subs.forEach(({ phoneNumber }) => {
        return sendSMS({ smsBody, phoneNumber})
      }))
  })
  .catch(err => {
    if (err.message === 'no workout posted' && err instanceof ReferenceError) {
      return console.log('really?')
    }

    return console.error(err)
  })
