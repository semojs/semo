const host = process.env.NODE_ENV === 'development' ? 'localhost:8080' : 'zignis.js.org'

module.exports = {
  title: 'Zignis',
  description: '沉淀最佳实践，减少重复投入，跨项目统一命令行实现方式。',
  base: '/',
  dest: 'public',
  themeConfig: {
    repo: 'https://github.com/zhike-team/zignis',
    repoLabel: 'Github',
    editLinks: true,
    editLinkText: 'Help improve this page',
    docsDir: 'doc',
    displayAllHeaders: false,
    nav: [
      { text: '首页', link: '/'},
      // { text: '指南', link: '/guide/'},
    ],
    sidebarDepth: 1,
  }

}
