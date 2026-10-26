// api/_lib/regions.js
// One entry per updates agent. Each agent:
//   - searches and reads its own OFFICIAL domains (subdomains included, so
//     "vic.gov.au" also covers workingwithchildren.vic.gov.au, ccyp.vic.gov.au,
//     etc.). Government regulators and the state sporting associations clubs
//     are affiliated to. Only these can be cited as a source.
//   - can also read its local NEWS outlets (plus the national ones below), but
//     only as leads: anything it reports must be backed by an official page.
//   - diffs its own watched pages against last week's snapshot,
//   - reads its own Google News queries (leads only).

// News outlets every agent may read for leads, on top of its own local outlets.
export const NATIONAL_NEWS_DOMAINS = ['abc.net.au', 'sbs.com.au', 'theconversation.com'];

// National sport websites that also host state bodies' pages (e.g. Tennis
// Victoria lives at tennis.com.au/vic, AFL Tasmania at play.afl), so every
// state agent can read them.
const SHARED_SPORT_DOMAINS = [
  'afl.com.au', 'play.afl', 'tennis.com.au', 'golf.org.au', 'cricket.com.au', 'nrl.com', 'playnrl.com',
  'playrugbyleague.com', 'australia.rugby', 'rugby.com.au', 'footballaustralia.com.au', 'australia.basketball'
];

// The state body for each of the 9 sports on the Updates page, in every state.
// "site" is where its pages live (a path means it sits inside a national site).
const STATE_SPORT_BODIES = {
  VIC: [
    { sport: 'AFL', name: 'AFL Victoria', site: 'aflvic.com.au' },
    { sport: 'Netball', name: 'Netball Victoria', site: 'vic.netball.com.au' },
    { sport: 'Cricket', name: 'Cricket Victoria', site: 'cricketvictoria.com.au' },
    { sport: 'Soccer', name: 'Football Victoria', site: 'footballvictoria.com.au' },
    { sport: 'Rugby League', name: 'NRL Victoria', site: 'nrl.com' },
    { sport: 'Rugby Union', name: 'Rugby Victoria', site: 'vic.rugby' },
    { sport: 'Basketball', name: 'Basketball Victoria', site: 'basketballvictoria.com.au' },
    { sport: 'Tennis', name: 'Tennis Victoria', site: 'tennis.com.au/vic' },
    { sport: 'Golf', name: 'Golf Australia (Victoria)', site: 'golf.org.au' }
  ],
  NSW: [
    { sport: 'AFL', name: 'AFL NSW/ACT', site: 'aflnswact.com.au' },
    { sport: 'Netball', name: 'Netball NSW', site: 'nsw.netball.com.au' },
    { sport: 'Cricket', name: 'Cricket NSW', site: 'cricketnsw.com.au' },
    { sport: 'Soccer', name: 'Football NSW', site: 'footballnsw.com.au' },
    { sport: 'Soccer', name: 'Northern NSW Football', site: 'northernnswfootball.com.au' },
    { sport: 'Rugby League', name: 'NSW Rugby League', site: 'nswrl.com.au' },
    { sport: 'Rugby Union', name: 'NSW Rugby', site: 'nsw.rugby' },
    { sport: 'Basketball', name: 'Basketball NSW', site: 'bnsw.com.au' },
    { sport: 'Tennis', name: 'Tennis NSW', site: 'tennis.com.au/nsw' },
    { sport: 'Golf', name: 'Golf NSW', site: 'golfnsw.org.au' }
  ],
  QLD: [
    { sport: 'AFL', name: 'AFL Queensland', site: 'aflq.com.au' },
    { sport: 'Netball', name: 'Netball Queensland', site: 'qld.netball.com.au' },
    { sport: 'Cricket', name: 'Queensland Cricket', site: 'qldcricket.com.au' },
    { sport: 'Soccer', name: 'Football Queensland', site: 'footballqueensland.com.au' },
    { sport: 'Rugby League', name: 'Queensland Rugby League', site: 'qrl.com.au' },
    { sport: 'Rugby Union', name: 'Queensland Rugby Union', site: 'qld.rugby' },
    { sport: 'Basketball', name: 'Basketball Queensland', site: 'queensland.basketball' },
    { sport: 'Tennis', name: 'Tennis Queensland', site: 'tennis.com.au/qld' },
    { sport: 'Golf', name: 'Golf Australia (Queensland)', site: 'golf.org.au' }
  ],
  SA: [
    { sport: 'AFL', name: 'SANFL', site: 'sanfl.com.au' },
    { sport: 'Netball', name: 'Netball SA', site: 'sa.netball.com.au' },
    { sport: 'Cricket', name: 'SACA', site: 'saca.com.au' },
    { sport: 'Soccer', name: 'Football SA', site: 'footballsa.com.au' },
    { sport: 'Rugby League', name: 'NRL SA', site: 'nrlsa.com.au' },
    { sport: 'Rugby Union', name: 'Rugby SA', site: 'sarugby.com.au' },
    { sport: 'Basketball', name: 'Basketball SA', site: 'basketballsa.com.au' },
    { sport: 'Tennis', name: 'Tennis SA', site: 'tennis.com.au/sa' },
    { sport: 'Golf', name: 'Golf Australia (SA)', site: 'golf.org.au' }
  ],
  WA: [
    { sport: 'AFL', name: 'WA Football Commission', site: 'wafootball.com.au' },
    { sport: 'Netball', name: 'Netball WA', site: 'wa.netball.com.au' },
    { sport: 'Cricket', name: 'WA Cricket', site: 'wacricket.com.au' },
    { sport: 'Soccer', name: 'Football West', site: 'footballwest.com.au' },
    { sport: 'Rugby League', name: 'NRL WA', site: 'nrlwa.com.au' },
    { sport: 'Rugby Union', name: 'RugbyWA', site: 'wa.rugby' },
    { sport: 'Basketball', name: 'Basketball WA', site: 'basketballwa.asn.au' },
    { sport: 'Tennis', name: 'Tennis West', site: 'tennis.com.au/wa' },
    { sport: 'Golf', name: 'GolfWA', site: 'golfwa.org.au' }
  ],
  TAS: [
    { sport: 'AFL', name: 'AFL Tasmania', site: 'play.afl' },
    { sport: 'Netball', name: 'Netball Tasmania', site: 'tas.netball.com.au' },
    { sport: 'Cricket', name: 'Cricket Tasmania', site: 'crickettas.com.au' },
    { sport: 'Soccer', name: 'Football Tasmania', site: 'footballtasmania.com.au' },
    { sport: 'Rugby League', name: 'NRL Tasmania', site: 'nrl.com' },
    { sport: 'Rugby Union', name: 'Tasmanian Rugby Union', site: 'tas.rugby' },
    { sport: 'Basketball', name: 'Basketball Tasmania', site: 'basketballtasmania.com.au' },
    { sport: 'Tennis', name: 'Tennis Tasmania', site: 'tennis.com.au/tas' },
    { sport: 'Golf', name: 'Golf Australia (Tasmania)', site: 'golf.org.au' }
  ],
  ACT: [
    { sport: 'AFL', name: 'AFL NSW/ACT (AFL Canberra)', site: 'aflnswact.com.au' },
    { sport: 'Netball', name: 'Netball ACT', site: 'act.netball.com.au' },
    { sport: 'Cricket', name: 'Cricket ACT', site: 'cricketact.com.au' },
    { sport: 'Soccer', name: 'Capital Football', site: 'capitalfootball.com.au' },
    { sport: 'Rugby League', name: 'NSW Rugby League (Canberra region)', site: 'nswrl.com.au' },
    { sport: 'Rugby Union', name: 'Brumbies Rugby (ACT and Southern NSW Rugby Union)', site: 'brumbies.com.au' },
    { sport: 'Basketball', name: 'Basketball ACT', site: 'basketballact.com.au' },
    { sport: 'Tennis', name: 'Tennis ACT', site: 'tennis.com.au/act' },
    { sport: 'Golf', name: 'Golf NSW (covers ACT clubs)', site: 'golfnsw.org.au' }
  ],
  NT: [
    { sport: 'AFL', name: 'AFLNT', site: 'aflnt.com.au' },
    { sport: 'Netball', name: 'Netball NT', site: 'nt.netball.com.au' },
    { sport: 'Cricket', name: 'NT Cricket', site: 'ntcricket.com.au' },
    { sport: 'Soccer', name: 'Football NT', site: 'footballnt.com.au' },
    { sport: 'Rugby League', name: 'NRL NT', site: 'nrlnt.com.au' },
    { sport: 'Rugby Union', name: 'NT Rugby Union', site: 'nt.rugby' },
    { sport: 'Basketball', name: 'Basketball NT', site: 'basketballnt.com.au' },
    { sport: 'Tennis', name: 'Tennis NT', site: 'tennis.com.au/nt' },
    { sport: 'Golf', name: 'Golf Australia (NT)', site: 'golf.org.au' }
  ]
};

export const REGIONS = {
  NATIONAL: {
    name: 'National',
    category: 'National',
    focus: 'Commonwealth child safety and sport bodies: National Office for Child Safety (National Principles for Child Safe Organisations), Sport Integrity Australia (National Integrity Framework, safeguarding policy), eSafety Commissioner, Australian Sports Commission / Play by the Rules, national Working With Children Check reform and the National Reference System, Privacy Act changes affecting clubs.',
    domains: [
      'childsafety.gov.au', 'sportintegrity.gov.au', 'esafety.gov.au', 'playbytherules.net.au',
      'ausport.gov.au', 'clearinghouseforsport.gov.au', 'oaic.gov.au', 'ag.gov.au', 'health.gov.au', 'acic.gov.au'
    ],
    newsDomains: [],
    watchedPages: [
      { url: 'https://www.childsafety.gov.au/national-principles', label: 'National Office for Child Safety: National Principles' },
      { url: 'https://www.sportintegrity.gov.au/news/media-statements', label: 'Sport Integrity Australia: Media statements' },
      { url: 'https://www.playbytherules.net.au/common-issues/child-safe-principles-legislation-and-resources', label: 'Play by the Rules: Child safe principles, legislation and resources' }
    ],
    queries: [
      'child safe standards Australia sport compliance',
      'national Working With Children Check reform Australia',
      'Sport Integrity Australia safeguarding child safety',
      'National Office for Child Safety organisations guidance',
      'eSafety Commissioner sport community clubs',
      'Privacy Act reform sporting clubs children data',
      'Standing Council of Attorneys-General Working with Children Check'
    ]
  },

  SPORT: {
    name: 'National sporting bodies',
    category: 'National',
    focus: 'National sporting organisations\' child safeguarding policies and member protection rules: AFL, Football Australia, Rugby Australia, NRL, Cricket Australia, Basketball Australia, Netball Australia, Tennis Australia, Golf Australia, Swimming Australia, Athletics Australia, Hockey Australia. Use the sport name as the category (AFL, Soccer, Rugby League, Rugby Union, Cricket, Basketball, Netball, Tennis, Golf) where it fits, otherwise National.',
    domains: [
      'afl.com.au', 'play.afl', 'footballaustralia.com.au', 'australia.rugby', 'nrl.com', 'playrugbyleague.com',
      'cricket.com.au', 'community.cricket.com.au', 'australia.basketball', 'netball.com.au', 'tennis.com.au',
      'golf.org.au', 'swimming.org.au', 'athletics.com.au', 'hockey.org.au', 'sportintegrity.gov.au'
    ],
    newsDomains: [],
    watchedPages: [],
    queries: [
      'AFL child safeguarding policy update',
      'Football Australia safeguarding children update',
      'Rugby Australia NRL child safeguarding update',
      'Cricket Australia safeguarding children update',
      'Netball Basketball Australia child safeguarding update',
      'Tennis Golf Swimming Australia child safe policy',
      'National Integrity Framework sport adopt safeguarding policy'
    ]
  },

  VIC: {
    name: 'Victoria',
    category: 'VIC',
    focus: 'Victoria: Working with Children Check (now run by the Social Services Regulator, incl. WWC Connect for applicants and organisations verifying workers, mandatory child safety training from 19 October 2026, Service Victoria transactions), the Child Safe Standards and Reportable Conduct Scheme (moving from the Commission for Children and Young People to the Social Services Regulator), Sport and Recreation Victoria, Vicsport.',
    domains: ['vic.gov.au', 'vicsport.com.au'],
    newsDomains: [],
    watchedPages: [
      { url: 'https://www.workingwithchildren.vic.gov.au/', label: 'Working with Children Check Victoria' },
      { url: 'https://www.vic.gov.au/social-services-regulator-media-centre', label: 'Social Services Regulator Victoria: News' },
      { url: 'https://www.vic.gov.au/social-services-regulator', label: 'Social Services Regulator Victoria' },
      { url: 'https://www.vic.gov.au/mandatory-child-safety-training-working-children-clearance-holders', label: 'SSR: Mandatory child safety training for WWC Clearance holders' },
      { url: 'https://www.vic.gov.au/changes-working-children-check-from-july-2026', label: 'SSR: Changes to the Working with Children Check' },
      { url: 'https://www.vicsport.com.au/child-safe', label: 'Vicsport: Child Safe Sport' },
      { url: 'https://www.aflvic.com.au/safeguarding-children', label: 'AFL Victoria: Safeguarding children' },
      { url: 'https://footballvictoria.com.au/about/policies/child-safety', label: 'Football Victoria: Child safety' },
      { url: 'https://www.cricketvictoria.com.au/clubs-support/child-safe-standards/', label: 'Cricket Victoria: Child Safe Standards' }
    ],
    queries: [
      'Working with Children Check Victoria changes',
      'Social Services Regulator Victoria child safety',
      'Victoria Child Safe Standards sport clubs',
      'Reportable Conduct Scheme Victoria',
      'Vicsport child safe sport',
      'Victoria sporting club volunteers child safety'
    ]
  },

  NSW: {
    name: 'New South Wales',
    category: 'NSW',
    focus: 'NSW: Office of the Children\'s Guardian (Working With Children Check, Child Safe Scheme and Child Safe Standards, Reportable Conduct Scheme), Office of Sport NSW, Sport NSW, NSW Government child safety reforms.',
    domains: ['nsw.gov.au', 'sportnsw.com.au'],
    newsDomains: ['smh.com.au', 'dailytelegraph.com.au'],
    watchedPages: [
      { url: 'https://ocg.nsw.gov.au/news', label: 'Office of the Children\'s Guardian NSW: News' },
      { url: 'https://www.sport.nsw.gov.au/running-your-club/safe-and-fair-clubs/child-safe-sport/child-safety-laws-nsw', label: 'Office of Sport NSW: Child safety laws' },
      { url: 'https://www.cricketnsw.com.au/safeguarding-children', label: 'Cricket NSW: Safeguarding children' },
      { url: 'https://www.golfnsw.org.au/child-safe-standards/', label: 'Golf NSW: Child Safe Standards' }
    ],
    queries: [
      'Working With Children Check NSW changes',
      'Office of the Children\'s Guardian NSW sport',
      'NSW Child Safe Scheme sporting organisations',
      'Reportable Conduct Scheme NSW',
      'NSW sporting club volunteers child safety'
    ]
  },

  QLD: {
    name: 'Queensland',
    category: 'QLD',
    focus: 'Queensland: in Queensland, sport\'s child safety obligations are governed and explained on Queensland Government websites, so treat qld.gov.au as the primary source: the Sport HQ pages for sport and recreation organisations (qld.gov.au/recreation/sports/club-support, including "Keeping the sport and racing industry safe" and "Diversity, equity, inclusion and safeguarding"), the Department of Sport, Racing and Olympic and Paralympic Games (sport.qld.gov.au), the blue card system (Blue Card Services, including child and youth risk management strategy requirements), the Child Safe Standards and Reportable Conduct Scheme administered by the Queensland Family and Child Commission (qfcc.qld.gov.au; Standards in force for sport from 1 April 2026, Reportable Conduct Scheme from 1 July 2026), the Child and Youth Protection Commission, and QSport.',
    domains: ['qld.gov.au', 'qsport.org.au'],
    newsDomains: ['brisbanetimes.com.au', 'couriermail.com.au'],
    watchedPages: [
      { url: 'https://www.qld.gov.au/recreation/sports/club-support/keeping-sport-and-recreation-safe', label: 'Queensland Government: Keeping sport and recreation safe' },
      { url: 'https://www.qld.gov.au/recreation/sports/club-support/participation/diversity,-equity,-inclusion-and-safeguarding', label: 'Queensland Government Sport HQ: Diversity, equity, inclusion and safeguarding' },
      { url: 'https://www.qld.gov.au/law/laws-regulated-industries-and-accountability/queensland-laws-and-regulations/regulated-industries-and-licensing/blue-card/organisations/risk-management-strategies', label: 'Blue Card Services: Child and youth risk management strategy requirements' },
      { url: 'https://www.qfcc.qld.gov.au/childsafe/standards', label: 'QFCC: Child Safe Standards' },
      { url: 'https://www.qfcc.qld.gov.au/childsafe/reportable-conduct-scheme', label: 'QFCC: Reportable Conduct Scheme' },
      { url: 'https://www.qfcc.qld.gov.au/news-and-updates', label: 'Queensland Family and Child Commission: News and updates' },
      { url: 'https://www.sport.qld.gov.au/news/latest', label: 'Queensland Government sport: Latest news' },
      { url: 'https://qld.rugby/rugby-welfare/child-safeguarding', label: 'Queensland Rugby Union: Child safeguarding' },
      { url: 'https://www.qldcricket.com.au/support/child-and-member-protection', label: 'Queensland Cricket: Child and member protection' },
      { url: 'https://www.queensland.basketball/child-safe-commitment', label: 'Basketball Queensland: Child safe commitment' }
    ],
    queries: [
      'Queensland blue card changes',
      'Queensland Child Safe Standards sport QFCC',
      'Reportable Conduct Scheme Queensland',
      'Queensland child safety sporting clubs',
      'Queensland Government sport clubs safeguarding blue card'
    ]
  },

  SA: {
    name: 'South Australia',
    category: 'SA',
    focus: 'South Australia: DHS Screening Unit (Working With Children Check), Child Safe Environments requirements, Commissioner for Children and Young People SA, Office for Recreation, Sport and Racing, Sport SA.',
    domains: ['sa.gov.au', 'ccyp.com.au', 'sportsa.org.au'],
    newsDomains: ['indaily.com.au', 'adelaidenow.com.au'],
    watchedPages: [
      { url: 'https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks/screening-wwcc', label: 'SA.GOV.AU: Working with Children Checks' },
      { url: 'https://www.orsr.sa.gov.au/sector-success/child-safety', label: 'Office for Recreation, Sport and Racing: Child safeguarding' },
      { url: 'https://www.ccyp.com.au/', label: 'Commissioner for Children and Young People SA' },
      { url: 'https://footballsa.com.au/child-safe-environments', label: 'Football SA: Child Safe Environments' },
      { url: 'https://sarugby.com.au/about/codes-and-policies/child-safety', label: 'Rugby SA: Child safety' }
    ],
    queries: [
      'Working With Children Check South Australia changes',
      'South Australia child safe environments sport',
      'Office for Recreation Sport and Racing child safety',
      'South Australia sporting club volunteers child safety'
    ]
  },

  WA: {
    name: 'Western Australia',
    category: 'WA',
    focus: 'Western Australia: Working with Children Check (Department of Communities, including the Working with Children (Screening) Amendment Act and recognition of interstate bans), Commissioner for Children and Young People WA, Reportable Conduct Scheme (WA Ombudsman), Department of Creative Industries, Tourism and Sport (formerly DLGSC), WA Sports Federation.',
    domains: ['wa.gov.au', 'wasf.org.au'],
    newsDomains: ['thewest.com.au', 'watoday.com.au'],
    watchedPages: [
      { url: 'https://www.wa.gov.au/organisation/department-of-communities/working-children-check-amendments-the-act', label: 'Department of Communities: WWC Check amendments to the Act' },
      { url: 'https://www.wa.gov.au/government/announcements/changes-the-working-children-wwc-legislation-are-coming', label: 'WA Government: Changes to WWC legislation are coming' },
      { url: 'https://wafootball.com.au/integrity/child-safeguarding', label: 'WA Football Commission: Child safeguarding' },
      { url: 'https://footballwest.com.au/about-us/child-safeguarding/', label: 'Football West: Child safeguarding' },
      { url: 'https://wa.netball.com.au/child-safeguarding', label: 'Netball WA: Child safeguarding' },
      { url: 'https://wa.rugby/safety-welfare/child-safeguarding', label: 'RugbyWA: Child safeguarding' }
    ],
    queries: [
      'Working With Children Check Western Australia changes',
      'Western Australia child safe organisations sport',
      'Reportable Conduct Scheme Western Australia',
      'Western Australia sporting club volunteers child safety'
    ]
  },

  TAS: {
    name: 'Tasmania',
    category: 'TAS',
    focus: 'Tasmania: Child and Youth Safe Organisations Framework and the Office of the Independent Regulator (Child and Youth Safe Standards, Reportable Conduct Scheme), Registration to Work with Vulnerable People (CBOS), Commissioner for Children and Young People Tasmania, Active Tasmania / Sport and Recreation Tasmania.',
    domains: ['tas.gov.au'],
    newsDomains: ['themercury.com.au', 'examiner.com.au', 'pulsetasmania.com.au'],
    watchedPages: [
      { url: 'https://www.oir.tas.gov.au/', label: 'Office of the Independent Regulator Tasmania' },
      { url: 'https://www.cbos.tas.gov.au/topics/licensing-and-registration/work-with-vulnerable-people/', label: 'CBOS: Registration to Work with Vulnerable People' },
      { url: 'https://www.active.tas.gov.au/child_safety/tiles/child_and_youth_safe_organisations_framework', label: 'Active Tasmania: Child and Youth Safe Organisations Framework' },
      { url: 'https://tas.netball.com.au/child-safeguarding', label: 'Netball Tasmania: Child safeguarding' },
      { url: 'https://www.crickettas.com.au/community/safeguardingchildrenandyoungpeople', label: 'Cricket Tasmania: Safeguarding children and young people' }
    ],
    queries: [
      'Tasmania Child and Youth Safe Organisations sport',
      'Tasmania Working with Vulnerable People registration changes',
      'Tasmania Independent Regulator child safe',
      'Tasmania sporting club volunteers child safety'
    ]
  },

  ACT: {
    name: 'Australian Capital Territory',
    category: 'ACT',
    focus: 'ACT: Working with Vulnerable People registration (Access Canberra), Reportable Conduct Scheme (ACT Ombudsman), ACT Human Rights Commission, ACT child safe standards reforms, Sport and Recreation ACT (there is no longer a peak sport body in the ACT).',
    domains: ['act.gov.au'],
    newsDomains: ['canberratimes.com.au', 'region.com.au'],
    watchedPages: [
      { url: 'https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people/working-with-vulnerable-people-scheme', label: 'Access Canberra: Working With Vulnerable People scheme' },
      { url: 'https://www.sport.act.gov.au/clubs-and-organisations/child-safe-sport', label: 'Sport and Recreation ACT: Child safe sport' },
      { url: 'https://act.netball.com.au/policies-and-bylaws', label: 'Netball ACT: Policies and by-laws' }
    ],
    queries: [
      'ACT Working with Vulnerable People changes',
      'ACT child safe standards',
      'ACT Reportable Conduct Scheme',
      'Canberra sporting club volunteers child safety'
    ]
  },

  NT: {
    name: 'Northern Territory',
    category: 'NT',
    focus: 'Northern Territory: Working with Children Clearance (SAFE NT / Ochre Card, including the reforms and new application forms from 1 September 2026), Office of the Children\'s Commissioner NT, NT child safe standards, NT Government sport and recreation.',
    domains: ['nt.gov.au'],
    newsDomains: ['ntnews.com.au', 'ntindependent.com.au'],
    watchedPages: [
      { url: 'https://nt.gov.au/emergency/child-safety/working-with-children-clearance', label: 'NT Government: Working with Children Clearance' },
      { url: 'https://pfes.nt.gov.au/SAFENT', label: 'SAFE NT Employment Screening' },
      { url: 'https://nt.netball.com.au/policy-procedure', label: 'Netball NT: Policy and procedure' },
      { url: 'https://ntcricket.com.au/integrity/member-protection', label: 'NT Cricket: Member protection' }
    ],
    queries: [
      'Northern Territory Working with Children Clearance Ochre Card changes',
      'Northern Territory child safe organisations',
      'Northern Territory Children\'s Commissioner sport',
      'Darwin sporting club volunteers child safety'
    ]
  }
};

// Give each state agent its 9 state sporting bodies: their sites become
// official sources, and the agent is told who to check for each sport.
for (const [key, bodies] of Object.entries(STATE_SPORT_BODIES)) {
  const region = REGIONS[key];
  const bodyDomains = bodies.map(b => b.site.split('/')[0]);
  region.domains = [...new Set([...region.domains, ...bodyDomains, ...SHARED_SPORT_DOMAINS])];
  region.focus += ` State sporting bodies for the 9 sports OneSide covers (check each for new or changed child safeguarding policies, codes of conduct, screening or training requirements): ${bodies.map(b => `${b.name} (${b.sport}, ${b.site})`).join('; ')}.`;
  region.sportBodies = bodies;
  region.queries = [...region.queries, `${region.name} (AFL OR netball OR cricket OR soccer OR "rugby league" OR "rugby union" OR basketball OR tennis OR golf) child safeguarding`];
}

export const REGION_KEYS = Object.keys(REGIONS);

// True when a URL is on one of the given domains (or a subdomain of one).
export function isOnDomains(url, domains) {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  return domains.some(d => host === d || host.endsWith(`.${d}`));
}
