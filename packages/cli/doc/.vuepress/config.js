const host = process.env.NODE_ENV === 'development' ? 'localhost:8080' : 'semo.js.org'

module.exports = {
  title: 'Semo',
  description: '帮你规范项目自定义命令行工具',
  base: '/',
  dest: '../../public',
  themeConfig: {
    repo: 'https://github.com/semojs/semo',
    repoLabel: 'Github',
    editLinks: true,
    editLinkText: 'Help improve this page',
    docsDir: 'doc',
    displayAllHeaders: false,
    nav: [
      { text: '首页', link: '/'},
      { text: '指南', link: '/guide/'},
      { text: '用法', link: '/usage/'},
      { text: '参考', link: `http://${host}/typedoc/`}
    ],
    sidebarDepth: 1,
    sidebar: [
      {
        title: '基础',
        collapsable: false,
        children: [
          '/guide/',
          '/guide/quickstart/',
          '/guide/core-commands/',
          '/guide/config/',
          '/guide/plugin/',
        ]
      },
      {
        title: '用法',
        collapsable: false,
        children: [
          '/usage/',
          '/usage/plugin/',
          '/usage/integration/',
          '/usage/solution/',
          '/usage/distribution/',
        ]
      },
      {
        title: '社区',
        collapsable: false,
        children: [
          '/community/contrib/',
          '/community/qa/',
        ]
      }
    ]
  }

}
