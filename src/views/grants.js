// ══ Grant Scan View ═══════════════════════════════════════════════════════════

// ── Built-in grant database (300+ entries) ────────────────────────────────────
// `keywords`: specific field terms for precision matching (separate from broad `fields` categories)
const GRANT_DB = [

  // ══ PhD Students ══════════════════════════════════════════════════════════════

  // ── USA / North America ───────────────────────────────────────────────────────
  { id:'gdb1',  name:'Marie Curie Doctoral Networks', funder:'European Commission', stage:['phd'], region:['EU','International'], fields:['All'], keywords:[], amount:'~€3,500/mo', duration:'3 years', url:'https://marie-sklodowska-curie-actions.ec.europa.eu/', desc:'EU-funded doctoral training through university consortia. Apply through host universities.' },
  { id:'gdb2',  name:'NSF Graduate Research Fellowship (GRFP)', funder:'NSF (USA)', stage:['phd'], region:['USA'], fields:['STEM','Social Sciences'], keywords:['biology','chemistry','physics','engineering','computer science','mathematics','psychology','sociology','anthropology','economics','neuroscience','materials','environmental'], amount:'$37k/year', duration:'3 years', url:'https://www.nsfgrfp.org/', desc:'Prestigious US fellowship for early-stage PhD students in STEM and social sciences.' },
  { id:'gdb3',  name:'NIH NRSA Predoctoral Fellowship (F31)', funder:'NIH (USA)', stage:['phd'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','neuroscience','molecular biology','cell biology','biochemistry','genetics','genomics','pharmacology','physiology','immunology','microbiology','cancer','cardiovascular','developmental biology','bioinformatics','structural biology','chemical biology'], amount:'~$26k/year + fees', duration:'Up to 5 years', url:'https://researchtraining.nih.gov/programs/fellowships/F31', desc:'Predoctoral fellowship for US PhD students in biomedical and behavioral sciences.' },
  { id:'gdb4',  name:'Gates Cambridge Scholarship', funder:'Gates Cambridge Trust', stage:['phd'], region:['International'], fields:['All'], keywords:[], amount:'Full + stipend', duration:'PhD length', url:'https://www.gatescambridge.org/', desc:'Full scholarships for outstanding PhD students at Cambridge. Non-UK citizens only.' },
  { id:'gdb5',  name:'Rhodes Scholarship', funder:'Rhodes Trust (Oxford)', stage:['phd'], region:['International'], fields:['All'], keywords:[], amount:'Full + stipend', duration:'2+ years', url:'https://www.rhodeshouse.ox.ac.uk/', desc:'One of the most prestigious scholarships for study at Oxford. Country quotas apply.' },
  { id:'gdb6',  name:'Fulbright U.S. Student Program', funder:'U.S. Dept. of State', stage:['phd','masters'], region:['USA','International'], fields:['All'], keywords:[], amount:'Varies', duration:'1 year', url:'https://foreign.fulbrightonline.org/', desc:'Study, research or teaching abroad. Non-US citizens apply through home country.' },
  { id:'n01',   name:'Hertz Foundation Graduate Fellowship', funder:'Fannie & John Hertz Foundation', stage:['phd'], region:['USA'], fields:['STEM'], keywords:['physics','chemistry','engineering','biology','mathematics','computer science','materials science','applied science','biophysics','biochemistry'], amount:'$38k/year', duration:'Up to 5 years', url:'https://www.hertzfoundation.org/', desc:'Highly competitive fellowship for PhD students in applied physical, biological and engineering sciences at US universities.' },
  { id:'n02',   name:'NDSEG Fellowship', funder:'US Department of Defense', stage:['phd'], region:['USA'], fields:['STEM','Engineering'], keywords:['engineering','physics','chemistry','biology','computer science','materials','electrical','mechanical','aerospace','chemical engineering','mathematics','neuroscience'], amount:'$38,400/year + tuition', duration:'3 years', url:'https://ndseg.org/', desc:'National Defense Science & Engineering Graduate Fellowship for US citizens in STEM fields relevant to national defense.' },
  { id:'n03',   name:'DOE Computational Science Graduate Fellowship', funder:'U.S. Department of Energy', stage:['phd'], region:['USA'], fields:['Computer Science','Mathematics','STEM'], keywords:['computational','computer science','mathematics','physics','chemistry','engineering','simulation','modeling','high performance computing','algorithms','numerical methods','data science'], amount:'$38k/year + extras', duration:'Up to 4 years', url:'https://www.krellinst.org/csgf/', desc:'For PhD students using high-performance computing to solve problems in science and engineering.' },
  { id:'n04',   name:'EPA STAR Graduate Fellowship', funder:'U.S. Environmental Protection Agency', stage:['phd'], region:['USA'], fields:['Environmental Sciences','STEM'], keywords:['environmental','ecology','toxicology','chemistry','public health','sustainability','climate','pollution','water quality','air quality','environmental science','environmental engineering'], amount:'$44k/year', duration:'Up to 3 years', url:'https://www.epa.gov/research-fellowships', desc:'For PhD students in environmental science, engineering, and health-related fields.' },
  { id:'n05',   name:'Ford Foundation Predoctoral Fellowship', funder:'Ford Foundation', stage:['phd'], region:['USA'], fields:['All'], keywords:['diversity','social sciences','humanities','STEM','underrepresented','minority'], amount:'$27k/year + tuition', duration:'3 years', url:'https://www.nationalacademies.org/our-work/ford-foundation-fellowships', desc:'Promotes diversity in US academia. Open to all disciplines. US citizens and nationals from underrepresented groups.' },
  { id:'n06',   name:'HHMI Gilliam Fellowship for Advanced Study', funder:'Howard Hughes Medical Institute', stage:['phd'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','genetics','biochemistry','cell biology','molecular biology','diversity','underrepresented'], amount:'~$53k/year', duration:'Up to 3 years', url:'https://www.hhmi.org/science-education/programs/gilliam-fellowships-advanced-study', desc:'For PhD students from underrepresented backgrounds in the life sciences. Includes mentorship award for advisor.' },
  { id:'n07',   name:'NIH Oxford-Cambridge Scholars Program', funder:'NIH (USA)', stage:['phd'], region:['USA','UK'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','medicine','biology','genetics','neuroscience','biochemistry','clinical research','translational','molecular biology'], amount:'Full stipend + tuition', duration:'4–5 years', url:'https://oxcam.grd.nih.gov/', desc:'Accelerated doctoral program for US students conducting collaborative research between NIH and Oxford or Cambridge.' },
  { id:'n08',   name:'American Heart Association Predoctoral Fellowship', funder:'American Heart Association', stage:['phd'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['cardiovascular','heart','cardiology','cardiac','vascular','stroke','hypertension','atherosclerosis','heart failure','electrophysiology','cardiomyopathy'], amount:'~$26k/year + indirect', duration:'Up to 2 years', url:'https://professional.heart.org/en/research-programs/aha-funded-research/aha-research-funding', desc:'For PhD students conducting cardiovascular/cerebrovascular research at US institutions.' },
  { id:'n09',   name:'Alzheimer\'s Association Doctoral Student Grant', funder:'Alzheimer\'s Association', stage:['phd'], region:['USA','International'], fields:['Biomedical','Neuroscience'], keywords:['alzheimer','dementia','neurodegeneration','neuroscience','brain','cognitive','memory','tau','amyloid','synaptic','aging','neurology'], amount:'Up to $20k', duration:'1 year', url:'https://www.alz.org/research/for_researchers/grants/types_of_grants', desc:'Supports PhD students conducting research on Alzheimer\'s disease and related dementias.' },
  { id:'n10',   name:'NSERC CGS Doctoral (CGS-D)', funder:'NSERC (Canada)', stage:['phd'], region:['Canada'], fields:['STEM'], keywords:['biology','chemistry','physics','engineering','computer science','mathematics','earth science','environmental','materials','neuroscience'], amount:'$35k CAD/year', duration:'3 years', url:'https://www.nserc-crsng.gc.ca/', desc:'Canada Graduate Scholarships for doctoral students in natural sciences and engineering.' },
  { id:'n11',   name:'SSHRC Doctoral Fellowship', funder:'SSHRC (Canada)', stage:['phd'], region:['Canada'], fields:['Social Sciences','Humanities'], keywords:['social sciences','humanities','economics','psychology','sociology','political science','history','philosophy','education','communication','anthropology','law'], amount:'$20k CAD/year', duration:'Up to 4 years', url:'https://www.sshrc-crsh.gc.ca/', desc:'Canadian doctoral fellowships in social sciences and humanities.' },

  // ── PhD — UK / Europe ─────────────────────────────────────────────────────────
  { id:'gdb7',  name:'EPSRC Doctoral Training Partnership', funder:'EPSRC (UK)', stage:['phd'], region:['UK'], fields:['Engineering','Physical Sciences'], keywords:['engineering','physics','chemistry','mathematics','computer science','materials','electrical','mechanical','chemical engineering','optics','photonics'], amount:'Fees + stipend', duration:'3.5 years', url:'https://www.ukri.org/councils/epsrc/', desc:'UK engineering and physical sciences doctoral training. Apply via UK universities.' },
  { id:'gdb8',  name:'Wellcome Trust PhD Studentship', funder:'Wellcome Trust (UK)', stage:['phd'], region:['UK'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','genetics','cell biology','molecular biology','biochemistry','immunology','infectious disease','global health','medical research'], amount:'Full costs', duration:'4 years', url:'https://wellcome.org/', desc:'Prestigious biomedical PhD funding for UK institutions.' },
  { id:'gdb9',  name:'L\'Oréal-UNESCO For Women in Science', funder:'L\'Oréal / UNESCO', stage:['phd','postdoc'], region:['International'], fields:['STEM'], keywords:['women in science','biology','chemistry','physics','mathematics','computer science','materials','neuroscience'], amount:'Varies', duration:'1 year', url:'https://www.forwomeninscience.com/', desc:'National and international fellowships for women researchers in STEM.' },
  { id:'gdb10', name:'Swiss Govt Excellence Scholarship', funder:'SBFI (Switzerland)', stage:['phd','postdoc'], region:['Switzerland'], fields:['All'], keywords:[], amount:'CHF 1,920/mo', duration:'1–3 years', url:'https://www.sbfi.admin.ch/', desc:'Scholarships for foreign researchers to study or research in Switzerland.' },
  { id:'gdb29', name:'IMPRS Doctoral Programs (Max Planck)', funder:'Max Planck Society', stage:['phd'], region:['Germany','International'], fields:['STEM','Life Sciences'], keywords:['physics','chemistry','biology','neuroscience','materials','astronomy','computer science','mathematics','biophysics','biochemistry'], amount:'TVöD-level stipend', duration:'3–4 years', url:'https://www.mpg.de/en/imprs', desc:'International Max Planck Research Schools in STEM across Germany.' },
  { id:'gdb30', name:'Boehringer Ingelheim Fonds Fellowship', funder:'Boehringer Ingelheim Fonds', stage:['phd'], region:['International'], fields:['Biomedical'], keywords:['biomedical','molecular biology','cell biology','biochemistry','genetics','genomics','biophysics','structural biology','neuroscience','immunology','developmental biology'], amount:'€1,575+/mo', duration:'Up to 3 years', url:'https://www.bifonds.de/', desc:'Highly competitive for PhD students in basic biomedical research. International.' },
  { id:'gdb31', name:'EMBL International PhD Programme', funder:'EMBL', stage:['phd'], region:['Europe','International'], fields:['Life Sciences','Biology'], keywords:['molecular biology','cell biology','developmental biology','bioinformatics','structural biology','systems biology','biochemistry','genetics','genomics','computational biology'], amount:'Salary + benefits', duration:'4 years', url:'https://www.embl.org/about/info/phd-programme/', desc:'PhD program across EMBL sites in Europe. Outstanding facilities.' },
  { id:'gdb32', name:'MEXT Japanese Government Scholarship', funder:'Ministry of Education (Japan)', stage:['phd','masters'], region:['Japan','International'], fields:['All'], keywords:[], amount:'¥148–250k/mo', duration:'3–5 years', url:'https://www.mext.go.jp/', desc:'Japanese government funding for foreign students to study and research in Japan.' },
  { id:'gdb33', name:'President\'s PhD Scholarship (Imperial)', funder:'Imperial College London', stage:['phd'], region:['UK','International'], fields:['STEM','Medicine'], keywords:['engineering','physics','chemistry','biology','medicine','computer science','materials','mathematics','biomedical'], amount:'Full + £25k/year', duration:'4 years', url:'https://www.imperial.ac.uk/study/fees-and-funding/postgraduate/scholarships/presidents-phd-scholarships/', desc:'One of the most generous UK PhD scholarships. Full fees plus stipend for outstanding international applicants.' },
  { id:'gdb34', name:'DFG Research Training Group (GRK)', funder:'DFG (Germany)', stage:['phd'], region:['Germany'], fields:['All'], keywords:[], amount:'TVöD stipend', duration:'3 years', url:'https://www.dfg.de/en/research_funding/programmes/coordinated_programmes/research_training_groups/', desc:'Structured PhD training within a coordinated research group at German universities.' },
  { id:'gdb35', name:'Erasmus Mundus Joint Doctoral Programmes', funder:'European Commission', stage:['phd'], region:['EU','International'], fields:['All'], keywords:[], amount:'~€2,500/mo', duration:'3 years', url:'https://erasmus-plus.ec.europa.eu/', desc:'Joint EU doctoral programs with multiple partner universities. Full scholarship.' },
  { id:'gdb36', name:'China Scholarship Council (CSC) PhD', funder:'CSC (China)', stage:['phd'], region:['International'], fields:['All'], keywords:[], amount:'Varies by country', duration:'3–5 years', url:'https://www.csc.edu.cn/en', desc:'Chinese government funding for PhD students to study at partner universities abroad.' },
  { id:'n12',   name:'Wellcome Sanger Institute PhD Programme', funder:'Wellcome Sanger Institute (UK)', stage:['phd'], region:['UK','International'], fields:['Life Sciences','Biomedical'], keywords:['genomics','genetics','bioinformatics','computational biology','sequencing','cancer genomics','infectious disease','evolutionary biology','functional genomics','CRISPR'], amount:'Full + stipend', duration:'4 years', url:'https://www.sanger.ac.uk/about/study/phd-programme/', desc:'PhD training in genomics and computational biology at one of the world\'s leading genome institutes.' },
  { id:'n13',   name:'FEBS Excellence Awards (PhD)', funder:'FEBS', stage:['phd'], region:['Europe'], fields:['Life Sciences','Biomedical'], keywords:['biochemistry','molecular biology','cell biology','structural biology','biophysics','enzymology','protein chemistry','metabolism','genetics'], amount:'€2,000 award', duration:'—', url:'https://www.febs.org/our-activities/fellowships-grants-and-awards/', desc:'Annual excellence awards for PhD students presenting at FEBS Congress in biochemistry and molecular biosciences.' },
  { id:'n14',   name:'Australian Research Training Program', funder:'Australian Government', stage:['phd','masters'], region:['Australia'], fields:['All'], keywords:[], amount:'Fees + ~$32k AUD/yr', duration:'3.5 years', url:'https://www.education.gov.au/', desc:'Tuition fee offset and stipend for domestic PhD/masters students in Australia.' },

  // ══ Postdoctoral Researchers ══════════════════════════════════════════════════

  // ── USA ───────────────────────────────────────────────────────────────────────
  { id:'gdb13', name:'NIH NRSA Postdoctoral Fellowship (F32)', funder:'NIH (USA)', stage:['postdoc'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','neuroscience','molecular biology','cell biology','genetics','genomics','biochemistry','immunology','cancer','pharmacology','physiology','microbiology','cardiovascular','developmental','structural biology'], amount:'$60–70k/year', duration:'1–3 years', url:'https://researchtraining.nih.gov/programs/fellowships/F32', desc:'Individual NIH postdoctoral fellowship for biomedical research at US institutions.' },
  { id:'n20',   name:'Life Sciences Research Foundation (LSRF) Fellowship', funder:'LSRF', stage:['postdoc'], region:['USA','International'], fields:['Life Sciences','Biomedical'], keywords:['life sciences','biology','molecular biology','cell biology','biochemistry','genetics','neuroscience','ecology','evolution','biophysics','structural biology'], amount:'$75k/year', duration:'3 years', url:'https://lsrf.org/', desc:'Highly competitive postdoctoral fellowships in all areas of life sciences. Sponsored by pharmaceutical companies.' },
  { id:'n21',   name:'Jane Coffin Childs Memorial Fund Fellowship', funder:'Jane Coffin Childs Memorial Fund', stage:['postdoc'], region:['USA','International'], fields:['Biomedical','Life Sciences'], keywords:['cancer','biomedical','molecular biology','cell biology','biochemistry','genetics','neuroscience','immunology','microbiology','structural biology'], amount:'$60k+/year', duration:'3 years', url:'https://www.jccfund.org/', desc:'For postdoctoral research in the biomedical sciences, particularly cancer-related research.' },
  { id:'n22',   name:'Damon Runyon Cancer Research Fellowship', funder:'Damon Runyon Cancer Research Foundation', stage:['postdoc'], region:['USA'], fields:['Biomedical'], keywords:['cancer','oncology','tumor biology','molecular biology','cell biology','genetics','genomics','immunology','biochemistry','cancer immunology','metastasis'], amount:'$70k+/year', duration:'4 years', url:'https://www.damonrunyon.org/', desc:'One of the most prestigious cancer research fellowships. For postdocs at US institutions working on cancer.' },
  { id:'n23',   name:'Helen Hay Whitney Foundation Fellowship', funder:'Helen Hay Whitney Foundation', stage:['postdoc'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','biochemistry','molecular biology','cell biology','genetics','immunology','neuroscience','physiology','pharmacology'], amount:'$55k/year', duration:'3 years', url:'https://hhwf.org/', desc:'Supports postdoctoral training in basic biomedical research at US institutions.' },
  { id:'n24',   name:'HHMI Hanna H. Gray Fellows Program', funder:'Howard Hughes Medical Institute', stage:['postdoc'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','diversity','biology','genetics','neuroscience','cell biology','molecular biology','biochemistry','underrepresented'], amount:'~$85k/year', duration:'Up to 8 years', url:'https://www.hhmi.org/programs/hanna-gray-fellows', desc:'For postdocs from underrepresented backgrounds pursuing independent biomedical research careers.' },
  { id:'n25',   name:'American Heart Association Postdoctoral Fellowship', funder:'American Heart Association', stage:['postdoc'], region:['USA'], fields:['Biomedical'], keywords:['cardiovascular','heart','cardiology','cardiac','vascular','hypertension','atherosclerosis','heart failure','electrophysiology','stroke','arrhythmia','coronary'], amount:'~$56k+/year', duration:'Up to 2 years', url:'https://professional.heart.org/en/research-programs', desc:'Supports postdoctoral researchers working on cardiovascular and cerebrovascular problems.' },
  { id:'n26',   name:'American Cancer Society Postdoctoral Fellowship', funder:'American Cancer Society', stage:['postdoc'], region:['USA'], fields:['Biomedical'], keywords:['cancer','oncology','tumor','molecular biology','cell biology','genetics','genomics','immunology','biochemistry','cancer biology','carcinogenesis'], amount:'$55k+/year', duration:'Up to 3 years', url:'https://www.cancer.org/research/we-fund-cancer-research/apply-research-grant.html', desc:'Supports postdoctoral researchers in cancer research at US institutions.' },
  { id:'n27',   name:'McKnight Endowment Fund Scholars Award', funder:'McKnight Foundation', stage:['postdoc','pi'], region:['USA'], fields:['Neuroscience'], keywords:['neuroscience','neurobiology','brain','neural circuits','synaptic','cognitive','memory','learning','behavioral neuroscience','systems neuroscience','molecular neuroscience'], amount:'$75k/year', duration:'3 years', url:'https://www.mcknight.org/programs/the-brain-research/scholar-awards/', desc:'For neuroscientists who recently started independent careers in the USA. Focuses on brain disorders and function.' },
  { id:'n28',   name:'Pew Scholars in the Biomedical Sciences', funder:'Pew Charitable Trusts', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','cell biology','molecular biology','genetics','biochemistry','immunology','cancer','developmental biology'], amount:'$300k total', duration:'4 years', url:'https://www.pewtrusts.org/en/projects/pew-scholars-program', desc:'For early-career assistant professors conducting basic research in biomedical sciences at US research universities.' },
  { id:'n29',   name:'Searle Scholars Program', funder:'Kinship Foundation', stage:['pi'], region:['USA'], fields:['Biomedical','Chemistry','STEM'], keywords:['biomedical','chemistry','biology','neuroscience','biochemistry','cell biology','molecular biology','biophysics','chemical biology','structural biology'], amount:'$300k total', duration:'3 years', url:'https://www.searlescholars.net/', desc:'For exceptional early-career assistant professors in biomedical research and chemistry at US research universities.' },
  { id:'n30',   name:'Packard Fellowships in Science & Engineering', funder:'David & Lucile Packard Foundation', stage:['pi'], region:['USA'], fields:['STEM'], keywords:['physics','chemistry','biology','engineering','computer science','mathematics','astronomy','earth science','materials science','neuroscience','ecology'], amount:'$875k total', duration:'5 years', url:'https://www.packard.org/what-we-fund/conservation-and-science/packard-fellowships/', desc:'For innovative early-career scientists and engineers at US universities. Among the largest private fellowships.' },
  { id:'n31',   name:'Alfred P. Sloan Research Fellowship', funder:'Alfred P. Sloan Foundation', stage:['pi'], region:['USA','Canada'], fields:['STEM'], keywords:['physics','chemistry','biology','mathematics','computer science','economics','neuroscience','ocean science','mathematics','computational'], amount:'$75k total', duration:'2 years', url:'https://sloan.org/fellowships', desc:'For outstanding early-career faculty in physics, chemistry, mathematics, computer science, economics, neuroscience, ocean science.' },
  { id:'n32',   name:'NIH Director\'s New Innovator Award (DP2)', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','cell biology','genetics','genomics','biochemistry','immunology','cancer','innovative','high-risk high-reward'], amount:'Up to $1.5M', duration:'5 years', url:'https://commonfund.nih.gov/newinnovator/', desc:'For early-stage investigators proposing highly innovative research. No preliminary data required. Very competitive.' },
  { id:'n33',   name:'NIH R01 Research Grant', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','molecular biology','cell biology','genetics','immunology','cancer','pharmacology','physiology','cardiovascular','infectious disease'], amount:'~$500k/year (typical)', duration:'3–5 years', url:'https://grants.nih.gov/grants/funding/r01.htm', desc:'The flagship NIH research grant. New investigator payline is more favorable. Apply any cycle through Grants.gov.' },
  { id:'n34',   name:'NIH R21 Exploratory Research Grant', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','molecular biology','cell biology','genetics','exploratory','pilot','proof-of-concept','novel'], amount:'Up to $275k', duration:'2 years', url:'https://grants.nih.gov/grants/funding/r21.htm', desc:'For exploratory/developmental biomedical research. Smaller than R01, ideal for piloting new ideas. Two-year budget.' },
  { id:'n35',   name:'NIH K01 Mentored Career Development Award', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','career development','mentored','neuroscience','behavioral','clinical','translational','early career'], amount:'~$200k/year', duration:'3–5 years', url:'https://grants.nih.gov/grants/guide/pa-files/PA-20-180.html', desc:'Mentored career development for researchers who need additional training to develop independent careers in biomedical research.' },
  { id:'n36',   name:'DOE Early Career Research Program', funder:'U.S. Department of Energy', stage:['pi'], region:['USA'], fields:['Physics','Chemistry','STEM'], keywords:['physics','chemistry','materials science','nuclear','plasma','energy','climate','fusion','quantum','accelerator','computational','biology','environmental','earth science'], amount:'$750k total', duration:'5 years', url:'https://science.energy.gov/early-career/', desc:'For outstanding early-career scientists in DOE mission-relevant areas at US universities or DOE national labs.' },
  { id:'gdb46', name:'Burroughs Wellcome Fund Career Award', funder:'Burroughs Wellcome Fund', stage:['postdoc'], region:['USA','Canada'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','infectious disease','toxicology','pharmacology','translational','cell biology','molecular biology','transition to independence'], amount:'$500k–$1M', duration:'5 years', url:'https://www.bwfund.org/', desc:'Prestigious career development for postdocs transitioning to independent biomedical research positions.' },
  { id:'gdb45', name:'Ford Foundation Postdoctoral Fellowship', funder:'Ford Foundation (USA)', stage:['postdoc'], region:['USA'], fields:['All'], keywords:['diversity','underrepresented','social sciences','humanities','STEM'], amount:'$45k/year', duration:'1 year', url:'https://www.nationalacademies.org/our-work/ford-foundation-fellowships', desc:'For US-based postdoctoral scholars from underrepresented groups. All disciplines.' },

  // ── Postdoc — International ───────────────────────────────────────────────────
  { id:'gdb11', name:'Marie Curie Postdoctoral Fellowship', funder:'European Commission', stage:['postdoc'], region:['EU','International'], fields:['All'], keywords:[], amount:'~€4,500/mo', duration:'1–2 years', url:'https://marie-sklodowska-curie-actions.ec.europa.eu/', desc:'Postdoctoral fellowships in any field. Two calls per year. Highly competitive.' },
  { id:'gdb12', name:'Alexander von Humboldt Fellowship', funder:'Humboldt Foundation', stage:['postdoc'], region:['Germany','International'], fields:['All'], keywords:[], amount:'~€2,670–3,170/mo', duration:'6–24 months', url:'https://www.humboldt-foundation.de/', desc:'Research stays in Germany for highly qualified international scientists. Rolling deadline.' },
  { id:'gdb14', name:'EMBO Long-Term Fellowship', funder:'EMBO', stage:['postdoc'], region:['Europe'], fields:['Life Sciences','Chemistry'], keywords:['molecular biology','cell biology','biochemistry','structural biology','genetics','genomics','systems biology','biophysics','developmental biology','neuroscience'], amount:'Scales with family', duration:'2 years', url:'https://www.embo.org/funding/fellowships-and-grants/', desc:'For life scientists moving to a new European country for postdoc research.' },
  { id:'gdb15', name:'EMBO Short-Term Fellowship', funder:'EMBO', stage:['phd','postdoc'], region:['Europe'], fields:['Life Sciences'], keywords:['molecular biology','cell biology','biochemistry','genetics','neuroscience'], amount:'Living expenses', duration:'1–3 months', url:'https://www.embo.org/funding/fellowships-and-grants/', desc:'Short research visits in the life sciences within Europe.' },
  { id:'gdb16', name:'Newton International Fellowship', funder:'Royal Society / Brit. Academy', stage:['postdoc'], region:['UK'], fields:['All'], keywords:[], amount:'£33k/year', duration:'2 years', url:'https://royalsociety.org/grants/newton-international/', desc:'Brings outstanding early-career researchers to the UK. Non-UK applicants only.' },
  { id:'gdb17', name:'HFSP Long-Term Fellowship', funder:'HFSP', stage:['postdoc'], region:['International'], fields:['Life Sciences','Biology'], keywords:['life sciences','biology','neuroscience','molecular biology','cell biology','biochemistry','biophysics','computational biology','systems biology'], amount:'~$55k/year', duration:'3 years', url:'https://www.hfsp.org/funding/hfsp-funding/research-fellowships', desc:'International postdoctoral fellowships for life scientists changing research area or country.' },
  { id:'gdb18', name:'SNSF Postdoc.Mobility', funder:'SNSF (Switzerland)', stage:['postdoc'], region:['Switzerland','International'], fields:['All'], keywords:[], amount:'~CHF 80k', duration:'18 months', url:'https://www.snf.ch/en/funding/careers/postdoc-mobility', desc:'Swiss NSF grants for postdocs going abroad. Swiss-based researchers only.' },
  { id:'gdb19', name:'DAAD Research Grants', funder:'DAAD (Germany)', stage:['phd','postdoc'], region:['Germany','International'], fields:['All'], keywords:[], amount:'Varies', duration:'1–24 months', url:'https://www.daad.de/en/', desc:'German Academic Exchange Service. Research stays in Germany and abroad.' },
  { id:'gdb37', name:'Branco Weiss Fellowship', funder:'Branco Weiss Society', stage:['postdoc'], region:['International'], fields:['All'], keywords:[], amount:'CHF 200k/year', duration:'Up to 5 years', url:'https://brancoweiss.ethz.ch/', desc:'Extremely competitive. Funds unconventional, early-career research worldwide.' },
  { id:'gdb38', name:'Banting Postdoctoral Fellowship', funder:'Government of Canada', stage:['postdoc'], region:['Canada'], fields:['All'], keywords:[], amount:'$70k CAD/year', duration:'2 years', url:'https://banting.fellowships-bourses.gc.ca/', desc:'Canada\'s most prestigious postdoctoral fellowship. Open to domestic and international applicants.' },
  { id:'gdb39', name:'JSPS Postdoctoral Fellowship', funder:'JSPS (Japan)', stage:['postdoc'], region:['Japan'], fields:['All'], keywords:[], amount:'¥362k/mo', duration:'12–24 months', url:'https://www.jsps.go.jp/english/e-fellow/', desc:'Japan Society for the Promotion of Science fellowships for overseas researchers.' },
  { id:'gdb40', name:'NWO Veni Grant', funder:'NWO (Netherlands)', stage:['postdoc'], region:['Netherlands'], fields:['All'], keywords:[], amount:'Up to €320k', duration:'3 years', url:'https://www.nwo.nl/en/calls/nwo-talent-programme-veni-2025', desc:'Dutch talent grant for researchers who recently received their PhD.' },
  { id:'gdb41', name:'DFG Walter Benjamin Programme', funder:'DFG (Germany)', stage:['postdoc'], region:['Germany','International'], fields:['All'], keywords:[], amount:'Project-based', duration:'2 years', url:'https://www.dfg.de/en/research_funding/programmes/individual/walter-benjamin/', desc:'DFG mobility programme for early postdocs.' },
  { id:'gdb42', name:'Leverhulme Trust Early Career Fellowship', funder:'Leverhulme Trust (UK)', stage:['postdoc'], region:['UK'], fields:['All'], keywords:[], amount:'50% salary match', duration:'3 years', url:'https://www.leverhulme.ac.uk/early-career-fellowships', desc:'For early-career researchers at UK institutions.' },
  { id:'gdb43', name:'British Academy Postdoctoral Fellowship', funder:'British Academy (UK)', stage:['postdoc'], region:['UK'], fields:['Humanities','Social Sciences'], keywords:['humanities','social sciences','history','philosophy','languages','anthropology','economics','sociology','linguistics','archaeology','area studies'], amount:'~£30k/year', duration:'3 years', url:'https://www.thebritishacademy.ac.uk/funding/postdoctoral-fellowships/', desc:'Humanities and social sciences postdoctoral fellowship at UK institutions.' },
  { id:'gdb44', name:'EMBL Interdisciplinary Postdoc Programme', funder:'EMBL', stage:['postdoc'], region:['Europe'], fields:['Life Sciences','Computer Science'], keywords:['computational biology','bioinformatics','systems biology','machine learning','data science','molecular biology','structural biology','genomics'], amount:'Salary + benefits', duration:'2+1 years', url:'https://www.embl.org/about/info/postdoctoral-programme/', desc:'Interdisciplinary postdoc positions across EMBL sites. Strong computational biology component.' },
  { id:'n40',   name:'FEBS Long-Term Fellowship', funder:'FEBS', stage:['postdoc'], region:['Europe'], fields:['Life Sciences','Biomedical'], keywords:['biochemistry','molecular biology','cell biology','structural biology','biophysics','enzymology','metabolism','genetics','proteomics'], amount:'Up to €2,000/mo', duration:'Up to 3 years', url:'https://www.febs.org/our-activities/fellowships-grants-and-awards/', desc:'Supports postdoctoral researchers moving to a different European country for training in biochemistry and molecular biosciences.' },
  { id:'n41',   name:'Novo Nordisk Foundation Fellowship', funder:'Novo Nordisk Foundation', stage:['postdoc','pi'], region:['Scandinavia','International'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','diabetes','endocrinology','metabolism','obesity','cardiovascular','neuroscience','biotechnology','life sciences'], amount:'Varies (large)', duration:'2–5 years', url:'https://novonordiskfonden.dk/en/grants/', desc:'Danish foundation funding biomedical research. Multiple programmes for different career stages.' },
  { id:'n42',   name:'NHMRC Research Fellowship (Australia)', funder:'NHMRC (Australia)', stage:['postdoc','pi'], region:['Australia'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','health','medicine','clinical','neuroscience','cancer','cardiovascular','infectious disease','public health','epidemiology'], amount:'Full salary + project', duration:'5 years', url:'https://www.nhmrc.gov.au/', desc:'Australia\'s main health and medical research funding body. Various career stage fellowships and project grants.' },
  { id:'n43',   name:'ARC Laureate Fellowship (Australia)', funder:'Australian Research Council', stage:['pi'], region:['Australia'], fields:['All'], keywords:[], amount:'~$3M+', duration:'5 years', url:'https://www.arc.gov.au/', desc:'Australia\'s premier individual research fellowship for outstanding researchers.' },
  { id:'n44',   name:'NRF Korean Research Fellowship', funder:'NRF (South Korea)', stage:['postdoc'], region:['International'], fields:['STEM'], keywords:['STEM','engineering','science','natural sciences','life sciences','biomedical'], amount:'Varies', duration:'1–2 years', url:'https://www.nrf.re.kr/eng/', desc:'Korea Research Foundation fellowships for foreign researchers to conduct research in South Korea.' },
  { id:'n45',   name:'Wellcome-DBT India Alliance', funder:'Wellcome Trust / DBT', stage:['phd','postdoc','pi'], region:['India'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','medicine','public health','infectious disease','neuroscience','cell biology','genetics'], amount:'Varies by level', duration:'Up to 5 years', url:'https://www.indiaalliance.org/', desc:'Fellowship programme supporting biomedical researchers in India across all career stages.' },
  { id:'n46',   name:'DST-SERB National Post Doctoral Fellowship (NPDF)', funder:'DST-SERB (India)', stage:['postdoc'], region:['India'], fields:['STEM'], keywords:['STEM','biology','chemistry','physics','engineering','mathematics','computer science','earth science'], amount:'₹55k/mo', duration:'2 years', url:'https://serbonline.in/SERB/npdf', desc:'National Post Doctoral Fellowship for Indian researchers at Indian academic institutions.' },
  { id:'n47',   name:'FAPESP Postdoctoral Research Grant', funder:'FAPESP (Brazil)', stage:['postdoc'], region:['Brazil'], fields:['All'], keywords:[], amount:'Varies', duration:'1–3 years', url:'https://fapesp.br/en/', desc:'São Paulo Research Foundation grants for postdoctoral research in Brazil.' },
  { id:'n48',   name:'ICGEB Research Fellowships', funder:'ICGEB', stage:['phd','postdoc'], region:['International'], fields:['Life Sciences','Biomedical'], keywords:['molecular biology','cell biology','genetics','genomics','biotechnology','biochemistry','structural biology','neuroscience'], amount:'Stipend + travel', duration:'Up to 2 years', url:'https://www.icgeb.org/fellowships/', desc:'International Centre for Genetic Engineering and Biotechnology fellowships for researchers from member states.' },

  // ══ PIs / Early-Career Researchers ══════════════════════════════════════════

  // ── EU / International ────────────────────────────────────────────────────────
  { id:'gdb20', name:'ERC Starting Grant', funder:'European Research Council', stage:['pi'], region:['EU'], fields:['All'], keywords:[], amount:'Up to €1.5M', duration:'5 years', url:'https://erc.europa.eu/apply-grant/starting-grant', desc:'For early-career researchers 2–7 years post-PhD with a European host institution.' },
  { id:'gdb21', name:'ERC Consolidator Grant', funder:'European Research Council', stage:['pi'], region:['EU'], fields:['All'], keywords:[], amount:'Up to €2M', duration:'5 years', url:'https://erc.europa.eu/apply-grant/consolidator-grant', desc:'For researchers 7–12 years post-PhD with a European host institution.' },
  { id:'gdb47', name:'ERC Advanced Grant', funder:'European Research Council', stage:['pi'], region:['EU'], fields:['All'], keywords:[], amount:'Up to €3.5M', duration:'5 years', url:'https://erc.europa.eu/apply-grant/advanced-grant', desc:'For established research leaders 10+ years post-PhD at European institutions.' },
  { id:'gdb48', name:'Wellcome Trust Investigator Award', funder:'Wellcome Trust (UK)', stage:['pi'], region:['UK','International'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','genetics','cell biology','molecular biology','biochemistry','immunology','infectious disease','global health'], amount:'Up to £4M', duration:'5–7 years', url:'https://wellcome.org/grant-funding/schemes/investigator-awards-science', desc:'For outstanding research leaders in biomedical sciences at UK institutions.' },
  { id:'gdb22', name:'DFG Research Grant', funder:'DFG (Germany)', stage:['postdoc','pi'], region:['Germany'], fields:['All'], keywords:[], amount:'Project-based', duration:'1–3 years', url:'https://www.dfg.de/', desc:'German Research Foundation grants for individual research projects.' },
  { id:'gdb23', name:'ANR Young Researcher (JCJC)', funder:'ANR (France)', stage:['pi'], region:['France'], fields:['All'], keywords:[], amount:'~€300k', duration:'4 years', url:'https://anr.fr/', desc:'French ANR grants for early-career PIs at French institutions.' },
  { id:'gdb24', name:'FWF Individual Project', funder:'FWF (Austria)', stage:['pi'], region:['Austria'], fields:['All'], keywords:[], amount:'Project-based', duration:'1–4 years', url:'https://www.fwf.ac.at/', desc:'Austrian Science Fund standalone grants for all research areas.' },
  { id:'gdb25', name:'Volkswagen Foundation Freigeist', funder:'Volkswagen Foundation', stage:['postdoc','pi'], region:['Germany'], fields:['All'], keywords:[], amount:'Up to €1M', duration:'5 years', url:'https://www.volkswagenstiftung.de/', desc:'For bold, unconventional research ideas at German institutions.' },
  { id:'gdb53', name:'NWO Vidi Grant', funder:'NWO (Netherlands)', stage:['pi'], region:['Netherlands'], fields:['All'], keywords:[], amount:'Up to €800k', duration:'5 years', url:'https://www.nwo.nl/', desc:'Dutch talent grant for researchers several years post-PhD establishing an independent line.' },
  { id:'n60',   name:'NWO Vici Grant', funder:'NWO (Netherlands)', stage:['pi'], region:['Netherlands'], fields:['All'], keywords:[], amount:'Up to €1.5M', duration:'5 years', url:'https://www.nwo.nl/', desc:'Senior Dutch talent grant for leading researchers establishing a research group.' },
  { id:'gdb54', name:'Swedish Research Council Starting Grant', funder:'Vetenskapsrådet (Sweden)', stage:['pi'], region:['Scandinavia'], fields:['All'], keywords:[], amount:'4–7M SEK/year', duration:'4 years', url:'https://www.vr.se/', desc:'For researchers 2–7 years post-PhD at Swedish institutions.' },
  { id:'gdb55', name:'ARC Discovery Early Career Award (DECRA)', funder:'Australian Research Council', stage:['pi'], region:['Australia'], fields:['All'], keywords:[], amount:'~$425k AUD', duration:'3 years', url:'https://www.arc.gov.au/', desc:'Australian Research Council fellowship for early-career researchers.' },
  { id:'gdb56', name:'Academy of Finland Research Fellow', funder:'Academy of Finland', stage:['pi'], region:['Scandinavia'], fields:['All'], keywords:[], amount:'~€350k', duration:'4 years', url:'https://www.aka.fi/', desc:'Four-year research positions at Finnish universities.' },
  { id:'n61',   name:'BBSRC Research Grant', funder:'BBSRC (UK)', stage:['pi'], region:['UK'], fields:['Life Sciences','Biomedical'], keywords:['biotechnology','biological sciences','genomics','systems biology','synthetic biology','cell biology','structural biology','biochemistry','genetics','agricultural','food science','bioenergy'], amount:'Project-based', duration:'3–5 years', url:'https://www.ukri.org/councils/bbsrc/', desc:'UK Biotechnology and Biological Sciences Research Council. Funds investigator-led research across biological sciences.' },
  { id:'n62',   name:'MRC Project Grant (UK)', funder:'Medical Research Council (UK)', stage:['pi'], region:['UK'], fields:['Biomedical','Life Sciences'], keywords:['medicine','biomedical','clinical','neuroscience','cancer','infectious disease','immunology','genetics','cell biology','molecular biology','cardiovascular','mental health','translational'], amount:'Project-based', duration:'3–5 years', url:'https://www.ukri.org/councils/mrc/', desc:'UK Medical Research Council project grants for biomedical and clinical research.' },
  { id:'n63',   name:'Cancer Research UK Programme Grant', funder:'Cancer Research UK', stage:['pi'], region:['UK'], fields:['Biomedical'], keywords:['cancer','oncology','tumor','molecular biology','genetics','genomics','immunology','cell biology','carcinogenesis','cancer biology'], amount:'Up to £2M+', duration:'5 years', url:'https://www.cancerresearchuk.org/funding-for-researchers', desc:'Major programme grants for outstanding cancer research at UK institutions.' },
  { id:'n64',   name:'Wellcome Collaborative Award', funder:'Wellcome Trust (UK)', stage:['pi'], region:['UK','International'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','collaboration','biology','neuroscience','infectious disease','genetics','immunology','molecular biology'], amount:'Up to £3M+', duration:'5 years', url:'https://wellcome.org/grant-funding/schemes/collaborative-awards-science', desc:'For teams of 3–6 research groups tackling important problems in biomedical science.' },
  { id:'gdb51', name:'Royal Society Research Grant', funder:'Royal Society (UK)', stage:['pi'], region:['UK'], fields:['All'], keywords:[], amount:'Up to £20k', duration:'1 year', url:'https://royalsociety.org/grants/research-grants/', desc:'Equipment and consumable costs for early-career UK researchers.' },
  { id:'gdb52', name:'British Academy Small Research Grant', funder:'British Academy (UK)', stage:['pi'], region:['UK'], fields:['Humanities','Social Sciences'], keywords:['humanities','social sciences','history','philosophy','sociology','anthropology','linguistics','archaeology'], amount:'Up to £10k', duration:'1–2 years', url:'https://www.thebritishacademy.ac.uk/', desc:'Supports primary research in humanities and social sciences.' },
  { id:'gdb57', name:'Novo Nordisk Foundation PI Grant', funder:'Novo Nordisk Foundation', stage:['postdoc','pi'], region:['Scandinavia','International'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','diabetes','endocrinology','metabolism','life sciences','neuroscience','cardiovascular','biotechnology'], amount:'Varies (large)', duration:'2–5 years', url:'https://novonordiskfonden.dk/', desc:'Danish foundation funding biomedical and life science research.' },
  { id:'gdb58', name:'Research Corporation Cottrell Scholar', funder:'Research Corporation (USA)', stage:['pi'], region:['USA'], fields:['Physics','Chemistry','Astronomy'], keywords:['physics','chemistry','astronomy','astrophysics','materials','spectroscopy','quantum','photonics'], amount:'$100k', duration:'3 years', url:'https://rescorp.org/', desc:'For early-career faculty in physical sciences at US universities.' },
  { id:'gdb49', name:'NIH K99/R00 Pathway to Independence', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','neuroscience','molecular biology','cell biology','genetics','biochemistry','cancer','cardiovascular','independence','career transition'], amount:'~$250k/year', duration:'2+3 years', url:'https://grants.nih.gov/grants/guide/pa-files/PA-24-171.html', desc:'Career transition award for late-stage postdocs moving to independent faculty positions in the USA.' },
  { id:'gdb50', name:'NSF CAREER Award', funder:'NSF (USA)', stage:['pi'], region:['USA'], fields:['STEM'], keywords:['STEM','engineering','physics','chemistry','biology','computer science','mathematics','earth science','materials','education','neuroscience'], amount:'$400–500k', duration:'5 years', url:'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=503214', desc:'NSF\'s most prestigious award for early-career faculty. Integrates research and education.' },

  // ── USA PI — Field-specific ───────────────────────────────────────────────────
  { id:'n70',   name:'NIH R35 Outstanding Investigator Award', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','outstanding investigator','established PI','sustained excellence','biology','neuroscience','genetics','cell biology'], amount:'Up to $8M', duration:'8 years', url:'https://grants.nih.gov/grants/guide/pa-files/PAR-22-232.html', desc:'For established NIH investigators with a strong funding track record. Long-term support for sustained research programs.' },
  { id:'n71',   name:'NIH Director\'s Pioneer Award (DP1)', funder:'NIH (USA)', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','pioneer','innovative','high risk','transformative','biology','medicine','neuroscience'], amount:'$3.5M total', duration:'5 years', url:'https://commonfund.nih.gov/pioneer/', desc:'For highly innovative, high-risk research that may lead to major advances. NIH Common Fund.' },
  { id:'n72',   name:'American Heart Association Scientist Development Grant', funder:'American Heart Association', stage:['pi'], region:['USA'], fields:['Biomedical'], keywords:['cardiovascular','heart','cardiology','cardiac','vascular','hypertension','atherosclerosis','heart failure','electrophysiology','stroke'], amount:'$77k/year', duration:'Up to 4 years', url:'https://professional.heart.org/en/research-programs', desc:'For researchers early in first faculty appointment working on cardiovascular/cerebrovascular problems.' },
  { id:'n73',   name:'Alzheimer\'s Association Research Grant', funder:'Alzheimer\'s Association', stage:['pi'], region:['USA','International'], fields:['Biomedical','Neuroscience'], keywords:['alzheimer','dementia','neurodegeneration','neuroscience','brain','cognitive','memory','tau','amyloid','aging','neurology'], amount:'Up to $150k', duration:'Up to 3 years', url:'https://www.alz.org/research/for_researchers/grants/', desc:'Investigator-initiated grants supporting research on Alzheimer\'s disease and related dementias.' },
  { id:'n74',   name:'American Cancer Society Research Scholar Grant', funder:'American Cancer Society', stage:['pi'], region:['USA'], fields:['Biomedical'], keywords:['cancer','oncology','tumor biology','molecular biology','cell biology','genetics','genomics','immunotherapy','carcinogenesis','cancer biology','translational'], amount:'$200k', duration:'4 years', url:'https://www.cancer.org/research/', desc:'For outstanding scientists making significant contributions to cancer research at US institutions.' },
  { id:'n75',   name:'Brain Research Foundation Scientific Innovations Award', funder:'Brain Research Foundation', stage:['pi'], region:['USA'], fields:['Neuroscience'], keywords:['neuroscience','brain','neurobiology','neural circuits','cognitive','psychiatric','neurological','Parkinson','Alzheimer','schizophrenia','depression'], amount:'$100k', duration:'2 years', url:'https://www.brainresearchfoundation.org/', desc:'Seed funding for neuroscience projects that have potential to be transformational and high-risk.' },
  { id:'n76',   name:'Dana Foundation Neuroscience Research Grant', funder:'Dana Foundation', stage:['pi'], region:['USA'], fields:['Neuroscience'], keywords:['neuroscience','brain','immunology','neuroimmunology','neurology','neurological disease','brain aging','neurodegenerative'], amount:'Varies', duration:'2–3 years', url:'https://www.dana.org/', desc:'Supports pioneering brain research with a focus on neuroimmunology and brain imaging.' },
  { id:'n77',   name:'Klingenstein-Simons Fellowship in Neuroscience', funder:'Esther A. & Joseph Klingenstein Fund', stage:['pi'], region:['USA'], fields:['Neuroscience'], keywords:['neuroscience','brain','neurological disease','neural circuits','synaptic','cognitive','molecular neuroscience','systems neuroscience'], amount:'$225k total', duration:'3 years', url:'https://klingenstein.org/', desc:'For assistant professors studying the nervous system and neurological diseases in the USA.' },
  { id:'n78',   name:'McKnight Technological Innovations in Neuroscience Award', funder:'McKnight Foundation', stage:['pi'], region:['USA'], fields:['Neuroscience'], keywords:['neuroscience','imaging','optogenetics','neural recording','brain technology','neural circuits','tools','methods'], amount:'$100k', duration:'2 years', url:'https://www.mcknight.org/', desc:'Supports development of new tools and technologies to study brain function.' },
  { id:'n79',   name:'Whitehall Foundation Research Grant', funder:'Whitehall Foundation', stage:['pi'], region:['USA'], fields:['Neuroscience'], keywords:['neurobiology','neuroscience','invertebrate','vertebrate','neural circuits','sensory','motor','integrative','animal behavior'], amount:'Up to $120k', duration:'1–3 years', url:'https://www.whitehall.org/', desc:'Supports basic research in neuroscience, particularly in invertebrate and vertebrate neurobiology.' },
  { id:'n80',   name:'Simons Foundation Autism Research Initiative (SFARI) Grant', funder:'Simons Foundation', stage:['pi'], region:['USA','International'], fields:['Neuroscience','Biomedical'], keywords:['autism','ASD','neuroscience','genetics','synaptic','neural circuits','developmental neuroscience','cognitive','social behavior','brain development'], amount:'Varies', duration:'1–3 years', url:'https://www.sfari.org/', desc:'Funds research that advances understanding of autism spectrum disorder.' },
  { id:'n81',   name:'Simons Collaboration on the Global Brain (SCGB)', funder:'Simons Foundation', stage:['pi'], region:['USA','International'], fields:['Neuroscience'], keywords:['computational neuroscience','neural coding','neural circuits','systems neuroscience','brain dynamics','machine learning','electrophysiology','cognition'], amount:'Varies (large)', duration:'Ongoing', url:'https://www.simonsfoundation.org/collaborations/global-brain/', desc:'Supports research on neural circuits and computation underlying cognition and perception.' },
  { id:'n82',   name:'Chan Zuckerberg Initiative (CZI) Investigator Grant', funder:'Chan Zuckerberg Initiative', stage:['pi'], region:['USA','International'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','cell biology','imaging','technology','infectious disease','neurodegeneration','rare disease','genomics','single cell'], amount:'Up to $3M', duration:'5 years', url:'https://chanzuckerberg.com/science/', desc:'For investigators using technology to understand and eliminate disease.' },
  { id:'n83',   name:'Howard Hughes Medical Institute (HHMI) Investigator', funder:'HHMI', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','genetics','cell biology','neuroscience','biochemistry','structural biology','evolutionary biology'], amount:'$1–2M+/year', duration:'Ongoing', url:'https://www.hhmi.org/scientists/investigators', desc:'HHMI\'s most prestigious program. Employs US-based biomedical scientists as HHMI Investigators.' },
  { id:'n84',   name:'HHMI Faculty Scholars Program', funder:'Howard Hughes Medical Institute', stage:['pi'], region:['USA'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','biology','neuroscience','genetics','cell biology','biochemistry','immunology'], amount:'$3.9M total', duration:'5 years', url:'https://www.hhmi.org/programs/faculty-scholars', desc:'For mid-career biomedical scientists at US research institutions who show exceptional promise.' },

  // ── CS / AI / Computational ───────────────────────────────────────────────────
  { id:'n90',   name:'Google Research Scholar Program', funder:'Google', stage:['pi'], region:['USA','International'], fields:['Computer Science'], keywords:['machine learning','artificial intelligence','deep learning','computer vision','natural language processing','NLP','algorithms','systems','robotics','human-computer interaction','data science','healthcare AI','climate AI'], amount:'$60k', duration:'1 year', url:'https://research.google/outreach/research-scholar-program/', desc:'Unrestricted gifts to support research by early-career faculty in CS/AI. Open to multiple areas.' },
  { id:'n91',   name:'Microsoft Research PhD Fellowship', funder:'Microsoft Research', stage:['phd'], region:['USA','Canada'], fields:['Computer Science'], keywords:['machine learning','AI','computer science','systems','algorithms','human-computer interaction','security','databases','programming languages','computer vision','NLP'], amount:'Full tuition + stipend', duration:'2 years', url:'https://www.microsoft.com/en-us/research/academic-program/phd-fellowship/', desc:'For outstanding PhD students in CS/engineering at North American universities with a research advisor at MSR.' },
  { id:'n92',   name:'Meta Research PhD Fellowship', funder:'Meta', stage:['phd'], region:['USA','International'], fields:['Computer Science'], keywords:['machine learning','artificial intelligence','computer vision','NLP','natural language','social computing','AR/VR','human-computer interaction','security','systems'], amount:'Full tuition + stipend', duration:'2 years', url:'https://research.facebook.com/fellowship/', desc:'Supports PhD students doing fundamental research in areas aligned with Meta\'s research interests.' },
  { id:'n93',   name:'Apple Scholars in AI/ML', funder:'Apple', stage:['phd'], region:['USA','International'], fields:['Computer Science'], keywords:['machine learning','artificial intelligence','deep learning','computer vision','natural language processing','speech','privacy','optimization'], amount:'Full tuition + stipend + internship', duration:'2 years', url:'https://machinelearning.apple.com/updates/apple-scholars-aiml', desc:'For PhD students doing innovative research in machine learning and AI.' },
  { id:'n94',   name:'Amazon Research Award', funder:'Amazon', stage:['pi'], region:['USA','International'], fields:['Computer Science'], keywords:['machine learning','NLP','robotics','computer vision','cloud computing','security','algorithms','operations research','economics'], amount:'$80k unrestricted', duration:'1 year', url:'https://www.amazon.science/research-awards', desc:'Unrestricted funds supporting academic research across areas of strategic importance to Amazon.' },
  { id:'n95',   name:'DARPA Young Faculty Award', funder:'DARPA (USA)', stage:['pi'], region:['USA'], fields:['STEM','Engineering'], keywords:['engineering','computer science','mathematics','physics','materials','biological sciences','cognitive science','national security','defense technology'], amount:'~$500k+', duration:'2 years', url:'https://www.darpa.mil/work-with-us/for-universities/young-faculty-award', desc:'Identifies and engages rising stars in junior faculty positions at US universities.' },
  { id:'n96',   name:'NSF CISE Research Initiation Initiative (CRII)', funder:'NSF (USA)', stage:['pi'], region:['USA'], fields:['Computer Science'], keywords:['computer science','algorithms','systems','machine learning','AI','networking','security','data','programming languages','theory'], amount:'Up to $175k', duration:'2 years', url:'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=505644', desc:'For first-time NSF PIs in CISE (computer science) who have not received NSF funding as PI before.' },
  { id:'n97',   name:'OpenAI Researcher Access Program', funder:'OpenAI', stage:['pi','postdoc'], region:['International'], fields:['Computer Science'], keywords:['AI safety','alignment','language models','machine learning','AI ethics','interpretability','robustness'], amount:'API credits + collaboration', duration:'Ongoing', url:'https://openai.com/research/', desc:'Research access and collaboration for academics studying AI safety and alignment.' },

  // ── Physics / Astronomy ───────────────────────────────────────────────────────
  { id:'n100',  name:'NSF Astronomy & Astrophysics Postdoctoral Fellowship (AAPF)', funder:'NSF (USA)', stage:['postdoc'], region:['USA'], fields:['Astronomy'], keywords:['astronomy','astrophysics','cosmology','galaxy','stars','exoplanets','gravitational waves','dark matter','dark energy','observational','theoretical','computational astrophysics'], amount:'$75k+/year', duration:'3 years', url:'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=13421', desc:'For outstanding postdoctoral researchers in astronomy and astrophysics. Combines research and education.' },
  { id:'n101',  name:'NASA Hubble Fellowship Program', funder:'NASA (USA)', stage:['postdoc'], region:['USA'], fields:['Astronomy'], keywords:['astrophysics','astronomy','cosmology','exoplanets','planetary science','stars','galaxies','gravitational waves','space science'], amount:'~$86k/year', duration:'Up to 3 years', url:'https://hubblesite.org/fellowship', desc:'Three track fellowship (Hubble, Einstein, Sagan) for postdoctoral research in NASA astrophysics science areas.' },
  { id:'n102',  name:'DOE Early Career Research Program (Physics/Chemistry)', funder:'U.S. Department of Energy', stage:['pi'], region:['USA'], fields:['Physics','Chemistry','STEM'], keywords:['physics','chemistry','materials science','nuclear','plasma','energy','computational science','fusion','quantum information','accelerator','environmental'], amount:'$750k total', duration:'5 years', url:'https://science.energy.gov/early-career/', desc:'For outstanding US scientists at universities or DOE national labs within 10 years of PhD.' },
  { id:'n103',  name:'Kavli Prize in Astrophysics/Nanoscience/Neuroscience', funder:'Kavli Foundation', stage:['pi'], region:['International'], fields:['Astronomy','Neuroscience','Physics'], keywords:['astrophysics','nanoscience','neuroscience','cosmology','condensed matter','brain'], amount:'$1M', duration:'—', url:'https://kavliprize.org/', desc:'Biennial prize awarded in astrophysics, nanoscience, and neuroscience. One of science\'s most prestigious awards.' },
  { id:'n104',  name:'Perimeter Institute Postdoctoral Fellowship', funder:'Perimeter Institute', stage:['postdoc'], region:['Canada'], fields:['Physics'], keywords:['theoretical physics','quantum gravity','quantum information','condensed matter','cosmology','string theory','quantum field theory'], amount:'Competitive', duration:'3 years', url:'https://perimeterinstitute.ca/', desc:'Leading theoretical physics research institute in Canada. Positions in quantum gravity, information, and condensed matter.' },

  // ── Chemistry ─────────────────────────────────────────────────────────────────
  { id:'n110',  name:'Dreyfus New Faculty Award', funder:'Camille & Henry Dreyfus Foundation', stage:['pi'], region:['USA'], fields:['Chemistry'], keywords:['chemistry','organic chemistry','inorganic chemistry','physical chemistry','biochemistry','chemical biology','materials chemistry','polymer','catalysis','synthesis'], amount:'$75k', duration:'5 years', url:'https://www.dreyfus.org/', desc:'For assistant professors of chemistry starting careers at US academic institutions.' },
  { id:'n111',  name:'Arnold and Mabel Beckman Foundation Young Investigator Award', funder:'Arnold and Mabel Beckman Foundation', stage:['pi'], region:['USA'], fields:['Chemistry','Biomedical'], keywords:['chemistry','biochemistry','biophysics','chemical biology','materials','spectroscopy','imaging','synthetic chemistry'], amount:'$750k total', duration:'5 years', url:'https://www.beckman-foundation.org/', desc:'Supports researchers in chemistry and life sciences who create or develop instrumentation.' },
  { id:'n112',  name:'ACS Petroleum Research Fund (PRF) Grant', funder:'American Chemical Society', stage:['pi'], region:['USA'], fields:['Chemistry'], keywords:['chemistry','chemical engineering','materials','petroleum','energy','catalysis','polymer','organic','physical chemistry','computational chemistry'], amount:'Up to $110k', duration:'3 years', url:'https://www.acs.org/funding/grants/petroleum-research-fund.html', desc:'Supports fundamental research in petroleum-related areas of chemistry and chemical engineering at US universities.' },

  // ── Environmental / Climate ───────────────────────────────────────────────────
  { id:'n120',  name:'NSF Biological Oceanography Program', funder:'NSF (USA)', stage:['pi'], region:['USA'], fields:['Environmental Sciences'], keywords:['oceanography','marine biology','marine ecology','ocean chemistry','biogeochemistry','plankton','coral reefs','ocean acidification','marine microbiology'], amount:'Project-based', duration:'3–5 years', url:'https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=11696', desc:'Supports research on biological processes in the ocean and their interaction with physical/chemical processes.' },
  { id:'n121',  name:'NOAA Sea Grant Research Program', funder:'NOAA Sea Grant', stage:['phd','pi'], region:['USA'], fields:['Environmental Sciences'], keywords:['ocean','coastal','marine','fisheries','aquaculture','marine ecology','climate change','ocean science','water quality'], amount:'Project-based', duration:'2–4 years', url:'https://seagrant.noaa.gov/', desc:'Supports university research, education, and outreach on ocean, coastal, and Great Lakes issues.' },
  { id:'n122',  name:'DOE Office of Science Climate & Earth Science', funder:'U.S. Department of Energy', stage:['pi'], region:['USA'], fields:['Environmental Sciences','Physics'], keywords:['climate change','earth system','atmospheric','ocean','carbon cycle','energy','climate modeling','biogeochemistry','environmental'], amount:'Project-based', duration:'3–5 years', url:'https://science.energy.gov/', desc:'DOE\'s atmospheric and earth system research program. Focuses on climate and earth system processes.' },
  { id:'n123',  name:'Moore Foundation Environmental Conservation Grants', funder:'Gordon & Betty Moore Foundation', stage:['pi'], region:['USA','International'], fields:['Environmental Sciences'], keywords:['marine conservation','ocean','ecology','biodiversity','environmental science','freshwater','fisheries','pacific northwest'], amount:'Varies (large)', duration:'Multi-year', url:'https://www.moore.org/', desc:'Supports environmental conservation science and field research, particularly marine and freshwater ecosystems.' },
  { id:'n124',  name:'National Geographic Society Research Grant', funder:'National Geographic Society', stage:['phd','postdoc','pi'], region:['International'], fields:['Environmental Sciences','Biology'], keywords:['geography','exploration','ecology','conservation','anthropology','archaeology','biology','environment','wildlife'], amount:'Up to $50k', duration:'1 year', url:'https://www.nationalgeographic.org/society/grants-and-investments/', desc:'For early-career explorers and researchers conducting field research in life sciences, social sciences, or geography.' },
  { id:'n125',  name:'David & Lucile Packard Foundation Conservation Science', funder:'Packard Foundation', stage:['pi'], region:['USA'], fields:['Environmental Sciences'], keywords:['conservation','ecology','marine','fisheries','climate','environmental science','biodiversity'], amount:'Varies', duration:'Multi-year', url:'https://www.packard.org/what-we-fund/conservation-and-science/', desc:'Supports conservation science and protection of marine and terrestrial ecosystems.' },

  // ── Social Sciences / Interdisciplinary ───────────────────────────────────────
  { id:'n130',  name:'Russell Sage Foundation Fellowship', funder:'Russell Sage Foundation', stage:['phd','postdoc','pi'], region:['USA'], fields:['Social Sciences'], keywords:['social sciences','economics','sociology','psychology','political science','behavioral','inequality','immigration','work','poverty','healthcare','education','racial inequality'], amount:'Varies', duration:'Varies', url:'https://www.russellsage.org/', desc:'Supports social science research on US social, economic, and political issues.' },
  { id:'n131',  name:'Robert Wood Johnson Foundation Health Policy Grant', funder:'Robert Wood Johnson Foundation', stage:['pi'], region:['USA'], fields:['Social Sciences'], keywords:['public health','health policy','health equity','community health','substance abuse','mental health','healthcare','obesity','tobacco','health systems'], amount:'Varies', duration:'2–4 years', url:'https://www.rwjf.org/', desc:'Supports research and programs to advance the health and wellbeing of all Americans.' },
  { id:'n132',  name:'William T. Grant Foundation Research Grant', funder:'William T. Grant Foundation', stage:['pi'], region:['USA'], fields:['Social Sciences'], keywords:['youth','adolescent','education','inequality','policy','social sciences','research use','evidence','programs for young people'], amount:'Up to $600k', duration:'2–3 years', url:'https://wtgrantfoundation.org/', desc:'Supports research on reducing inequality in youth outcomes and improving use of research in policies and programs.' },
  { id:'n133',  name:'Spencer Foundation Research Grant', funder:'Spencer Foundation', stage:['pi'], region:['USA','International'], fields:['Social Sciences'], keywords:['education','learning','teaching','educational research','school','equity','higher education','K-12','STEM education'], amount:'Up to $50k', duration:'1–2 years', url:'https://www.spencer.org/', desc:'Supports research that improves education. Particularly interested in equity and improving educational outcomes.' },
  { id:'n134',  name:'Social Science Research Council (SSRC) Fellowship', funder:'SSRC', stage:['phd','postdoc'], region:['USA'], fields:['Social Sciences','Humanities'], keywords:['social sciences','humanities','international research','area studies','African','Asian','Latin American','Middle Eastern','cultural'], amount:'Varies', duration:'1–2 years', url:'https://www.ssrc.org/', desc:'Multiple fellowship programs for social science and humanities researchers focusing on international issues.' },
  { id:'n135',  name:'Wenner-Gren Foundation Research Grant', funder:'Wenner-Gren Foundation', stage:['phd','postdoc','pi'], region:['International'], fields:['Social Sciences'], keywords:['anthropology','archaeology','biological anthropology','cultural anthropology','linguistic anthropology','primatology','human evolution','ethnography'], amount:'Up to $20k', duration:'1–2 years', url:'https://wennergren.org/', desc:'Supports anthropological research at all stages of career. One of the leading funders of anthropology globally.' },
  { id:'n136',  name:'American Philosophical Society Research Grants', funder:'American Philosophical Society', stage:['phd','pi'], region:['USA'], fields:['Humanities','Social Sciences'], keywords:['humanities','history','philosophy','science history','literature','linguistics','anthropology','social sciences'], amount:'Up to $6k', duration:'1 year', url:'https://www.amphilsoc.org/grants', desc:'Supports scholarly research in humanities and social sciences for US scholars.' },

  // ── Women in Science ──────────────────────────────────────────────────────────
  { id:'n140',  name:'AWIS Foundation Scholarships', funder:'Association for Women in Science', stage:['phd'], region:['USA'], fields:['STEM'], keywords:['women in science','STEM','biology','chemistry','physics','engineering','computer science','neuroscience','environmental'], amount:'Varies', duration:'1 year', url:'https://www.awis.org/scholarship/', desc:'Scholarships for women pursuing science degrees. Multiple programs across STEM fields.' },
  { id:'n141',  name:'Association for Women in Mathematics Travel Grants', funder:'AWM', stage:['phd','postdoc','pi'], region:['USA'], fields:['Mathematics'], keywords:['mathematics','algebra','analysis','topology','applied mathematics','statistics','computational mathematics'], amount:'Up to $1,500', duration:'Per event', url:'https://awm-math.org/', desc:'Travel grants for women in mathematics to attend conferences and workshops.' },
  { id:'n142',  name:'FWF Elise Richter Excellence Award (Austria)', funder:'FWF (Austria)', stage:['pi'], region:['Austria'], fields:['All'], keywords:[], amount:'~€80k/year', duration:'Up to 4 years', url:'https://www.fwf.ac.at/', desc:'Supports outstanding female researchers in Austria pursuing university careers. Includes project funding.' },

  // ── Gates Foundation / Global Health ─────────────────────────────────────────
  { id:'n150',  name:'Wellcome Trust International Intermediate Fellowship', funder:'Wellcome Trust', stage:['postdoc'], region:['International'], fields:['Biomedical','Life Sciences'], keywords:['biomedical','infectious disease','neglected tropical disease','global health','biology','genetics','parasitology','virology','bacteriology'], amount:'Up to £500k', duration:'5 years', url:'https://wellcome.org/grant-funding/schemes/intermediate-fellowships', desc:'For researchers in low/middle-income countries transitioning to research independence in biomedical sciences.' },
  { id:'n151',  name:'Gates Foundation Grand Challenges Explorations', funder:'Bill & Melinda Gates Foundation', stage:['phd','postdoc','pi'], region:['International'], fields:['Biomedical','Life Sciences'], keywords:['global health','infectious disease','malaria','tuberculosis','HIV','vaccine','nutrition','sanitation','poverty','agriculture','maternal health','neglected tropical diseases'], amount:'Up to $100k', duration:'1–2 years', url:'https://gcgh.grandchallenges.org/', desc:'Funds bold ideas to tackle global health challenges. Phase 1 grants require only a 2-page application. Rolling deadlines.' },

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

// ── Relevance engine ──────────────────────────────────────────────────────────

// For live API searches: field only — stage terms cause Grants.gov to return
// completely unrelated results (arts fellowships, student housing, etc.)
function _buildApiKeywords(profile) {
  const field = (profile?.field || '').trim()
  return field || 'research'
}

// NIH activity codes by career stage — used to filter NIH Reporter results
const _NIH_MECHANISMS = {
  phd:     ['F31','F30','T32'],
  postdoc: ['F32','K99','K01','K08','T32'],
  pi:      ['R01','R21','R03','R35','DP2','DP1','K99','K01','K08','K23'],
}

// Tokenise a field string into meaningful search terms (4+ chars)
function _fieldTokens(field) {
  return (field || '')
    .toLowerCase()
    .split(/[\s,\/\-\(\)]+/)
    .filter(t => t.length >= 4)
}

// Weighted relevance score for a grant vs a researcher profile
function _relevanceScore(grant, profile) {
  const stage  = profile?.careerStage || ''
  const field  = (profile?.field || '').toLowerCase()
  const region = profile?.region || ''
  let score    = 0

  // Career stage: must match — wrong stage = 0
  if (stage && !grant.stage.includes(stage)) return 0
  if (stage) score += 40

  // Region match
  if (region && grant.region.some(r => r === region || r === 'International')) score += 15

  if (!field) return score

  const tokens = _fieldTokens(field)

  // Check specific keywords array (highest precision)
  const grantKws = (grant.keywords || []).join(' ')
  for (const t of tokens) {
    if (grantKws.includes(t)) score += 10
  }

  // Check broad fields array
  for (const f of grant.fields) {
    const fl = f.toLowerCase()
    if (fl === 'all') { score += 3; continue }
    if (fl === 'stem' && tokens.some(t => ['biology','chemistry','physics','engineering','computer','mathematics','science'].some(s => s.startsWith(t) || t.startsWith(s)))) {
      score += 5; continue
    }
    if (field.includes(fl) || tokens.some(t => fl.includes(t) || t.includes(fl))) score += 8
  }

  // Check grant name and desc for field tokens
  const searchable = (grant.name + ' ' + grant.desc).toLowerCase()
  for (const t of tokens) {
    if (searchable.includes(t)) score += 3
  }

  return score
}

// Rank and bucket grants into match tiers
function _rankGrants(grants, profile) {
  const scored = grants
    .map(g => ({ g, score: _relevanceScore(g, profile) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)

  return {
    perfect: scored.filter(x => x.score >= 55).map(x => x.g),
    strong:  scored.filter(x => x.score >= 30 && x.score < 55).map(x => x.g),
    explore: scored.filter(x => x.score > 0  && x.score < 30).map(x => x.g),
  }
}

// ── Live search state ─────────────────────────────────────────────────────────

let _liveSearchQuery    = ''
let _liveSearchResults  = { ggov: null, nih: null, nsf: null, eu: null, ukri: null }
let _liveSourceEnabled  = { ggov: true, nih: true, nsf: true, eu: true, ukri: true }
let _liveSearchDone     = false

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
    { id:'search',    label:'🔍 Search' },
    { id:'resources', label:'🌐 Databases' },
  ]

  vc.innerHTML = `
  ${pageHeader('💰 Grant Scan', `
    <div class="flex gap-2">
      ${_grantTab==='mine' ? `<button onclick="openGrantModal()" class="btn-primary text-xs py-2">+ Add Grant</button>` : ''}
    </div>`)}

  <!-- Tabs -->
  <div class="bg-white border-b border-slate-200 px-2 lg:px-5 flex gap-1 flex-shrink-0 overflow-x-auto">
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
  // Reset live search state when re-entering the search tab fresh
  if (tab === 'search' && !_liveSearchDone) {
    _liveSearchQuery   = _buildApiKeywords(state.profile)
    _liveSearchResults = { ggov: null, nih: null, nsf: null, eu: null, ukri: null }
  }
  renderGrantTab()
}

function renderGrantTab() {
  const el = document.getElementById('grant-tab-content')
  if (!el) return
  if      (_grantTab === 'foryou')    el.innerHTML = buildForYouHTML()
  else if (_grantTab === 'mine')      el.innerHTML = buildMyGrantsHTML()
  else if (_grantTab === 'search')    buildSearchHTML(el)
  else                                el.innerHTML = buildResourcesHTML()
}

// ── FOR YOU ───────────────────────────────────────────────────────────────────

let _forYouNihResults  = null  // null=not loaded, 'loading', [] or {error}
let _forYouNsfResults  = null
let _fundedPanelState  = 'idle'  // idle | loading | loaded

function buildForYouHTML() {
  const p = state.profile || {}
  const stage  = p.careerStage
  const field  = p.field || ''
  const region = p.region || ''
  const stageLabels = { phd:'PhD Student', masters:'Masters Student', postdoc:'Postdoc', pi:'PI / Group Leader' }
  const alreadyTracked = new Set(state.grants.map(g => g.sourceId).filter(Boolean))

  const setupCard = !stage ? `
  <div class="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-5">
    <div class="flex items-start gap-3">
      <div class="text-2xl">🎯</div>
      <div class="flex-1">
        <h3 class="text-sm font-bold text-indigo-900 mb-1">Tell us about your career stage</h3>
        <p class="text-xs text-indigo-700 mb-3">PhDFlow ranks every grant by relevance to your stage and research field.</p>
        <div class="flex flex-wrap gap-2">
          ${['phd','masters','postdoc','pi'].map(s => `
          <button onclick="grantSetStage('${s}')"
            class="px-3 py-1.5 rounded-xl border-2 border-indigo-200 bg-white text-xs font-semibold text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 transition-all">
            ${stageLabels[s]}
          </button>`).join('')}
        </div>
      </div>
    </div>
  </div>` : ''

  const profilePill = stage ? `
  <div class="flex items-center gap-2 mb-4 flex-wrap">
    <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
      <span class="font-semibold text-slate-700">Profile:</span>
      <span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">${stageLabels[stage]}</span>
      ${field ? `<span class="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium truncate max-w-[180px]">${esc(field)}</span>` : ''}
      ${region ? `<span class="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">${esc(region)}</span>` : ''}
    </div>
    <button onclick="grantEditProfile()" class="text-xs text-slate-400 hover:text-indigo-600 hover:underline">Edit</button>
  </div>` : ''

  const tiers = _rankGrants(GRANT_DB, p)

  const grantCard = (g, tier) => {
    const tracked = alreadyTracked.has(g.id)
    const tierBorder = tier === 'perfect' ? 'border-indigo-200' : 'border-slate-200'
    const stageChip = s => {
      const sc = {phd:'bg-indigo-100 text-indigo-700',postdoc:'bg-purple-100 text-purple-700',pi:'bg-teal-100 text-teal-700',masters:'bg-slate-100 text-slate-600'}
      return `<span class="text-xs px-2 py-0.5 rounded-full ${sc[s]||'bg-slate-100 text-slate-600'}">${s==='phd'?'PhD':s==='pi'?'PI':s==='masters'?'Masters':'Postdoc'}</span>`
    }
    return `
    <div class="bg-white border ${tierBorder} rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-2.5">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-slate-900 text-sm leading-snug">${esc(g.name)}</h3>
          <p class="text-xs text-slate-500 mt-0.5">${esc(g.funder)}</p>
        </div>
        ${tracked ? `<span class="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Tracking</span>` : ''}
      </div>
      <p class="text-xs text-slate-600 leading-relaxed line-clamp-2">${esc(g.desc)}</p>
      <div class="flex gap-1.5 flex-wrap">
        ${g.stage.map(stageChip).join('')}
        ${g.region.slice(0,2).map(r=>`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${r}</span>`).join('')}
        ${g.fields[0]!=='All'?`<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">${g.fields[0]}</span>`:''}
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
        <span class="font-medium text-slate-700">${g.amount}${g.duration?' · '+g.duration:''}</span>
        <div class="flex gap-2">
          <button onclick="api.openExternal('${esc(g.url)}')" class="text-indigo-500 hover:underline">Website ↗</button>
          ${!tracked ? `<button onclick="trackDiscoveredGrant('${g.id}')" class="text-xs px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">+ Track</button>` : ''}
        </div>
      </div>
    </div>`
  }

  const tierSection = (tier, label, colorCls, grants) => {
    if (!grants.length) return ''
    return `
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs font-bold uppercase tracking-wider ${colorCls}">${label}</span>
        <span class="text-xs text-slate-400">${grants.length} grant${grants.length>1?'s':''}</span>
      </div>
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        ${grants.slice(0,tier==='explore'?6:24).map(g=>grantCard(g,tier)).join('')}
      </div>
      ${tier==='explore'&&grants.length>6?`<p class="mt-1.5 text-xs text-slate-400">+${grants.length-6} more in <button onclick="switchGrantTab('search')" class="text-indigo-500 hover:underline">Search</button></p>`:''}
    </div>`
  }

  const hasResults = tiers.perfect.length || tiers.strong.length || tiers.explore.length

  return `
  <div class="p-3 lg:p-5 max-w-5xl">
    ${setupCard}
    ${profilePill}
    ${!stage ? '' : !hasResults ? `
    <div class="py-8 text-center text-slate-400 text-sm mb-4">
      No grants matched your profile yet.
      ${!field ? '<br/><span class="text-xs mt-1 block">Add a research field in Settings → Profile for better matches.</span>' : ''}
      <br/><button onclick="switchGrantTab('search')" class="mt-3 text-indigo-500 hover:underline text-xs">Search all ${GRANT_DB.length}+ grants →</button>
    </div>` : `
    ${tierSection('perfect', '⭐ Perfect match', 'text-indigo-700', tiers.perfect)}
    ${tierSection('strong',  '✓ Strong match',  'text-emerald-700', tiers.strong)}
    ${tierSection('explore', '🔍 Explore',       'text-slate-500',   tiers.explore)}
    <div class="text-center mt-1 mb-5">
      <button onclick="switchGrantTab('search')" class="text-xs text-slate-400 hover:text-indigo-600 hover:underline">
        Search all ${GRANT_DB.length}+ grants + live databases →
      </button>
    </div>`}
    ${_buildFundedPanel()}
  </div>`
}

// ── "What's being funded" panel (NIH + NSF funded projects) ──────────────────

function _buildFundedPanel() {
  const p = state.profile || {}
  if (!p.field && !p.careerStage) return ''

  if (_fundedPanelState === 'idle') return `
  <div class="border-t border-slate-200 pt-5 mt-2">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-bold text-slate-700">🔬 What's being funded in your field</h3>
      <button onclick="loadFundedPanel()" class="text-xs text-indigo-600 hover:underline font-medium">Load from NIH + NSF →</button>
    </div>
    <p class="text-xs text-slate-400">See recently funded projects in your research area to understand which mechanisms are active and what reviewers support.</p>
  </div>`

  if (_fundedPanelState === 'loading') return `
  <div class="border-t border-slate-200 pt-5 mt-2">
    <div class="flex items-center gap-2 text-sm text-slate-500">
      <div class="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
      <span class="font-semibold text-slate-700">What's being funded in your field</span>
      <span>Querying NIH Reporter + NSF…</span>
    </div>
  </div>`

  const cards = (items) => {
    if (!items?.length) return `<p class="text-xs text-slate-400 italic">No results found.</p>`
    return items.slice(0,6).map(r => `
    <div class="bg-white border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors">
      <div class="flex items-start justify-between gap-2 mb-1">
        <p class="text-xs font-semibold text-slate-800 leading-snug flex-1 line-clamp-2">${esc(r.name)}</p>
        ${r.mechanism?`<span class="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0">${esc(r.mechanism)}</span>`:''}
      </div>
      <div class="text-xs text-slate-400 mb-1 flex gap-1.5 flex-wrap">
        ${r.pi?`<span>${esc(r.pi.slice(0,35))}</span>`:''}
        ${r.org?`<span>· ${esc(r.org.slice(0,35))}</span>`:''}
        ${r.amount?`<span class="text-slate-600 font-medium">· ${esc(r.amount)}</span>`:''}
        ${r.year?`<span>· FY${r.year}</span>`:''}
      </div>
      ${r.abstract?`<p class="text-xs text-slate-500 line-clamp-2">${esc(r.abstract)}</p>`:''}
      <button onclick="api.openExternal('${esc(r.url)}')" class="text-xs text-indigo-500 hover:underline mt-1">View ↗</button>
    </div>`).join('')
  }

  return `
  <div class="border-t border-slate-200 pt-5 mt-2">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-bold text-slate-700">🔬 What's being funded in your field</h3>
      <button onclick="_fundedPanelState='idle';renderGrantTab()" class="text-xs text-slate-400 hover:text-slate-600">Hide</button>
    </div>
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div>
        <div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🇺🇸 NIH Reporter — ${(_forYouNihResults||[]).length} recent projects</div>
        <div class="space-y-2">${cards(_forYouNihResults)}</div>
      </div>
      <div>
        <div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🔬 NSF Awards — ${(_forYouNsfResults||[]).length} recent awards</div>
        <div class="space-y-2">${cards(_forYouNsfResults)}</div>
      </div>
    </div>
    <p class="text-xs text-slate-400 mt-3">Recently funded projects in your field — shows active mechanisms and review priorities.</p>
  </div>`
}

async function loadFundedPanel() {
  const p    = state.profile || {}
  const kw   = _buildApiKeywords(p)
  const codes = _NIH_MECHANISMS[p.careerStage] || []
  _fundedPanelState = 'loading'
  renderGrantTab()
  const [nih, nsf] = await Promise.allSettled([
    api.searchNihReporter({ keywords: kw, activityCodes: codes, rows: 10 }),
    api.searchNsfAwards({ keywords: kw, rows: 10 }),
  ])
  _forYouNihResults = nih.status==='fulfilled' && nih.value.success ? nih.value.results : []
  _forYouNsfResults = nsf.status==='fulfilled' && nsf.value.success ? nsf.value.results : []
  _fundedPanelState = 'loaded'
  renderGrantTab()
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
  <div class="p-3 lg:p-5 space-y-3 max-w-3xl">
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

// ── SEARCH (unified: built-in + live APIs) ────────────────────────────────────

const _SOURCE_META = {
  builtin: { label: '🗃 Built-in',    color: 'slate'  },
  ggov:    { label: '🇺🇸 Grants.gov', color: 'blue'   },
  nih:     { label: '🇺🇸 NIH Reporter',color: 'indigo' },
  nsf:     { label: '🔬 NSF Awards',  color: 'teal'   },
  eu:      { label: '🇪🇺 EU Horizon', color: 'indigo' },
  ukri:    { label: '🇬🇧 UKRI',       color: 'violet' },
}

function buildSearchHTML(el) {
  if (!_liveSearchQuery) _liveSearchQuery = _buildGrantKeywords(state.profile)

  const alreadyTracked = new Set(state.grants.map(g => g.sourceId).filter(Boolean))

  // ── Built-in results (instant, filtered from GRANT_DB) ────────────────────
  const q = _liveSearchQuery.toLowerCase()
  const builtinResults = GRANT_DB.filter(g =>
    !q || g.name.toLowerCase().includes(q) || g.funder.toLowerCase().includes(q) ||
    g.desc.toLowerCase().includes(q) ||
    g.fields.some(f => q.includes(f.toLowerCase())) ||
    g.stage.some(s => q.includes(s))
  )

  // ── Source section renderer ────────────────────────────────────────────────
  const liveSection = (key, results) => {
    const meta = _SOURCE_META[key]
    if (!_liveSourceEnabled[key]) return ''
    if (results === null) return `
    <div class="mb-5">
      <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">${meta.label}</div>
      <div class="text-xs text-slate-400 italic">Not searched yet — click Search to load</div>
    </div>`
    if (results === 'loading') return `
    <div class="mb-5">
      <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <div class="w-3 h-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <span class="font-bold uppercase tracking-wide">${meta.label}</span>
        <span class="text-slate-400">searching…</span>
      </div>
    </div>`
    if (results.error) return `
    <div class="mb-5">
      <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">${meta.label}</div>
      <div class="text-xs text-rose-400">Could not reach this source: ${esc(results.error)}</div>
    </div>`
    if (!results.length) return `
    <div class="mb-5">
      <div class="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">${meta.label}</div>
      <div class="text-xs text-slate-400 italic">No results found for this query.</div>
    </div>`

    return `
    <div class="mb-5">
      <div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
        ${meta.label} <span class="font-normal text-slate-400">(${results.length}${results.total > results.length ? ' of '+results.total : ''})</span>
      </div>
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        ${results.map(g => _liveGrantCard(g, alreadyTracked, key)).join('')}
      </div>
    </div>`
  }

  el.innerHTML = `
  <!-- Search bar -->
  <div class="bg-white border-b border-slate-100 px-5 py-3 flex gap-2 flex-wrap items-start">
    <div class="flex-1 min-w-64">
      <div class="flex gap-2">
        <input id="grant-search-q" type="text" value="${esc(_liveSearchQuery)}"
          placeholder="e.g. computational neuroscience doctoral fellowship"
          class="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onkeydown="if(event.key==='Enter')runLiveGrantSearch()"/>
        <button onclick="runLiveGrantSearch()"
          class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0">
          🔍 Search
        </button>
      </div>
      <div class="mt-1.5 flex gap-3 flex-wrap">
        ${Object.entries(_SOURCE_META).map(([key, m]) => `
        <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
          <input type="checkbox" ${_liveSourceEnabled[key]?'checked':''}
            onchange="_liveSourceEnabled['${key}']=this.checked;renderGrantTab()"
            class="accent-indigo-600"/>
          ${m.label}
        </label>`).join('')}
      </div>
    </div>
    <div class="flex gap-2 flex-shrink-0 items-start pt-0.5">
      <button onclick="grantOpenWebSearch()" title="Open a tailored search in your browser"
        class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
        🌐 Web
      </button>
      <button onclick="grantEditProfile()" title="Edit your grant profile"
        class="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
        🎯 Profile
      </button>
    </div>
  </div>

  <!-- Results -->
  <div class="p-3 lg:p-5 max-w-5xl">

    <!-- Built-in DB -->
    ${_liveSourceEnabled.builtin ? `
    <div class="mb-5">
      <div class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
        🗃 Built-in <span class="font-normal text-slate-400">(${builtinResults.length} of ${GRANT_DB.length})</span>
      </div>
      ${builtinResults.length ? `
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        ${builtinResults.map(g => _builtinGrantCard(g, alreadyTracked)).join('')}
      </div>` : `<div class="text-xs text-slate-400 italic">No built-in grants match this query.</div>`}
    </div>` : ''}

    <!-- Live sources -->
    ${liveSection('ggov',  _liveSearchResults.ggov)}
    ${liveSection('eu',    _liveSearchResults.eu)}
    ${liveSection('ukri',  _liveSearchResults.ukri)}

    ${!_liveSearchDone && _liveSearchResults.ggov === null ? `
    <div class="text-center py-6 text-slate-400 text-sm">
      <p class="mb-3">Search live databases for real open opportunities.</p>
      <button onclick="runLiveGrantSearch()" class="btn-primary text-sm px-5 py-2">🔍 Search now</button>
    </div>` : ''}
  </div>`
}

function _builtinGrantCard(g, alreadyTracked) {
  const tracked = alreadyTracked.has(g.id)
  const reasons = _grantMatchReasons(g, state.profile || {})
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
    <div class="flex gap-1.5 flex-wrap">${stageChips}
      ${g.region.slice(0,2).map(r=>`<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${r}</span>`).join('')}
      ${g.fields[0]!=='All'?`<span class="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">${g.fields[0]}</span>`:''}
    </div>
    <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
      <span class="font-medium">${g.amount}${g.duration?' · '+g.duration:''}</span>
      <div class="flex gap-2">
        <button onclick="api.openExternal('${esc(g.url)}')" class="text-indigo-500 hover:underline">Website ↗</button>
        ${!tracked ? `<button onclick="trackDiscoveredGrant('${g.id}')" class="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">+ Track</button>` : ''}
      </div>
    </div>
  </div>`
}

function _liveGrantCard(g, alreadyTracked, sourceKey) {
  const tracked    = alreadyTracked.has(g.id)
  const sourceMeta = _SOURCE_META[sourceKey]
  const deadlineStr = g.deadline ? fmtDate(g.deadline) : ''
  const now = new Date().toISOString().split('T')[0]
  const urgent = g.deadline && g.deadline < new Date(Date.now() + 30*864e5).toISOString().split('T')[0]

  return `
  <div class="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col gap-2.5">
    <div>
      <div class="flex items-start justify-between gap-2 mb-0.5">
        <h3 class="font-bold text-slate-900 text-sm leading-snug flex-1">${esc(g.name)}</h3>
        ${tracked ? `<span class="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">✓ Tracking</span>` : ''}
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span>${esc(g.funder)}</span>
        ${g.number ? `<span class="text-slate-300">·</span><span class="font-mono text-slate-400">${esc(g.number)}</span>` : ''}
      </div>
    </div>
    ${g.desc ? `<p class="text-xs text-slate-600 leading-relaxed line-clamp-2">${esc(g.desc)}</p>` : ''}
    <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
      <div class="flex items-center gap-2 flex-wrap">
        ${g.amount ? `<span class="font-medium text-slate-700">${esc(g.amount)}</span>` : ''}
        ${deadlineStr ? `<span class="${urgent ? 'text-rose-500 font-semibold' : 'text-slate-400'}">🗓 ${deadlineStr}</span>` : ''}
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button onclick="api.openExternal('${esc(g.url)}')" class="text-indigo-500 hover:underline">Open ↗</button>
        ${!tracked ? `<button onclick="trackLiveGrant(${JSON.stringify(g).replace(/"/g,'&quot;')})" class="text-xs px-2.5 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium">+ Track</button>` : ''}
      </div>
    </div>
  </div>`
}

async function runLiveGrantSearch() {
  const inp = document.getElementById('grant-search-q')
  if (inp) _liveSearchQuery = inp.value.trim() || _buildGrantKeywords(state.profile)

  _liveSearchResults = { ggov:'loading', nih:'loading', nsf:'loading', eu:'loading', ukri:'loading' }
  _liveSearchDone    = false
  renderGrantTab()

  const apiKw  = _buildApiKeywords(state.profile) || _liveSearchQuery.split(' ').slice(0,3).join(' ')
  const codes  = _NIH_MECHANISMS[state.profile?.careerStage] || []
  const update = () => renderGrantTab()

  const run = (key, promise) => {
    if (!_liveSourceEnabled[key]) { _liveSearchResults[key] = null; return }
    promise.then(r => {
      _liveSearchResults[key] = r.success ? r.results : { error: r.error }
      update()
    }).catch(e => { _liveSearchResults[key] = { error: e.message }; update() })
  }

  run('ggov', api.searchGrantsGov({ keywords: apiKw, rows: 20 }))
  run('nih',  api.searchNihReporter({ keywords: apiKw, activityCodes: codes, rows: 20 }))
  run('nsf',  api.searchNsfAwards({ keywords: apiKw, rows: 20 }))
  run('eu',   api.searchEuCordis({ keywords: apiKw, rows: 20 }))
  run('ukri', api.searchUkri({ keywords: apiKw, rows: 20 }))

  _liveSearchDone = true
}

function grantOpenWebSearch() {
  const kw  = _liveSearchQuery || _buildGrantKeywords(state.profile)
  const q   = encodeURIComponent(`research grant fellowship funding "${kw}"`)
  api.openExternal(`https://www.google.com/search?q=${q}`)
}

function trackLiveGrant(g) {
  if (!g?.id) return
  const existing = state.grants.find(x => x.sourceId === g.id)
  if (existing) { showToast('Already tracking this grant', 'info'); return }
  state.grants.push({
    id:          uid(),
    sourceId:    g.id,
    title:       g.name,
    funder:      g.funder,
    amount:      g.amount || '',
    duration:    '',
    deadline:    g.deadline || '',
    status:      'researching',
    eligibility: g.desc || '',
    tags:        [g.source],
    requirements: [], sections: [], coApplicants: [],
    notes:       `Source: ${g.source}\nURL: ${g.url}`,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  })
  save('grants')
  _syncGrantCalendarEvent(state.grants[state.grants.length - 1])
  renderGrantTab()
  showToast(`"${g.name}" added to My Grants ✓`)
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

  <!-- Linked Notes -->
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-bold text-slate-800">📄 Notes</span>
      <div class="flex gap-3">
        <button onclick="createLinkedNote('${id}','grant')" class="text-xs text-indigo-600 hover:underline font-medium">+ New</button>
        <button onclick="linkExistingNote('${id}','grant')" class="text-xs text-slate-400 hover:text-slate-600 font-medium">+ Link existing</button>
      </div>
    </div>
    <div id="linked-notes-${id}">${renderLinkedNotes(id,'grant')}</div>
  </div>

  <!-- Internal notes (quick scratch pad) -->
  <div class="mb-4">
    <label class="label">Internal notes <span class="font-normal text-slate-400">(quick scratch pad)</span></label>
    <textarea rows="2" class="input resize-none" placeholder="Quick notes, links, contacts…"
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

  ${_aiAvailable() ? `
  <div class="flex gap-2 border-t border-slate-100 pt-3 mb-3">
    <button onclick="grantAiDraftSection('${id}','aims')" class="flex-1 text-xs py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-medium transition-colors">✨ Draft Specific Aims</button>
    <button onclick="grantAiDraftSection('${id}','significance')" class="flex-1 text-xs py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-medium transition-colors">✨ Draft Significance</button>
    <button onclick="grantAiDraftSection('${id}','approach')" class="text-xs py-2 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl font-medium transition-colors">✨ Approach</button>
  </div>
  <div id="grant-ai-result-${id}" class="hidden mb-3 p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-900 leading-relaxed max-h-48 overflow-y-auto"></div>
  ` : ''}
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

// ── AI grant writing ──────────────────────────────────────────────────────────

async function grantAiDraftSection(grantId, section) {
  const g   = state.grants.find(x => x.id === grantId)
  const box = document.getElementById(`grant-ai-result-${grantId}`)
  if (!g || !box) return

  const sections = { aims:'Specific Aims', significance:'Significance & Innovation', approach:'Research Approach' }
  box.innerHTML = `<span class="text-violet-400">✨ Drafting ${sections[section]}…</span>`
  box.classList.remove('hidden')

  const profile = state.profile || {}
  const context = [
    `Grant: ${g.title}`,
    `Funder: ${g.funder}`,
    g.amount   ? `Amount: ${g.amount}` : '',
    g.eligibility ? `Description: ${g.eligibility}` : '',
    profile.field ? `Researcher field: ${profile.field}` : '',
    g.notes    ? `Notes: ${g.notes}` : '',
  ].filter(Boolean).join('\n')

  const prompts = {
    aims:         `Write a concise Specific Aims section (1 page equivalent) for this grant application. Include: the problem being addressed, 2-3 specific aims with brief rationale, and expected impact.`,
    significance: `Write a Significance and Innovation section for this grant. Explain why the research is important, what gap it fills, and what is genuinely novel about the approach.`,
    approach:     `Draft a Research Approach section outline with: overview paragraph, methodology for each aim, potential challenges and how to address them, and expected outcomes.`,
  }

  const r = await _aiCall(
    `${context}\n\n${prompts[section]}`,
    `You are an expert academic grant writer helping a researcher. Write in formal academic style suitable for submission. Be specific, compelling, and avoid generic statements.`
  )

  if (r.success) {
    box.innerHTML = r.response
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\n\n/g,'<br/><br/>')
      .replace(/\n/g,'<br/>')
  } else {
    box.innerHTML = `<span class="text-rose-500">Error: ${esc(r.error)}</span>`
  }
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
