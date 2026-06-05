// ══ Writing Assistant — Academic writing with embedded expert knowledge ════════
// Knowledge base: NIH R01, NSF, EU Horizon, IMRAD, CARS, PRISMA, thesis structures

// ── Document type registry ────────────────────────────────────────────────────
const WRITING_TYPES = {

  'journal-article': {
    label: 'Journal Article', icon: '📄', color: '#6366f1',
    desc: 'Empirical paper (IMRAD structure)',
    sections: [
      { id:'title',        label:'Title',           words:20,
        hint:'Informative, specific, concise (12–15 words ideal). Include key variables or outcome. Avoid abbreviations in title. Declarative titles are gaining popularity.',
        starters:['[Key variable] predicts [outcome] in [population]','Effect of [intervention] on [outcome]: a [design]','[Mechanism] mediates the relationship between [A] and [B]'] },
      { id:'abstract',     label:'Abstract',        words:250,
        hint:'STRUCTURED: Background (why it matters), Methods (what you did), Results (key numbers), Conclusions (so what?).\nOR UNSTRUCTURED: single paragraph covering all four areas.\nMust be standalone. No citations. No undefined abbreviations. Lead with the most important result.',
        starters:['Background: [condition/problem] affects [N] individuals globally and...','[N] [participants/samples] were [recruited/collected] from [source] between [dates].','The primary outcome was [X], measured using [validated tool].','[Intervention/predictor] significantly [improved/predicted] [outcome] (p = X, d = Y).'] },
      { id:'keywords',     label:'Keywords',         words:50,
        hint:'5–8 keywords NOT appearing in the title. Use controlled vocabulary (MeSH for biomedical). Order from specific to general.' },
      { id:'introduction', label:'Introduction',     words:600,
        hint:'CARS MODEL (Swales, 1990):\n1. ESTABLISH TERRITORY — why this domain matters. Broad → specific funnel. State the problem with burden data or theoretical stakes. 1–2 paragraphs.\n2. ESTABLISH NICHE — identify the gap. "However, little is known about..." or "Despite progress in X, it remains unclear whether..."\n3. OCCUPY THE NICHE — what this paper does. "Here, we investigated..." End with aim statement and brief outline.',
        starters:['[Condition/problem] affects [number] [people/organisms/systems] globally, representing a major [burden/challenge/cost] (Ref).','Despite substantial progress in understanding [territory], [specific gap] remains poorly characterised.','However, few studies have examined [specific question], and those that have [limitation of prior work].','In this study, we [aim verb: investigate/examine/test/characterise] whether [hypothesis]. We hypothesised that...','The aim of this study was to [specific aim]. We predicted that [directional hypothesis].'] },
      { id:'methods',      label:'Methods',          words:800,
        hint:'PAST TENSE throughout. Sub-sections: Study Design • Participants/Materials • Procedure • Measures/Data Collection • Data Analysis • Ethical Approval.\nReproducibility standard: another lab should be able to replicate exactly. Be precise with sample sizes, instruments, and statistical tests. Pre-registration? State it here.',
        starters:['[N = X] [participants/samples] were recruited from [source] between [dates].','Inclusion criteria were: [list]. Exclusion criteria included: [list].','Data were collected using [instrument/method] (Ref), which has demonstrated [reliability/validity metric].','Statistical analyses were performed using [software] version [X]. [Test name] was used to examine [hypothesis].','Written informed consent was obtained from all participants. The study was approved by [IRB/Ethics Committee] (protocol #X).'] },
      { id:'results',      label:'Results',          words:800,
        hint:'PAST TENSE. Present findings without interpretation.\n• Lead with primary outcome\n• Report exact statistics: M ± SD, t-values, p-values, effect sizes (d, η², r), 95% CIs\n• Reference all figures and tables in order\n• Report secondary outcomes, unexpected findings\n• Be precise: "significantly" only when p < α; use "marginally" or "approached significance" for .05–.10',
        starters:['[Primary hypothesis] was [supported/not supported].','Participants in the [condition] showed significantly [greater/lower] [outcome] (M = X.XX, SD = Y.YY) compared to [comparison] (M = X.XX, SD = Y.YY), t([df]) = Z.ZZ, p = .XXX, 95% CI [lower, upper], d = X.XX.','[Predictor] significantly predicted [outcome], B = X.XX, SE = X.XX, β = X.XX, t([df]) = X.XX, p = .XXX, 95% CI [lower, upper].','No significant difference was found between groups for [variable], F([df]) = X.XX, p = .XX, η² = .XX.'] },
      { id:'discussion',   label:'Discussion',       words:1000,
        hint:'TENSE: Present for general facts and theory; past for your specific findings.\n1. STATE MAIN FINDING DIRECTLY (2–3 sentences; do not repeat Results)\n2. INTERPRET — what does this mean theoretically?\n3. SITUATE IN LITERATURE — how does it compare with prior work?\n4. EXPLAIN INCONSISTENCIES — if results differ from expectation\n5. STRENGTHS & LIMITATIONS — be honest, specific, show you understand the implications\n6. IMPLICATIONS — clinical, theoretical, policy\n7. FUTURE DIRECTIONS',
        starters:['The primary finding of this study was that [X], which [supports/contradicts] [theory].','Consistent with [theory/prior work (Ref)], we found that [result].','These results extend prior work by demonstrating that [contribution beyond literature].','Contrary to our hypothesis, [unexpected result]. One possible explanation is [mechanism].','Several limitations should be considered. First, [limitation 1]. Second, [limitation 2].'] },
      { id:'conclusion',   label:'Conclusion',       words:150,
        hint:'1–2 paragraphs. Do NOT repeat Discussion. Answer your research question directly. State the contribution clearly. Avoid new information. End with a forward-looking sentence about implications or future directions.',
        starters:['In conclusion, this study demonstrated that [main finding], contributing [specific advance] to the literature on [topic].','These findings support the view that [theoretical statement] and have implications for [practice/policy/theory].','Future work should examine [specific questions] to determine whether [limitation/extension].'] },
      { id:'references',   label:'References',       words:null,
        hint:'Follow journal style (APA, Vancouver, Harvard, Chicago). Use a reference manager. All in-text citations must appear in reference list and vice versa. Verify DOIs. No "et al." in reference list unless >6 authors (check journal guidelines).' },
    ]
  },

  'nih-r01': {
    label: 'NIH R01 Grant', icon: '🏥', color: '#ef4444',
    desc: 'Standard NIH research grant (2+10 pages)',
    sections: [
      { id:'specific-aims', label:'Specific Aims',   words:650,
        hint:'THE MOST IMPORTANT PAGE OF YOUR ENTIRE APPLICATION. Reviewers read this first and form their overall impression here.\n\nSTRUCTURE:\n1. Opening Hook (2–3 sentences): unmet problem with disease burden/statistics\n2. Long-term Goal: "The long-term goal of our programme is to…"\n3. Objective: "The objective of this particular application is to…"\n4. Central Hypothesis: "Our central hypothesis is that…"\n5. Rationale: why this hypothesis and why now\n6. AIM 1: [Objective]. [Rationale]. [Approach]. Expected outcome.\n7. AIM 2: same structure\n8. AIM 3: same (optional Aim 4)\n9. Expected outcomes & potential impact\n\nAIMS should be independent (failure of one should not sink others). Each needs a clear, measurable endpoint.',
        starters:['[Disease] affects [N million] Americans and is the [Nth] leading cause of [death/disability], with annual costs exceeding $[X] billion.','Despite decades of research, no [disease-modifying/effective/durable] treatment exists for [condition].','The long-term goal of our programme is to understand [mechanism] to enable [outcome].','The objective of this application is to test the central hypothesis that [hypothesis].','Aim 1. [Verb: Determine/Characterise/Test/Develop] [specific objective]. Rationale: [why this aim]. Approach: [method]. Expected outcome: [measurable result].'] },
      { id:'significance',  label:'Significance',    words:1500,
        hint:'Why does this problem matter?\n• Start with the scope of the problem (epidemiology, economic burden, unmet need)\n• Identify what is KNOWN (cite your preliminary data and others)\n• Identify the CRITICAL GAP — the scientific problem your aims address\n• Explain how FILLING THIS GAP will change the field\n• Avoid being too narrow — reviewers want to see you understand the big picture\n\nDo NOT describe your methods here. This is about WHY, not HOW.',
        starters:['[Condition] is a leading cause of [mortality/morbidity], affecting [N] individuals in the United States alone.','Current treatments are limited by [specific limitation: efficacy/safety/access/etc.].','A critical gap in knowledge is [specific gap].','Filling this gap will [advance/transform/enable] [specific scientific or clinical impact].'] },
      { id:'innovation',    label:'Innovation',      words:500,
        hint:'What is genuinely NEW?\n• Shift in paradigm or scientific premise\n• Novel model or conceptual framework\n• Novel methodology, intervention, or tool\n• New application of existing approaches to a new problem\n\nDo NOT say "we are the first to study X" without evidence. Reviewers hate unsubstantiated novelty claims.\nCOMPARE explicitly with the current standard approach.',
        starters:['The proposed research is innovative because it [challenges/shifts/overturns/replaces] the current paradigm that [prior assumption].','Prior work has been limited to [limitation]. We propose a novel approach using [method/tool/model] that overcomes this limitation by [mechanism].','The application is innovative in the following respects: (1) [first innovation]; (2) [second innovation]; (3) [third innovation].'] },
      { id:'approach',      label:'Approach',        words:6000,
        hint:'The scientific core. Organize by AIM (not by technique). For each aim:\n• Overview of aim and central hypothesis\n• Preliminary data (CRITICAL — reviewers need to know you can do this)\n• Experimental design/methods\n• Expected outcomes (quantitative where possible)\n• Potential problems and alternative approaches\n\nTIMELINE: Include a realistic Gantt chart or table. Year 1, 2, etc.\n\nPitfall: Being so specific you box yourself in vs. being too vague to be credible.',
        starters:['Aim 1 Overview: We will [verb] [specific objective] to test the hypothesis that [aim-specific hypothesis].','Preliminary data: We have obtained [evidence supporting feasibility].','Potential pitfall: If [risk], we will [alternative approach].','Timeline: Aim 1 will be completed in Year 1 (Months 1–12)…'] },
      { id:'references',    label:'References',      words:null,
        hint:'No page limit. Current (last 5 years preferred). Include your own relevant publications — reviewers need to see your track record. Follow NIH citation format.' },
    ]
  },

  'nsf': {
    label: 'NSF Proposal', icon: '🔬', color: '#0891b2',
    desc: 'National Science Foundation proposal structure',
    sections: [
      { id:'project-summary', label:'Project Summary', words:350,
        hint:'THREE labelled paragraphs (REQUIRED by NSF):\n1. OVERVIEW: What you will do — who, what, where, when, how\n2. INTELLECTUAL MERIT: How does this advance knowledge within science/engineering?\n3. BROADER IMPACTS: What are the benefits to society, education, underrepresented groups?\n\nNSF takes Broader Impacts as seriously as Intellectual Merit. Be specific, not aspirational.\nMust be intelligible to a non-expert. Avoid jargon.',
        starters:['Overview: This project will [action] by [method], addressing [problem/question].','Intellectual Merit: This research [advances/transforms/contributes to] understanding of [field] by [specific contribution].','Broader Impacts: This project will [specific activity: train graduate students / involve undergraduates / develop curriculum / partner with community].'] },
      { id:'introduction',    label:'Introduction',    words:500,
        hint:'What is the problem? Why does it matter scientifically? What is the current state of knowledge? Build to your research gap.',
        starters:['[Field/topic] is a fundamental problem in [discipline] with implications for [downstream applications].','Despite decades of research, [specific gap] remains unresolved.'] },
      { id:'background',      label:'Background & Prior Art', words:1000,
        hint:'What has been done? Situate your work in relation to prior research. Cite seminal work AND recent work (reviewers will check currency). Show you know the field deeply. Where prior approaches fall short → motivates your work.' },
      { id:'research-plan',   label:'Research Plan',   words:5000,
        hint:'Organized by Research Objectives or Research Questions. Each should have:\n• Rationale for this specific approach\n• Detailed methods\n• Analysis plan\n• Expected outcomes\n• Contingency for negative results\n\nShow feasibility: preliminary data, relevant expertise, access to needed facilities.',
        starters:['Objective 1: [Specific, measurable objective]. Rationale: [why this approach].','We will use [method] to [test/measure/characterise] [variable].','If [expected outcome is not obtained], we will [alternative approach].'] },
      { id:'broader-impacts', label:'Broader Impacts',  words:500,
        hint:'Be SPECIFIC and REALISTIC. Reviewers are sceptical of vague claims. Examples of credible impacts:\n• Specific number of graduate/undergraduate students trained\n• Named outreach programme with measurable outcome\n• Open-source software release with estimated users\n• Named underrepresented group engagement plan\n• Industry partnership with specific deliverable',
        starters:['This project will directly support [N] graduate students and [N] undergraduate researchers, including [underrepresented group characteristic].','Results will be disseminated via [specific journals, conferences, open-access repository].','We will develop [educational materials/curriculum module/outreach programme] for [specific audience] at [specific partner institution/school/organisation].'] },
      { id:'timeline',        label:'Timeline',         words:200,
        hint:'Table or list. Show deliverables per 6-month or annual period. Be realistic — reviewers know what is achievable. Include student training, publications, data deposition.' },
      { id:'references',      label:'References Cited', words:null,
        hint:'No page limit. Cite only works referenced in the text. Include DOIs.' },
    ]
  },

  'eu-horizon': {
    label: 'EU Horizon Europe', icon: '🇪🇺', color: '#1d4ed8',
    desc: 'ERC / Collaborative Horizon Europe proposal',
    sections: [
      { id:'abstract',    label:'Abstract',               words:200,
        hint:'Max 200 words. Accessible to a non-specialist. WILL BE PUBLIC if funded. Cover: what you will do, how, and why it matters. Avoid acronyms and jargon.' },
      { id:'excellence',  label:'1.1 Objectives & Ambition', words:1000,
        hint:'What are your scientific objectives? Show they are ambitious yet realistic. Explain how they go beyond current state of the art. Be explicit about the "paradigm shift" you propose. For ERC: excellence = outstanding researcher + frontier research.',
        starters:['The overarching objective of this project is to [aim].','This project will challenge the current paradigm that [assumption] by demonstrating that [alternative].','The state of the art in [field] is currently limited to [limitation]. We propose to overcome this by [approach].'] },
      { id:'methodology', label:'1.2 Methodology',         words:3000,
        hint:'Describe your research approach, work packages, and how you will manage risk. Show:\n• Why your methodology is appropriate for your objectives\n• What tools/approaches you will use\n• How you handle uncertainty (alternative approaches)\n• For collaborative projects: how partners complement each other\n• Risk register: identify 3–5 risks with likelihood, impact, and mitigation',
        starters:['The project is structured into [N] work packages: WP1 [name], WP2 [name]...','Risk 1: [Description]. Likelihood: [High/Medium/Low]. Mitigation: [approach].','To ensure [objective], we will employ [method], which has been validated in [context (cite)].'] },
      { id:'impact-1',    label:'2.1 Expected Outcomes',   words:1000,
        hint:'Be SPECIFIC and MEASURABLE. Distinguish:\n• Short-term outcomes (end of project): publications, prototypes, datasets\n• Medium-term impacts (3–5 years): follow-on funding, industry adoption\n• Long-term societal impacts (10+ years): policy change, health outcomes\n\nUse the EU Horizon Impact taxonomy where relevant (scientific, economic, societal).',
        starters:['By the end of the project, we will have [specific deliverables: publications, datasets, prototypes].','Within 5 years of project completion, these results are expected to [medium-term impact].','In the long term, this work will contribute to [societal benefit / EU strategic goal / SDG].'] },
      { id:'impact-2',    label:'2.2 Dissemination Plan',  words:500,
        hint:'Open Science is mandatory in Horizon Europe.\n• Open Access publications (Horizon mandate: Plan S compliance)\n• Data management plan (FAIR principles)\n• Exploitation plan if applicable\n• Communication to non-specialist audiences (social media, press releases, public events)' },
      { id:'work-plan',   label:'3.1 Work Plan & Gantt',   words:3000,
        hint:'Work packages with tasks, milestones, and deliverables.\nMilestone: a qualitative checkpoint (decision point, completion of phase)\nDeliverable: a tangible output (report, dataset, prototype, publication)\n\nFor each WP:\n• Objective\n• Tasks (numbered: T1.1, T1.2...)\n• Effort per partner (person-months)\n• Deliverables and due dates\n• Dependencies\n\nGantt chart recommended.' },
      { id:'team',        label:'3.2 Team & Management',   words:1000,
        hint:'Show complementary expertise. For collaborative projects:\n• Who leads what WP and why they are the right person\n• Decision-making structure (Steering Committee, frequency of meetings)\n• Conflict resolution protocol\n• How you will ensure integration across WPs\n\nFor ERC: why YOU are the right person to lead this.' },
      { id:'resources',   label:'3.3 Budget Justification', words:500,
        hint:'Justify every budget line:\n• Personnel: who, what % FTE, why needed\n• Equipment: why needed, why not available elsewhere\n• Travel: which conferences, why this many\n• Subcontracting: what and why not done in-house\n• Overheads are usually fixed % — check call rules\n\nBudget must be coherent with the work plan.' },
    ]
  },

  'phd-thesis': {
    label: 'PhD Thesis Chapter', icon: '🎓', color: '#7c3aed',
    desc: 'Chapter for a traditional or paper-based PhD thesis',
    sections: [
      { id:'intro',       label:'Chapter Introduction',  words:400,
        hint:'1–2 pages. Must:\n1. Situate this chapter within the overall thesis argument\n2. State the chapter-specific research question or aim\n3. Briefly outline chapter structure ("This chapter is structured as follows: Section X examines... Section Y presents...")\n4. Link to the previous chapter if applicable',
        starters:['This chapter examines [topic], which relates to the overarching thesis argument that [theme].','Building on Chapter [N], which [established/demonstrated], this chapter turns to [focus].','The specific question addressed in this chapter is: [research question].','This chapter is structured as follows: Section [N] reviews the literature on [X]; Section [N+1] presents [method/findings]; Section [N+2] discusses [implications].'] },
      { id:'lit-review',  label:'Background / Literature', words:2000,
        hint:'Show mastery of the relevant literature. Purpose:\n• Establish the theoretical framework you work within\n• Identify what is known and what remains unclear\n• Justify your approach and methods\n• Position your contribution\n\nAvoid a "catalogue" of studies. Instead, organise thematically and build an argument.\nEnd this section with a clear statement of the gap your chapter addresses.',
        starters:['A substantial body of work has established that [established finding (citations)].','Theoretical accounts of [phenomenon] differ in [key dimension]. [Theory A] proposes [claim], while [Theory B] argues [alternative claim].','Despite this progress, [specific gap] remains unresolved. Specifically, it remains unclear whether [question].'] },
      { id:'methods',     label:'Methodology',           words:1500,
        hint:'For empirical chapters: describe design, participants, procedure, measures, analysis.\nFor theoretical/conceptual chapters: describe your interpretive approach, analytical framework, data sources.\n\nJustify your choices — why this method for this question? In a thesis, examiners will probe your methodological reasoning.',
        starters:['A [qualitative/quantitative/mixed methods] approach was adopted because [rationale linked to research question].','[N] participants were recruited using [sampling strategy] from [setting] between [dates].','Thematic analysis was conducted following [Braun & Clarke 2006 / other framework], using [inductive/deductive] coding.'] },
      { id:'findings',    label:'Findings / Results',    words:3000,
        hint:'Present your findings clearly and systematically.\n• Use thematic subheadings (qualitative) or structured results (quantitative)\n• Each finding should be supported by evidence (quotes for qualitative, statistics for quantitative)\n• Do not interpret here — save for Discussion\n• For quantitative: report effect sizes, CIs, not just p-values\n• For qualitative: use participant quotes to illustrate themes, with pseudonyms/codes' },
      { id:'discussion',  label:'Discussion',            words:1500,
        hint:'Engage with the literature. This is where you make your scholarly contribution.\n1. What do your findings mean?\n2. How do they confirm, extend, or challenge prior work? (cite specifics)\n3. What tensions or surprises exist in the data?\n4. What are the limitations of your approach?\n5. What is the contribution of this chapter to the thesis argument?',
        starters:['These findings [support/challenge/extend] prior work by [citation], which found [prior finding].','The most striking finding was [result], which was unexpected given [prior expectation] and suggests that [interpretation].','A key limitation of this chapter is [limitation], which means [implication for interpretation].'] },
      { id:'summary',     label:'Chapter Summary',       words:300,
        hint:'1–2 pages. Summarise the key contributions of the chapter. Link forward: "Chapter [N] will build on these findings by..." Help the reader understand how the pieces fit together.',
        starters:['In summary, this chapter has [demonstrated/argued/shown] that [main contribution].','These findings contribute to the thesis argument by [specific contribution].','Chapter [N] turns to [next topic], examining [focus] in light of these findings.'] },
    ]
  },

  'systematic-review': {
    label: 'Systematic Review', icon: '🔍', color: '#0d9488',
    desc: 'Systematic review or meta-analysis (PRISMA)',
    sections: [
      { id:'abstract',    label:'Structured Abstract',   words:350,
        hint:'PRISMA requires structured abstract with: Background, Objectives, Data sources, Study eligibility, Participants, Interventions, Assessment, Main outcomes and measures, Synthesis methods, Results (number included, key findings), Limitations, Conclusions, Systematic review registration number.',
        starters:['Background: [Condition/intervention] affects [population], yet systematic synthesis of evidence is lacking.','Objectives: To [synthesise/examine/meta-analyse] evidence on [outcome] in [population] receiving [intervention].','Results: [N] studies ([N participants]) were included. [Primary finding with statistic].'] },
      { id:'intro',       label:'Introduction',          words:600,
        hint:'Frame the clinical/scientific question. Use PICO (Population, Intervention, Comparator, Outcome) to sharpen focus.\nState:\n1. Why a review is needed (burden, conflicting evidence, recent developments)\n2. The review question\n3. Scope and objectives',
        starters:['[Condition] affects [N individuals/population] globally, causing [burden].','Despite [N] individual studies examining [topic], no systematic synthesis exists.','This review addresses the question: In [P], does [I] compared to [C] result in [O]?'] },
      { id:'methods',     label:'Methods (PRISMA)',       words:1000,
        hint:'Follow PRISMA 2020 checklist:\n• Eligibility criteria (PICO + study design, language, date limits)\n• Information sources (databases + grey literature sources)\n• Search strategy (provide full search string for at least one database)\n• Selection process (how many reviewers, resolution of disagreement)\n• Data extraction (which data, by whom)\n• Risk of bias assessment (tool: RoB 2, ROBINS-I, NOS, etc.)\n• Synthesis methods (narrative/meta-analysis, heterogeneity measure: I²)\n• Registration (PROSPERO)',
        starters:['Searches were conducted in [databases: PubMed, EMBASE, PsycINFO, Cochrane, Web of Science] from inception to [date].','Studies were eligible if they [eligibility criteria: RCT/observational, population, intervention, outcome].','Two reviewers (XX, YY) independently screened titles/abstracts and extracted data. Disagreements were resolved by consensus or [third reviewer].','Heterogeneity was assessed using the I² statistic; I² > 50% was considered substantial heterogeneity.'] },
      { id:'results',     label:'Results',               words:2000,
        hint:'Report:\n• PRISMA flow diagram numbers (identified, screened, eligible, included)\n• Characteristics of included studies (Table)\n• Risk of bias summary\n• Main synthesis: if meta-analysis, pooled effect with CI, I², publication bias (funnel plot, Egger\'s test); if narrative, structured by subgroup or outcome\n• Subgroup and sensitivity analyses' },
      { id:'discussion',  label:'Discussion',            words:1000,
        hint:'1. Summary of evidence (strength and direction)\n2. Compare with other reviews\n3. Methodological quality of included studies\n4. Limitations of the review itself (search limitations, publication bias, heterogeneity)\n5. Implications for practice and policy\n6. Gaps and future research directions',
        starters:['Overall, the evidence [supports/does not support] the effectiveness of [intervention] for [outcome] in [population].','The pooled effect was [moderate/small/large] (SMD = X, 95% CI [X, X]), with [low/moderate/high] certainty of evidence.','These findings are consistent with [prior review (Ref)] but differ from [other review (Ref)] in that...','Key limitations of this review include [limitation 1] and [limitation 2].'] },
    ]
  },

  'conference-abstract': {
    label: 'Conference Abstract', icon: '🎤', color: '#f59e0b',
    desc: 'Abstract for conference submission (oral or poster)',
    sections: [
      { id:'title',   label:'Title',     words:15,
        hint:'Punchy and informative (10–15 words). Can include a key finding. Avoid "A study of..." — be direct. Conference titles can be slightly more informal than journal titles.',
        starters:['[Key finding]: evidence from [study type] of [N population]','[Variable] predicts [outcome] in [population]: findings from a [design]'] },
      { id:'content', label:'Abstract',  words:300,
        hint:'Most conferences: 250–400 words. Typical structure:\n• Background (2–3 sentences): why this matters\n• Aims (1–2 sentences): what you examined\n• Methods (3–4 sentences): who, what, how analysed\n• Results (3–5 sentences): main numbers with statistics\n• Conclusions (2–3 sentences): what this means\n\nStrong abstracts for competitive conferences: Lead with your finding, not your question.',
        starters:['Background: [Condition] is prevalent and undertreated, with [statistic].','Aim: This study examined whether [hypothesis/question].','Method: [N] [participants/samples] were [recruited/collected] and [intervention/measure] was used.','Results: [Primary finding with statistics: M, SD, p, d].','Conclusion: These findings suggest that [implication] and have relevance for [practice/theory].'] },
    ]
  },

  'cover-letter': {
    label: 'Journal Cover Letter', icon: '✉️', color: '#64748b',
    desc: 'Manuscript submission cover letter',
    sections: [
      { id:'opening',     label:'Salutation & Date',  words:30,
        hint:'"Dear Dr. [Last Name]," if known; otherwise "Dear Editors," or "Dear [Journal Name] Editorial Team,"\nInclude date and journal name in first line.',
        starters:['Dear Dr. [Name],','Dear Editors of [Journal Name],'] },
      { id:'submission',  label:'Manuscript Overview', words:60,
        hint:'State: article type, title, and briefly what it is.\n"We submit for your consideration our [article type] entitled \'[Title]\', which we believe is suitable for [Journal Name]."',
        starters:['We submit for your consideration our [Original Article/Review/Brief Report] entitled "[Title]".','We respectfully submit the enclosed [manuscript type], "[Title]", for consideration by [Journal Name].'] },
      { id:'significance', label:'Key Contribution',  words:120,
        hint:'2–4 sentences. Answer: WHY should this journal\'s readers care?\n1. Key finding or contribution\n2. Why it advances the field\n3. Why this journal\'s readership specifically\n\nMatch language to the journal\'s stated aims and scope.',
        starters:['Our paper provides the first [type of evidence] that [main finding].','These findings challenge the conventional view that [prior assumption] by showing that [new finding].','This work directly addresses [journal\'s stated research priority] and will interest readers working on [relevant topics].'] },
      { id:'fit',         label:'Journal Fit',        words:80,
        hint:'Why THIS journal? Be specific:\n• Reference 1–2 recent papers in the journal that your work complements or extends\n• Note overlap with journal scope\n• Avoid generic praise ("prestigious journal")',
        starters:['We believe this work is ideally suited for [Journal Name], as it aligns with the journal\'s focus on [scope element].','Recent articles in [Journal Name] on [related topic] (Author et al., Year; Author et al., Year) demonstrate the journal\'s interest in [area], with which our work directly engages.'] },
      { id:'compliance',  label:'Compliance Statements', words:80,
        hint:'Required statements (check journal requirements):\n• Manuscript not under consideration elsewhere\n• All authors have reviewed and approved\n• No competing interests (or disclose)\n• Appropriate ethics approval\n• Data availability',
        starters:['This manuscript has not been published previously and is not under consideration elsewhere.','All authors have read and approved the final manuscript and accept responsibility for its content.','The authors declare no competing interests.','The study was approved by [IRB/Ethics body] (reference: XX).'] },
      { id:'closing',     label:'Closing',            words:60,
        hint:'Thank the editor. Express willingness to revise. Provide contact details for corresponding author.',
        starters:['We welcome the opportunity to revise the manuscript in response to reviewers\' comments.','We would be happy to provide any additional information and look forward to the editorial team\'s feedback.','Please address all correspondence to: [Name], [Institution], [Email].'] },
    ]
  },

  'reviewer-response': {
    label: 'Response to Reviewers', icon: '🔄', color: '#0891b2',
    desc: 'Point-by-point response letter for peer review',
    sections: [
      { id:'opening',  label:'Opening Letter',     words:200,
        hint:'Open with thanks (genuinely — reviewers give their time freely). Briefly summarise the key changes made. End by noting where you disagree (if applicable) and that you can discuss further.\n\nTone: professional, non-defensive, collegial.',
        starters:['We thank the editors and reviewers for their careful reading and constructive comments, which have substantially improved the manuscript.','We have revised the manuscript extensively in response to the reviewers\' thoughtful critiques.','We have addressed all reviewer concerns. The major changes include: (1) [key change]; (2) [key change]; (3) [key change].','In one instance (Reviewer 2, Comment 3), we respectfully maintain our original interpretation, for reasons detailed below.'] },
      { id:'r1',       label:'Reviewer 1 Responses', words:1200,
        hint:'FORMAT for each comment:\n\n> **Reviewer 1, Comment 1:** "[Exact quote from reviewer]"\n\n**Response:** [Your response — agree or respectfully disagree]\n\n*Changes made:* [Where in manuscript, page/line if possible]\n\nFor changes: quote the new text or summarise precisely.\nFor disagreements: provide evidence (citations, additional analyses, logic) — never just "we disagree".',
        starters:['We thank the reviewer for this insightful comment.','We agree with the reviewer that [issue] needed clarification and have [specific action taken].','We respectfully disagree with this concern for the following reason: [evidence/logic].','In response to this comment, we have [added/revised/restructured] [specific element] on page [X] (lines [X–Y]).','This is an important point. We have now [addressed/clarified/expanded on] this in the [section name] section.'] },
      { id:'r2',       label:'Reviewer 2 Responses', words:1200,
        hint:'Same format as Reviewer 1. If reviewers contradict each other, address the tension explicitly and explain how you resolved it.',
        starters:['We thank Reviewer 2 for these detailed and helpful comments.','Reviewer 2 raises an important concern about [issue], which we address as follows.'] },
      { id:'r3',       label:'Reviewer 3 / Editor', words:400,
        hint:'If there are editor-specific comments beyond the reviews, address them here. Editor comments often reflect the most critical issues to address — treat them as highest priority.' },
    ]
  },
}

// ── Writing aids data (embedded from expert research) ─────────────────────────
const WRITING_AIDS = {
  transitions: {
    label: 'Transition Phrases',
    categories: {
      'Adding evidence':       ['Furthermore,','Moreover,','In addition,','Additionally,','Similarly,','Also noteworthy is','Along similar lines,','Consistent with this,','Relatedly,'],
      'Contrasting':           ['However,','Nevertheless,','Nonetheless,','In contrast,','Conversely,','On the other hand,','Despite this,','Yet,','Notwithstanding this,','That said,','While it is true that…'],
      'Causality / Result':    ['Therefore,','Consequently,','As a result,','Hence,','Thus,','This suggests that','This indicates that','This implies that','For this reason,'],
      'Exemplifying':          ['For instance,','For example,','Specifically,','In particular,','As illustrated by','To illustrate,','Notably,'],
      'Sequence':              ['First,','Secondly,','Subsequently,','Finally,','Taken together,','Overall,','In summary,','In conclusion,'],
      'Conceding a point':     ['Admittedly,','Granted,','It is true that…','While [X], nevertheless [Y]','Even though [X],','Although [X],'],
      'Introducing a niche':   ['However,','Despite this,','To date, little is known about','A key unresolved question is','Few studies have examined','It remains unclear whether','What has not been addressed is'],
    }
  },
  hedging: {
    label: 'Hedging Language',
    categories: {
      'Strong (direct finding)':    ['demonstrate that','show that','confirm that','establish that','reveal that'],
      'Moderate (interpreting)':    ['suggest that','indicate that','appear to','tend to','are consistent with'],
      'Tentative (speculating)':    ['might suggest','could indicate','may reflect','it is possible that','one might hypothesise that','we propose that'],
      'Limiting scope':             ['in this sample,','under these conditions,','in this study,','for this population,','in the short term,'],
      'Acknowledging limits':       ['although this requires further validation,','pending replication,','subject to the limitations noted above,','it should be noted that'],
    }
  },
  reportingVerbs: {
    label: 'Reporting Verbs',
    categories: {
      'Strong claim (author asserts)': ['demonstrates','shows','confirms','establishes','reveals','proves (rare — use in maths only)'],
      'Moderate claim':               ['indicates','suggests','finds','reports','observes','notes','documents'],
      'Tentative/interpretive':        ['proposes','hypothesises','speculates','implies','assumes','argues','contends'],
      'Method/approach':              ['employs','uses','adopts','applies','develops','describes','examines','investigates','tests'],
      'Agreement with prior work':    ['is consistent with','corroborates','replicates','extends','supports','corroborates'],
      'Disagreement':                 ['contradicts','challenges','questions','disputes','fails to replicate','is inconsistent with'],
    }
  },
  tenseGuide: {
    label: 'Tense Guide',
    categories: {
      'Present tense':  ['General scientific facts: "DNA is a double helix."','Theory: "Social baseline theory proposes…"','Discussion of published literature: "Smith (2023) finds that…"','Your conclusions and implications: "These results suggest that…"'],
      'Past tense':     ['Your methods: "Participants completed the survey."','Your results: "The intervention group showed greater improvement."','Prior studies (when emphasising the study): "Smith (2023) found that…"','Describing what was done: "Blood samples were collected at T1."'],
      'Perfect tense':  ['Connecting past to present: "Recent work has shown that…"','Establishing currency: "Much progress has been made in understanding…"','Background that led to your study: "Researchers have identified three key mechanisms…"'],
    }
  },
  statsTemplates: {
    label: 'Statistical Phrases',
    categories: {
      't-test':         ['t([df]) = [value], p = [value], 95% CI [[lower], [upper]], Cohen\'s d = [value]','[Group A] (M = X.XX, SD = Y.YY) differed significantly from [Group B] (M = X.XX, SD = Y.YY)'],
      'ANOVA':          ['F([df_between], [df_within]) = [value], p = [value], η² = [value]','Post-hoc comparisons (Tukey HSD) revealed that… p = [value], d = [value]'],
      'Regression':     ['B = [value], SE = [value], β = [standardised], t([df]) = [value], p = [value], 95% CI [[lower], [upper]]','The model explained [X]% of variance in [outcome] (R² = .XX, adjusted R² = .XX, F([df]) = [value], p = [value])'],
      'Correlation':    ['r([df]) = [value], p = [value], 95% CI [[lower], [upper]]'],
      'Non-significant':['No significant [difference/association] was found, [statistic], p = [value] (post-hoc power = [value] to detect d = [value])'],
      'Effect sizes':   ['Small: d = 0.2, r = .10, η² = .01','Medium: d = 0.5, r = .30, η² = .06','Large: d = 0.8, r = .50, η² = .14'],
    }
  },
}

// ── State & render ─────────────────────────────────────────────────────────────
let _wrDoc        = null   // active document
let _wrSection    = null   // active section ID
let _wrAidPanel   = false  // writing aids panel visible
let _wrAidTab     = 'transitions'
let _wrSaveTimer  = null

function render_writing() {
  const vc = document.getElementById('view-content')
  if (!vc) return

  const docs = state.writingDocs || []

  vc.innerHTML = `
  <div style="display:flex;height:100%;overflow:hidden">

    <!-- ── Document sidebar (dark, like Notes) ──────────────────────────────── -->
    <div style="width:220px;flex-shrink:0;background:#1a1a2e;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid rgba(255,255,255,.06)">

      <!-- Header -->
      <div style="padding:.875rem .75rem .5rem;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8">Writing Docs</span>
        <button onclick="wrNewDoc()" title="New document"
          style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:1.1rem;line-height:1;padding:.1rem .2rem;border-radius:.375rem;transition:color .12s"
          onmouseover="this.style.color='#e2e8f0'" onmouseout="this.style.color='#6b7280'">+</button>
      </div>

      <!-- Doc list -->
      <div style="flex:1;overflow-y:auto;padding:.25rem .5rem">
        ${docs.length === 0 ? `<p style="font-size:.75rem;color:#374151;text-align:center;padding:2rem 1rem">No documents yet.<br/>Click + to start writing.</p>` :
          docs.map(d => `
          <button onclick="wrOpenDoc('${d.id}')"
            style="display:block;width:100%;padding:.5rem .75rem;border-radius:.5rem;cursor:pointer;border:none;text-align:left;background:${_wrDoc?.id===d.id?'#2d2d2d':'transparent'};transition:background .12s"
            onmouseover="this.style.background='#2d2d2d'" onmouseout="this.style.background='${_wrDoc?.id===d.id?'#2d2d2d':'transparent'}'">
            <span style="display:block;font-size:.1rem;color:${WRITING_TYPES[d.type]?.color||'#6366f1'};margin-bottom:.1rem">${WRITING_TYPES[d.type]?.icon||'📝'}</span>
            <span style="display:block;font-size:.78rem;font-weight:500;color:${_wrDoc?.id===d.id?'#f3f4f6':'#9ca3af'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.title||'Untitled'}</span>
            <span style="display:block;font-size:.68rem;color:#4b5563;margin-top:.1rem">${WRITING_TYPES[d.type]?.label||d.type}</span>
          </button>`).join('')}
      </div>

      <!-- Writing aids toggle -->
      <div style="padding:.75rem;border-top:1px solid rgba(255,255,255,.06)">
        <button onclick="wrToggleAids()" title="Writing aids panel"
          style="width:100%;padding:.5rem .75rem;background:${_wrAidPanel?'#1e293b':'none'};border:1px solid ${_wrAidPanel?'#334155':'rgba(255,255,255,.08)'};border-radius:.5rem;font-size:.75rem;color:${_wrAidPanel?'#e2e8f0':'#6b7280'};cursor:pointer;transition:all .12s;text-align:center">
          ✦ Writing Aids
        </button>
      </div>
    </div>

    <!-- ── Main area ───────────────────────────────────────────────────────── -->
    <div style="flex:1;display:flex;flex-direction:column;overflow:hidden;background:${document.documentElement.dataset.theme==='dark'?'#1e293b':'#fff'}">
      ${_wrDoc ? _wrEditorPanel(_wrDoc) : _wrEmptyState()}
    </div>

    <!-- ── Writing aids panel ─────────────────────────────────────────────── -->
    ${_wrAidPanel ? _wrAidsPanel() : ''}

  </div>`

  // Re-focus the editor if open
  if (_wrDoc && _wrSection) {
    const ta = document.getElementById('wr-editor-ta')
    if (ta) { ta.focus(); ta.selectionStart = ta.value.length }
  }
}

// ── Editor panel ──────────────────────────────────────────────────────────────
function _wrEditorPanel(doc) {
  const type     = WRITING_TYPES[doc.type]
  const sections = type?.sections || []
  const activeId = _wrSection || sections[0]?.id
  const activeSec = sections.find(s=>s.id===activeId) || sections[0]
  const content   = doc.sections?.[activeSec?.id] || ''
  const wcount    = content.trim().split(/\s+/).filter(Boolean).length
  const wtarget   = activeSec?.words

  const _dk = document.documentElement.dataset.theme === 'dark'
  const _bg = _dk ? '#1e293b' : '#fff'
  const _bdr = _dk ? '#334155' : '#e5e7eb'
  const _tx = _dk ? '#e2e8f0' : '#374151'
  const _txm = _dk ? '#94a3b8' : '#6b7280'

  return `
  <!-- Top bar: doc title + type -->
  <div style="padding:.625rem 1.25rem;border-bottom:1px solid ${_bdr};display:flex;align-items:center;gap:.75rem;flex-shrink:0;background:${_bg}">
    <span style="font-size:1.25rem;flex-shrink:0">${type?.icon||'📝'}</span>
    <input id="wr-title-inp" type="text" value="${esc(doc.title||'')}" placeholder="Document title…"
      style="flex:1;font-size:1rem;font-weight:600;color:${_tx};background:transparent;border:none;outline:none;font-family:inherit"
      oninput="wrUpdateTitle(this.value)"/>
    <span style="font-size:.7rem;color:${_txm};flex-shrink:0;background:${_dk?'#334155':'#f1f5f9'};padding:.2rem .6rem;border-radius:1rem">${type?.label||doc.type}</span>
    ${_aiAvailable() ? `<button onclick="wrAiSection()" title="AI: improve this section with Odysseus"
      style="flex-shrink:0;padding:.375rem .875rem;border:1px solid #6366f1;background:none;border-radius:.5rem;font-size:.75rem;color:#6366f1;cursor:pointer;transition:background .12s"
      onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background='none'">
      ✦ AI Assist
    </button>` : ''}
    <button onclick="wrExportDoc('${doc.id}')"
      style="flex-shrink:0;padding:.375rem .875rem;border:1px solid ${_bdr};background:none;border-radius:.5rem;font-size:.75rem;color:${_txm};cursor:pointer"
      title="Export as Markdown">↓ Export</button>
    <button onclick="wrDeleteDoc('${doc.id}')"
      style="flex-shrink:0;background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:.25rem"
      title="Delete document">🗑</button>
  </div>

  <!-- Section tabs -->
  <div style="display:flex;gap:0;border-bottom:1px solid ${_bdr};overflow-x:auto;flex-shrink:0;background:${_bg}">
    ${sections.map(s => {
      const sc     = (doc.sections?.[s.id]||'').trim().split(/\s+/).filter(Boolean).length
      const active = s.id === activeId
      const color  = type?.color || '#6366f1'
      return `<button onclick="wrSetSection('${s.id}')"
        style="padding:.625rem .875rem;border:none;background:none;cursor:pointer;font-size:.72rem;font-weight:${active?'600':'400'};
          color:${active?color:_txm};border-bottom:2px solid ${active?color:'transparent'};
          white-space:nowrap;flex-shrink:0;transition:all .12s"
        title="${s.hint?.split('\n')[0]||''}">
        ${s.label}${sc>0?` <span style="font-size:.68rem;color:#94a3b8;font-weight:400">(${sc}w)</span>`:''}
      </button>`
    }).join('')}
  </div>

  <!-- Editor area -->
  <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">

    <!-- Guidance collapsible -->
    <div id="wr-hint-bar" style="background:${_dk?'#0f172a':'#f8fafc'};border-bottom:1px solid ${_bdr};padding:.5rem 1.25rem;flex-shrink:0">
      <div style="display:flex;align-items:flex-start;gap:.5rem;cursor:pointer" onclick="wrToggleHint()">
        <span style="color:#6366f1;font-size:.75rem;font-weight:600;flex-shrink:0">💡 Guidance</span>
        <span id="wr-hint-text" style="font-size:.72rem;color:${_txm};flex:1;line-height:1.5;white-space:pre-wrap">${esc(activeSec?.hint||'')}</span>
        <span id="wr-hint-toggle" style="font-size:.7rem;color:${_txm};flex-shrink:0">▲</span>
      </div>
      ${activeSec?.starters?.length ? `
      <div style="margin-top:.625rem;display:flex;gap:.375rem;flex-wrap:wrap" id="wr-starters">
        ${activeSec.starters.map(s=>`
        <button onclick="wrInsertStarter(${JSON.stringify(s)})"
          style="font-size:.68rem;padding:.25rem .625rem;border-radius:1rem;border:1px solid ${_dk?'#334155':'#e2e8f0'};background:${_dk?'#1e293b':'#fff'};color:${_txm};cursor:pointer;transition:border-color .12s;text-align:left;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
          onmouseover="this.style.borderColor='#6366f1';this.style.color='#6366f1'" onmouseout="this.style.borderColor='${_dk?'#334155':'#e2e8f0'}';this.style.color='${_txm}'"
          title="${esc(s)}">
          ${esc(s.slice(0,55))}${s.length>55?'…':''}
        </button>`).join('')}
      </div>` : ''}
    </div>

    <!-- Textarea -->
    <div style="flex:1;overflow-y:auto;padding:1.75rem 2.5rem">
      <textarea id="wr-editor-ta"
        placeholder="Start writing here…"
        spellcheck="true"
        style="display:block;width:100%;min-height:55vh;font-size:15px;line-height:1.85;
          color:${_tx};background:transparent;border:none;outline:none;resize:none;
          font-family:inherit;box-sizing:border-box;padding:0"
        oninput="wrOnEdit(this.value)"
      >${esc(content)}</textarea>
    </div>

    <!-- Status bar -->
    <div style="border-top:1px solid ${_bdr};padding:.375rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-shrink:0;background:${_bg}">
      <span style="font-size:.7rem;color:${_txm}">
        ${wcount} words
        ${wtarget ? `<span style="color:${wcount>wtarget*1.2?'#ef4444':wcount>=wtarget*.8?'#22c55e':'#94a3b8'}"> / ${wtarget} target (${Math.round(wcount/wtarget*100)}%)</span>` : ''}
      </span>
      <span id="wr-save-status" style="font-size:.7rem;color:#94a3b8;margin-left:auto">Auto-saved ✓</span>
    </div>
  </div>`
}

// ── Empty state ───────────────────────────────────────────────────────────────
function _wrEmptyState() {
  return `
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:3rem">
    <div style="font-size:3rem;margin-bottom:1.25rem;opacity:.25">✍️</div>
    <p style="font-size:.9375rem;font-weight:600;color:#6b7280;margin:0 0 .375rem">No document open</p>
    <p style="font-size:.8rem;color:#9ca3af;margin:0 0 1.75rem">Create a new writing document to get started.</p>
    <button onclick="wrNewDoc()"
      style="padding:.625rem 1.5rem;background:#6366f1;color:#fff;border:none;border-radius:.75rem;font-size:.8rem;font-weight:600;cursor:pointer">
      + New Document
    </button>
  </div>`
}

// ── Writing aids panel ────────────────────────────────────────────────────────
function _wrAidsPanel() {
  const _dk = document.documentElement.dataset.theme === 'dark'
  const _bg = _dk ? '#1a1a2e' : '#f8fafc'
  const _bdr = _dk ? '#334155' : '#e2e8f0'
  const _tx = _dk ? '#e2e8f0' : '#374151'
  const _txm = _dk ? '#94a3b8' : '#6b7280'

  const tabs = Object.keys(WRITING_AIDS)
  const aid  = WRITING_AIDS[_wrAidTab]

  return `
  <div style="width:260px;flex-shrink:0;background:${_bg};border-left:1px solid ${_bdr};display:flex;flex-direction:column;overflow:hidden">
    <!-- Tab bar -->
    <div style="display:flex;gap:0;border-bottom:1px solid ${_bdr};overflow-x:auto;flex-shrink:0">
      ${tabs.map(t=>`
      <button onclick="_wrAidTab='${t}';render_writing()"
        style="padding:.5rem .625rem;border:none;background:none;font-size:.65rem;font-weight:${_wrAidTab===t?'700':'400'};
          color:${_wrAidTab===t?'#6366f1':_txm};border-bottom:2px solid ${_wrAidTab===t?'#6366f1':'transparent'};
          white-space:nowrap;flex-shrink:0;cursor:pointer">${WRITING_AIDS[t].label}</button>`).join('')}
    </div>

    <!-- Categories + phrases -->
    <div style="flex:1;overflow-y:auto;padding:.75rem .625rem">
      ${Object.entries(aid.categories).map(([cat,phrases])=>`
      <div style="margin-bottom:1rem">
        <div style="font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${_txm};margin-bottom:.375rem">${cat}</div>
        <div style="display:flex;flex-direction:column;gap:.25rem">
          ${phrases.map(p=>`
          <button onclick="wrInsertAid(${JSON.stringify(p)})"
            style="text-align:left;padding:.3rem .5rem;background:none;border:1px solid ${_bdr};border-radius:.375rem;
              font-size:.72rem;color:${_tx};cursor:pointer;transition:border-color .12s;line-height:1.4"
            onmouseover="this.style.borderColor='#6366f1';this.style.color='#6366f1'" onmouseout="this.style.borderColor='${_bdr}';this.style.color='${_tx}'">
            ${esc(p)}
          </button>`).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div>`
}

// ── Document CRUD ─────────────────────────────────────────────────────────────
function wrNewDoc() {
  const types = Object.entries(WRITING_TYPES)
  openModal(`
  <h3 class="text-sm font-bold text-slate-900 mb-3">✍️ New Writing Document</h3>
  <p class="text-xs text-slate-400 mb-4">Choose a document type to get guided section templates and writing advice.</p>
  <div class="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto mb-4">
    ${types.map(([id,t])=>`
    <button onclick="wrCreateDoc('${id}')"
      class="flex items-start gap-2.5 p-3 rounded-xl border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-left transition-all">
      <span class="text-xl flex-shrink-0">${t.icon}</span>
      <div>
        <div class="text-xs font-bold text-slate-800">${t.label}</div>
        <div class="text-[10px] text-slate-400 mt-0.5 leading-snug">${t.desc}</div>
      </div>
    </button>`).join('')}
  </div>`)
}

function wrCreateDoc(type) {
  closeModal()
  const type_def = WRITING_TYPES[type]
  const doc = {
    id: 'wr-' + uid(),
    title: 'Untitled ' + type_def.label,
    type,
    sections: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (!state.writingDocs) state.writingDocs = []
  state.writingDocs.unshift(doc)
  _wrDoc     = doc
  _wrSection = type_def.sections[0]?.id || null
  save('writingDocs')
  render_writing()
  showToast(`New ${type_def.label} created ✓`)
}

function wrOpenDoc(id) {
  _wrDoc = (state.writingDocs||[]).find(d=>d.id===id) || null
  if (_wrDoc) {
    const type_def = WRITING_TYPES[_wrDoc.type]
    _wrSection = type_def?.sections[0]?.id || null
  }
  render_writing()
}

function wrDeleteDoc(id) {
  if (!confirm('Delete this document?')) return
  state.writingDocs = (state.writingDocs||[]).filter(d=>d.id!==id)
  if (_wrDoc?.id === id) { _wrDoc = (state.writingDocs||[])[0] || null; _wrSection = null }
  save('writingDocs')
  render_writing()
  showToast('Document deleted')
}

// ── Editing ────────────────────────────────────────────────────────────────────
function wrSetSection(id) {
  if (_wrDoc && _wrSection && _wrDoc.sections) {
    // save current editor content before switching
    const ta = document.getElementById('wr-editor-ta')
    if (ta) { _wrDoc.sections[_wrSection] = ta.value; _wrDoc.updatedAt = new Date().toISOString() }
  }
  _wrSection = id
  render_writing()
}

function wrOnEdit(value) {
  if (!_wrDoc || !_wrSection) return
  if (!_wrDoc.sections) _wrDoc.sections = {}
  _wrDoc.sections[_wrSection] = value
  _wrDoc.updatedAt = new Date().toISOString()
  // word count live update
  const wcount = value.trim().split(/\s+/).filter(Boolean).length
  const statusEl = document.getElementById('wr-save-status')
  const type_def = WRITING_TYPES[_wrDoc.type]
  const sec  = type_def?.sections.find(s=>s.id===_wrSection)
  const wcEl = document.querySelector('#view-content span[style*="words"]')
  if (wcEl) wcEl.textContent = wcount + ' words' + (sec?.words ? ` / ${sec.words} target (${Math.round(wcount/sec.words*100)}%)` : '')
  if (statusEl) statusEl.textContent = 'Saving…'
  clearTimeout(_wrSaveTimer)
  _wrSaveTimer = setTimeout(() => { save('writingDocs'); if (statusEl) statusEl.textContent = 'Auto-saved ✓' }, 1200)
}

function wrUpdateTitle(value) {
  if (!_wrDoc) return
  _wrDoc.title = value
  _wrDoc.updatedAt = new Date().toISOString()
  clearTimeout(_wrSaveTimer)
  _wrSaveTimer = setTimeout(() => save('writingDocs'), 1200)
}

function wrToggleHint() {
  const hintEl    = document.getElementById('wr-hint-text')
  const toggle    = document.getElementById('wr-hint-toggle')
  const starters  = document.getElementById('wr-starters')
  const collapsed = toggle?.textContent === '▼'
  if (hintEl)   hintEl.style.display    = collapsed ? '' : 'none'
  if (toggle)   toggle.textContent      = collapsed ? '▲' : '▼'
  if (starters) starters.style.display  = collapsed ? '' : 'none'
}

function wrInsertStarter(text) {
  const ta = document.getElementById('wr-editor-ta')
  if (!ta) return
  const pos = ta.selectionStart
  const before = ta.value.slice(0, pos)
  const after  = ta.value.slice(pos)
  const newText = (before ? before + '\n\n' : '') + text + ' ' + after
  ta.value = newText
  ta.selectionStart = ta.selectionEnd = pos + (before?2:0) + text.length + 1
  ta.focus()
  wrOnEdit(ta.value)
}

function wrInsertAid(phrase) {
  const ta = document.getElementById('wr-editor-ta')
  if (!ta) { navigator.clipboard?.writeText(phrase); showToast('Copied: ' + phrase.slice(0,40)); return }
  const pos = ta.selectionStart
  const before = ta.value.slice(0, pos)
  const after  = ta.value.slice(pos)
  ta.value = before + phrase + ' ' + after
  ta.selectionStart = ta.selectionEnd = pos + phrase.length + 1
  ta.focus()
  wrOnEdit(ta.value)
}

function wrToggleAids() { _wrAidPanel = !_wrAidPanel; render_writing() }

// ── AI assistance ─────────────────────────────────────────────────────────────
async function wrAiSection() {
  const ta = document.getElementById('wr-editor-ta')
  if (!ta || !_wrDoc || !_wrSection) return
  const content = ta.value.trim()
  if (!content) { showToast('Write something first', 'error'); return }

  const type_def = WRITING_TYPES[_wrDoc.type]
  const sec      = type_def?.sections.find(s=>s.id===_wrSection)

  const systemCtx = `You are an expert academic writing coach. The user is writing the "${sec?.label||_wrSection}" section of a "${type_def?.label||_wrDoc.type}". Guidance for this section: ${sec?.hint||''}. Help improve clarity, academic tone, and structure. Keep changes minimal and maintain the author's voice.`

  openModal(`
  <h3 class="text-sm font-bold text-slate-900 mb-2">✦ AI Writing Assist — ${esc(sec?.label||_wrSection)}</h3>
  <div class="space-y-2 mb-4">
    ${[
      ['Improve clarity & flow', 'Improve the clarity and flow of this academic text. Fix any awkward phrasing, passive voice overuse, or unclear antecedents. Keep changes minimal.'],
      ['Strengthen academic tone', 'Revise this text to strengthen the academic register. Replace informal language, ensure appropriate hedging, and use precise vocabulary.'],
      ['Check structure', 'Analyse the structure of this text and suggest improvements. For an introduction, check CARS model compliance (establish territory → niche → occupy). For methods, check reproducibility.'],
      ['Suggest stronger verbs', 'Identify weak verbs (is, has, gets) and suggest stronger, more precise academic verbs.'],
      ['Improve first sentence', 'The first sentence of each paragraph should be a strong topic sentence. Evaluate and suggest improvements.'],
    ].map(([label,prompt])=>`
    <button onclick="wrAiRun(${JSON.stringify(prompt)},${JSON.stringify(systemCtx)})"
      class="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-xs text-slate-700">
      ${label}
    </button>`).join('')}
  </div>
  <div class="flex justify-end">
    <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Cancel</button>
  </div>`)
}

async function wrAiRun(prompt, systemCtx) {
  closeModal()
  const ta = document.getElementById('wr-editor-ta')
  if (!ta) return
  const content = ta.value.trim()
  const statusEl = document.getElementById('wr-save-status')
  if (statusEl) statusEl.textContent = 'AI processing…'
  try {
    const res = await api.odysseusChat({
      messages: [
        { role: 'system', content: systemCtx },
        { role: 'user', content: `${prompt}\n\nText to review:\n\n${content}` }
      ]
    })
    const reply = res?.content || res?.message
    if (!reply) { showToast('AI returned empty response', 'error'); return }
    openModal(`
    <h3 class="text-sm font-bold text-slate-900 mb-3">✦ AI Suggestion</h3>
    <div class="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed max-h-64 overflow-y-auto mb-4 whitespace-pre-wrap">${esc(reply)}</div>
    <div class="flex gap-2 justify-end">
      <button onclick="closeModal()" class="btn-secondary text-xs py-2 px-4">Dismiss</button>
      <button onclick="wrAiApply(${JSON.stringify(reply)});closeModal()" class="btn-primary text-xs py-2 px-4">Replace section text</button>
    </div>`)
  } catch(e) {
    showToast('AI request failed: ' + e.message, 'error')
    if (statusEl) statusEl.textContent = 'Auto-saved ✓'
  }
}

function wrAiApply(text) {
  const ta = document.getElementById('wr-editor-ta')
  if (ta) { ta.value = text; wrOnEdit(text) }
}

// ── Export ─────────────────────────────────────────────────────────────────────
async function wrExportDoc(id) {
  const doc = (state.writingDocs||[]).find(d=>d.id===id)
  if (!doc) return
  const type_def = WRITING_TYPES[doc.type]
  const lines = [`# ${doc.title||'Untitled'}`, `*Type: ${type_def?.label||doc.type}*`, `*Exported: ${new Date().toLocaleDateString()}*`, '---', '']
  ;(type_def?.sections||[]).forEach(s => {
    const content = doc.sections?.[s.id] || ''
    const wc = content.trim().split(/\s+/).filter(Boolean).length
    lines.push(`## ${s.label}${s.words ? ` *(${wc}/${s.words} words)*` : ''}`)
    lines.push(content || '*[Not written yet]*')
    lines.push('')
  })
  const wsDir  = await api.getWorkspaceDir().catch(()=>null)
  const fname  = (doc.title||'document').replace(/[/\\:*?"<>|]/g,'_').slice(0,60)+'.md'
  const dest   = await api.openSaveDialog({
    title:'Export writing document',
    defaultPath: wsDir ? wsDir+'\\Notes\\'+fname : fname,
    filters:[{name:'Markdown',extensions:['md']}],
  })
  if (!dest) return
  await api.writeTextFile(dest, lines.join('\n'))
  showToast('Exported ✓')
}
