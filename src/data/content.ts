import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n';

import heroCover from '../assets/images/hero-cover.webp';
import logoImg from '../assets/images/logo.png';
import founderImg from '../assets/images/founder.webp';
import behindScenesImg from '../assets/images/behind-the-scenes.webp';
import awardMainImg from '../assets/images/award-main.webp';
import awardGoldenHorseImg from '../assets/images/award-golden-horse.webp';
import tearsOnFireStillImg from '../assets/images/tears-on-fire-still.webp';
import youngsterStillImg from '../assets/images/youngster-still.webp';
import ninaWuStillImg from '../assets/images/nina-wu-still.webp';

import activityStage1 from '../assets/images/activity-stage-1.webp';
import activityStage2 from '../assets/images/activity-stage-2.webp';
import activityTccf1 from '../assets/images/activity-tccf-1.webp';
import activityTccf2 from '../assets/images/activity-tccf-2.webp';
import activityMaster1 from '../assets/images/activity-masterclass-1.webp';
import activityMaster2 from '../assets/images/activity-masterclass-2.webp';
import activityMaster3 from '../assets/images/activity-masterclass-3.webp';
import activityCampus1 from '../assets/images/activity-campus-1.webp';
import activityCampus2 from '../assets/images/activity-campus-2.webp';
import activityCampus3 from '../assets/images/activity-campus-3.webp';

import posterReportSimulation from '../assets/posters/report-simulation.webp';
import posterTearsOnFire from '../assets/posters/tears-on-fire.webp';
import posterCallOfDuty from '../assets/posters/call-of-duty.webp';
import posterDangerZone from '../assets/posters/danger-zone.webp';
import posterBattlegrounds from '../assets/posters/battlegrounds.webp';
import posterTheGangs from '../assets/posters/the-gangs.webp';

export const BRAND_IMAGES = {
  heroCover,
  logoImg,
  founderImg,
  behindScenesImg,
  awardMainImg,
  posterReportSimulation,
} as const;

export type ActivityKey = 'stage' | 'tccf' | 'masterclass' | 'campus';

export const ACTIVITY_MEDIA: Record<ActivityKey, ImageMetadata[]> = {
  stage: [activityStage1, activityStage2],
  tccf: [activityTccf1, activityTccf2],
  masterclass: [activityMaster1, activityMaster2, activityMaster3],
  campus: [activityCampus1, activityCampus2, activityCampus3],
};

export type EffectItemKey =
  | 'tearsOnFire'
  | 'callOfDuty'
  | 'dangerZone'
  | 'battleGrounds'
  | 'theGangs';

export interface EffectVideoMeta {
  key: EffectItemKey;
  poster: ImageMetadata;
  src: string;
}

export const EFFECT_VIDEOS: Record<EffectItemKey, EffectVideoMeta> = {
  tearsOnFire: {
    key: 'tearsOnFire',
    poster: posterTearsOnFire,
    src: '/video/tears-on-fire.mp4',
  },
  callOfDuty: {
    key: 'callOfDuty',
    poster: posterCallOfDuty,
    src: '/video/call-of-duty.mp4',
  },
  dangerZone: {
    key: 'dangerZone',
    poster: posterDangerZone,
    src: '/video/danger-zone.mp4',
  },
  battleGrounds: {
    key: 'battleGrounds',
    poster: posterBattlegrounds,
    src: '/video/battlegrounds.mp4',
  },
  theGangs: {
    key: 'theGangs',
    poster: posterTheGangs,
    src: '/video/the-gangs.mp4',
  },
};

export type EffectTabKey = 'series' | 'films' | 'commercials';

export const EFFECT_TABS: { id: EffectTabKey; items: EffectItemKey[] }[] = [
  {
    id: 'series',
    items: ['tearsOnFire', 'dangerZone', 'callOfDuty', 'battleGrounds'],
  },
  {
    id: 'films',
    items: ['tearsOnFire', 'dangerZone', 'callOfDuty', 'theGangs'],
  },
  {
    id: 'commercials',
    items: ['tearsOnFire', 'dangerZone', 'theGangs', 'battleGrounds'],
  },
];

export interface AwardSlide {
  image: ImageMetadata;
  caption: Record<Locale, string>;
  alt: Record<Locale, string>;
}

export const AWARD_SLIDES: AwardSlide[] = [
  {
    image: awardGoldenHorseImg,
    caption: {
      'zh-TW': '榮獲 第58屆 金馬獎－年度傑出電影工作者獎《現場特效指導》',
      en: 'Winner — 58th Golden Horse Awards: Outstanding Taiwanese Filmmaker of the Year (Practical Special Effects)',
    },
    alt: {
      'zh-TW': '第58屆金馬獎 年度傑出電影工作者獎現場特效指導紀錄',
      en: '58th Golden Horse Awards Outstanding Taiwanese Filmmaker of the Year recognition',
    },
  },
  {
    image: tearsOnFireStillImg,
    caption: {
      'zh-TW': '入圍 第57屆 電視金鐘獎－戲劇類節目視覺特效獎《茶金》、《火神的眼淚》',
      en: 'Nominee — 57th Golden Bell Awards: Best Visual Effects for a Drama Series (Gold Leaf, Tears on Fire)',
    },
    alt: {
      'zh-TW': '《火神的眼淚》戲劇視覺特效劇照',
      en: 'Still from Tears on Fire nominated at the 57th Golden Bell Awards',
    },
  },
  {
    image: awardMainImg,
    caption: {
      'zh-TW': '榮獲 第二屆 傑出影視聽工作者－年度電影傑出工作者獎《現場特效指導》',
      en: 'Winner — 2nd Outstanding Audiovisual Workers Award: Film Worker of the Year (Practical Special Effects)',
    },
    alt: {
      'zh-TW': '陳銘澤榮獲年度電影傑出工作者獎視覺海報',
      en: 'Award tribute featuring founder Ming-Tse Chen for Practical Special Effects supervision',
    },
  },
  {
    image: youngsterStillImg,
    caption: {
      'zh-TW': '入圍 第24屆 台北電影節－傑出技術獎《少年吔－爆破設計》',
      en: 'Nominee — 24th Taipei Film Awards: Outstanding Technical Achievement (Untouchable — Pyrotechnics Design)',
    },
    alt: {
      'zh-TW': '電影《少年吔》爆破設計劇照',
      en: 'Still from Untouchable nominated for Outstanding Technical Achievement at the 24th Taipei Film Awards',
    },
  },
  {
    image: ninaWuStillImg,
    caption: {
      'zh-TW': '入圍 第22屆 台北電影節－最佳視覺效果獎《灼人秘密》',
      en: 'Nominee — 22nd Taipei Film Awards: Best Visual Effects (Nina Wu)',
    },
    alt: {
      'zh-TW': '電影《灼人秘密》視覺效果劇照',
      en: 'Still from Nina Wu nominated for Best Visual Effects at the 22nd Taipei Film Awards',
    },
  },
];

export interface ProjectRecordGroup {
  id: string;
  label: Record<Locale, string>;
  heading: Record<Locale, string>;
  items: string[];
}

export const PROJECT_RECORDS: ProjectRecordGroup[] = [
  {
    id: '2024',
    label: { 'zh-TW': '2024年', en: '2024' },
    heading: { 'zh-TW': '2024年', en: '2024' },
    items: [
      '影集《零日攻擊》',
      '影集《成名在望》',
      '影集《郵票與舒芙蕾》',
      '戲劇《願望》',
      '電影《一路狂奔》',
      '電影《所有人都在死》',
      '電影《狀況》',
      '電影《閩江船事件》',
      '廣告 黑松沙士【人生不走公式，走你熱愛的事】熱情怪獸篇',
      '舞台劇 臺中國家歌劇院-火燒人協力《Sucks in the Middle》',
      '舞台劇 高雄衛武營國家藝術文化中心-槍火光特效協力《瑪儂．雷斯考》',
      '其他 苗栗水利署演習-無人機爆',
      '其他 肆號工作室-人才培訓計畫（爆破課指導）',
    ],
  },
  {
    id: '2023',
    label: { 'zh-TW': '2023年', en: '2023' },
    heading: { 'zh-TW': '2023年', en: '2023' },
    items: [
      '影集《星空下的黑潮島嶼》',
      '電影《叫我驅魔男神》（台印電影）',
      '電影《Mr. Monster R》',
      '影集《角頭-影集版》',
      '電影《雨の中の欲情》（台日電影）',
      '電影《週末大逃亡》（台法電影）',
      '電影《餘燼》',
      '電影《還錢》',
      '電影《媽的機密任務》',
      '影集《人生清理員》',
      '影集《誰是被害者2》',
      '電影《周處除三害》',
      '電影《他馬克老闆》',
    ],
  },
  {
    id: '2022',
    label: { 'zh-TW': '2022年', en: '2022' },
    heading: { 'zh-TW': '2022年', en: '2022' },
    items: [
      '電影《查無此心》',
      '電影《關於我和鬼變成家人的那件事》',
      '電影《夢遊樂園》',
      'Netflix電影《夜叉:浴血諜戰》（台灣部份）',
      '電影《少年吔》',
      '電影《小子》',
      '影集《零下一九七》',
      '電影《塑膠花》',
      '短片《夾鬼娃》',
    ],
  },
  {
    id: '2021',
    label: { 'zh-TW': '2021年', en: '2021' },
    heading: { 'zh-TW': '2021年', en: '2021' },
    items: [
      '電視劇《火神的眼淚》',
      '電視劇《斯卡羅》',
      '電視劇《逆局》',
      '電影《角頭外傳－浪流連》',
      '電視劇《茶金》',
    ],
  },
  {
    id: '2020',
    label: { 'zh-TW': '2020年', en: '2020' },
    heading: { 'zh-TW': '2020年', en: '2020' },
    items: [
      'HBO電視劇《獵夢特工》',
      '電影《急先鋒》台灣部份',
      '電影《殺手不笨》',
      '電影《惡之畫》',
    ],
  },
  {
    id: '2019',
    label: { 'zh-TW': '2019年', en: '2019' },
    heading: { 'zh-TW': '2019年', en: '2019' },
    items: [
      '電影《灼人秘密》',
      '電影《江湖無難事》',
      '電影《亡命之徒》（台日電影）',
      '影集《罪夢者》',
      '影集《第九分局》',
      '廣告《絕地求生- 刺激戰場》',
      '影集《妖怪人間》',
    ],
  },
  {
    id: '2018',
    label: { 'zh-TW': '2018年', en: '2018' },
    heading: { 'zh-TW': '2018年', en: '2018' },
    items: [
      '電影《角頭2》',
      '電影《北風》（台韓電影/台灣部份）',
      '電影《黃金兄弟》台灣部份',
      '電影《猛蟲過江》台灣部份',
      '電影《狂徒》',
      '電影《紅衣小女孩3》',
    ],
  },
  {
    id: '2017',
    label: { 'zh-TW': '2017年', en: '2017' },
    heading: { 'zh-TW': '2017年', en: '2017' },
    items: [
      '電影《目擊者》',
      '電影《機器之血》（台灣協力）',
      '電視劇《麻醉風暴2》',
      '電影《天生不對》台灣部分',
      '電視劇《他們在畢業前一天爆炸2》',
      '電影《神秘家族》',
      '電影《健忘村》',
      '電影《報告老師！怪怪怪怪物！》',
    ],
  },
  {
    id: '2016',
    label: { 'zh-TW': '2016年', en: '2016' },
    heading: { 'zh-TW': '2016年', en: '2016' },
    items: ['電影《一路順風》'],
  },
  {
    id: '2015',
    label: { 'zh-TW': '2015年', en: '2015' },
    heading: { 'zh-TW': '2015年', en: '2015' },
    items: ['電視劇《一把青》', '電影《紅衣小女孩》'],
  },
  {
    id: 'mv',
    label: { 'zh-TW': 'MV', en: 'Music Videos' },
    heading: { 'zh-TW': 'MV', en: 'Music Videos' },
    items: [
      'aMEI張惠妹《身後 Left Behind》',
      'Mayday五月天《成名在望 Almost Famous》夢想小屋版',
      'S.H.E《十七》',
      '蔡依林 Jolin Tsai《怪美的 UGLY BEAUTY》',
      '高爾宣 OSN《So Bad》',
      '戴愛玲 Princess Ai《燒》',
      '潘瑋柏 Will Pan《第二順位.Second Opting》',
      "盧廣仲 Crowd Lu《勵志論C'mon》",
      '羅志祥 Show Lo《TRAP GAME》',
      '蕭秉治 Xiao Bing Chien《WILD》',
      "BOOM！怪物星人《You'll be There 你會在》",
    ],
  },
  {
    id: 'commercial',
    label: { 'zh-TW': '廣告', en: 'Commercials' },
    heading: { 'zh-TW': '廣告', en: 'Commercials' },
    items: [
      '可樂果 - Its My Way（瘦子）',
      '絕地求生 - 刺激戰場（吳京）',
      '使命招喚手遊版 - 每一局都是槍戰大片（周杰倫）',
      '暗黑破壞神 -「蒙福之母莉莉絲篇」（蔡依林）',
      'Acer Predator Triton 700 電競筆電「戰友篇」廣告影片（火燒人）',
    ],
  },
];
