// api/_lib/regions.js
// One entry per updates agent. Each agent searches only its own official
// domains (subdomains included, so "vic.gov.au" also covers
// workingwithchildren.vic.gov.au, ccyp.vic.gov.au, etc.), reads its own
// news queries, and diffs its own watched pages.

export const REGIONS = {
  NATIONAL: {
    name: 'National',
    category: 'National',
    focus: 'Commonwealth child safety and sport bodies: National Office for Child Safety (National Principles for Child Safe Organisations), Sport Integrity Australia (National Integrity Framework, safeguarding policy), eSafety Commissioner, Australian Sports Commission / Play by the Rules, national Working With Children Check reform and the National Reference System, Privacy Act changes affecting clubs.',
    domains: [
      'childsafety.gov.au', 'sportintegrity.gov.au', 'esafety.gov.au', 'playbytherules.net.au',
      'ausport.gov.au', 'clearinghouseforsport.gov.au', 'oaic.gov.au', 'ag.gov.au', 'health.gov.au', 'acic.gov.au'
    ],
    watchedPages: [],
    queries: [
      'child safe standards Australia sport compliance',
      'national Working With Children Check reform Australia',
      'Sport Integrity Australia safeguarding child safety',
      'National Office for Child Safety organisations guidance',
      'eSafety Commissioner sport community clubs',
      'Privacy Act reform sporting clubs children data'
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
    watchedPages: [],
    queries: [
      'AFL child safeguarding policy update',
      'Football Australia safeguarding children update',
      'Rugby Australia NRL child safeguarding update',
      'Cricket Australia safeguarding children update',
      'Netball Basketball Australia child safeguarding update',
      'Tennis Golf Swimming Australia child safe policy'
    ]
  },

  VIC: {
    name: 'Victoria',
    category: 'VIC',
    focus: 'Victoria: Working with Children Check (now run by the Social Services Regulator, incl. WWC Connect for applicants and organisations verifying workers, mandatory child safety training from 19 October 2026, Service Victoria transactions), the Child Safe Standards and Reportable Conduct Scheme (moving from the Commission for Children and Young People to the Social Services Regulator), Sport and Recreation Victoria, Vicsport.',
    domains: ['vic.gov.au', 'vicsport.com.au'],
    watchedPages: [
      { url: 'https://www.workingwithchildren.vic.gov.au/', label: 'Working with Children Check Victoria' },
      { url: 'https://www.vic.gov.au/social-services-regulator-media-centre', label: 'Social Services Regulator Victoria: News' },
      { url: 'https://www.vic.gov.au/social-services-regulator', label: 'Social Services Regulator Victoria' },
      { url: 'https://www.vic.gov.au/mandatory-child-safety-training-working-children-clearance-holders', label: 'SSR: Mandatory child safety training for WWC Clearance holders' },
      { url: 'https://www.vic.gov.au/changes-working-children-check-from-july-2026', label: 'SSR: Changes to the Working with Children Check' },
      { url: 'https://www.vicsport.com.au/child-safe', label: 'Vicsport: Child Safe Sport' }
    ],
    queries: [
      'Working with Children Check Victoria changes',
      'Social Services Regulator Victoria child safety',
      'Victoria Child Safe Standards sport clubs',
      'Reportable Conduct Scheme Victoria',
      'Vicsport child safe sport'
    ]
  },

  NSW: {
    name: 'New South Wales',
    category: 'NSW',
    focus: 'NSW: Office of the Children\'s Guardian (Working With Children Check, Child Safe Scheme and Child Safe Standards, Reportable Conduct Scheme), Office of Sport NSW, Sport NSW, NSW Government child safety reforms.',
    domains: ['nsw.gov.au', 'sportnsw.com.au'],
    watchedPages: [
      { url: 'https://ocg.nsw.gov.au/news', label: 'Office of the Children\'s Guardian NSW: News' }
    ],
    queries: [
      'Working With Children Check NSW changes',
      'Office of the Children\'s Guardian NSW sport',
      'NSW Child Safe Scheme sporting organisations',
      'Reportable Conduct Scheme NSW'
    ]
  },

  QLD: {
    name: 'Queensland',
    category: 'QLD',
    focus: 'Queensland: blue card system (Blue Card Services), Child Safe Standards administered by the Queensland Family and Child Commission (in force for sport from 1 April 2026), Reportable Conduct Scheme (Queensland Ombudsman), Child and Youth Protection Commission, Queensland Government sport and recreation club support, QSport.',
    domains: ['qld.gov.au', 'qsport.org.au'],
    watchedPages: [
      { url: 'https://www.qld.gov.au/recreation/sports/club-support/keeping-sport-and-recreation-safe', label: 'Queensland Government: Keeping sport and recreation safe' }
    ],
    queries: [
      'Queensland blue card changes',
      'Queensland Child Safe Standards sport QFCC',
      'Reportable Conduct Scheme Queensland',
      'Queensland child safety sporting clubs'
    ]
  },

  SA: {
    name: 'South Australia',
    category: 'SA',
    focus: 'South Australia: DHS Screening Unit (Working With Children Check), Child Safe Environments requirements, Commissioner for Children and Young People SA, Office for Recreation, Sport and Racing, Sport SA.',
    domains: ['sa.gov.au', 'ccyp.com.au', 'sportsa.org.au'],
    watchedPages: [],
    queries: [
      'Working With Children Check South Australia changes',
      'South Australia child safe environments sport',
      'Office for Recreation Sport and Racing child safety'
    ]
  },

  WA: {
    name: 'Western Australia',
    category: 'WA',
    focus: 'Western Australia: Working with Children Check (Department of Communities), Commissioner for Children and Young People WA, Reportable Conduct Scheme (WA Ombudsman), Department of Local Government, Sport and Cultural Industries, WA Sports Federation.',
    domains: ['wa.gov.au', 'wasf.org.au'],
    watchedPages: [],
    queries: [
      'Working With Children Check Western Australia changes',
      'Western Australia child safe organisations sport',
      'Reportable Conduct Scheme Western Australia'
    ]
  },

  TAS: {
    name: 'Tasmania',
    category: 'TAS',
    focus: 'Tasmania: Child and Youth Safe Organisations Framework and the Office of the Independent Regulator, Registration to Work with Vulnerable People (CBOS), Active Tasmania / Sport and Recreation Tasmania.',
    domains: ['tas.gov.au'],
    watchedPages: [
      { url: 'https://oir.tas.gov.au/', label: 'Office of the Independent Regulator Tasmania' }
    ],
    queries: [
      'Tasmania Child and Youth Safe Organisations sport',
      'Tasmania Working with Vulnerable People registration changes',
      'Tasmania Independent Regulator child safe'
    ]
  },

  ACT: {
    name: 'Australian Capital Territory',
    category: 'ACT',
    focus: 'ACT: Working with Vulnerable People registration (Access Canberra), Reportable Conduct Scheme (ACT Ombudsman), ACT Human Rights Commission, ACT child safe standards reforms, Sport and Recreation ACT.',
    domains: ['act.gov.au'],
    watchedPages: [],
    queries: [
      'ACT Working with Vulnerable People changes',
      'ACT child safe standards',
      'ACT Reportable Conduct Scheme'
    ]
  },

  NT: {
    name: 'Northern Territory',
    category: 'NT',
    focus: 'Northern Territory: Working with Children Clearance (SAFE NT / Ochre Card), Office of the Children\'s Commissioner NT, NT child safe standards, NT Government sport and recreation.',
    domains: ['nt.gov.au'],
    watchedPages: [],
    queries: [
      'Northern Territory Working with Children Clearance Ochre Card changes',
      'Northern Territory child safe organisations',
      'Northern Territory Children\'s Commissioner sport'
    ]
  }
};

export const REGION_KEYS = Object.keys(REGIONS);
