import got from 'got'
import cheerio from 'cheerio'
import toMarkdown from 'to-markdown'
import moment from 'moment'
import twilio from 'twilio'

// setup twilio credentials and client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = twilio(accountSid, authToken)

const getDate = () => {
  return moment().add(1, 'days').format('YYYY-MM-DD')
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

const sendSMS = body => {
  return twilioClient.messages.create({
      body,
      to: '+18083674380',
      from: process.env.TWILIO_PHONE_NUMBER,
  })
}

const url = `https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=${getDate()}`

got(url)
  .then(res => {
    const $ = cheerio.load(res.body)
    const wodHTML = $('.workout').html()

    // no workout posted? bail.
    if (!wodHTML) throw ReferenceError('no workout posted')

    const html = toMarkdown(wodHTML, toMarkdownOptions)
    const header = toMarkdown($('#idPage h2').html(), toMarkdownOptions)

    return `# ${header}\n\n${html}`
  })
  // .then(markdown => console.log(markdown))
  .then(sendSMS)
  .then(() => console.log('SMS success?!'))
  .catch(err => {
    if (err.message === 'no workout posted' && err instanceof ReferenceError) {
      return console.log('really?')
    }

    return console.error(err);
  })

