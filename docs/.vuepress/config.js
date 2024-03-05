const host =
  process.env.NODE_ENV === 'development' ? 'localhost:8080' : 'semo.js.org'

module.exports = {
  base: '/',
  dest: 'public',
  locales: {
    // 键名是该语言所属的子路径
    // 作为特例，默认语言可以使用 '/' 作为其路径。
    '/': {
      lang: 'zh-CN', // 将会被设置为 <html> 的 lang 属性
      title: 'Semo',
      description: '一个Node项目命令行开发规范',
    },
    '/en/': {
      lang: 'en-US',
      title: 'Semo',
      description: 'A Node.js CLI building rules.',
    },
  },
  themeConfig: {
    repo: 'semojs/semo',
    repoLabel: 'Github',
    editLinks: true,
    docsDir: 'docs',
    displayAllHeaders: false,
    locales: {
      '/': {
        editLinkText: '帮助改进此页文档',
        nav: [
          { text: '首页', link: '/' },
          { text: '指南', link: '/guide/' },
          { text: '用法', link: '/usage/' },
          { text: '参考', link: `http://${host}/typedoc/` },
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
              '/guide/custom-commands/',
              '/guide/config/',
              '/guide/hook/',
              '/guide/plugin/',
            ],
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
            ],
          },
          {
            title: '社区',
            collapsable: false,
            children: ['/community/contrib/', '/community/qa/'],
          },
        ],
      },
      '/en/': {
        editLinkText: 'Help improve this page',
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guide', link: '/en/guide/' },
          { text: 'Usage', link: '/en/usage/' },
          { text: 'Reference', link: `http://${host}/typedoc/` },
        ],
        sidebarDepth: 1,
        sidebar: [
          {
            title: 'Guide',
            collapsable: false,
            children: [
              '/en/guide/',
              '/en/guide/quickstart/',
              '/en/guide/core-commands/',
              '/en/guide/custom-commands/',
              '/en/guide/config/',
              '/en/guide/hook/',
              '/en/guide/plugin/',
            ],
          },
          {
            title: 'Usage',
            collapsable: false,
            children: [
              '/en/usage/',
              '/en/usage/plugin/',
              '/en/usage/integration/',
              '/en/usage/solution/',
              '/en/usage/distribution/',
            ],
          },
          {
            title: 'Community',
            collapsable: false,
            children: ['/en/community/contrib/', '/en/community/qa/'],
          },
        ],
      },
    },
  },
}
