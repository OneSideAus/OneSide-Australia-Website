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
export const NATIONAL_NEWS_DOMAINS = ['abc.net.au', 'sbs.com.au', 'theguardian.com', 'theconversation.com'];

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
    focus: 'Victoria: Working with Children Check (now run by the Social Services Regulator, incl. WWC Connect for applicants and organisations verifying workers, mandatory child safety training from 19 October 2026, Service Victoria transactions), the Child Safe Standards and Reportable Conduct Scheme (moving from the Commission for Children and Young People to the Social Services Regulator), Sport and Recreation Victoria, Vicsport, and Victorian state sporting associations (AFL Victoria, Football Victoria, Cricket Victoria, Netball Victoria).',
    domains: ['vic.gov.au', 'vicsport.com.au', 'aflvic.com.au', 'footballvictoria.com.au', 'cricketvictoria.com.au', 'vic.netball.com.au'],
    newsDomains: ['theage.com.au', 'heraldsun.com.au'],
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
      'AFL Victoria OR Football Victoria OR Cricket Victoria OR Netball Victoria child safety',
      'Victoria sporting club volunteers child safety'
    ]
  },

  NSW: {
    name: 'New South Wales',
    category: 'NSW',
    focus: 'NSW: Office of the Children\'s Guardian (Working With Children Check, Child Safe Scheme and Child Safe Standards, Reportable Conduct Scheme), Office of Sport NSW, Sport NSW, NSW Government child safety reforms, and NSW state sporting associations (Cricket NSW, Football NSW, NSWRL, Netball NSW).',
    domains: ['nsw.gov.au', 'sportnsw.com.au', 'cricketnsw.com.au', 'footballnsw.com.au', 'nswrl.com.au', 'nsw.netball.com.au'],
    newsDomains: ['smh.com.au', 'dailytelegraph.com.au'],
    watchedPages: [
      { url: 'https://ocg.nsw.gov.au/news', label: 'Office of the Children\'s Guardian NSW: News' },
      { url: 'https://www.sport.nsw.gov.au/running-your-club/safe-and-fair-clubs/child-safe-sport/child-safety-laws-nsw', label: 'Office of Sport NSW: Child safety laws' },
      { url: 'https://www.cricketnsw.com.au/safeguarding-children', label: 'Cricket NSW: Safeguarding children' }
    ],
    queries: [
      'Working With Children Check NSW changes',
      'Office of the Children\'s Guardian NSW sport',
      'NSW Child Safe Scheme sporting organisations',
      'Reportable Conduct Scheme NSW',
      'Football NSW OR NSWRL OR Cricket NSW OR Netball NSW child safety',
      'NSW sporting club volunteers child safety'
    ]
  },

  QLD: {
    name: 'Queensland',
    category: 'QLD',
    focus: 'Queensland: blue card system (Blue Card Services), Child Safe Standards administered by the Queensland Family and Child Commission (in force for sport from 1 April 2026), Reportable Conduct Scheme (started 1 July 2026), Child and Youth Protection Commission, Queensland Government sport and recreation club support, QSport, and Queensland state sporting associations (QRL, AFL Queensland, Football Queensland, Netball Queensland).',
    domains: ['qld.gov.au', 'qsport.org.au', 'qrl.com.au', 'aflq.com.au', 'footballqueensland.com.au', 'qld.netball.com.au'],
    newsDomains: ['brisbanetimes.com.au', 'couriermail.com.au'],
    watchedPages: [
      { url: 'https://www.qld.gov.au/recreation/sports/club-support/keeping-sport-and-recreation-safe', label: 'Queensland Government: Keeping sport and recreation safe' },
      { url: 'https://www.qfcc.qld.gov.au/news-and-updates', label: 'Queensland Family and Child Commission: News and updates' },
      { url: 'https://www.sport.qld.gov.au/news/latest', label: 'Queensland Government sport: Latest news' }
    ],
    queries: [
      'Queensland blue card changes',
      'Queensland Child Safe Standards sport QFCC',
      'Reportable Conduct Scheme Queensland',
      'Queensland child safety sporting clubs',
      'QRL OR AFL Queensland OR Football Queensland OR Netball Queensland child safeguarding'
    ]
  },

  SA: {
    name: 'South Australia',
    category: 'SA',
    focus: 'South Australia: DHS Screening Unit (Working With Children Check), Child Safe Environments requirements, Commissioner for Children and Young People SA, Office for Recreation, Sport and Racing, Sport SA, and SA state sporting associations (SANFL, SACA, Football SA, Netball SA).',
    domains: ['sa.gov.au', 'ccyp.com.au', 'sportsa.org.au', 'sanfl.com.au', 'saca.com.au', 'footballsa.com.au', 'sa.netball.com.au'],
    newsDomains: ['indaily.com.au', 'adelaidenow.com.au'],
    watchedPages: [
      { url: 'https://www.sa.gov.au/topics/rights-and-law/rights-and-responsibilities/screening-checks/screening-wwcc', label: 'SA.GOV.AU: Working with Children Checks' },
      { url: 'https://www.orsr.sa.gov.au/sector-success/child-safety', label: 'Office for Recreation, Sport and Racing: Child safeguarding' },
      { url: 'https://www.ccyp.com.au/', label: 'Commissioner for Children and Young People SA' }
    ],
    queries: [
      'Working With Children Check South Australia changes',
      'South Australia child safe environments sport',
      'Office for Recreation Sport and Racing child safety',
      'SANFL OR SACA OR Football SA OR Netball SA child safeguarding',
      'South Australia sporting club volunteers child safety'
    ]
  },

  WA: {
    name: 'Western Australia',
    category: 'WA',
    focus: 'Western Australia: Working with Children Check (Department of Communities, including the Working with Children (Screening) Amendment Act and recognition of interstate bans), Commissioner for Children and Young People WA, Reportable Conduct Scheme (WA Ombudsman), Department of Creative Industries, Tourism and Sport (formerly DLGSC), WA Sports Federation, and WA state sporting associations (WAFC, Football West, WACA, Netball WA).',
    domains: ['wa.gov.au', 'wasf.org.au', 'wafootball.com.au', 'footballwest.com.au', 'waca.com.au', 'wa.netball.com.au'],
    newsDomains: ['thewest.com.au', 'watoday.com.au'],
    watchedPages: [
      { url: 'https://www.wa.gov.au/organisation/department-of-communities/working-children-check-amendments-the-act', label: 'Department of Communities: WWC Check amendments to the Act' },
      { url: 'https://www.wa.gov.au/government/announcements/changes-the-working-children-wwc-legislation-are-coming', label: 'WA Government: Changes to WWC legislation are coming' },
      { url: 'https://footballwest.com.au/about-us/child-safeguarding/', label: 'Football West: Child safeguarding' },
      { url: 'https://wa.netball.com.au/child-safeguarding', label: 'Netball WA: Child safeguarding' }
    ],
    queries: [
      'Working With Children Check Western Australia changes',
      'Western Australia child safe organisations sport',
      'Reportable Conduct Scheme Western Australia',
      'WAFC OR Football West OR WACA OR Netball WA child safeguarding',
      'Western Australia sporting club volunteers child safety'
    ]
  },

  TAS: {
    name: 'Tasmania',
    category: 'TAS',
    focus: 'Tasmania: Child and Youth Safe Organisations Framework and the Office of the Independent Regulator (Child and Youth Safe Standards, Reportable Conduct Scheme), Registration to Work with Vulnerable People (CBOS), Commissioner for Children and Young People Tasmania, Active Tasmania / Sport and Recreation Tasmania, and Tasmanian state sporting associations (AFL Tasmania, Football Tasmania, Netball Tasmania, Cricket Tasmania).',
    domains: ['tas.gov.au', 'footballtasmania.com.au', 'tas.netball.com.au'],
    newsDomains: ['themercury.com.au', 'examiner.com.au', 'pulsetasmania.com.au'],
    watchedPages: [
      { url: 'https://oir.tas.gov.au/', label: 'Office of the Independent Regulator Tasmania' },
      { url: 'https://www.cbos.tas.gov.au/topics/licensing-and-registration/work-with-vulnerable-people/', label: 'CBOS: Registration to Work with Vulnerable People' },
      { url: 'https://www.active.tas.gov.au/child_safety/tiles/child_and_youth_safe_organisations_framework', label: 'Active Tasmania: Child and Youth Safe Organisations Framework' },
      { url: 'https://tas.netball.com.au/child-safeguarding', label: 'Netball Tasmania: Child safeguarding' }
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
    focus: 'ACT: Working with Vulnerable People registration (Access Canberra), Reportable Conduct Scheme (ACT Ombudsman), ACT Human Rights Commission, ACT child safe standards reforms, Sport and Recreation ACT (there is no longer a peak sport body in the ACT), and ACT sporting associations (Capital Football, Netball ACT, Cricket ACT, AFL NSW/ACT).',
    domains: ['act.gov.au', 'capitalfootball.com.au', 'act.netball.com.au'],
    newsDomains: ['canberratimes.com.au', 'region.com.au'],
    watchedPages: [
      { url: 'https://www.accesscanberra.act.gov.au/business-and-work/working-with-vulnerable-people/working-with-vulnerable-people-scheme', label: 'Access Canberra: Working With Vulnerable People scheme' },
      { url: 'https://www.sport.act.gov.au/clubs-and-organisations/child-safe-sport', label: 'Sport and Recreation ACT: Child safe sport' }
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
    focus: 'Northern Territory: Working with Children Clearance (SAFE NT / Ochre Card, including the reforms and new application forms from 1 September 2026), Office of the Children\'s Commissioner NT, NT child safe standards, NT Government sport and recreation, and NT sporting associations (AFLNT, NT Cricket, Netball NT).',
    domains: ['nt.gov.au', 'aflnt.com.au', 'nt.netball.com.au'],
    newsDomains: ['ntnews.com.au', 'ntindependent.com.au'],
    watchedPages: [
      { url: 'https://nt.gov.au/emergency/child-safety/working-with-children-clearance', label: 'NT Government: Working with Children Clearance' },
      { url: 'https://pfes.nt.gov.au/SAFENT', label: 'SAFE NT Employment Screening' }
    ],
    queries: [
      'Northern Territory Working with Children Clearance Ochre Card changes',
      'Northern Territory child safe organisations',
      'Northern Territory Children\'s Commissioner sport',
      'Darwin sporting club volunteers child safety'
    ]
  }
};

export const REGION_KEYS = Object.keys(REGIONS);

// True when a URL is on one of the given domains (or a subdomain of one).
export function isOnDomains(url, domains) {
  let host;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  return domains.some(d => host === d || host.endsWith(`.${d}`));
}
