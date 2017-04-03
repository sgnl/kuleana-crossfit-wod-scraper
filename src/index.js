import got from 'got'
import cheerio from 'cheerio'
import toMarkdown from 'to-markdown'
import moment from 'moment'

const getDate = () => {
  return moment().add(1, 'days').format('YYYY-MM-DD')
}

const markdownOptions = {
  converters: [
    {
      filter: ['div', 'a'],
      replacement: content => {
        return content
      }
    }
  ]
}

got(`https://crossfitk.sites.zenplanner.com/leaderboard-day.cfm?date=${getDate()}`)
  .then(res => {
    const $ = cheerio.load(res.body)
    const html = toMarkdown($('.workout').html(), markdownOptions)
    const header = toMarkdown($('#idPage h2').html(), markdownOptions)
    return `# ${header}\n\n${html}`
  })
  .then(markdown => console.log(markdown))
  .catch(err => console.error)

