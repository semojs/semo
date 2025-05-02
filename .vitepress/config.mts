import { defineConfig } from 'vitepress'
import { createRequire } from 'node:module'

const host =
  process.env.NODE_ENV === 'development' ? 'localhost:5173' : 'semo.js.org'

const require = createRequire(import.meta.url)

const latestVersion = '1.x'
const defaultLanguage = 'en'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Semo',
  description:
    'A command line tool for building enterprise-level Node.js project command line systems',
  srcDir: './docs',
  ignoreDeadLinks: true,
  vite: {
    resolve: {
      alias: {
        'vue/server-renderer': require.resolve('vue/server-renderer'),
        vue: require.resolve('vue'),
      },
    },
  },

  locales: {
    cn: {
      label: '中文',
      lang: 'zh',
      link: '/cn/',
      themeConfig: {
        footer: {
          message: '企业级Node项目命令行体系建设规范',
        },
        nav: [
          { text: '首页', link: '/cn/' },
          { text: '指南', link: '/cn/guide/' },
          { text: '用法', link: '/cn/usage/' },
          { text: '参考', link: `http://${host}/typedoc/` },
        ],
        sidebar: [
          {
            text: '基础',
            collapsed: false,
            items: [
              {
                text: '介绍',
                link: '/cn/guide/',
              },
              {
                text: '快速上手',
                link: '/cn/guide/quickstart/',
              },
              {
                text: '核心命令',
                link: '/cn/guide/core-commands/',
              },
              {
                text: '自定义命令',
                link: '/cn/guide/custom-commands/',
              },
              {
                text: '配置管理',
                link: '/cn/guide/config/',
              },
              {
                text: '钩子机制',
                link: '/cn/guide/hook/',
              },
              {
                text: '插件开发',
                link: '/cn/guide/plugin/',
              },
            ],
          },
          {
            text: '用法',
            collapsed: false,
            items: [
              {
                text: '概述',
                link: '/cn/usage/',
              },
              {
                text: '插件',
                link: '/cn/usage/plugin/',
              },
              {
                text: '项目整合',
                link: '/cn/usage/integration/',
              },
              {
                text: '解决方案',
                link: '/cn/usage/solution/',
              },
              {
                text: '发行版',
                link: '/cn/usage/distribution/',
              },
            ],
          },
          {
            text: '社区',
            collapsed: false,
            items: [
              {
                text: '如何贡献',
                link: '/cn/community/contrib/',
              },
              {
                text: '常见问题',
                link: '/cn/community/qa/',
              },
            ],
          },
        ],
      },
    },
    root: {
      label: 'English',
      lang: 'en',
      link: '/',
      themeConfig: {
        footer: {
          message: 'Enterprise level CLI solution',
        },
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/guide/' },
          { text: 'Usage', link: '/usage/' },
          { text: 'Reference', link: `http://${host}/typedoc/` },
        ],
        sidebar: [
          {
            text: 'Guide',
            collapsed: false,
            items: [
              {
                text: 'Introduction',
                link: '/guide/',
              },
              {
                text: 'Quick Start',
                link: '/guide/quickstart/',
              },
              {
                text: 'Core Commands',
                link: '/guide/core-commands/',
              },
              {
                text: 'Custom Commands',
                link: '/guide/core-commands/',
              },
              {
                text: 'Configuration Management',
                link: '/guide/config/',
              },
              {
                text: 'Hook Mechanism',
                link: '/guide/hook/',
              },
              {
                text: 'Plugin Development',
                link: '/guide/plugin/',
              },
            ],
          },
          {
            text: 'Usage',
            collapsed: false,
            items: [
              {
                text: 'Overview',
                link: '/usage/',
              },
              {
                text: 'Plugins',
                link: '/usage/plugin/',
              },
              {
                text: 'Project Integration',
                link: '/usage/integration/',
              },
              {
                text: 'Solutions',
                link: '/usage/solution/',
              },
              {
                text: 'Distribution',
                link: '/usage/distribution/',
              },
            ],
          },
          {
            text: 'Community',
            collapsed: false,
            items: [
              {
                text: 'How to Contribute',
                link: '/community/contrib/',
              },
              {
                text: 'Frequently Asked Questions',
                link: '/community/qa/',
              },
            ],
          },
        ],
      },
    },
  },
  themeConfig: {
    search: {
      provider: 'local',
    },
    // https://vitepress.dev/reference/default-theme-config
  },
})
