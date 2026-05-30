// ══ Grant Scan View ═══════════════════════════════════════════════════════════

// ── Built-in grant database ───────────────────────────────────────────────────
const GRANT_DB = [
  // ── PhD Students ─────────────────────────────────────────────────────────────
  { id:'gdb1',  name:'Marie Curie Doctoral Networks',             funder:'European Commission',         stage:['phd'],            region:['EU','International'],           fields:['All'],                           amount:'~€3,500/mo',         duration:'3 years',     url:'https://marie-sklodowska-curie-actions.ec.europa.eu/', desc:'EU-funded doctoral training through university consortia. Apply through host universities.' },
  { id:'gdb2',  name:'NSF Graduate Research Fellowship (GRFP)',   funder:'NSF (USA)',                   stage:['phd'],            region:['USA'],                          fields:['STEM','Social Sciences'],        amount:'$37k/year',          duration:'3 years',     url:'https://www.nsfgrfp.org/',                             desc:'Prestigious US fellowship for early-stage PhD students in STEM and social sciences.' },
  { id:'gdb3',  name:'NIH NRSA Predoctoral Fellowship (F31)',     funder:'NIH (USA)',                   stage:['phd'],            region:['USA'],                          fields:['Biomedical','Life Sciences'],    amount:'~$26k/year + fees',  duration:'Up to 5 years',url:'https://researchtraining.nih.gov/programs/fellowships/F31', desc:'Predoctoral fellowship for US PhD students in biomedical and behavioral sciences.' },
  { id:'gdb4',  name:'Gates Cambridge Scholarship',               funder:'Gates Cambridge Trust',       stage:['phd'],            region:['International'],                fields:['All'],                           amount:'Full + stipend',     duration:'PhD length',  url:'https://www.gatescambridge.org/',                      desc:'Full scholarships for outstanding PhD students at Cambridge. Non-UK citizens only.' },
  { id:'gdb5',  name:'Rhodes Scholarship',                        funder:'Rhodes Trust (Oxford)',       stage:['phd'],            region:['International'],                fields:['All'],                           amount:'Full + stipend',     duration:'2+ years',    url:'https://www.rhodeshouse.ox.ac.uk/',                    desc:'One of the most prestigious scholarships for study at Oxford. Country quotas apply.' },
  { id:'gdb6',  name:'Fulbright U.S. Student Program',            funder:'U.S. Dept. of State',        stage:['phd','masters'],  region:['USA','International'],          fields:['All'],                           amount:'Varies',             duration:'1 year',      url:'https://foreign.fulbrightonline.org/',                 desc:'Study, research or teaching abroad. Non-US citizens apply through home country.' },
  { id:'gdb7',  name:'EPSRC Doctoral Training Partnership',       funder:'EPSRC (UK)',                  stage:['phd'],            region:['UK'],                           fields:['Engineering','Physical Sciences'],amount:'Fees + stipend',     duration:'3.5 years',   url:'https://www.ukri.org/councils/epsrc/',                 desc:'UK engineering and physical sciences doctoral training. Apply via UK universities.' },
  { id:'gdb8',  name:'Wellcome Trust PhD Studentship',            funder:'Wellcome Trust (UK)',         stage:['phd'],            region:['UK'],                           fields:['Biomedical','Life Sciences'],    amount:'Full costs',         duration:'4 years',     url:'https://wellcome.org/',                                desc:'Prestigious biomedical PhD funding for UK institutions.' },
  { id:'gdb9',  name:'L\'Oréal-UNESCO For Women in Science',      funder:'L\'Oréal / UNESCO',          stage:['phd','postdoc'],  region:['International'],                fields:['STEM'],                          amount:'Varies',             duration:'1 year',      url:'https://www.forwomeninscience.com/',                   desc:'National and international fellowships for women researchers in STEM.' },
  { id:'gdb10', name:'Swiss Govt Excellence Scholarship',         funder:'SBFI (Switzerland)',          stage:['phd','postdoc'],  region:['Switzerland'],                  fields:['All'],                           amount:'CHF 1,920/mo',       duration:'1–3 years',   url:'https://www.sbfi.admin.ch/',                           desc:'Scholarships for foreign researchers to study or research in Switzerland.' },
  { id:'gdb26', name:'NSERC CGS Doctoral (CGS-D)',                funder:'NSERC (Canada)',              stage:['phd'],            region:['Canada'],                       fields:['STEM'],                          amount:'$35k CAD/year',      duration:'3 years',     url:'https://www.nserc-crsng.gc.ca/',                       desc:'Canada Graduate Scholarships for doctoral students in natural sciences and engineering.' },
  { id:'gdb27', name:'SSHRC Doctoral Fellowship',                 funder:'SSHRC (Canada)',              stage:['phd'],            region:['Canada'],                       fields:['Social Sciences','Humanities'],  amount:'$20k CAD/year',      duration:'Up to 4 years',url:'https://www.sshrc-crsh.gc.ca/',                        desc:'Canadian doctoral fellowships in social sciences and humanities. Canadian citizens and permanent residents.' },
  { id:'gdb28', name:'Australian Research Training Program',      funder:'Australian Government',       stage:['phd','masters'],  region:['Australia'],                    fields:['All'],                           amount:'Fees + ~$32k AUD/yr',duration:'3.5 years',   url:'https://www.education.gov.au/',                        desc:'Tuition fee offset and stipend for domestic PhD/masters students in Australia.' },
  { id:'gdb29', name:'IMPRS Doctoral Programs (Max Planck)',      funder:'Max Planck Society',          stage:['phd'],            region:['Germany','International'],      fields:['STEM','Life Sciences'],          amount:'TVöD-level stipend', duration:'3–4 years',   url:'https://www.mpg.de/en/imprs',                          desc:'International Max Planck Research Schools offer structured PhD programs in STEM across Germany.' },
  { id:'gdb30', name:'Boehringer Ingelheim Fonds Fellowship',     funder:'Boehringer Ingelheim Fonds',  stage:['phd'],            region:['International'],                fields:['Biomedical'],                    amount:'€1,575+/mo',         duration:'Up to 3 years',url:'https://www.bifonds.de/',                              desc:'Highly competitive fellowship for outstanding PhD students in basic biomedical research. International.' },
  { id:'gdb31', name:'EMBL International PhD Programme',          funder:'EMBL',                        stage:['phd'],            region:['Europe','International'],       fields:['Life Sciences','Biology'],       amount:'Salary + benefits',  duration:'4 years',     url:'https://www.embl.org/about/info/phd-programme/',       desc:'PhD program across EMBL sites in Europe. Competitive stipend, outstanding facilities.' },
  { id:'gdb32', name:'MEXT Japanese Government Scholarship',      funder:'Ministry of Education (Japan)',stage:['phd','masters'], region:['Japan','International'],        fields:['All'],                           amount:'¥148–250k/mo',       duration:'3–5 years',   url:'https://www.mext.go.jp/a_menu/koutou/ryugaku/boshu/1330996.htm', desc:'Japanese government funding for foreign students to study and research in Japan.' },
  { id:'gdb33', name:'President\'s PhD Scholarship (Imperial)',   funder:'Imperial College London',     stage:['phd'],            region:['UK','International'],           fields:['STEM','Medicine'],               amount:'Full + £25k/year',   duration:'4 years',     url:'https://www.imperial.ac.uk/study/fees-and-funding/postgraduate/scholarships/presidents-phd-scholarships/', desc:'One of the most generous UK PhD scholarships. Full fees plus living stipend for outstanding international applicants.' },
  { id:'gdb34', name:'DFG Research Training Group (GRK)',         funder:'DFG (Germany)',               stage:['phd'],            region:['Germany'],                      fields:['All'],                           amount:'TVöD stipend',       duration:'3 years',     url:'https://www.dfg.de/en/research_funding/programmes/coordinated_programmes/research_training_groups/', desc:'Structured PhD training within a coordinated research group. Apply through the hosting German university.' },
  { id:'gdb35', name:'Erasmus Mundus Joint Doctoral Programmes',  funder:'European Commission',         stage:['phd'],            region:['EU','International'],           fields:['All'],                           amount:'~€2,500/mo',         duration:'3 years',     url:'https://erasmus-plus.ec.europa.eu/',                   desc:'Joint EU doctoral programs with multiple partner universities. Full scholarship with mobility component.' },
  { id:'gdb36', name:'China Scholarship Council (CSC) PhD',       funder:'CSC (China)',                 stage:['phd'],            region:['International'],                fields:['All'],                           amount:'Varies by country',  duration:'3–5 years',   url:'https://www.csc.edu.cn/en',                            desc:'Chinese government funding for PhD students to study at partner universities abroad.' },
  // ── Postdoctoral Researchers ──────────────────────────────────────────────────
  { id:'gdb11', name:'Marie Curie Postdoctoral Fellowship',       funder:'European Commission',         stage:['postdoc'],        region:['EU','International'],           fields:['All'],                           amount:'~€4,500/mo',         duration:'1–2 years',   url:'https://marie-sklodowska-curie-actions.ec.europa.eu/', desc:'Postdoctoral fellowships in any field. Two calls per year. Highly competitive.' },
  { id:'gdb12', name:'Alexander von Humboldt Fellowship',         funder:'Humboldt Foundation',         stage:['postdoc'],        region:['Germany','International'],      fields:['All'],                           amount:'~€2,670–3,170/mo',   duration:'6–24 months', url:'https://www.humboldt-foundation.de/',                  desc:'Research stays in Germany for highly qualified international scientists. Rolling deadline.' },
  { id:'gdb13', name:'NIH Postdoctoral Fellowship (F32)',         funder:'NIH (USA)',                   stage:['postdoc'],        region:['USA'],                          fields:['Biomedical','Life Sciences'],    amount:'$60–70k/year',       duration:'1–3 years',   url:'https://researchtraining.nih.gov/programs/fellowships/F32', desc:'Individual postdoctoral fellowship for biomedical research at US institutions.' },
  { id:'gdb14', name:'EMBO Long-Term Fellowship',                 funder:'EMBO',                        stage:['postdoc'],        region:['Europe'],                       fields:['Life Sciences','Chemistry'],     amount:'Scales with family', duration:'2 years',     url:'https://www.embo.org/funding/fellowships-and-grants/', desc:'For life scientists moving to a new European country for postdoc research.' },
  { id:'gdb15', name:'EMBO Short-Term Fellowship',                funder:'EMBO',                        stage:['phd','postdoc'],  region:['Europe'],                       fields:['Life Sciences'],                 amount:'Living expenses',    duration:'1–3 months',  url:'https://www.embo.org/funding/fellowships-and-grants/', desc:'Short research visits in the life sciences within Europe.' },
  { id:'gdb16', name:'Newton International Fellowship',           funder:'Royal Society / Brit. Academy',stage:['postdoc'],       region:['UK'],                           fields:['All'],                           amount:'£33k/year',          duration:'2 years',     url:'https://royalsociety.org/grants/newton-international/', desc:'Brings outstanding early-career researchers to the UK. Non-UK applicants only.' },
  { id:'gdb17', name:'HFSP Long-Term Fellowship',                 funder:'HFSP',                        stage:['postdoc'],        region:['International'],                fields:['Life Sciences','Biology'],       amount:'~$55k/year',         duration:'3 years',     url:'https://www.hfsp.org/funding/hfsp-funding/research-fellowships', desc:'International postdoctoral fellowships for life scientists changing research area or country.' },
  { id:'gdb18', name:'SNSF Postdoc.Mobility',                    funder:'SNSF (Switzerland)',           stage:['postdoc'],        region:['Switzerland','International'],  fields:['All'],                           amount:'~CHF 80k',           duration:'18 months',   url:'https://www.snf.ch/en/funding/careers/postdoc-mobility', desc:'Swiss NSF grants for postdocs going abroad. Swiss-based researchers only.' },
  { id:'gdb19', name:'DAAD Research Grants',                      funder:'DAAD (Germany)',              stage:['phd','postdoc'],  region:['Germany','International'],      fields:['All'],                           amount:'Varies',             duration:'1–24 months', url:'https://www.daad.de/en/',                              desc:'German Academic Exchange Service. Supports research stays in Germany and abroad.' },
  { id:'gdb37', name:'Branco Weiss Fellowship',                   funder:'Branco Weiss Society',        stage:['postdoc'],        region:['International'],                fields:['All'],                           amount:'CHF 200k/year',      duration:'Up to 5 years',url:'https://brancoweiss.ethz.ch/',                         desc:'Extremely competitive fellowship for independent thinkers. Funds unconventional, early-career research worldwide.' },
  { id:'gdb38', name:'Banting Postdoctoral Fellowship',           funder:'Government of Canada',        stage:['postdoc'],        region:['Canada'],                       fields:['All'],                           amount:'$70k CAD/year',      duration:'2 years',     url:'https://banting.fellowships-bourses.gc.ca/',           desc:'Canada\'s most prestigious postdoctoral fellowship. Open to domestic and international applicants.' },
  { id:'gdb39', name:'JSPS Postdoctoral Fellowship',              funder:'JSPS (Japan)',                stage:['postdoc'],        region:['Japan'],                        fields:['All'],                           amount:'¥362k/mo + allowance',duration:'12–24 months',url:'https://www.jsps.go.jp/english/e-fellow/',             desc:'Japan Society for the Promotion of Science fellowships for overseas researchers to work in Japan.' },
  { id:'gdb40', name:'NWO Veni Grant',                            funder:'NWO (Netherlands)',           stage:['postdoc'],        region:['Netherlands'],                  fields:['All'],                           amount:'Up to €320k',        duration:'3 years',     url:'https://www.nwo.nl/en/calls/nwo-talent-programme-veni-2025', desc:'Dutch talent grant for researchers who recently received their PhD. Funds independent research at Dutch institutions.' },
  { id:'gdb41', name:'DFG Walter Benjamin Programme',             funder:'DFG (Germany)',               stage:['postdoc'],        region:['Germany','International'],      fields:['All'],                           amount:'Project-based',      duration:'2 years',     url:'https://www.dfg.de/en/research_funding/programmes/individual/walter-benjamin/', desc:'DFG mobility programme for early postdocs to pursue independent research at host institutions worldwide.' },
  { id:'gdb42', name:'Leverhulme Trust Early Career Fellowship',  funder:'Leverhulme Trust (UK)',       stage:['postdoc'],        region:['UK'],                           fields:['All'],                           amount:'50% salary match',   duration:'3 years',     url:'https://www.leverhulme.ac.uk/early-career-fellowships', desc:'For early-career researchers at UK institutions. Leverhulme covers 50%, host institution 50%.' },
  { id:'gdb43', name:'British Academy Postdoctoral Fellowship',   funder:'British Academy (UK)',        stage:['postdoc'],        region:['UK'],                           fields:['Humanities','Social Sciences'],  amount:'~£30k/year',         duration:'3 years',     url:'https://www.thebritishacademy.ac.uk/funding/postdoctoral-fellowships/', desc:'Humanities and social sciences postdoctoral fellowship at UK institutions. Highly prestigious.' },
  { id:'gdb44', name:'EMBL Interdisciplinary Postdoc Programme',  funder:'EMBL',                        stage:['postdoc'],        region:['Europe'],                       fields:['Life Sciences','Computer Science'],amount:'Salary + benefits', duration:'2+1 years',   url:'https://www.embl.org/about/info/postdoctoral-programme/', desc:'Interdisciplinary postdoc positions across EMBL sites. Strong computational/quantitative biology component.' },
  { id:'gdb45', name:'Ford Foundation Postdoctoral Fellowship',   funder:'Ford Foundation (USA)',       stage:['postdoc'],        region:['USA'],                          fields:['All'],                           amount:'$45k/year',          duration:'1 year',      url:'https://www.nationalacademies.org/our-work/ford-foundation-fellowships', desc:'For US-based scholars from underrepresented groups. All disciplines. Administered by National Academies.' },
  { id:'gdb46', name:'Burroughs Wellcome Fund Career Award',      funder:'Burroughs Wellcome Fund',     stage:['postdoc'],        region:['USA','Canada'],                 fields:['Biomedical','Life Sciences'],    amount:'$500k–$1M',          duration:'5 years',     url:'https://www.bwfund.org/',                              desc:'Prestigious career development award for postdocs transitioning to independent biomedical research positions.' },
  // ── PIs / Early-Career Researchers ────────────────────────────────────────────
  { id:'gdb20', name:'ERC Starting Grant',                        funder:'European Research Council',   stage:['pi'],             region:['EU'],                           fields:['All'],                           amount:'Up to €1.5M',        duration:'5 years',     url:'https://erc.europa.eu/apply-grant/starting-grant',     desc:'For early-career researchers 2–7 years post-PhD with a European host institution.' },
  { id:'gdb21', name:'ERC Consolidator Grant',                    funder:'European Research Council',   stage:['pi'],             region:['EU'],                           fields:['All'],                           amount:'Up to €2M',          duration:'5 years',     url:'https://erc.europa.eu/apply-grant/consolidator-grant', desc:'For researchers 7–12 years post-PhD with a European host institution.' },
  { id:'gdb22', name:'DFG Research Grant',                        funder:'DFG (Germany)',               stage:['postdoc','pi'],   region:['Germany'],                      fields:['All'],                           amount:'Project-based',      duration:'1–3 years',   url:'https://www.dfg.de/',                                  desc:'German Research Foundation grants for individual research projects. Open to researchers worldwide at German institutions.' },
  { id:'gdb23', name:'ANR Young Researcher (JCJC)',               funder:'ANR (France)',                stage:['pi'],             region:['France'],                       fields:['All'],                           amount:'~€300k',             duration:'4 years',     url:'https://anr.fr/en/call-for-proposals-details/',        desc:'French ANR grants for early-career PIs at French institutions. Strong track record required.' },
  { id:'gdb24', name:'FWF Individual Project',                    funder:'FWF (Austria)',               stage:['pi'],             region:['Austria'],                      fields:['All'],                           amount:'Project-based',      duration:'1–4 years',   url:'https://www.fwf.ac.at/en/research-funding/fwf-programmes/standalone-projects', desc:'Austrian Science Fund standalone grants for all research areas.' },
  { id:'gdb25', name:'Volkswagen Foundation Freigeist',           funder:'Volkswagen Foundation',       stage:['postdoc','pi'],   region:['Germany'],                      fields:['All'],                           amount:'Up to €1M',          duration:'5 years',     url:'https://www.volkswagenstiftung.de/en/funding/for-researchers-at-a-transitional-stage/freigeist-fellowships', desc:'For bold, unconventional research ideas. Exceptional track record required.' },
  { id:'gdb47', name:'ERC Advanced Grant',                        funder:'European Research Council',   stage:['pi'],             region:['EU'],                           fields:['All'],                           amount:'Up to €3.5M',        duration:'5 years',     url:'https://erc.europa.eu/apply-grant/advanced-grant',     desc:'For established research leaders 10+ years post-PhD at European institutions.' },
  { id:'gdb48', name:'Wellcome Trust Investigator Award',         funder:'Wellcome Trust (UK)',         stage:['pi'],             region:['UK','International'],           fields:['Biomedical','Life Sciences'],    amount:'Up to £4M',          duration:'5–7 years',   url:'https://wellcome.org/grant-funding/schemes/investigator-awards-science', desc:'For outstanding research leaders in biomedical sciences. UK and certain low/middle income countries.' },
  { id:'gdb49', name:'NIH K99/R00 Pathway to Independence',       funder:'NIH (USA)',                   stage:['pi'],             region:['USA'],                          fields:['Biomedical','Life Sciences'],    amount:'~$250k/year',        duration:'2+3 years',   url:'https://grants.nih.gov/grants/guide/pa-files/PA-24-171.html', desc:'Career transition award for late-stage postdocs moving to independent faculty positions in the USA.' },
  { id:'gdb50', name:'NSF CAREER Award',                          funder:'NSF (USA)',                   stage:['pi'],             region:['USA'],                          fields:['STEM'],                          amount:'$400–500k',          duration:'5 years',     url:'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=503214', desc:'NSF\'s most prestigious award for early-career faculty. Integrates research and education missions.' },
  { id:'gdb51', name:'Royal Society Research Grant',              funder:'Royal Society (UK)',          stage:['pi'],             region:['UK'],                           fields:['All'],                           amount:'Up to £20k',         duration:'1 year',      url:'https://royalsociety.org/grants/research-grants/',     desc:'Equipment and consumable costs for early-career UK researchers setting up their first lab.' },
  { id:'gdb52', name:'British Academy Small Research Grant',      funder:'British Academy (UK)',        stage:['pi'],             region:['UK'],                           fields:['Humanities','Social Sciences'],  amount:'Up to £10k',         duration:'1–2 years',   url:'https://www.thebritishacademy.ac.uk/funding/small-research-grants/', desc:'Supports primary research in humanities and social sciences for UK-based researchers.' },
  { id:'gdb53', name:'NWO Vidi Grant',                            funder:'NWO (Netherlands)',           stage:['pi'],             region:['Netherlands'],                  fields:['All'],                           amount:'Up to €800k',        duration:'5 years',     url:'https://www.nwo.nl/en/calls/nwo-talent-programme-vidi-2025', desc:'Dutch talent grant for researchers several years post-PhD establishing their own research line.' },
  { id:'gdb54', name:'Swedish Research Council Starting Grant',   funder:'Vetenskapsrådet (Sweden)',    stage:['pi'],             region:['Scandinavia'],                  fields:['All'],                           amount:'4–7M SEK/year',      duration:'4 years',     url:'https://www.vr.se/english.html',                       desc:'For researchers 2–7 years post-PhD at Swedish institutions. Covers all scientific disciplines.' },
  { id:'gdb55', name:'ARC Discovery Early Career Award (DECRA)',  funder:'Australian Research Council', stage:['pi'],             region:['Australia'],                    fields:['All'],                           amount:'~$425k AUD',         duration:'3 years',     url:'https://www.arc.gov.au/funding-research/funding-schemes/discovery-program/discovery-early-career-researcher-award-decra', desc:'Australian Research Council fellowship for early-career researchers at Australian institutions.' },
  { id:'gdb56', name:'Academy of Finland Research Fellow',        funder:'Academy of Finland',          stage:['pi'],             region:['Scandinavia'],                  fields:['All'],                           amount:'~€350k',             duration:'4 years',     url:'https://www.aka.fi/en/funding/',                       desc:'Four-year research positions at Finnish universities for early-career researchers.' },
  { id:'gdb57', name:'Novo Nordisk Foundation Postdoc + PI Grant',funder:'Novo Nordisk Foundation',     stage:['postdoc','pi'],   region:['Scandinavia','International'],  fields:['Biomedical','Life Sciences'],    amount:'Varies (large)',     duration:'2–5 years',   url:'https://novonordiskfonden.dk/en/grants/',               desc:'Danish foundation funding biomedical and life science research. Several international grant types available.' },
  { id:'gdb58', name:'Research Corporation Cottrell Scholar',     funder:'Research Corporation (USA)',  stage:['pi'],             region:['USA'],                          fields:['Physics','Chemistry','Astronomy'],amount:'$100k',             duration:'3 years',     url:'https://rescorp.org/cottrell-scholars',                desc:'For early-career faculty in physical sciences at US universities. Integrates research and teaching.' },
]

const STAGES  = ['phd','masters','postdoc','pi']
const REGIONS = ['EU','International','USA','UK','Germany','France','Austria','Switzerland','Europe','Canada','Australia','Netherlands','Scandinavia','Japan','China']
const FIELDS  = ['All','STEM','Life Sciences','Biomedical','Chemistry','Physics','Engineering','Computer Science','Mathematics','Social Sciences','Humanities','Psychology','Neuroscience','Economics','Biology','Environmental Sciences','Medicine','Astronomy']

// ── Grant resource databases ──────────────────────────────────────────────────
const GRANT_RESOURCES = [
  { id:'gr1',  name:'Grants.gov',                                scope:'Global',         region:'USA',           desc:'All US federal grant opportunities. Search by keyword, agency, or CFDA number.',          url:'https://www.grants.gov/' },
  { id:'gr2',  name:'NIH Research Portfolio (Reporter)',         scope:'National',       region:'USA',           desc:'Search NIH-funded projects by keyword, PI, institution, or disease area.',                  url:'https://reporter.nih.gov/' },
  { id:'gr3',  name:'Horizon Europe Funding & Tenders Portal',  scope:'EU',             region:'EU',            desc:'Official portal for all Horizon Europe calls — ERC, MSCA, collaborative grants.',             url:'https://ec.europa.eu/info/funding-tenders/opportunities/portal/' },
  { id:'gr4',  name:'UKRI Funding Finder',                      scope:'National',       region:'UK',            desc:'All UK Research and Innovation funding calls across AHRC, BBSRC, EPSRC, MRC, NERC, ESRC.',   url:'https://www.ukri.org/opportunity/' },
  { id:'gr5',  name:'DFG GEPRIS (Funded Projects)',             scope:'National',       region:'Germany',       desc:'Database of DFG-funded projects — useful for finding collaborators and understanding DFG priorities.', url:'https://gepris.dfg.de/gepris/OCTOPUS' },
  { id:'gr6',  name:'SNSF Funding Portal',                      scope:'National',       region:'Switzerland',   desc:'Swiss National Science Foundation calls and career funding (Ambizione, PRIMA, Spark, etc.).',  url:'https://www.snf.ch/en/funding' },
  { id:'gr7',  name:'NWO Calls & Deadlines',                    scope:'National',       region:'Netherlands',   desc:'Netherlands Organisation for Scientific Research — Veni/Vidi/Vici talent program and open calls.', url:'https://www.nwo.nl/en/calls' },
  { id:'gr8',  name:'ANR Open Calls',                           scope:'National',       region:'France',        desc:'French National Research Agency — generic call, young researcher grants, collaborative programs.', url:'https://anr.fr/en/open-calls-and-results/' },
  { id:'gr9',  name:'FWF Grant Programmes',                     scope:'National',       region:'Austria',       desc:'Austrian Science Fund — standalone projects, Esprit, Elise Richter, and international programs.', url:'https://www.fwf.ac.at/en/research-funding/fwf-programmes' },
  { id:'gr10', name:'Academy of Finland Calls',                 scope:'National',       region:'Scandinavia',   desc:'Finnish research funding — academy researcher posts, research projects, consortium funding.',     url:'https://www.aka.fi/en/funding/' },
  { id:'gr11', name:'Research Council of Norway',               scope:'National',       region:'Scandinavia',   desc:'Norwegian research funding — FRIMEDBIO, FRINATEK, FRIPRO and NORCE calls.',                    url:'https://www.forskningsradet.no/en/' },
  { id:'gr12', name:'Swedish Research Council (VR)',            scope:'National',       region:'Scandinavia',   desc:'Vetenskapsrådet — research project grants, international postdoc, starting grants.',             url:'https://www.vr.se/english/applyingforfunding.html' },
  { id:'gr13', name:'Australian Research Council (ARC)',        scope:'National',       region:'Australia',     desc:'Discovery Early Career (DECRA), Discovery Projects, Future Fellowships, and Linkage grants.',   url:'https://www.arc.gov.au/funding-research' },
  { id:'gr14', name:'NSERC / SSHRC / CIHR (Canada Tri-Agency)', scope:'National',       region:'Canada',        desc:'Canada\'s three federal research granting agencies for natural sciences, social sciences, and health.', url:'https://science.gc.ca/site/science/en/funding' },
  { id:'gr15', name:'Wellcome Trust Grant Finder',              scope:'Global',         region:'International', desc:'Wellcome funding across biomedical, population health, social science, and humanities.',          url:'https://wellcome.org/grant-funding' },
  { id:'gr16', name:'Volkswagen Foundation Funding',            scope:'National',       region:'Germany',       desc:'German foundation — Freigeist, Momentum, Peter Seligmann, and international programs.',          url:'https://www.volkswagenstiftung.de/en/funding' },
  { id:'gr17', name:'Gates Foundation Grand Challenges',        scope:'Global',         region:'International', desc:'Bill and Melinda Gates Foundation — global health, agriculture, and development challenges.',      url:'https://gcgh.grandchallenges.org/' },
  { id:'gr18', name:'Pivot-RP (ProQuest)',                      scope:'Global',         region:'International', desc:'Comprehensive funding database. Requires institutional subscription — check if your library has access.', url:'https://pivot.proquest.com/' },
  { id:'gr19', name:'GrantForward',                             scope:'Global',         region:'International', desc:'Funding search engine with ~10,000+ sponsors. Many universities provide free institutional access.', url:'https://www.grantforward.com/' },
  { id:'gr20', name:'OpenAIRE Funding',                         scope:'EU',             region:'EU',            desc:'EU and global open-access funding opportunities, linked to Horizon Europe and national funders.', url:'https://explore.openaire.eu/search/find/funding' },
]

// ── Field → grant keyword mapping ────────────────────────────────────────────
const _FIELD_KEYWORDS = {
  'Life Sciences':         ['biology','molecular','cell','biochem','evolution','ecology','genomics','protein','genetics','microbiology','zoology','botany'],
  'Biomedical':            ['biomedical','medical','clinical','disease','therapy','pharmaceutical','drug','health','translational','immunology','pathology','oncology'],
  'Chemistry':             ['chemistry','chemical','synthesis','organic','inorganic','materials','polymer','spectroscopy','catalysis'],
  'Physics':               ['physics','quantum','condensed matter','optics','photon','particle','astrophys','cosmology','atomic'],
  'Engineering':           ['engineering','mechanical','electrical','civil','aerospace','robotics','systems','manufacturing','structural'],
  'Computer Science':      ['computer','computing','software','algorithm','artificial intelligence','machine learning','deep learning','neural network','data science','computational','programming','nlp','vision'],
  'Mathematics':           ['mathematics','math','statistic','topology','algebra','geometry','analysis','probability','combinatorics'],
  'Social Sciences':       ['social','sociology','anthropology','political','communication','media','education','economics','public policy'],
  'Humanities':            ['history','philosophy','literature','linguistics','cultural','archaeology','art','heritage','ethics'],
  'Psychology':            ['psychology','cognitive','behavioral','mental health','perception','neurocognitive','psychotherapy'],
  'Neuroscience':          ['neuroscience','neurology','brain','neural','connectome','neuroimaging','synaptic','cortex','cognitive neuroscience'],
  'Economics':             ['economics','finance','econometrics','macroeconomics','microeconomics','game theory','market'],
  'Biology':               ['biology','zoology','botany','microbiology','evolution','ecology','developmental'],
  'Environmental Sciences':['environment','climate','sustainability','conservation','earth science','ecology','atmospheric','geoscience'],
  'Medicine':              ['medicine','clinical','surgery','cardiology','immunology','pathology','pharmaceutical','epidemiology'],
  'Astronomy':             ['astronomy','astrophysics','cosmology','telescope','space','planet','stellar','gravitational'],
}

function _fieldScore(grantFields, profileField) {
  if (!profileField) return 0
  const pf = profileField.toLowerCase()
  if (grantFields.includes('All')) return 1

  let score = 0
  for (const [field, keywords] of Object.entries(_FIELD_KEYWORDS)) {
    if (!grantFields.includes(field) && !grantFields.includes('STEM')) continue
    for (const kw of keywords) {
      if (pf.includes(kw.toLowerCase())) { score += 2; break }
    }
    if (grantFields.includes(field)) score += 1
  }
  // Direct field name match
  for (const gf of grantFields) {
    if (pf.includes(gf.toLowerCase())) score += 3
  }
  return score
}

function _grantMatchReasons(g, profile) {
  const stage  = profile?.careerStage
  const field  = profile?.field || ''
  const region = profile?.region || ''
  const reasons = []

  if (stage && g.stage.includes(stage))
    reasons.push({ text: stage === 'phd' ? 'PhD ✓' : stage === 'postdoc' ? 'Postdoc ✓' : 'PI ✓', color: 'emerald' })

  const fs = _fieldScore(g.fields, field)
  if (fs > 0)
    reasons.push({ text: g.fields[0] === 'All' ? 'All fields ✓' : `${g.fields[0]} ✓`, color: 'indigo' })

  if (region && g.region.some(r => r === region || r === 'International' || r === 'EU'))
    reasons.push({ text: `${g.region.includes(region) ? region : 'International'} ✓`, color: 'violet' })

  return reasons
}

function _rankForProfile(grants, profile) {
  const stage = profile?.careerStage
  const field = profile?.field || ''
  return [...grants]
    .map(g => {
      let score = 0
      if (stage && g.stage.includes(stage))   score += 10
      score += _fieldScore(g.fields, field) * 3
      return { g, score }
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.g)
}

// ── Active tab ────────────────────────────────────────────────────────────────
let _grantTab = 'foryou'

function render_grants() {
  const vc = document.getElementById('view-content')
  const myCount = state.grants.length
  // First visit with no tracked grants → show For You
  if (_grantTab === 'mine' && !myCount) _grantTab = 'foryou'

  const tabs = [
    { id:'foryou',    label:'✨ For You' },
    { id:'mine',      label:`📊 My Grants${myCount ? ` <span class="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">${myCount}</span>` : ''}` },
    { id:'scan',      label:`🔍 Scan <span class="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">${GRANT_DB.length}</span>` },
    { id:'resources', label:'🌐 Databases' },
  ]

  vc.innerHTML = `
  ${pageHeader('💰 Grant Scan', `
    <div class="flex gap-2">
      ${_grantTab==='mine' ? `<button onclick="openGrantModal()" class="btn-primary text-xs py-2">+ Add Grant</button>` : ''}
    </div>`)}

  <!-- Tabs -->
  <div class="bg-white border-b border-slate-200 px-5 flex gap-1 flex-shrink-0">
    ${tabs.map(t => `
    <button onclick="switchGrantTab('${t.id}')" data-gtab="${t.id}"
      class="px-4 py-3 text-sm font-medium border-b-2 transition-colors ${_grantTab===t.id?'border-indigo-600 text-indigo-700':'border-transparent text-slate-500 hover:text-slate-700'}">
      ${t.label}
    </button>`).join('')}
  </div>

  <div class="flex-1 overflow-y-auto">
    <div id="grant-tab-content" class="h-full"></div>
  </div>`

  renderGrantTab()
}

function switchGrantTab(tab) {
  _grantTab = tab
  document.querySelectorAll('[data-gtab]').forEach(b => {
    const active = b.dataset.gtab === tab
    b.className = `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${active
      ? 'border-indigo-600 text-indigo-700'
      : 'border-transparent text-slate-500 hover:text-slate-700'}`
  })
  const btn = document.querySelector('[onclick="openGrantModal()"]')
  if (btn) btn.style.display = tab === 'mine' ? '' : 'none'
  renderGrantTab()
}

function renderGrantTab() {
  const el = document.getElementById('grant-tab-content')
  if (!el) return
  if      (_grantTab === 'foryou')    el.innerHTML = buildForYouHTML()
  else if (_grantTab === 'mine')      el.innerHTML = buildMyGrantsHTML()
  else if (_grantTab === 'scan')      el.innerHTML = buildScanHTML()
  else                                el.innerHTML = buildResourcesHTML()
}

// ── FOR YOU ───────────────────────────────────────────────────────────────────
function buildForYouHTML() {
  const p = state.profile || {}
  const stage  = p.careerStage
  const field  = p.field || ''
  const region = p.region || ''

  const stageLabels = { phd:'PhD Student', masters:'Masters Student', postdoc:'Postdoc', pi:'PI / Group Leader' }

  // Profile setup card — shown when career stage is missing
  const setupCard = !stage ? `
  <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6">
    <div class="flex items-start gap-3">
      <div class="text-2xl">🎯</div>
      <div class="flex-1">
        <h3 class="text-sm font-bold text-indigo-900 mb-1">Tell us where you are in your career</h3>
        <p class="text-xs text-indigo-700 mb-3">PhDFlow uses your career stage and research field to surface the grants most likely to be relevant to you.</p>
        <div class="flex flex-wrap gap-2">
          ${['phd','masters','postdoc','pi'].map(s => `
          <button onclick="grantSetStage('${s}')"
            class="px-3 py-1.5 rounded-xl border-2 border-indigo-200 bg-white text-xs font-semibold text-indigo-700
              hover:border-indigo-500 hover:bg-indigo-50 transition-all">
            ${stageLabels[s]}
          </button>`).join('')}
        </div>
      </div>
    </div>
  </div>` : ''

  // Profile summary pill — shown when stage is set
  const profilePill = stage ? `
  <div class="flex items-center gap-2 mb-5 flex-wrap">
    <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
      <span class="font-semibold text-slate-700">Showing grants for:</span>
      <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">${stageLabels[stage]}</span>
      ${field ? `<span class="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">${esc(field)}</span>` : ''}
      ${region ? `<span class="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">${esc(region)}</span>` : ''}
    </div>
    <button onclick="grantEditProfile()" class="text-xs text-slate-400 hover:text-indigo-600 hover:underline transition-colors">Edit profile</button>
  </div>` : ''

  // Get ranked grants
  let ranked = _rankForProfile(GRANT_DB, p)
  if (stage) ranked = ranked.filter(g => g.stage.includes(stage))
  // If field is set, only show grants with score > 0 first, then the rest
  if (!ranked.length) ranked = GRANT_DB.filter(g => stage ? g.stage.includes(stage) : true)

  const alreadyTracked = new Set(state.grants.map(g => g.sourceId).filter(Boolean))
  const top = ranked.slice(0, 12)

  const matchChip = (reason) => {
    const colors = { emerald:'bg-emerald-100 text-emerald-700', indigo:'bg-indigo-100 text-indigo-700', violet:'bg-violet-100 text-violet-700' }
    return `<span class="text-xs px-1.5 py-0.5 rounded-full font-medium ${colors[reason.color]||'bg-slate-100 text-slate-600'}">${reason.text}</span>`
  }

  const grantCard = (g) => {
    const tracked = alreadyTracked.has(g.id)
    const reasons = _grantMatchReasons(g, p)
    const stageChips = g.stage.map(s => {
      const sc = {phd:'bg-indigo-100 text-indigo-700',postdoc:'bg-purple-100 text-purple-700',pi:'bg-teal-100 text-teal-700',masters:'bg-slate-100 text-slate-600'}
      return `<span class="text-xs px-2 py-0.5 rounded-full ${sc[s]||'bg-slate-100 text-slate-600'}">${s==='phd'?'PhD':s==='pi'?'PI':s==='masters'?'Masters':'Postdoc'}</span>`
    }).join('')

    return `
    <div class="bg-white border ${reasons.length > 1 ? 'border-indigo-200' : 'border-slate-200'} rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div>
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-bold text-slate-900 text-sm leading-snug">${esc(g.name)}</h3>
          ${tracked ? `<span class="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Tracking</span>` : ''}
        </div>
        <p class="text-xs text-slate-500 mt-0.5">${esc(g.funder)}</p>
      </div>
      ${reasons.length ? `<div class="flex gap-1 flex-wrap">${reasons.map(matchChip).join('')}</div>` : ''}
      <p class="text-xs text-slate-600 leading-relaxed">${esc(g.desc)}</p>
      <div class="flex gap-1.5 flex-wrap">
        ${stageChips}
        ${g.region.slice(0,2).map(r=>`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${r}</span>`).join('')}
        ${g.fields[0]!=='All'?`<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">${g.fields[0]}</span>`:''}
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
        <span class="font-medium">${g.amount}${g.duration?' · '+g.duration:''}</span>
        <div class="flex gap-2">
          <button onclick="window.api.openExternal('${esc(g.url)}')" class="text-indigo-500 hover:underline">Website ↗</button>
          ${!tracked ? `<button onclick="trackDiscoveredGrant('${g.id}')" class="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">+ Track</button>` : ''}
        </div>
      </div>
    </div>`
  }

  const emptyMsg = !stage
    ? `<div class="col-span-2 py-8 text-center text-slate-400 text-sm">Set your career stage above to see personalised recommendations.</div>`
    : `<div class="col-span-2 py-8 text-center text-slate-400 text-sm">No grants in the database match your current filters. <button onclick="switchGrantTab('scan')" class="text-indigo-500 hover:underline">Browse all grants →</button></div>`

  return `
  <div class="p-5 max-w-4xl">
    ${setupCard}
    ${profilePill}
    ${top.length ? `
    <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      ${top.map(grantCard).join('')}
    </div>
    <div class="mt-4 text-center">
      <button onclick="switchGrantTab('scan')" class="text-sm text-indigo-600 hover:underline">
        Browse all ${GRANT_DB.length} grants in the database →
      </button>
    </div>` : emptyMsg}
  </div>`
}

async function grantSetStage(stage) {
  if (!state.profile) state.profile = {}
  state.profile.careerStage = stage
  await save('profile')
  renderGrantTab()
}

function grantEditProfile() {
  const p = state.profile || {}
  const stageLabels = { phd:'PhD Student', masters:'Masters Student', postdoc:'Postdoc', pi:'PI / Group Leader' }
  openModal(`
  <h3 class="text-base font-bold text-slate-900 mb-4">🎯 Grant Profile</h3>
  <div class="space-y-3">
    <div>
      <label class="label">Career stage</label>
      <div class="flex flex-wrap gap-2 mt-1">
        ${['phd','masters','postdoc','pi'].map(s => `
        <button id="gs-stage-${s}" onclick="grantProfileStageSelect('${s}')"
          class="px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all
            ${p.careerStage===s?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}">
          ${stageLabels[s]}
        </button>`).join('')}
      </div>
    </div>
    <div>
      <label class="label">Research field</label>
      <input id="gp-field" type="text" value="${esc(p.field||'')}" class="input"
        placeholder="e.g. Computational Neuroscience"/>
    </div>
    <div>
      <label class="label">Home region / country</label>
      <select id="gp-region" class="input">
        <option value="">— Not specified —</option>
        ${['EU','USA','UK','Germany','France','Austria','Switzerland','Netherlands','Scandinavia','Canada','Australia','Japan','International'].map(r =>
          `<option value="${r}" ${p.region===r?'selected':''}>${r}</option>`
        ).join('')}
      </select>
    </div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveGrantProfile()" class="flex-1 btn-primary">Save</button>
    </div>
  </div>`)
  window._gpStage = p.careerStage || null
}

function grantProfileStageSelect(s) {
  window._gpStage = s
  ;['phd','masters','postdoc','pi'].forEach(st => {
    const btn = document.getElementById(`gs-stage-${st}`)
    if (!btn) return
    btn.className = `px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${
      st === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`
  })
}

async function saveGrantProfile() {
  if (!state.profile) state.profile = {}
  state.profile.careerStage = window._gpStage || null
  state.profile.field  = document.getElementById('gp-field')?.value.trim() || state.profile.field || ''
  state.profile.region = document.getElementById('gp-region')?.value || null
  await save('profile')
  closeModal()
  renderGrantTab()
  showToast('Grant profile saved ✓')
}

// ── MY GRANTS ─────────────────────────────────────────────────────────────────
function buildMyGrantsHTML() {
  if (!state.grants.length) return `
  <div class="p-6 flex flex-col items-center justify-center h-full text-center">
    ${emptyState('🔍','No grants tracked yet','Scan the database to find opportunities, or add a grant manually')}
    <button onclick="switchGrantTab('scan')" class="mt-4 btn-primary text-sm">🔍 Scan grant database</button>
  </div>`

  const now = new Date()

  const counts = {}
  const STATUSES = ['researching','drafting','submitted','awarded','rejected']
  STATUSES.forEach(s => counts[s] = state.grants.filter(g=>g.status===s).length)

  const statusColors = {
    researching:'bg-purple-100 text-purple-700 border-purple-200',
    drafting:   'bg-amber-100 text-amber-700 border-amber-200',
    submitted:  'bg-blue-100 text-blue-700 border-blue-200',
    awarded:    'bg-green-100 text-green-700 border-green-200',
    rejected:   'bg-slate-100 text-slate-500 border-slate-200'
  }

  const sorted = [...state.grants].sort((a,b) => {
    const order = {researching:0,drafting:1,submitted:2,awarded:3,rejected:4}
    if ((order[a.status]||0) !== (order[b.status]||0)) return (order[a.status]||0)-(order[b.status]||0)
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1; if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  })

  return `
  <!-- Pipeline strip -->
  <div class="bg-white border-b border-slate-100 px-5 py-3 flex gap-2 flex-wrap">
    ${STATUSES.map(s => counts[s] ? `
    <span class="text-xs px-2.5 py-1 rounded-full border font-medium ${statusColors[s]}">
      ${s[0].toUpperCase()+s.slice(1)}: ${counts[s]}
    </span>` : '').join('')}
  </div>

  <!-- Grant cards -->
  <div class="p-5 space-y-3 max-w-3xl">
    ${sorted.map(g => {
      let deadlineBanner = ''
      if (g.deadline) {
        const daysLeft = Math.round((new Date(g.deadline) - now) / 864e5)
        if (g.status !== 'awarded' && g.status !== 'rejected') {
          if      (daysLeft < 0)    deadlineBanner = `<div class="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">🔴 Deadline passed ${Math.abs(daysLeft)}d ago</div>`
          else if (daysLeft === 0)  deadlineBanner = `<div class="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">🔴 Deadline is TODAY</div>`
          else if (daysLeft <= 7)   deadlineBanner = `<div class="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1">⏰ Deadline in ${daysLeft} day${daysLeft>1?'s':''}!</div>`
          else if (daysLeft <= 30)  deadlineBanner = `<div class="mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">📅 ${daysLeft} days until deadline</div>`
        }
      }
      const reqsDone = (g.requirements||[]).filter(r=>r.done).length
      const reqsTotal = (g.requirements||[]).length

      return `
      <div class="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer" onclick="openGrantDetail('${g.id}')">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-slate-900 text-sm">${esc(g.title||g.funder)}</h3>
            <p class="text-xs text-slate-500 mt-0.5">${esc(g.funder)}</p>
          </div>
          <span class="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 border ${statusColors[g.status]||'bg-slate-100 text-slate-500 border-slate-200'}">${g.status||'researching'}</span>
        </div>
        <div class="flex gap-4 mt-2.5 text-xs text-slate-400 flex-wrap">
          ${g.deadline ? `<span>🗓 ${fmtDate(g.deadline)}</span>` : '<span class="italic">No deadline set</span>'}
          ${g.amount   ? `<span>💰 ${esc(g.amount)}</span>` : ''}
          ${g.duration ? `<span>⏱ ${esc(g.duration)}</span>` : ''}
          ${reqsTotal  ? `<span>📋 ${reqsDone}/${reqsTotal} requirements</span>` : ''}
        </div>
        ${deadlineBanner}
      </div>`
    }).join('')}
  </div>`
}

// ── SCAN ──────────────────────────────────────────────────────────────────────
let _dStage = '', _dRegion = 'all', _dField = 'all', _dSearch = ''
let _dScanInited = false

function _initScanFilters() {
  if (_dScanInited) return
  _dScanInited = true
  const p = state.profile || {}
  if (p.careerStage) _dStage  = p.careerStage
  if (p.region)      _dRegion = p.region
}

function buildScanHTML() {
  _initScanFilters()
  let grants = GRANT_DB
  const p = state.profile || {}

  if (_dStage  && _dStage !== 'all')  grants = grants.filter(g => g.stage.includes(_dStage))
  if (_dRegion !== 'all') grants = grants.filter(g => g.region.some(r => r === _dRegion || r === 'International'))
  if (_dField  !== 'all') grants = grants.filter(g => g.fields.includes('All') || g.fields.includes(_dField))
  if (_dSearch)           grants = grants.filter(g =>
    g.name.toLowerCase().includes(_dSearch) || g.funder.toLowerCase().includes(_dSearch) || g.desc.toLowerCase().includes(_dSearch))

  const alreadyTracked = new Set(state.grants.map(g => g.sourceId).filter(Boolean))
  const profileActive  = !!p.careerStage

  return `
  <!-- Scan filters -->
  <div class="bg-white border-b border-slate-100 px-5 py-3 flex gap-2 flex-wrap items-center">
    <input type="text" placeholder="Search grants, funders, keywords..." value="${esc(_dSearch)}"
      oninput="_dSearch=this.value;document.getElementById('grant-tab-content').innerHTML=buildScanHTML()"
      class="flex-1 min-w-48 px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
    <select onchange="_dStage=this.value;document.getElementById('grant-tab-content').innerHTML=buildScanHTML()" class="input" style="width:auto;padding:.3rem .7rem;font-size:.8rem">
      <option value=""        ${!_dStage||_dStage==='all'?'selected':''}>All stages</option>
      <option value="phd"     ${_dStage==='phd'    ?'selected':''}>PhD Student</option>
      <option value="masters" ${_dStage==='masters'?'selected':''}>Masters</option>
      <option value="postdoc" ${_dStage==='postdoc'?'selected':''}>Postdoc</option>
      <option value="pi"      ${_dStage==='pi'     ?'selected':''}>PI / Group Leader</option>
    </select>
    <select onchange="_dRegion=this.value;document.getElementById('grant-tab-content').innerHTML=buildScanHTML()" class="input" style="width:auto;padding:.3rem .7rem;font-size:.8rem">
      <option value="all" ${_dRegion==='all'?'selected':''}>All regions</option>
      ${REGIONS.map(r=>`<option value="${r}" ${_dRegion===r?'selected':''}>${r}</option>`).join('')}
    </select>
    <select onchange="_dField=this.value;document.getElementById('grant-tab-content').innerHTML=buildScanHTML()" class="input" style="width:auto;padding:.3rem .7rem;font-size:.8rem">
      <option value="all" ${_dField==='all'?'selected':''}>All fields</option>
      ${FIELDS.filter(f=>f!=='All').map(f=>`<option value="${f}" ${_dField===f?'selected':''}>${f}</option>`).join('')}
    </select>
    <div class="flex items-center gap-2">
      <span class="text-xs text-slate-400 whitespace-nowrap">${grants.length} of ${GRANT_DB.length}</span>
      ${(_dStage||_dRegion!=='all'||_dField!=='all'||_dSearch) ? `<button onclick="_dStage='';_dRegion='all';_dField='all';_dSearch='';_dScanInited=false;document.getElementById('grant-tab-content').innerHTML=buildScanHTML()" class="text-xs text-slate-400 hover:text-rose-500 transition-colors" title="Clear filters">✕ Clear</button>` : ''}
    </div>
  </div>
  ${profileActive && !_dSearch ? `<div class="px-5 pt-3 text-xs text-slate-400">Filters pre-applied from your <button onclick="grantEditProfile()" class="text-indigo-500 hover:underline">grant profile</button>.</div>` : ''}

  <!-- Grant cards -->
  <div class="p-5 grid grid-cols-1 gap-3 max-w-4xl lg:grid-cols-2">
    ${grants.length === 0
      ? `<div class="col-span-2 py-16 text-center text-slate-400">No grants match your filters.<br/><button onclick="_dStage='';_dRegion='all';_dField='all';_dSearch='';_dScanInited=false;document.getElementById('grant-tab-content').innerHTML=buildScanHTML()" class="mt-2 text-indigo-500 hover:underline text-sm">Clear filters</button></div>`
      : grants.map(g => {
        const tracked = alreadyTracked.has(g.id)
        const reasons = profileActive ? _grantMatchReasons(g, p) : []
        const stageChips = g.stage.map(s => {
          const sc = {phd:'bg-indigo-100 text-indigo-700',postdoc:'bg-purple-100 text-purple-700',pi:'bg-teal-100 text-teal-700',masters:'bg-slate-100 text-slate-600'}
          return `<span class="text-xs px-2 py-0.5 rounded-full ${sc[s]||'bg-slate-100 text-slate-600'}">${s==='phd'?'PhD':s==='pi'?'PI':s==='masters'?'Masters':'Postdoc'}</span>`
        }).join('')
        return `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-bold text-slate-900 text-sm leading-snug">${esc(g.name)}</h3>
              ${tracked ? `<span class="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Tracking</span>` : ''}
            </div>
            <p class="text-xs text-slate-500 mt-0.5">${esc(g.funder)}</p>
          </div>
          ${reasons.length ? `<div class="flex gap-1 flex-wrap">${reasons.map(r=>`<span class="text-xs px-1.5 py-0.5 rounded-full font-medium bg-${r.color}-100 text-${r.color}-700">${r.text}</span>`).join('')}</div>` : ''}
          <p class="text-xs text-slate-600 leading-relaxed">${esc(g.desc)}</p>
          <div class="flex gap-1.5 flex-wrap">
            ${stageChips}
            ${g.region.slice(0,2).map(r=>`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${r}</span>`).join('')}
            ${g.fields[0]!=='All'?`<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">${g.fields[0]}</span>`:''}
          </div>
          <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
            <span class="font-medium">${g.amount}${g.duration?' · '+g.duration:''}</span>
            <div class="flex gap-2">
              <button onclick="window.api.openExternal('${esc(g.url)}')" class="text-indigo-500 hover:underline">Website ↗</button>
              ${!tracked ? `<button onclick="trackDiscoveredGrant('${g.id}')" class="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">+ Track</button>` : ''}
            </div>
          </div>
        </div>`
      }).join('')}
  </div>`
}

function trackDiscoveredGrant(dbId) {
  const g = GRANT_DB.find(x=>x.id===dbId)
  if (!g) return
  state.grants.push({
    id: uid(), sourceId: dbId,
    title: g.name, funder: g.funder,
    amount: g.amount, duration: g.duration,
    status: 'researching', deadline: '',
    eligibility: g.desc, tags: [...g.stage, ...g.fields.filter(f=>f!=='All')],
    requirements: [], sections: [], coApplicants: [],
    notes: `Website: ${g.url}`,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  })
  save('grants')
  showToast(`"${g.name}" added to My Grants ✓`)
  renderGrantTab()
}

// ── RESOURCES ─────────────────────────────────────────────────────────────────
function buildResourcesHTML() {
  const scopeColors = {
    'Global':   'bg-indigo-100 text-indigo-700',
    'EU':       'bg-blue-100 text-blue-700',
    'National': 'bg-teal-100 text-teal-700',
  }

  const byRegion = {}
  GRANT_RESOURCES.forEach(r => {
    if (!byRegion[r.region]) byRegion[r.region] = []
    byRegion[r.region].push(r)
  })

  const regionOrder = ['International','EU','USA','UK','Germany','France','Austria','Switzerland','Netherlands','Scandinavia','Australia','Canada']

  return `
  <div class="p-5 max-w-4xl space-y-6">
    <!-- Intro -->
    <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
      <p class="font-semibold mb-1">💡 Finding more grants</p>
      <p class="text-xs text-indigo-700 leading-relaxed">The built-in database covers major fellowships, but most funding is only discoverable through your institution's research office or a proper grant database. Use the portals below to search by your field, career stage, and eligibility — then add any find to <em>My Grants</em> for tracking.</p>
    </div>

    <!-- Database cards by region -->
    ${regionOrder.filter(reg => byRegion[reg]).map(reg => `
    <div>
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">${reg}</h3>
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        ${byRegion[reg].map(r => `
        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between gap-2">
            <h4 class="font-bold text-slate-900 text-sm leading-snug">${esc(r.name)}</h4>
            <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${scopeColors[r.scope]||'bg-slate-100 text-slate-600'}">${r.scope}</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed flex-1">${esc(r.desc)}</p>
          <button onclick="window.api.openExternal('${esc(r.url)}')"
            class="self-start text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
            Open Database ↗
          </button>
        </div>`).join('')}
      </div>
    </div>`).join('')}

    <!-- Tips section -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <p class="text-sm font-bold text-slate-800 mb-3">🎯 Tips for finding grants</p>
      <ul class="text-xs text-slate-600 space-y-2 leading-relaxed">
        <li><span class="font-semibold text-slate-700">Talk to your research office:</span> Most universities have a dedicated grants team who know country- and institution-specific opportunities not listed in public databases.</li>
        <li><span class="font-semibold text-slate-700">Check your supervisor's funding:</span> Look up their grants on NIH Reporter, GEPRIS, or Horizon Europe — funders they use are likely relevant to your work too.</li>
        <li><span class="font-semibold text-slate-700">Follow funding bodies on social media:</span> ERC, Wellcome, HFSP and others announce new calls on X/LinkedIn before they appear in databases.</li>
        <li><span class="font-semibold text-slate-700">Ask your academic society:</span> Discipline-specific societies (ACS, SfN, ASA, etc.) often have their own travel and research grants not in general databases.</li>
        <li><span class="font-semibold text-slate-700">Set up alerts:</span> Grants.gov and UKRI allow email alerts for new calls matching your keywords.</li>
      </ul>
    </div>
  </div>`
}

// ── Grant modal (create / edit) ───────────────────────────────────────────────
function openGrantModal(id) {
  const g = id ? state.grants.find(x=>x.id===id) : null
  openModal(`
  <h3 class="text-base font-bold mb-4">${g ? 'Edit Grant' : 'Add Grant'}</h3>
  <div class="space-y-3">
    <div><label class="label">Grant Name *</label>
      <input id="gr-title" type="text" value="${esc(g?.title)}" placeholder="e.g. ERC Starting Grant 2026" class="input"/></div>
    <div><label class="label">Funder / Agency *</label>
      <input id="gr-funder" type="text" value="${esc(g?.funder)}" placeholder="ERC, NIH, DFG, EPSRC..." class="input"/></div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">Deadline</label>
        <input id="gr-deadline" type="date" value="${g?.deadline||''}" class="input"/></div>
      <div><label class="label">Status</label>
        <select id="gr-status" class="input">
          ${['researching','drafting','submitted','awarded','rejected'].map(s=>`<option value="${s}" ${g?.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}
        </select></div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div><label class="label">Amount</label>
        <input id="gr-amount" type="text" value="${esc(g?.amount)}" placeholder="€1,500,000" class="input"/></div>
      <div><label class="label">Duration</label>
        <input id="gr-duration" type="text" value="${esc(g?.duration)}" placeholder="5 years" class="input"/></div>
    </div>
    <div><label class="label">Eligibility / Notes</label>
      <textarea id="gr-eligibility" rows="2" class="input resize-none" placeholder="Career stage, institution requirements...">${esc(g?.eligibility||g?.notes)}</textarea></div>
    <div class="flex gap-3 pt-2">
      <button onclick="closeModal()" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveGrant('${g?.id||''}')" class="flex-1 btn-primary">Save Grant</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('gr-title')?.focus(),50)
}

function saveGrant(id) {
  const title  = document.getElementById('gr-title').value.trim()
  const funder = document.getElementById('gr-funder').value.trim()
  if (!title || !funder) { showToast('Name and funder required','error'); return }
  const existing = id ? state.grants.find(g=>g.id===id) : null
  const data = {
    id: id||uid(), title, funder,
    deadline:    document.getElementById('gr-deadline').value,
    status:      document.getElementById('gr-status').value,
    amount:      document.getElementById('gr-amount').value.trim(),
    duration:    document.getElementById('gr-duration').value.trim(),
    eligibility: document.getElementById('gr-eligibility').value.trim(),
    requirements: existing?.requirements||[],
    sections:     existing?.sections||[],
    coApplicants: existing?.coApplicants||[],
    notes:        existing?.notes||'',
    sourceId:     existing?.sourceId||null,
    createdAt:    existing?.createdAt||new Date().toISOString(),
    updatedAt:    new Date().toISOString()
  }
  if (id) { const i=state.grants.findIndex(g=>g.id===id); if(i>-1) state.grants[i]=data }
  else state.grants.push(data)
  save('grants')
  const calMsg = _syncGrantCalendarEvent(data)
  closeModal()
  renderGrantTab()
  showToast(calMsg || (id ? 'Grant updated ✓' : 'Grant added ✓'))
}

// ── Grant ↔ Calendar sync ─────────────────────────────────────────────────────
function _syncGrantCalendarEvent(grant) {
  if (!state.events) state.events = []
  const linked = state.events.find(e => e.grantId === grant.id)

  // Finished grants — remove event if it exists
  if (grant.status === 'awarded' || grant.status === 'rejected') {
    if (linked) {
      state.events = state.events.filter(e => e.grantId !== grant.id)
      save('events')
    }
    return null
  }

  // No deadline — remove stale event
  if (!grant.deadline) {
    if (linked) {
      state.events = state.events.filter(e => e.grantId !== grant.id)
      save('events')
    }
    return null
  }

  const eventTitle = `${grant.title} — deadline`
  const eventDesc  = `Grant deadline: ${grant.funder}${grant.amount ? ' · ' + grant.amount : ''}`

  if (linked) {
    // Keep in sync — update title/date/desc
    linked.title       = eventTitle
    linked.date        = grant.deadline
    linked.description = eventDesc
    save('events')
    return null
  }

  // Create new deadline event
  state.events.push({
    id:          uid(),
    title:       eventTitle,
    date:        grant.deadline,
    type:        'deadline',
    priority:    'high',
    startTime:   '', endTime: '', location: '',
    description: eventDesc,
    recurrence:  'none',
    reminder:    '7days',
    grantId:     grant.id,
    createdAt:   new Date().toISOString(),
  })
  save('events')
  if (typeof scheduleEventReminders === 'function') scheduleEventReminders()
  return 'Grant saved ✓ · 📅 Deadline added to Calendar'
}

// ── Grant detail ──────────────────────────────────────────────────────────────
function openGrantDetail(id) {
  const g = state.grants.find(x=>x.id===id)
  if (!g) return
  const now = new Date()
  const statusColors = {researching:'bg-purple-100 text-purple-700',drafting:'bg-amber-100 text-amber-700',submitted:'bg-blue-100 text-blue-700',awarded:'bg-green-100 text-green-700',rejected:'bg-slate-100 text-slate-500'}

  let deadlineBanner = ''
  if (g.deadline && g.status !== 'awarded' && g.status !== 'rejected') {
    const daysLeft = Math.round((new Date(g.deadline) - now) / 864e5)
    if (daysLeft < 0)    deadlineBanner = `<div class="mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">🔴 Deadline passed ${Math.abs(daysLeft)} days ago</div>`
    else if (daysLeft<=7)deadlineBanner = `<div class="mb-4 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">⏰ Deadline in ${daysLeft} day${daysLeft>1?'s':''}!</div>`
    else if (daysLeft<=30)deadlineBanner= `<div class="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">📅 Deadline in ${daysLeft} days — ${fmtDate(g.deadline)}</div>`
  }

  openModal(`
  <div class="flex items-start justify-between gap-3 mb-1">
    <div>
      <h3 class="font-bold text-slate-900 text-lg leading-tight">${esc(g.title||g.funder)}</h3>
      <p class="text-slate-500 text-sm mt-0.5">${esc(g.funder)}</p>
    </div>
    <span class="text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[g.status]||'bg-slate-100 text-slate-500'}">${g.status}</span>
  </div>

  <div class="grid grid-cols-3 gap-2 my-4 text-sm">
    ${g.deadline?`<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400">Deadline</div><div class="font-semibold">${fmtDate(g.deadline)}</div></div>`:''}
    ${g.amount  ?`<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400">Amount</div><div class="font-semibold">${esc(g.amount)}</div></div>`:''}
    ${g.duration?`<div class="bg-slate-50 rounded-xl p-2.5"><div class="text-xs text-slate-400">Duration</div><div class="font-semibold">${esc(g.duration)}</div></div>`:''}
  </div>

  ${deadlineBanner}
  ${g.eligibility?`<div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 leading-relaxed">${esc(g.eligibility)}</div>`:''}

  <!-- Requirements checklist -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">📋 Requirements Checklist</span>
      <button onclick="addRequirement('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add</button>
    </div>
    <div id="req-list">${renderRequirements(g)}</div>
  </div>

  <!-- Co-applicants -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">👥 Co-Applicants</span>
      <button onclick="addCoApplicant('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Add</button>
    </div>
    <div id="coapplicant-list">${renderCoApplicants(g)}</div>
  </div>

  <!-- Notes -->
  <div class="mb-4">
    <label class="label">Notes</label>
    <textarea rows="3" class="input resize-none" placeholder="Internal notes, links, contacts..."
      onchange="updateGrantField('${id}','notes',this.value)">${esc(g.notes||'')}</textarea>
  </div>

  <!-- Linked Tasks -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">✅ Tasks</span>
      <button onclick="createTaskForGrant('${id}')" class="text-xs text-indigo-600 hover:underline font-medium">+ Create Task</button>
    </div>
    <div id="grant-task-list">${renderGrantTasks(id)}</div>
  </div>

  <!-- Calendar event link -->
  ${(() => {
    const ev = (state.events||[]).find(e => e.grantId === id)
    if (!ev) return g.deadline && g.status !== 'awarded' && g.status !== 'rejected'
      ? `<div class="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
           <span>📅</span>
           <span class="flex-1">No calendar event yet.</span>
           <button onclick="_grantCreateEventNow('${id}')" class="text-indigo-600 hover:underline font-medium">Add to Calendar</button>
         </div>`
      : ''
    return `<div class="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs">
      <span>📅</span>
      <span class="flex-1 text-indigo-700 font-medium">Deadline in Calendar: ${fmtDate(ev.date)}</span>
      <button onclick="closeModal();showView('calendar')" class="text-indigo-500 hover:underline">View →</button>
    </div>`
  })()}

  <div class="flex gap-3 border-t border-slate-100 pt-4">
    <button onclick="openGrantModal('${id}')" class="flex-1 btn-secondary">✏️ Edit</button>
    <button onclick="duplicateGrant('${id}')" class="btn-secondary">Duplicate</button>
    <button onclick="deleteGrant('${id}')" class="btn-danger">Delete</button>
  </div>`, true)
}

// ── Requirements checklist ────────────────────────────────────────────────────
function renderRequirements(g) {
  const reqs = g.requirements||[]
  if (!reqs.length) return `<p class="text-xs text-slate-400 italic">No requirements added — e.g. CV, Reference letters, Research proposal, Budget...</p>`
  const done = reqs.filter(r=>r.done).length
  return `
  <div class="mb-2 flex items-center gap-2">
    <div class="flex-1 bg-slate-100 rounded-full h-1.5">
      <div class="h-1.5 rounded-full bg-indigo-500 transition-all" style="width:${reqs.length?Math.round(done/reqs.length*100):0}%"></div>
    </div>
    <span class="text-xs text-slate-400">${done}/${reqs.length}</span>
  </div>
  <div class="space-y-1.5">
  ${reqs.map((r,i) => `
    <div class="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors">
      <input type="checkbox" ${r.done?'checked':''} onchange="toggleRequirement('${g.id}',${i})"
        class="rounded border-slate-300 text-indigo-600 flex-shrink-0"/>
      <span class="text-sm flex-1 ${r.done?'line-through text-slate-400':'text-slate-800'}">${esc(r.text)}</span>
      <button onclick="removeRequirement('${g.id}',${i})" class="text-slate-300 hover:text-red-400 text-xs flex-shrink-0">✕</button>
    </div>`).join('')}
  </div>`
}

function addRequirement(grantId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Requirement</h3>
  <div class="space-y-3">
    <div><label class="label">Requirement *</label>
      <input id="req-text" type="text" class="input" placeholder="e.g. CV (max 2 pages), Research proposal, Reference letters..."/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openGrantDetail('${grantId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveRequirement('${grantId}')" class="flex-1 btn-primary">Add</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('req-text')?.focus(),50)
}

function saveRequirement(grantId) {
  const text = document.getElementById('req-text').value.trim()
  if (!text) { showToast('Requirement text required','error'); return }
  const g = state.grants.find(x=>x.id===grantId)
  if (!g) return
  if (!g.requirements) g.requirements=[]
  g.requirements.push({text, done:false})
  save('grants'); openGrantDetail(grantId)
}

function toggleRequirement(grantId, index) {
  const g = state.grants.find(x=>x.id===grantId)
  if (!g?.requirements?.[index]) return
  g.requirements[index].done = !g.requirements[index].done
  save('grants')
  const el = document.getElementById('req-list')
  if (el) el.innerHTML = renderRequirements(g)
  renderGrantTab()
}

function removeRequirement(grantId, index) {
  const g = state.grants.find(x=>x.id===grantId)
  if (!g) return
  g.requirements.splice(index,1); save('grants')
  const el = document.getElementById('req-list')
  if (el) el.innerHTML = renderRequirements(g)
}

// ── Co-applicants ─────────────────────────────────────────────────────────────
function renderCoApplicants(g) {
  if (!g.coApplicants?.length) return `<p class="text-xs text-slate-400 italic">None added</p>`
  return g.coApplicants.map((c,i)=>`
  <div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 text-sm">
    <span class="font-medium text-slate-800">${esc(c.name)}</span>
    <div class="flex items-center gap-2">
      <span class="text-slate-400 text-xs">${esc(c.role)}${c.institution?' · '+esc(c.institution):''}</span>
      <button onclick="removeCoapplicant('${g.id}',${i})" class="text-red-400 hover:text-red-600 text-xs">✕</button>
    </div>
  </div>`).join('')
}

function addCoApplicant(grantId) {
  openModal(`
  <h3 class="text-base font-bold mb-4">Add Co-Applicant</h3>
  <div class="space-y-3">
    <div><label class="label">Name *</label><input id="ca-name" type="text" class="input"/></div>
    <div><label class="label">Role</label><input id="ca-role" type="text" class="input" placeholder="Co-PI, Collaborator..."/></div>
    <div><label class="label">Institution</label><input id="ca-inst" type="text" class="input"/></div>
    <div class="flex gap-3 pt-2">
      <button onclick="openGrantDetail('${grantId}')" class="flex-1 btn-secondary">Cancel</button>
      <button onclick="saveCoapplicant('${grantId}')" class="flex-1 btn-primary">Add</button>
    </div>
  </div>`)
  setTimeout(()=>document.getElementById('ca-name')?.focus(),50)
}

function saveCoapplicant(grantId) {
  const name = document.getElementById('ca-name').value.trim()
  if (!name) { showToast('Name required','error'); return }
  const g = state.grants.find(x=>x.id===grantId)
  if (!g) return
  if (!g.coApplicants) g.coApplicants=[]
  g.coApplicants.push({name, role: document.getElementById('ca-role').value.trim(), institution: document.getElementById('ca-inst').value.trim()})
  save('grants'); openGrantDetail(grantId)
}

function removeCoapplicant(grantId, index) {
  const g = state.grants.find(x=>x.id===grantId)
  if (g) { g.coApplicants.splice(index,1); save('grants'); openGrantDetail(grantId) }
}

function updateGrantField(id, field, value) {
  const g = state.grants.find(x=>x.id===id)
  if (g) { g[field]=value; save('grants') }
}

// ── Linked Tasks ──────────────────────────────────────────────────────────────
function renderGrantTasks(grantId) {
  const tasks = (state.todos||[]).filter(t => t.grantId === grantId && !t.completedAt)
  if (!tasks.length) return `<p class="text-xs text-slate-400 italic">No open tasks linked to this grant</p>`
  return `<div class="space-y-1">` + tasks.map(t => {
    const overdue = t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]
    return `<div class="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
      <input type="checkbox" onchange="todoToggle('${t.id}');setTimeout(()=>{document.getElementById('grant-task-list').innerHTML=renderGrantTasks('${grantId}')},150)"
        class="rounded accent-indigo-600 flex-shrink-0"/>
      <span class="flex-1 text-sm text-slate-700 truncate">${esc(t.title)}</span>
      ${t.dueDate ? `<span class="text-xs flex-shrink-0 ${overdue?'text-red-500 font-semibold':'text-slate-400'}">${fmtDate(t.dueDate)}</span>` : ''}
    </div>`
  }).join('') + `</div>`
}

function createTaskForGrant(grantId) {
  window._pendingTaskGrantId = grantId
  openTodoModal(null)
}

function _grantCreateEventNow(grantId) {
  const g = state.grants.find(x => x.id === grantId)
  if (!g) return
  _syncGrantCalendarEvent(g)
  openGrantDetail(grantId)
  showToast('📅 Deadline added to Calendar ✓')
}

// ── Duplicate ─────────────────────────────────────────────────────────────────
function duplicateGrant(id) {
  const g = state.grants.find(x=>x.id===id)
  if (!g) return
  const copy = JSON.parse(JSON.stringify(g))
  copy.id        = uid()
  copy.title     = `Copy of ${g.title||g.funder}`
  copy.status    = 'researching'
  copy.createdAt = new Date().toISOString()
  copy.updatedAt = new Date().toISOString()
  ;(copy.requirements||[]).forEach(r => { r.done = false })
  state.grants.push(copy)
  save('grants')
  closeModal()
  renderGrantTab()
  showToast(`"${copy.title}" created ✓`)
}

async function deleteGrant(id) {
  const snap       = [...state.grants]
  const snapEvents = [...state.events]
  const title = state.grants.find(g=>g.id===id)?.title || 'Grant'
  state.grants = state.grants.filter(g=>g.id!==id)
  // Remove linked calendar event
  const hadEvent = state.events.some(e => e.grantId === id)
  state.events   = state.events.filter(e => e.grantId !== id)
  save('grants')
  if (hadEvent) save('events')
  closeModal(); renderGrantTab()
  showUndoToast(`"${title}" deleted`, () => {
    state.grants = snap
    state.events = snapEvents
    save('grants'); save('events')
    renderGrantTab(); showToast('Grant restored ✓')
  })
}
