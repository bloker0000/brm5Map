// the artwork behind the preloader, the map and the mission library.
// BG_CREDITS is indexed in lockstep with BG_IMAGES, so the two stay the same length

export const BG_IMAGES = [
  '/BG/BG1.jpeg',
  '/BG/BG2.png',
  '/BG/BG3.png',
  '/BG/BG4.png',
  '/BG/BG5.jpg',
  '/BG/BG6.png',
  '/BG/BG7.jpeg',
  '/BG/BG8.png',
  '/BG/BG9.png',
  '/BG/BG10.png',
  '/BG/BG11.png',
  '/BG/BG12.png',
  '/BG/BG13.png',
  '/BG/BG14.png',
  '/BG/BG15.png',
  '/BG/BG16.png',
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
