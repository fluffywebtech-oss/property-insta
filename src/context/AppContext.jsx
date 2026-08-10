import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { allProperties as staticProperties, allReels as staticReels, formatPriceIndian } from '../data';
import { supabase } from '../lib/supabase';
import { computePropScore } from '../utils/propScore';

// ============================================================================
// Derive a canonical city from a free-text location string
// ============================================================================
export function deriveCity(loc = '') {
  const l = (loc || '').toLowerCase();
  if (l.includes('faridabad')) return 'Faridabad';
  if (l.includes('ghaziabad') || l.includes('indirapuram') || l.includes('crossings') || l.includes('raj nagar')) return 'Ghaziabad';
  if (l.includes('greater noida') || l.includes('noida extension') || l.includes('noida west')) return 'Greater Noida';
  if (l.includes('noida') || l.includes('wish town') || l.includes('jaypee')) return 'Noida';
  // Other metros (Navi Mumbai must be checked before Mumbai)
  if (l.includes('navi mumbai') || l.includes('panvel')) return 'Navi Mumbai';
  if (l.includes('mumbai')) return 'Mumbai';
  if (l.includes('bangalore') || l.includes('bengaluru')) return 'Bangalore';
  if (l.includes('hyderabad')) return 'Hyderabad';
  if (l.includes('pune')) return 'Pune';
  if (l.includes('ahmedabad')) return 'Ahmedabad';
  if (l.includes('kolkata')) return 'Kolkata';
  if (l.includes('chandigarh') || l.includes('mohali')) return 'Chandigarh';
  if (l.includes('lucknow')) return 'Lucknow';
  if (l.includes('ludhiana')) return 'Ludhiana';
  if (l.includes('indore')) return 'Indore';
  if (l.includes('vrindavan') || l.includes('mathura')) return 'Vrindavan';
  // "Dwarka Expressway" (any abbreviation: exp / expwy / expressway) is a GURGAON corridor
  const isDwarkaExpwy = l.includes('dwarka') && /\bexp/.test(l);
  // Delhi — only the bare "Dwarka" sub-city (e.g., "Sector 23, Dwarka"), NOT the Gurgaon expressway
  if (l.includes('new delhi') || (l.includes('dwarka') && !isDwarkaExpwy)) return 'Delhi';
  // Gurgaon / Gurugram micro-markets
  if (
    isDwarkaExpwy ||
    l.includes('gurgaon') || l.includes('gurugram') || l.includes('golf course') ||
    l.includes('spr') || l.includes('southern peripheral') || l.includes('sohna') ||
    l.includes('dlf') || l.includes('sushant') ||
    l.includes('nirvana') || l.includes('cyber') || l.includes('mg road') || l.includes('manesar')
  ) return 'Gurgaon';
  return 'Other';
}

// ============================================================================
// Unique listing imagery — 80 distinct, verified real-estate photos
// (Unsplash, free license). Every listing gets a unique image SET (distinct
// cover + gallery) so no two listings look alike and covers never repeat
// within view. Replaces the handful of images that were reused everywhere.
// ============================================================================
const LISTING_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1433832597046-4f10e10ac764?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1448630360428-65456885c650?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1459767129954-1b1c1f9b9ace?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1486718448742-163732cd1544?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1496564203457-11bb12075d90?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1497604401993-f2e922e5cb0a?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1502005097973-6a7082348e28?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1512699355324-f07e3106dae5?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1551361415-69c87624334f?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1554435493-93422e8220c8?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1564013434775-f71db0030976?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1583845112203-29329902332e?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1597211833712-5e41faa202ea?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1598228723793-52759bba239c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600047509782-20d39509f26d?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1605146768851-eda79da39897?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1606744888344-493238951221?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1612637968894-660373e23b03?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1617104678098-de229db51175?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1626178793926-22b28830aa30?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&h=675&fit=crop&q=75',
  'https://images.unsplash.com/photo-1633505899118-4ca6bd143043?w=900&h=675&fit=crop&q=75',
];

// Pexels CDN helper — free license, verified property photos
const PEX = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=675&fit=crop`;

// Extra verified Pexels property images (apartments, buildings, interiors, villas)
const PEXELS_APARTMENT = [
  PEX(1546168), PEX(1396122), PEX(323780), PEX(271624), PEX(209296),
  PEX(462235), PEX(1370704), PEX(1571460), PEX(1396132), PEX(2102587),
  PEX(1571459), PEX(323705), PEX(1029599), PEX(2440008), PEX(2059535),
  PEX(280229), PEX(280221), PEX(290275), PEX(534151), PEX(534174),
  PEX(1643389), PEX(443383), PEX(443380), PEX(443378), PEX(443373),
  // second batch — buildings + interiors
  PEX(2079234), PEX(1115804), PEX(2462015), PEX(271816), PEX(1571463),
  PEX(1571468), PEX(1571470), PEX(2079246), PEX(2079249), PEX(4119832),
  PEX(4119833), PEX(3935350), PEX(3935352), PEX(8089087), PEX(8146322),
  PEX(1879061), PEX(276724), PEX(276551), PEX(2030037), PEX(2089698),
];
const PEXELS_VILLA = [
  PEX(1396122), PEX(209296), PEX(1370704), PEX(1396132), PEX(2102587),
  PEX(1029599), PEX(280229), PEX(280221), PEX(1643389), PEX(1643384),
  // second batch — houses
  PEX(1438832), PEX(2476632), PEX(3935333), PEX(5997993), PEX(6585764),
  PEX(7031607), PEX(7061662), PEX(106399), PEX(210617), PEX(271643),
];
const PEXELS_PENTHOUSE = [
  PEX(1571459), PEX(534151), PEX(2059535), PEX(462235), PEX(1396127),
  PEX(276551), PEX(1879061), PEX(2079246),
];

// Pool indices grouped by what the photo actually shows, so imagery MATCHES
// the listing's property type. (Indices 82 & 96 are intentionally excluded —
// they aren't property photos.)
const POOL_BY_TYPE = {
  // standalone houses / villas / cottages / mansions
  villa: [0, 6, 9, 18, 26, 27, 28, 30, 45, 46, 50, 51, 52, 55, 56, 58, 59, 61, 62, 63, 64, 65, 72, 73, 74, 76, 77, 79, 81, 84, 85, 86, 87, 91, 92],
  // premium / luxury interiors
  penthouse: [23, 60, 67, 68, 69, 71, 89, 94],
  // glass towers / commercial-scale buildings
  commercial: [13, 34],
  // highrises, apartment blocks, city + residential interiors
  apartment: [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 29, 31, 32, 33, 48, 53, 54, 57, 66, 70, 75, 78, 80, 83, 88, 90, 93, 95, 97, 98],
};

function poolKeyForType(t = '') {
  const s = (t || '').toLowerCase();
  if (s.includes('villa')) return 'villa';
  if (s.includes('penthouse')) return 'penthouse';
  if (s.includes('commercial') || s.includes('office') || s.includes('shop') || s.includes('retail')) return 'commercial';
  return 'apartment';
}

// A listing has its OWN real photos when its images aren't the generic stock
// placeholders (i.e. uploaded to storage or set to any non-Unsplash URL).
function hasRealProjectImages(p) {
  const imgs = p.media || p.images || [];
  return imgs.length > 0 && imgs.some(u => u && !/images\.unsplash\.com/i.test(u));
}

// Combined pools: Unsplash (indexed) + Pexels (direct URLs)
const COMBINED_POOL = {
  apartment: [
    ...POOL_BY_TYPE.apartment.map(i => LISTING_IMAGE_POOL[i]),
    ...PEXELS_APARTMENT,
  ],
  villa: [
    ...POOL_BY_TYPE.villa.map(i => LISTING_IMAGE_POOL[i]),
    ...PEXELS_VILLA,
  ],
  penthouse: [
    ...POOL_BY_TYPE.penthouse.map(i => LISTING_IMAGE_POOL[i]),
    ...PEXELS_PENTHOUSE,
  ],
  commercial: POOL_BY_TYPE.commercial.map(i => LISTING_IMAGE_POOL[i]),
};

// Curated project-photo overrides — force specific listings to use real,
// committed images regardless of what the DB row carries. Runs before image
// assignment so these always win over Supabase placeholders / stock fallbacks.
// Files live under /public/projects/... and ship with the build.
const PROJECT_IMAGE_OVERRIDES = [
  {
    match: (p) => /ashiana\s*aaroham/i.test(p.title || '') || (p.builder === 'Ashiana Housing' && /aaroham/i.test(p.title || '')),
    images: [
      '/projects/ashiana-aaroham/exterior-1.webp',
      '/projects/ashiana-aaroham/exterior-2.webp',
      '/projects/ashiana-aaroham/reception.webp',
      '/projects/ashiana-aaroham/gym.webp',
      '/projects/ashiana-aaroham/classroom.webp',
      '/projects/ashiana-aaroham/dance-room.webp',
      '/projects/ashiana-aaroham/squash.webp',
      '/projects/ashiana-aaroham/football.webp',
      '/projects/ashiana-aaroham/kids-1.webp',
      '/projects/ashiana-aaroham/kids-2.webp',
      '/projects/ashiana-aaroham/kids-3.webp',
    ],
  },
  {
    // The Omaxe State, Dwarka (matches both the DB "Omaxe State Dwarka" listing
    // and the static "Omaxe The State" entry).
    match: (p) => /omaxe\s*(the\s*)?state/i.test(p.title || ''),
    images: [
      '/projects/omaxe-state/aerial.jpg',
      '/projects/omaxe-state/fashion-street.webp',
      '/projects/omaxe-state/east-gate.webp',
      '/projects/omaxe-state/ground-floor.webp',
      '/projects/omaxe-state/retail-first-floor.webp',
      '/projects/omaxe-state/master-layout.webp',
    ],
  },
  {
    // Emaar Serenity Hills, Sector 86 (covers any DB row for the project too).
    match: (p) => /emaar\s*serenity(\s*hills)?/i.test(p.title || '') || /serenity\s*hills/i.test(p.title || ''),
    images: [
      '/projects/emaar-serenity-hills/towers-night.webp',
      '/projects/emaar-serenity-hills/front-facade.webp',
      '/projects/emaar-serenity-hills/central-park.webp',
      '/projects/emaar-serenity-hills/infinity-pool.webp',
      '/projects/emaar-serenity-hills/clubhouse.webp',
      '/projects/emaar-serenity-hills/master-bedroom.webp',
      '/projects/emaar-serenity-hills/floor-plan-3bhk.webp',
      '/projects/emaar-serenity-hills/floor-plan-4bhk.webp',
      '/projects/emaar-serenity-hills/master-plan.webp',
    ],
  },
  {
    // Ganga Anantam 85, Sector 85 (covers the DB row for id 20 too).
    match: (p) => /anantam\s*85|ganga\s*anantam/i.test(p.title || ''),
    images: [
      '/projects/ganga-anantam-85/towers-hero.webp',
      '/projects/ganga-anantam-85/courtyard.webp',
      '/projects/ganga-anantam-85/night-tower.webp',
      '/projects/ganga-anantam-85/infinity-pool.webp',
      '/projects/ganga-anantam-85/yoga-deck.webp',
      '/projects/ganga-anantam-85/gym.webp',
      '/projects/ganga-anantam-85/fine-dining.webp',
      '/projects/ganga-anantam-85/bar-restaurant.webp',
      '/projects/ganga-anantam-85/floor-guide.webp',
      '/projects/ganga-anantam-85/site-plan.webp',
      '/projects/ganga-anantam-85/floor-plan-3bhk.webp',
      '/projects/ganga-anantam-85/floor-plan-4bhk.webp',
      '/projects/ganga-anantam-85/location-map.webp',
    ],
  },
  {
    // Central Park BelaPerla, Sector 48 (covers any DB row for the project too).
    match: (p) => /belaperla|bela\s*perla/i.test(p.title || ''),
    images: [
      '/projects/belaperla/towers-hero.webp',
      '/projects/belaperla/lobby-entrance.webp',
      '/projects/belaperla/gazebo-garden.webp',
      '/projects/belaperla/gym.webp',
      '/projects/belaperla/balcony-lounge.webp',
      '/projects/belaperla/terrace-golf-view.webp',
      '/projects/belaperla/clubhouse-pool.webp',
      '/projects/belaperla/resort-lobby.webp',
      '/projects/belaperla/floor-plate-plan.webp',
      '/projects/belaperla/studio-plan.webp',
      '/projects/belaperla/location-map.png',
    ],
  },
];
function applyImageOverrides(p) {
  const o = PROJECT_IMAGE_OVERRIDES.find((ov) => ov.match(p));
  return o ? { ...p, images: o.images, media: o.images, thumbnail: o.images[0] } : p;
}

// Real, project-specific photos (uploaded via admin → Supabase Storage)
// ALWAYS win. Only listings without real photos get a type-MATCHED unique set.
function assignUniqueImages(list) {
  const counters = { villa: 0, penthouse: 0, commercial: 0, apartment: 0 };
  return list.map((raw) => {
    const p = applyImageOverrides(raw);
    if (hasRealProjectImages(p)) {
      const imgs = (p.media && p.media.length ? p.media : p.images) || [];
      return { ...p, media: imgs, images: imgs, thumbnail: imgs[0] };
    }
    const key = poolKeyForType(p.type);
    const pool = COMBINED_POOL[key];
    const n = counters[key]++;
    // Cover = unique slot; gallery = 3 more picked with spread so no repeats
    const cover = pool[n % pool.length];
    const gallery = [];
    let step = 1;
    while (gallery.length < 3) {
      const cand = pool[(n + step * Math.ceil(pool.length / 4)) % pool.length];
      if (cand !== cover && !gallery.includes(cand)) gallery.push(cand);
      step++;
      if (step > pool.length * 2) break;
    }
    const media = [cover, ...gallery];
    return { ...p, media, images: media, thumbnail: media[0] };
  });
}

// ============================================================================
// Property mapping: snake_case (DB) → camelCase (React)
// ============================================================================
function mapDBProperty(db) {
  return {
    id: db.id,
    city: deriveCity(db.location),
    title: db.title,
    location: db.location,
    price: db.price,
    bedrooms: db.beds,
    bathrooms: db.baths,
    area: db.sqft,
    type: db.type ? db.type.charAt(0).toUpperCase() + db.type.slice(1) : 'Apartment',
    status: db.status === 'sale' ? 'For Sale' : db.status === 'rent' ? 'For Rent' : db.status,
    builder: db.builder,
    rera: !!db.rera_id,
    reraId: db.rera_id,
    possession: db.possession_status,
    possessionStatus: db.possession_status,
    floor: db.floor,
    furnishing: db.furnishing,
    emiEstimate: db.emi_estimate,
    bankOffers: db.bank_offers,
    media: db.images || [],
    images: db.images || [],
    amenities: (db.amenities || []).map(a => {
      const amenityMap = { pool: 'Pool', gym: 'Gym', parking: 'Parking', garden: 'Garden', security: 'Security', smartHome: 'Smart Home' };
      return amenityMap[a] || (typeof a === 'string' ? a.charAt(0).toUpperCase() + a.slice(1) : a);
    }),
    featured: db.featured,
    hot: db.hot,
    trending: db.hot,
    badge: db.hot ? 'Hot Deal' : (db.featured ? 'Featured' : null),
    badgeType: db.hot ? 'hot' : (db.featured ? 'featured' : ''),
    openHouse: db.open_house,
    facing: db.facing || 'Not Set',
    parking: db.parking || 'None',
    pricePerSqft: db.price_per_sqft || Math.round(db.price / (db.sqft || 1)),
    verified: db.verified,
    views: db.views || 0,
    description: db.description,
    agent: {
      id: db.agent_id || `agent-${db.id}`,
      name: db.agent_name || 'Agent',
      avatar: db.agent_avatar || 'https://i.pravatar.cc/150?img=1',
      rating: db.agent_rating || 4.0,
      sales: db.agent_sales || 0,
      phone: db.agent_phone || '',
      email: db.agent_email || '',
    },
    agentAvatar: db.agent_avatar || 'https://i.pravatar.cc/150?img=1',
    postDate: db.post_date || 'Recently',
    comments: db.comments || 0,
    shares: db.shares || 0,
    lat: db.lat,
    lng: db.lng,
    neighborhood: Array.isArray(db.neighborhood) ? db.neighborhood : ['Schools: N/A', 'Transit: N/A', 'Walk Score: 0/100', 'Crime Rate: N/A'],
    floorPlan: db.floor_plan,
    developerLogo: db.developer_logo || '',
    developerWebsite: db.developer_website || '',
    age: db.age || 'New',
    mediaAspectRatio: db.media_aspect_ratio || '4/3',
    listingStatus: db.listing_status || db.possession_status || 'Ready to Move',
    propScore: computePropScore({
      price: db.price,
      sqft: db.sqft,
      builder: db.builder,
      location: db.location,
      type: db.type,
      possessionStatus: db.possession_status,
      hot: db.hot,
      amenities: db.amenities || [],
      neighborhood: db.neighborhood,
    }),
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

function mapDBReel(db) {
  return {
    id: db.id,
    propertyId: db.property_id,
    title: db.title,
    location: db.location,
    price: db.price,
    category: db.category,
    video: db.video,
    thumbnail: db.thumbnail,
    description: db.description,
    views: db.views || 0,
    likes: db.likes || 0,
    status: db.status,
    duration: db.duration || '',
    tags: db.tags || [],
    agentName: db.agent_name,
    builder: db.builder,
    reraId: db.rera_id,
    possessionDate: db.possession_date,
    sqft: db.sqft,
    furnishing: db.furnishing,
    floor: db.floor,
    emiEstimate: db.emi_estimate,
    bankOffers: db.bank_offers,
    created_at: db.created_at,
  };
}

// ============================================================================
// Merge Supabase properties with static fallback
// ============================================================================
function mergeWithStatic(supabaseProps, staticProps) {
  const dbIds = new Set(supabaseProps.map(p => p.id));
  const merged = [...supabaseProps];
  staticProps.forEach(sp => {
    if (!dbIds.has(sp.id)) {
      merged.push(sp);
    }
  });
  return merged;
}

// ============================================================================
// Context
// ============================================================================
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Supabase availability flag
  const [dbReady, setDbReady] = useState(false);

  // View management — land on the blog when deep-linked via /blog or /blog/{slug}
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window === 'undefined') return 'feed';
    const path = window.location.pathname;
    if (/^\/blog(\/|$)/.test(path)) return 'blog';
    if (/^\/ameya-sapphire(-82a)?(\/|$)/.test(path)) return 'ameya-sapphire';
    if (/^\/builder-desk(\/|$)/.test(path)) return 'builder-desk';
    return 'feed';
  });
  // Which builder's microsite is being shown (set when `currentView === 'builder'`)
  const [selectedBuilder, setSelectedBuilder] = useState(null);

  // Convenience: navigate to a builder's dedicated page.
  const openBuilder = useCallback((name) => {
    setSelectedBuilder(name);
    setCurrentView('builder');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Which property's dedicated page is being shown (set when `currentView === 'property'`).
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

  // Open the full project page for a property. Records a recent view + scrolls
  // to top. Use this instead of opening the modal for a richer experience.
  const openProperty = useCallback((id) => {
    setSelectedPropertyId(id);
    setCurrentView('property');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Properties — start with static data, upgrade to Supabase when available
  const [allProperties, setAllProperties] = useState(() => assignUniqueImages(staticProperties));
  const [allReels, setAllReels] = useState(staticReels);

  // ==========================================================================
  // Supabase Real-Time Subscription
  // ==========================================================================
  useEffect(() => {
    if (!supabase) {
      console.warn('[PropertyInsta] Supabase not configured — using static data only');
      return;
    }

    let propertiesChannel;
    let reelsChannel;

    async function initSupabase() {
      try {
        console.log('[PropertyInsta] Fetching properties & reels from Supabase...');
        // 1. Fetch initial data
        const [{ data: props, error: propsErr }, { data: reels, error: reelsErr }] = await Promise.all([
          supabase.from('properties').select('*').order('id', { ascending: false }),
          supabase.from('reels').select('*').order('id', { ascending: false }),
        ]);

        if (propsErr) {
          console.error('[PropertyInsta] Properties fetch error:', propsErr.message);
        }
        if (reelsErr) {
          console.error('[PropertyInsta] Reels fetch error:', reelsErr.message);
        }

        if (!propsErr && props) {
          console.log('[PropertyInsta] Loaded ' + props.length + ' properties from Supabase');
          const mapped = props.map(mapDBProperty);
          const merged = mergeWithStatic(mapped, staticProperties);
          setAllProperties(assignUniqueImages(merged));
          setDbReady(true);
        }
        if (!reelsErr && reels) {
          console.log('[PropertyInsta] Loaded ' + reels.length + ' reels from Supabase');
          const mapped = reels.map(mapDBReel);
          const merged = mergeWithStatic(mapped, staticReels);
          setAllReels(merged);
        }
      } catch (err) {
        console.error('[PropertyInsta] initSupabase failed:', err);
      }

      // 2. Subscribe to real-time changes on properties
      propertiesChannel = supabase
        .channel('properties-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'properties' },
          (payload) => {
            setAllProperties(prev => {
              const updated = [...prev];
              if (payload.eventType === 'INSERT') {
                const newProp = mapDBProperty(payload.new);
                updated.unshift(newProp);
              } else if (payload.eventType === 'UPDATE') {
                const idx = updated.findIndex(p => p.id === payload.new.id);
                if (idx !== -1) updated[idx] = mapDBProperty(payload.new);
              } else if (payload.eventType === 'DELETE') {
                const idx = updated.findIndex(p => p.id === payload.old.id);
                if (idx !== -1) updated.splice(idx, 1);
              }
              return assignUniqueImages(mergeWithStatic(updated, staticProperties));
            });
          }
        )
        .subscribe();

      // 3. Subscribe to real-time changes on reels
      reelsChannel = supabase
        .channel('reels-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reels' },
          (payload) => {
            setAllReels(prev => {
              const updated = [...prev];
              if (payload.eventType === 'INSERT') {
                updated.unshift(mapDBReel(payload.new));
              } else if (payload.eventType === 'UPDATE') {
                const idx = updated.findIndex(r => r.id === payload.new.id);
                if (idx !== -1) updated[idx] = mapDBReel(payload.new);
              } else if (payload.eventType === 'DELETE') {
                const idx = updated.findIndex(r => r.id === payload.old.id);
                if (idx !== -1) updated.splice(idx, 1);
              }
              return mergeWithStatic(updated, staticReels);
            });
          }
        )
        .subscribe();
    }

    initSupabase();

    return () => {
      if (propertiesChannel) supabase.removeChannel(propertiesChannel);
      if (reelsChannel) supabase.removeChannel(reelsChannel);
    };
  }, []);

  // ==========================================================================
  // Dark mode
  // ==========================================================================
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('propertyInsta_dark') === 'true';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('propertyInsta_dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);

  // ==========================================================================
  // Filters
  // ==========================================================================
  const [filters, setFilters] = useState({
    search: '', city: '', builder: '', priceRange: '', priceMin: '', priceMax: '',
    propertyType: [], bedrooms: null, amenities: [],
    listingStatus: [], sortBy: 'newest'
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const [currentPage, setCurrentPage] = useState(1);
  const propsPerPage = 24;

  const sortProperties = useCallback((props) => {
    const sorted = [...props];
    switch (filters.sortBy) {
      case 'price_asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price_desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'newest': sorted.sort((a, b) => b.id - a.id); break;
      case 'popular': sorted.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      case 'area_desc': sorted.sort((a, b) => (b.area || 0) - (a.area || 0)); break;
      default: break;
    }
    return sorted;
  }, [filters.sortBy]);

  const filteredProperties = useMemo(() => {
    let result = [...allProperties];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q)
      );
    }
    if (filters.city) {
      result = result.filter(p => (p.city || deriveCity(p.location)) === filters.city);
    }
    if (filters.builder) {
      result = result.filter(p => p.builder === filters.builder);
    }
    if (filters.priceRange) {
      const priceRanges = {
        'Under ₹30L': [0, 3000000],
        '₹30L-60L': [3000000, 6000000],
        '₹60L-1Cr': [6000000, 10000000],
        '₹1Cr-2Cr': [10000000, 20000000],
        '₹2Cr-5Cr': [20000000, 50000000],
        '₹5Cr+': [50000000, Infinity],
      };
      const [min, max] = priceRanges[filters.priceRange] || [0, Infinity];
      result = result.filter(p => p.price >= min && p.price <= max);
    }
    const minPrice = filters.priceMin ? Number(filters.priceMin) : 0;
    const maxPrice = filters.priceMax ? Number(filters.priceMax) : Infinity;
    if (minPrice > 0) result = result.filter(p => p.price >= minPrice);
    if (maxPrice < Infinity) result = result.filter(p => p.price <= maxPrice);
    if (filters.propertyType.length) result = result.filter(p => filters.propertyType.includes(p.type));
    if (filters.bedrooms !== null) result = result.filter(p => p.bedrooms === filters.bedrooms);
    if (filters.amenities.length) result = result.filter(p => filters.amenities.every(a => (p.amenities || []).includes(a)));
    if (filters.listingStatus.length) result = result.filter(p => filters.listingStatus.includes(p.listingStatus));
    return sortProperties(result);
  }, [allProperties, filters, sortProperties]);

  const displayedProperties = useMemo(() => {
    return filteredProperties.slice(0, currentPage * propsPerPage);
  }, [filteredProperties, currentPage]);

  const loadMore = useCallback(() => {
    if (currentPage * propsPerPage < filteredProperties.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, filteredProperties.length]);

  const hasMore = currentPage * propsPerPage < filteredProperties.length;
  const filteredCount = filteredProperties.length;

  // ==========================================================================
  // Saved / Liked
  // ==========================================================================
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('propertyInsta_saved') || '[]'); } catch { return []; }
  });
  const [likedIds, setLikedIds] = useState([]);

  useEffect(() => {
    localStorage.setItem('propertyInsta_saved', JSON.stringify(savedIds));
  }, [savedIds]);

  const toggleSave = useCallback((id) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);
  const toggleLike = useCallback((id) => {
    setLikedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  // ==========================================================================
  // Recently viewed
  // ==========================================================================
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('propertyInsta_recent') || '[]'); } catch { return []; }
  });
  const addRecentView = useCallback((propId) => {
    setRecentlyViewed(prev => {
      const updated = [propId, ...prev.filter(id => id !== propId)].slice(0, 8);
      localStorage.setItem('propertyInsta_recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ==========================================================================
  // Compare
  // ==========================================================================
  const [compareIds, setCompareIds] = useState([]);
  const toggleCompare = useCallback((id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  // ==========================================================================
  // Notifications
  // ==========================================================================
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Price drop alert: Skyline Tower down 5%", time: "10 min ago", icon: "fa-tag", read: false },
    { id: 2, text: "New property matching your search: Lakeside Retreat", time: "1 hour ago", icon: "fa-home", read: false },
    { id: 3, text: "Your scheduled tour for Penthouse Executive is confirmed", time: "3 hours ago", icon: "fa-calendar-check", read: false },
    { id: 4, text: "Sarah Kim accepted your connection request", time: "5 hours ago", icon: "fa-user-check", read: true },
    { id: 5, text: "Compare ready: 3 saved properties analyzed", time: "1 day ago", icon: "fa-balance-scale", read: true },
  ]);
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const markNotifRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  // ==========================================================================
  // Modal state
  // ==========================================================================
  const [activeModal, setActiveModal] = useState(null);
  const openModal = useCallback((type, data = null) => setActiveModal({ type, data }), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // ==========================================================================
  // Reels category
  // ==========================================================================
  const [activeReelCategory, setActiveReelCategory] = useState('All');

  // ==========================================================================
  // Admin: CRUD helpers exposed via context
  // ==========================================================================
  const adminAddProperty = useCallback(async (property) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.from('properties').insert({
      title: property.title,
      location: property.location,
      price: property.price,
      beds: property.beds || property.bedrooms,
      baths: property.baths || property.bathrooms,
      sqft: property.sqft || property.area,
      type: property.type?.toLowerCase(),
      status: property.status,
      builder: property.builder,
      rera_id: property.reraId,
      possession_status: property.possessionStatus || property.possession,
      floor: property.floor,
      furnishing: property.furnishing,
      emi_estimate: property.emiEstimate,
      bank_offers: property.bankOffers,
      images: property.images || property.media,
      amenities: property.amenities,
      featured: property.featured,
      hot: property.hot,
      open_house: property.openHouse,
      facing: property.facing,
      parking: property.parking,
      price_per_sqft: property.pricePerSqft,
      verified: property.verified,
      views: property.views || 0,
      description: property.description,
      agent_id: property.agent?.id,
      agent_name: property.agent?.name,
      agent_avatar: property.agent?.avatar,
      agent_rating: property.agent?.rating,
      agent_sales: property.agent?.sales,
      agent_phone: property.agent?.phone,
      agent_email: property.agent?.email,
      post_date: property.postDate,
      lat: property.lat,
      lng: property.lng,
      neighborhood: property.neighborhood,
      floor_plan: property.floorPlan,
      trending: property.trending,
      age: property.age,
      media_aspect_ratio: property.mediaAspectRatio,
      listing_status: property.listingStatus,
    }).select().single();
    if (error) throw error;
    return data;
  }, []);

  const adminUpdateProperty = useCallback(async (id, updates) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('properties').update(updates).eq('id', id);
    if (error) throw error;
  }, []);

  const adminDeleteProperty = useCallback(async (id) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw error;
  }, []);

  const toggleSearchPanel = useCallback(() => {
    const panel = document.querySelector('.ig-search-panel');
    if (panel) panel.classList.toggle('hidden');
  }, []);

  const value = {
    currentView, setCurrentView,
    selectedBuilder, openBuilder,
    selectedPropertyId, openProperty,
    darkMode, toggleDarkMode,
    filters, setFilters,
    filteredProperties, displayedProperties,
    allProperties, allReels,
    dbReady,
    currentPage, loadMore, hasMore, filteredCount,
    savedIds, toggleSave,
    likedIds, toggleLike,
    recentlyViewed, addRecentView,
    compareIds, toggleCompare, setCompareIds,
    notifications, unreadCount, markNotifRead,
    activeModal, openModal, closeModal, setActiveModal,
    activeReelCategory, setActiveReelCategory,
    toggleSearchPanel,
    sidebarOpen, toggleSidebar,
    // Admin CRUD
    adminAddProperty, adminUpdateProperty, adminDeleteProperty,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export default AppContext;