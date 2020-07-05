const host = process.env.NODE_ENV === 'development' ? 'localhost:8080' : 'semo.js.org'

module.exports = {
  title: 'Semo',
  description: '一个Node项目命令行开发规范',
  base: '/',
  dest: 'public',
  themeConfig: {
    repo: 'semojs/semo',
    repoLabel: 'Github',
    editLinks: true,
    editLinkText: '帮助改进此页文档',
    docsDir: 'docs',
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
          '/guide/hook/',
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
