const chalk = require('chalk')

module.exports = {
  * beforeCommand () {
    let ten = [
      '通过利他来利己。',
      '所有的事情追求质量的极致，效率的极致，变态般的细致。',
      '大声直接的说出你的观点，哪怕它是错的。',
      '做比说重要，只说不做只能证明无能。',
      '越努力，越幸运：努力到无能为力，拼搏到感动自己。',
      '做一个有创新精神的专家。',
      '做一个传递正能量的人，不要抱怨。',
      '让用户和客户感动是对待用户和客户的唯一标准。',
      '充满求知欲，因为脑子是用来学习的，不止是用来做梦的。',
      '充满解决问题的欲望，因为问题是用来解决的，不止是用来发现的。'
    ]

    return {
      zignisPluginTen: function (argv) {
        if (argv.disableTenTemporarily) {
          return
        }

        const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development' // development/production/test
        const envColor = env === 'production' ? 'yellow' : 'green'
        console.log(chalk[envColor](ten[Math.floor((Math.random() * ten.length))], '-- 智课十诫'), '\n')
      }
    }
  },
  * afterCommand () {
  }
}
