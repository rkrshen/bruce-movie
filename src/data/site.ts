export const SITE = {
  url: 'https://brucemovie.com',
  ogImage: '/og-image.jpg',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  email: 'brucemovie@gmail.com',
  phoneDisplay: '+886 911844183',
  phoneHref: 'tel:+886911844183',
  phoneSchema: '+886-911-844-183',
  youtubeReportId: 'pAofg7XJXXg',
  /**
   * Web3Forms public access key (public form identifier by Web3Forms design;
   * Web3Forms Free plan blocks server-side/Worker POSTs with HTTP 403 and
   * requires browser-side submission). Override via PUBLIC_WEB3FORMS_ACCESS_KEY.
   */
  web3formsEndpoint: 'https://api.web3forms.com/submit',
  web3formsAccessKey: 'a493a945-7ebd-4e72-949a-2db91751869d',
  social: {
    facebook: 'https://www.facebook.com/mingzespecialeffects',
    // TODO: 請替換為澤影映像官方 Instagram 帳號網址（例如 https://www.instagram.com/your_handle）
    instagram: 'https://www.instagram.com',
  },
} as const;
