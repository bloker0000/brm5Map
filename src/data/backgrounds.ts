// the artwork behind the preloader, the map and the mission library.
// BG_CREDITS is indexed in lockstep with BG_IMAGES, so the two stay the same length

export const BG_IMAGES = [
  '/BG/BG1.webp',
  '/BG/BG2.webp',
  '/BG/BG3.webp',
  '/BG/BG4.webp',
  '/BG/BG5.webp',
  '/BG/BG6.webp',
  '/BG/BG7.webp',
  '/BG/BG8.webp',
  '/BG/BG9.webp',
  '/BG/BG10.webp',
  '/BG/BG11.webp',
  '/BG/BG12.webp',
  '/BG/BG13.webp',
  '/BG/BG14.webp',
  '/BG/BG15.webp',
  '/BG/BG16.webp',
];

export interface BgCredit {
  name: string;
  url: string | null;
}

export const BG_CREDITS: BgCredit[] = [
  { name: 'Platinum Five', url: 'https://www.roblox.com/communities/4668709/PLATINUM-FIVE#!/about' },
  { name: 'MentalShocked', url: 'https://www.reddit.com/user/MentalShocked/' },
  { name: 'buymechickensalt', url: 'https://x.com/BuymetheWeeb' },
  { name: 'buymechickensalt', url: 'https://x.com/BuymetheWeeb' },
  { name: 'rinchantea', url: 'https://x.com/RinChanTea' },
  { name: 'mister.roztov', url: 'https://sites.google.com/view/roztovportfolio?usp=sharing' },
  { name: 'postal__pal', url: 'https://www.roblox.com/users/1538934843/profile?friendshipSourceType=PlayerSearch' },
  { name: 'basically_gdg', url: null },
  { name: 'a5t3r1k', url: 'https://www.roblox.com/users/1458471315/profile?friendshipSourceType=PlayerSearch' },
  { name: 'buymechickensalt', url: 'https://x.com/BuymetheWeeb' },
  { name: 'ryz_vik', url: null },
  { name: 'docc_a', url: null },
  { name: 'ala_koli', url: 'https://x.com/ala_koli' },
  { name: 'kenemony', url: null },
  { name: 'a5t3r1k', url: 'https://www.roblox.com/users/1458471315/profile?friendshipSourceType=PlayerSearch' },
  { name: 'postal__pal', url: 'https://www.roblox.com/users/1538934843/profile?friendshipSourceType=PlayerSearch' },
];

export const randomBgIndex = () => Math.floor(Math.random() * BG_IMAGES.length);
