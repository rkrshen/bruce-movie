import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://brucemovie.com',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  i18n: {
    defaultLocale: 'zh-TW',
    locales: ['zh-TW', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'zh-TW',
        locales: {
          'zh-TW': 'zh-TW',
          en: 'en',
        },
      },
      namespaces: {
        xhtml: true,
        news: false,
        image: false,
        video: false,
      },
      lastmod: new Date(),
      filter: (page) => !page.endsWith('/404'),
      serialize(item) {
        const links = item.links ? [...item.links] : [];
        if (!links.some((link) => link.lang === 'x-default')) {
          links.push({ lang: 'x-default', url: 'https://brucemovie.com/' });
        }
        return {
          ...item,
          links,
        };
      },
    }),
  ],
});
