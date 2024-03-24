import { defineConfig } from 'vitepress'
import { createRequire } from 'node:module'

const host =
  process.env.NODE_ENV === 'development' ? 'localhost:5173' : 'semo.js.org'

const require = createRequire(import.meta.url)

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Semo',
  description: '一个命令行工具',
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
    root: {
      label: '中文',
      lang: 'zh',
      link: '/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '指南', link: '/guide/' },
          { text: '用法', link: '/usage/' },
          { text: '参考', link: `http://${host}/typedoc/` },
        ],
        sidebar: [
          {
            text: '基础',
            collapsed: false,
            items: [
              {
                text: '介绍',
                link: '/guide/',
              },
              {
                text: '快速上手',
                link: '/guide/quickstart/',
              },
              {
                text: '核心命令',
                link: '/guide/core-commands/',
              },
              {
                text: '自定义命令',
                link: '/guide/custom-commands/',
              },
              {
                text: '配置管理',
                link: '/guide/config/',
              },
              {
                text: '钩子机制',
                link: '/guide/hook/',
              },
              {
                text: '插件开发',
                link: '/guide/plugin/',
              },
            ],
          },
          {
            text: '用法',
            collapsed: false,
            items: [
              {
                text: '概述',
                link: '/usage/',
              },
              {
                text: '插件',
                link: '/usage/plugin/',
              },
              {
                text: '项目整合',
                link: '/usage/integration/',
              },
              {
                text: '解决方案',
                link: '/usage/solution/',
              },
              {
                text: '发行版',
                link: '/usage/distribution/',
              },
            ],
          },
          {
            text: '社区',
            collapsed: false,
            items: [
              {
                text: '如何贡献',
                link: '/community/contrib/',
              },
              {
                text: '常见问题',
                link: '/community/qa/',
              },
            ],
          },
        ],
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Guide', link: '/en/guide/' },
          { text: 'Usage', link: '/en/usage/' },
          { text: 'Reference', link: `http://${host}/typedoc/` },
        ],
        sidebar: [
          {
            text: 'Guide',
            collapsed: false,
            items: [
              {
                text: 'Introduction',
                link: '/en/guide/',
              },
              {
                text: 'Quick Start',
                link: '/en/guide/quickstart/',
              },
              {
                text: 'Core Commands',
                link: '/en/guide/core-commands/',
              },
              {
                text: 'Custom Commands',
                link: '/en/guide/core-commands/',
              },
              {
                text: 'Configuration Management',
                link: '/en/guide/config/',
              },
              {
                text: 'Hook Mechanism',
                link: '/en/guide/hook/',
              },
              {
                text: 'Plugin Development',
                link: '/en/guide/plugin/',
              },
            ],
          },
          {
            text: 'Usage',
            collapsed: false,
            items: [
              {
                text: 'Overview',
                link: '/en/usage/',
              },
              {
                text: 'Plugins',
                link: '/en/usage/plugin/',
              },
              {
                text: 'Project Integration',
                link: '/en/usage/integration/',
              },
              {
                text: 'Solutions',
                link: '/en/usage/solution/',
              },
              {
                text: 'Distribution',
                link: '/en/usage/distribution/',
              },
            ],
          },
          {
            text: 'Community',
            collapsed: false,
            items: [
              {
                text: 'How to Contribute',
                link: '/en/community/contrib/',
              },
              {
                text: 'Frequently Asked Questions',
                link: '/en/community/qa/',
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
