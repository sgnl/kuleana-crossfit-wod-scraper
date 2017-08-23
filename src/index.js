import got from 'got'
import cheerio from 'cheerio'
import toMarkdown from 'to-markdown'
import moment from 'moment'
import twilio from 'twilio'

import { getAllSubscribers } from './mongo'

// setup twilio credentials and client
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = twilio(accountSid, authToken)

const date = moment().add(1, 'days').format('YYYY-MM-DD')

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

const sendSMS = ({ smsBody, phoneNumber }, cb) => {
  return twilioClient.messages.create({
    body: smsBody,
    to: `+${phoneNumber}`,
    from: twilioPhoneNumber,
  }, cb)
}

const baseUrl = `https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=${date}`
const actualUrl = (programId) => `https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?programid=${programId}&date=${date}`;

got(baseUrl)
  .then(res => {
    const $ = cheerio.load(res.body)
    const optionElements = $('#objectid option')

    const allLevelsSelectable = optionElements.filter((_, element) => {
      return element.children.some(html => /All Levels/gmi.test(html.data))
    });

    return actualUrl(allLevelsSelectable[0].attribs.value)
  })
  .then(got)
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
        return sendSMS({ smsBody, phoneNumber}, (err, text) => {
          console.log('sms sent!')
          process.exit()
        })
      }))
  })
  .catch(err => {
    if (err.message === 'no workout posted' && err instanceof ReferenceError) {
      return console.log('really?')
    }

    return console.error(err)
  })
