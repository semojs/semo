const chalk = require('chalk')
const Utils = require('../../common/utils')
const _ = require('lodash')

module.exports = {
  status () {
    return {a: 1}
  },
  * beforeCommand () {
    let ten = [
      '通过利他来利己。 -- 智课十诫',
      '所有的事情追求质量的极致，效率的极致，变态般的细致。 -- 智课十诫',
      '大声直接的说出你的观点，哪怕它是错的。 -- 智课十诫',
      '做比说重要，只说不做只能证明无能。 -- 智课十诫',
      '越努力，越幸运：努力到无能为力，拼搏到感动自己。 -- 智课十诫',
      '做一个有创新精神的专家。 -- 智课十诫',
      '做一个传递正能量的人，不要抱怨。 -- 智课十诫',
      '让用户和客户感动是对待用户和客户的唯一标准。 -- 智课十诫',
      '充满求知欲，因为脑子是用来学习的，不止是用来做梦的。 -- 智课十诫',
      '充满解决问题的欲望，因为问题是用来解决的，不止是用来发现的。 -- 智课十诫'
    ]

    return {
      zignisPluginTen: function (argv) {
        let config = _.merge(Utils.getCombinedConfig(), argv) // use zignis config as default args
        if (config.disableTenTemporarily) {
          return
        }

        const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development' // development/production/test
        const envColor = env === 'production' ? 'yellow' : 'green'
        console.log(chalk[envColor](ten[Math.floor(Math.random() * ten.length)]), '\n')
      }
    }
  },
  * afterCommand () {}
}
