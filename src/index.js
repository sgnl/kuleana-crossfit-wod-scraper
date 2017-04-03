import got from 'got'
import cheerio from 'cheerio'
import toMarkdown from 'to-markdown'
import moment from 'moment'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioClient = twilio(accountSid, authToken)

const getDate = () => {
  return moment().add(1, 'days').format('YYYY-MM-DD')
}

const markdownOptions = {
  converters: [
    {
      // 'div.skillName'
      filter: node => {
        return node.classList.contains('skillName')
      },
      replacement: content => {
        return `${content}\n\n`
      }
    },
    {
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
      from: '+18082011211',
  })
}

got(`https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=${getDate()}`)
  .then(res => {
    const $ = cheerio.load(res.body)
    const html = toMarkdown($('.workout').html(), markdownOptions)
    const header = toMarkdown($('#idPage h2').html(), markdownOptions)
    return `# ${header}\n\n${html}`
  })
  .then(markdown => console.log(markdown))
  // .then(sendSMS)
  .then(() => console.log('SMS success?!'))
  .catch(err => console.error)

