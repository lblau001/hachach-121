/* ---------------------------------------------------------------------------
   WORKING ENGLISH TRANSLATION — not source data.
   data.js holds the sourced Hebrew. Nothing here is quoted from a source:
   every string below is a translation made for testing, including the passages
   that appear in quotation marks, which are renderings of Hebrew quotes rather
   than words the speaker said in English. Keyed by the ids in data.js.
   Never edit data.js to match this file.
--------------------------------------------------------------------------- */
const DATA_EN = {

topics: {
  religion:       { label: "Religion and State",     sub: "How much religion is there in the state?" },
  economy:        { label: "Economy and Society",    sub: "Why is everything so expensive here?" },
  branches:       { label: "Who Decides Here?",      sub: "Knesset, government and the High Court" },
  gender:         { label: "Gender and Equality",    sub: "Equal? For women too?" },
  accountability: { label: "Public Accountability",  sub: "Who takes responsibility?" },
  environment:    { label: "Environment and Climate",sub: "It is going to get hot here. What do we do?" },
  internal_sec:   { label: "Internal Security",      sub: "Police, crime and guns" },
  military:       { label: "Defense and Diplomacy",  sub: "War, peace and everything in between" }
},

politicians: {
  netanyahu:     { name: "Benjamin Netanyahu",   party: "Likud" },
  lapid:         { name: "Yair Lapid",           party: "Yesh Atid" },
  gantz:         { name: "Benny Gantz",          party: "National Unity" },
  liberman:      { name: "Avigdor Liberman",     party: "Yisrael Beiteinu" },
  smotrich:      { name: "Bezalel Smotrich",     party: "Religious Zionism" },
  ben_gvir:      { name: "Itamar Ben-Gvir",      party: "Otzma Yehudit" },
  deri:          { name: "Aryeh Deri",           party: "Shas" },
  gafni:         { name: "Moshe Gafni",          party: "United Torah Judaism" },
  michaeli:      { name: "Merav Michaeli",       party: "Labor" },
  odeh:          { name: "Ayman Odeh",           party: "Hadash-Ta'al" },
  abbas:         { name: "Mansour Abbas",        party: "Ra'am" },
  saar:          { name: "Gideon Sa'ar",         party: "The National Right" },
  eisenkot:      { name: "Gadi Eisenkot",        party: "National Unity" },
  galant:        { name: "Yoav Galant",          party: "Likud" },
  edelstein:     { name: "Yuli Edelstein",       party: "Likud" },
  elkin:         { name: "Ze'ev Elkin",          party: "The National Right" },
  gotliv:        { name: "Tally Gotliv",         party: "Likud" },
  levin:         { name: "Yariv Levin",          party: "Likud" },
  silman:        { name: "Idit Silman",          party: "Likud" },
  son_harmelech: { name: "Limor Son Har-Melech", party: "Otzma Yehudit" },
  lahav:         { name: "Yorai Lahav-Hertzano", party: "Yesh Atid" }
},

/* keyed by the Hebrew term in data.js; `term` is the English string that gets
   matched inside the English text, so it must appear verbatim in translations */
glossary: {
  "עילת הסבירות":        { term: "reasonableness standard", def: "A legal tool that let the High Court strike down government decisions that were \"extremely unreasonable\". It was abolished by law in 2023 — and the High Court struck down the abolition in 2024. Yes, this is confusing. That is exactly what the fight over power looks like." },
  "דין רציפות":          { term: "legislative continuity", def: "A parliamentary trick: you carry on advancing a bill from a previous Knesset instead of starting from scratch. It saves years of legislation — which is why it is contested." },
  "קריאה טרומית":        { term: "preliminary reading", def: "The first vote on a private member's bill. If it passes, the bill moves on to committee. Most bills die right here." },
  "קריאה ראשונה":        { term: "first reading", def: "The vote that sends a bill to committee for detailed preparation. Second and third readings come after it — and only then is it law." },
  "קריאה שנייה ושלישית": { term: "second and third readings", def: "The final votes that turn a bill into binding law. They are usually held on the same day." },
  "חוק ההסדרים":         { term: "Arrangements Law", def: "A legislative giant attached to the budget, carrying dozens of reforms at once. Critics call it a way to bypass real debate." },
  "כספים קואליציוניים":  { term: "coalition funds", def: "Money that coalition parties receive to distribute according to their political agreements — on top of the ministries' regular budgets." },
  "בג\"ץ":               { term: "High Court", def: "The Supreme Court sitting as the High Court of Justice. Where citizens go to challenge decisions of the state." },
  "ועדת חקירה ממלכתית":  { term: "state commission of inquiry", def: "A body independent of the government, headed by a judge, whose members are appointed by the President of the Supreme Court. The strongest tool there is for investigating failures." },
  "ועדת בדיקה":          { term: "government examination committee", def: "A committee the government sets up and whose composition it controls. Less independent than a state commission of inquiry." },
  "חסינות":              { term: "immunity", def: "Protection for members of Knesset against being sued over acts done as part of the job (a speech, a vote). It does not protect against ordinary criminal offences." },
  "משמעת קואליציונית":   { term: "coalition discipline", def: "The unwritten rule: coalition members vote together. Whoever breaks it pays a political price. That is why \"rebels\" are an event." },
  "אופוזיציה":           { term: "opposition", def: "The parties that are not in the government. The job: to criticise, to offer alternatives — and to try to bring the government down." },
  "קואליציה":            { term: "coalition", def: "The parties that make up the government. They need at least 61 of the 120 members of Knesset." },
  "אי-אמון":             { term: "no confidence", def: "A vote that brings the government down if 61 members support it. The opposition's heavy weapon." },
  "ח\"כ":                { term: "MK", def: "Member of Knesset. There are 120 of them. You are the 121st." },
  "סטטוס-קוו":           { term: "status quo", def: "The unwritten 1947 arrangement on religion and state: the Sabbath, kashrut, marriage. Each side claims the other is breaking it." },
  "לימודי ליבה":         { term: "core curriculum", def: "Maths, English, science — the basics every publicly funded school is meant to teach. At the heart of the argument over ultra-Orthodox education." },
  "רפורמה משפטית":       { term: "judicial overhaul", def: "The government's 2023 plan to cut back the power of the High Court. It set off the largest protest movement in the country's history. Part of it was halted, part struck down." },
  "קרן הארנונה":         { term: "municipal tax fund", def: "A mechanism that takes part of the business property tax of wealthy cities and hands it to authorities that build housing. The wealthy cities petitioned the High Court against it." },
  "הצהרת כנסת":          { term: "Knesset declaration", def: "A resolution expressing the Knesset's position without legislating. It has no binding legal force — but it carries political and international weight." },
  "נישואי יוטה":         { term: "Utah marriage", def: "A civil marriage conducted remotely over Zoom before a clerk in the state of Utah. Israel was forced to recognise these after a High Court ruling." }
},

issues: {

r1: {
  title: "The Conscription Law",
  tf: "The conscription bill the coalition advanced in 2024 is based on a framework written by... Benny Gantz.",
  tf_explain: "True! The framework was drafted while Gantz was defense minister in the Bennett-Lapid government, and it passed a first reading in 2022. In 2024 Netanyahu revived exactly that same framework (\"legislative continuity\") — and Gantz himself voted against his own framework, arguing that reality had changed after 7 October.",
  bill_title: "Applying legislative continuity to the Conscription Law",
  bill_date: "11 June 2024",
  bill_summary: "Carry on advancing the conscription bill from the previous Knesset instead of restarting the legislation from scratch. In practice: an exemption from service for most yeshiva students, with gradual recruitment targets. Passed 63 to 57.",
  source_name: "Israel Hayom",
  notes: {
    galant: "The only coalition member who voted against: \"You must not play small politics on the backs of IDF combat soldiers.\" A senior Likud figure called for him to be fired",
    gantz: "Voted against the framework he wrote himself — because, he argued, 7 October changed everything",
    netanyahu: "Drove the move and rounded up the votes at the last moment",
    gafni: "The ultra-Orthodox parties backed it once the rabbinic leaders approved — even though they had previously called this same law \"wretched and humiliating\"",
    lapid: "\"One of the most contemptible moments of disgrace in the history of the Israeli Knesset\"",
    edelstein: "Voted in favour, but made clear that in his committee the law would only pass if it genuinely answered the army's needs",
    gotliv: "Threatened to oppose it — and then voted in favour, by her own account because of a protest held outside her home",
    liberman: "\"I have never understood why a Jew is forbidden to be a fighter\"",
    deri: "Shas voted in favour as part of the coalition"
  }
},

r2: {
  title: "The Chametz Law",
  tf: "Under the Chametz Law, hospital security guards are allowed to search your bag for leavened bread on Passover.",
  tf_explain: "False. The version finally approved contains no power of search at all — only signage at the entrance and notification. A hospital director may restrict bringing chametz in, but nobody is going to open your bag.",
  bill_title: "The Chametz Law (amendment to the Patient's Rights Law)",
  bill_date: "22 February 2023",
  bill_summary: "A hospital director may restrict or prohibit bringing chametz onto hospital grounds over Passover, in order to maintain kashrut. Passed 60 to 52. The law was written to get around a 2020 ruling of the High Court.",
  source_name: "Davar",
  notes: {
    gafni: "\"I have never signed a law that tells a secular person how to behave\" — one of the bill's sponsors",
    lapid: "\"You cannot force a person to believe in the exodus from Egypt\" — warned it would backfire",
    michaeli: "The entire opposition objected — \"religious coercion\"",
    ben_gvir: "Voted with the coalition"
  }
},

e1: {
  title: "The State Budget",
  tf: "If the Knesset fails to pass a budget on time, it dissolves automatically and the country goes to elections.",
  tf_explain: "True! It is written into Basic Law: The State Economy. That is why budget votes are existential tests for every government — whoever controls the budget controls the coalition.",
  bill_title: "The 2023–2024 state budget + the municipal tax fund",
  bill_date: "24 May 2023",
  bill_summary: "A two-year budget: 484 billion shekels for 2023, 514 billion for 2024. It included the municipal tax fund, which takes part of the business property tax of wealthy cities and distributes it to authorities that build housing. Passed 64 to 55 after a night of thousands of reservations.",
  source_name: "Walla",
  notes: {
    smotrich: "The finance minister: \"Tremendous news for Israel's economy\" (party position — did not take part in this vote)",
    lapid: "\"Netanyahu is weaker than ever, so he handed the ultra-Orthodox 14 billion shekels\"",
    liberman: "\"An enormous black stain on Israel's history\"",
    netanyahu: "The whole coalition voted in favour",
    gafni: "Chair of the Finance Committee that moved the budget through: \"They describe us as robbers of the public purse\"",
    gantz: "The entire opposition against",
    abbas: "The entire opposition against"
  }
},

e2: {
  title: "The War Budget",
  tf: "After the war broke out, the government cut all the coalition funds out of the budget.",
  tf_explain: "False. The revised war budget of late 2023 still contained roughly 5 billion shekels of coalition funds — even though the professional staff at the finance ministry and the Bank of Israel recommended cutting them. That led to a crisis inside the government itself.",
  bill_title: "Supplementary budget law for 2023 (the war budget)",
  bill_date: "14 December 2023",
  bill_summary: "An addition of roughly 26 billion shekels to the budget because of the war: 17 billion for defense, some 9 billion for civilian costs (evacuees, compensation). The criticism: billions in coalition funds were left inside it.",
  source_name: "mako",
  notes: {
    gantz: "The surprise: National Unity voted against — even though it was sitting in the emergency government at the time!",
    eisenkot: "Voted against together with his faction, in protest at the coalition funds",
    edelstein: "From Likud — announced he would abstain in the concluding vote",
    smotrich: "The finance minister who led the revised budget",
    netanyahu: "The coalition passed it on the strength of its solid majority",
    lapid: "The opposition against",
    gafni: "Voted with the coalition"
  }
},

b1: {
  title: "Abolishing the reasonableness standard",
  tf: "Israel has no single written constitution.",
  tf_explain: "True! Instead of a constitution we have Basic Laws, enacted piecemeal over the years. That is precisely why the question of who decides — the Knesset or the High Court — stays open and keeps exploding. The reasonableness standard was the stormiest chapter of that argument.",
  bill_title: "Abolition of the reasonableness standard (amendment to Basic Law: The Judiciary)",
  bill_date: "11 July 2023",
  bill_summary: "Bar the High Court from striking down decisions of the government and its ministers on the grounds that they are unreasonable. The first law of the judicial overhaul. The vote shown here is the reading that sent the law to committee (64 to 56); later, at the third reading on 24 July 2023, the opposition boycotted the vote.",
  source_name: "ynet",
  notes: {
    levin: "The justice minister and architect of the overhaul: \"There is no school of reasonableness\"",
    galant: "The surprise: pushed until the last moment to soften the law — and in the end voted in favour",
    liberman: "Voted against sending it to committee. Later, at the third reading on 24 July, he was the one who led the boycott",
    netanyahu: "Followed the vote closely and mediated between Levin and Galant on the floor",
    ben_gvir: "\"Any compromise would be a disgrace to the entire right\"",
    lapid: "Voted against sending it to committee. At the third reading he joined the opposition boycott",
    gantz: "Voted against. \"Whoever votes in favour will be recorded in the chronicles\"",
    odeh: "Voted against together with the opposition"
  }
},

b2: {
  title: "The Leakers Law",
  tf: "Leaking a classified military document to the press is a criminal offence.",
  tf_explain: "True. And it was out of exactly such an affair (the case of the prime minister's spokesman, Eli Feldstein) that a bill was born granting immunity to someone who leaks classified information — provided the leak goes to the prime minister. The then IDF spokesman warned the law was \"extremely dangerous to national security\".",
  bill_title: "Immunity for those passing classified information to the prime minister",
  bill_date: "4 December 2024",
  bill_summary: "Anyone who leaks classified information to the prime minister would receive immunity from prosecution. The bill was tabled following the indictment of the prime minister's spokesman in the document leak affair. Passed a preliminary reading 59 to 52.",
  source_name: "Haaretz",
  notes: {
    netanyahu: "The bill was tabled following the affair involving his own spokesman — the coalition backed it",
    lapid: "The opposition objected",
    levin: "Voted with the coalition",
    gantz: "Opposed along with the opposition",
    liberman: "Opposed along with the opposition",
    smotrich: "Voted with the coalition"
  }
},

g1: {
  title: "Gender segregation in academia",
  tf: "The High Court has previously permitted men and women to be taught separately at universities.",
  tf_explain: "True — and it surprises a lot of people. In 2021 the High Court permitted gender-segregated study for the ultra-Orthodox public, but only for undergraduate degrees, only inside the classroom, and on condition that female lecturers were not discriminated against. The new bill wants to extend that far further.",
  bill_title: "Extending gender-segregated study to advanced degrees",
  bill_date: "Preliminary reading: December 2024",
  bill_summary: "Allow tracks segregated between men and women in master's and doctoral programmes too, at any academic institution, for anyone who requests it \"on religious grounds\". Supporters: making academia accessible to the ultra-Orthodox. Opponents: the exclusion of women and a blow to equality. In July 2026 it was approved by the Education Committee for second and third readings.",
  source_name: "Haaretz",
  notes: {
    son_harmelech: "The bill's sponsor: \"The High Court imposed a radical progressive worldview. This law restores freedom of choice\"",
    michaeli: "Opposition members protested with \"men\" and \"women\" signs on either side of the chamber",
    gafni: "The ultra-Orthodox parties are pushing the extension",
    lapid: "The opposition: \"the exclusion of women\"",
    ben_gvir: "The bill comes from a member of his own party",
    smotrich: "The coalition backed it"
  }
},

g2: {
  title: "Civil marriage",
  tf: "You can get married in Israel today in a civil ceremony.",
  tf_explain: "False. Marriage in Israel takes place only through religious bodies (the Rabbinate, the church, sharia courts). Anyone who cannot or will not use them flies to Cyprus, marries over Zoom in a Utah marriage, or stays without any status at all. Israel is one of the only Western countries in this position.",
  bill_title: "Civil partnership — bills that keep coming back to the Knesset",
  bill_date: "Documented public positions",
  bill_summary: "The idea: a full legal track for couples without any involvement of the Rabbinate — including same-sex couples and couples of different religions. Bills like this have been tabled and rejected over many years. Here you are ordering by stated public positions, not by one specific vote.",
  source_name: "Public party positions",
  notes: {
    lapid: "Yesh Atid has supported civil marriage as part of its platform since the party was founded",
    gafni: "The ultra-Orthodox parties object in principle to any bypassing of the Rabbinate",
    liberman: "Yisrael Beiteinu champions civil marriage — largely because of the hundreds of thousands of immigrants the Rabbinate does not recognise as Jewish",
    deri: "Shas is firmly opposed",
    michaeli: "Labor supports separating religion from state in marriage",
    smotrich: "Religious Zionism opposes civil marriage"
  }
},

a1: {
  title: "A commission of inquiry into 7 October",
  tf: "A state commission of inquiry has been established into the events of 7 October.",
  tf_explain: "False — as of July 2026 no state commission of inquiry (independent, headed by a judge) has been established. Instead the government is advancing a law for a commission whose members would be appointed by politicians. Bereaved families from the October Council call it a \"whitewash commission\".",
  bill_title: "A politically appointed commission of inquiry into 7 October (the Kalner bill)",
  bill_date: "24 December 2025",
  bill_summary: "Instead of a state commission appointed by the President of the Supreme Court — a commission appointed by the coalition and the opposition (and if the opposition refuses, by the Knesset speaker). Passed a preliminary reading 53 to 48, while bereaved families protested from the gallery and turned their backs on the speaker.",
  source_name: "ynet",
  notes: {
    elkin: "The surprise: boycotted the vote — \"I support a state commission of inquiry whose composition is determined by Justice Sohlberg\" (party position — did not take part in this vote)",
    edelstein: "Also from Likud — boycotted the vote because he backs a state commission (party position — did not take part in this vote)",
    netanyahu: "Absent from the vote — although the law is being advanced with his encouragement (party position — did not take part in this vote)",
    lapid: "\"In the first month of the next government we will establish a state commission of inquiry\"",
    ben_gvir: "Deputy minister Almog Cohen, from his party, presented the government's position in favour",
    gantz: "The opposition against"
  }
},

a2: {
  title: "Immunity for members of Knesset",
  tf: "A member of Knesset cannot be prosecuted while still in office.",
  tf_explain: "False. Members of Knesset have immunity only for acts done as part of the job (a speech, a vote) — not for criminal offences. MKs and ministers have been investigated, prosecuted and even jailed. A new bill sought to change precisely that.",
  bill_title: "Extending immunity: no investigation of an MK without the approval of 90 MKs",
  bill_date: "4 December 2024",
  bill_summary: "No criminal investigation could be opened against a member of Knesset unless 90 MKs confirmed that the act was unrelated to the job. It would not apply to bribery and fraud. Passed a preliminary reading 57 to 53.",
  source_name: "Haaretz",
  notes: {
    gotliv: "The bill's sponsor",
    levin: "The justice minister welcomed the bill's approval",
    netanyahu: "The coalition backed it",
    lapid: "The opposition objected",
    gantz: "The opposition objected",
    liberman: "The opposition objected"
  }
},

v1: {
  title: "The Climate Law",
  tf: "Israel has set a binding target in law: net zero carbon emissions by 2050.",
  tf_explain: "Partly. The climate bill that passed a first reading in 2024 does set a target of zero emissions by 2050 (and minus 30% by 2030) — but in a \"flexible\" wording the government can change easily, with no budget and almost no teeth. So much so that even the environmental organisations opposed it.",
  bill_title: "The Climate Law",
  bill_date: "3 April 2024",
  bill_summary: "Israel's first legal framework for cutting greenhouse gas emissions: minus 30% by 2030, zero by 2050. The twist: the finance and energy ministries softened the wording again and again, and environmental groups argued that a strong law was better than a law with no teeth.",
  source_name: "infospot",
  notes: {
    silman: "The environmental protection minister who steered the law through three rounds in the ministerial committee (party position — did not take part in this vote)",
    smotrich: "The finance ministry backed it — but only after it managed to soften the targets substantially and keep a budget out (party position — did not take part in this vote)",
    lahav: "Attacked the softened wording and the lack of commitment to the targets sharply in committee debates"
  }
},

v2: {
  title: "The tax on disposable tableware",
  tf: "Israel imposed a tax on disposable tableware — and scrapped it about a year later.",
  tf_explain: "True. In November 2021 the then finance minister, Liberman, imposed a tax that sent the price of disposables up — and consumption fell sharply. In January 2023 the incoming finance minister, Smotrich, abolished the tax, partly as a gesture to the ultra-Orthodox public, who use a great deal of disposable tableware. Environment against politics, head on.",
  bill_title: "Abolition of the tax on disposable tableware",
  bill_date: "January 2023 (Finance Committee approval)",
  bill_summary: "Abolition of the tax order imposed in 2021. Supporters of the repeal: the tax hurts large families and never proved its worth. Opponents: the tax worked, consumption fell, and repealing it surrenders an environmental tool for political needs. Order these by documented positions.",
  source_name: "Positions documented in the press",
  notes: {
    smotrich: "Signed the repeal of the tax among his first acts as finance minister",
    liberman: "He was the one who imposed the tax in 2021 — and publicly opposed repealing it",
    gafni: "Chair of the Finance Committee that approved the repeal — a central demand of the ultra-Orthodox public",
    deri: "Shas led the demand for repeal",
    michaeli: "Opposed the repeal — \"giving up an environmental tool that works\""
  }
},

s1: {
  title: "Ben-Gvir's police law",
  tf: "The national security minister is entitled to instruct the police whom to investigate.",
  tf_explain: "False — and the High Court made sure it stays that way. The 2022 \"Ben-Gvir law\" let the minister set general policy for the police, including in the field of investigations. But in 2024 the High Court struck down the investigations clause and ruled: the minister sets general policy — he may not intervene in specific investigations and operations.",
  bill_title: "Amendment to the Police Ordinance (the \"Ben-Gvir law\")",
  bill_date: "28 December 2022",
  bill_summary: "The police are subordinate to the government, and the national security minister sets its policy — work plans, priorities, and even investigation policy. It was legislated at high speed before the government was sworn in, as Ben-Gvir's condition for joining the coalition. Passed 61 to 55.",
  source_name: "Maariv",
  notes: {
    ben_gvir: "\"A historic bill\" — the law he demanded as his condition for joining the government",
    netanyahu: "The coalition then taking shape passed the law before the government was sworn in",
    deri: "Voted with the coalition",
    lapid: "The opposition: the politicisation of the police",
    gantz: "The opposition objected",
    michaeli: "The opposition objected"
  }
},

s2: {
  title: "Sanctions on supporters of terror",
  tf: "The Palestinian Authority pays allowances to the families of attackers.",
  tf_explain: "True — the Palestinian Authority's policy of payments to prisoners and to the families of attackers is well documented and is known as \"pay for slay\". Israel deducts the sums from the tax revenues it transfers to the Authority. It was against this background that the following bill was born.",
  bill_title: "Sanctions on organisations that support terror",
  bill_date: "4 December 2024",
  bill_summary: "The state would be able to impose sanctions on organisations that transfer money to attackers or their families: a ban on entering the country, freezing of assets, a ban on transactions. Passed a preliminary reading 55 to 10.",
  source_name: "Haaretz",
  notes: {
    elkin: "The bill's sponsor (together with MK Zvi Sukkot): \"to increase the effectiveness of the war on terror\"",
    ben_gvir: "The coalition backed it",
    smotrich: "The coalition backed it",
    netanyahu: "The coalition backed it",
    odeh: "The ten opponents — mostly from the Arab parties (to be verified against the record)",
    abbas: "Among the opponents (to be verified against the record)"
  }
},

m1: {
  title: "A Palestinian state: unilateral recognition",
  tf: "The Knesset adopted a declaration opposing unilateral international recognition of a Palestinian state.",
  tf_explain: "True. Several declarations on the subject came before the 25th Knesset. One central declaration against unilateral recognition of a Palestinian state won broad cross-bloc support — coalition and opposition together. Note: the precise details of each vote need verifying against the Knesset website.",
  bill_title: "Declaration against unilateral recognition of a Palestinian state",
  bill_date: "February 2024",
  bill_summary: "The declaration: Israel rejects international dictates, and a political settlement will be reached only through direct negotiations. [Note: the exact details of this vote must be verified against the Knesset website before publication]",
  source_name: "ynet",
  notes: {
    lapid: "The surprise: the leader of the opposition voted with Netanyahu — \"I and my party are against unilateral steps\"",
    odeh: "\"The Palestinian people deserve the right to self-determination and to establish a state of their own\"",
    netanyahu: "Initiated the declaration: \"An overwhelming and unprecedented majority of 99 members of Knesset\"",
    gantz: "National Unity backed it",
    liberman: "Yisrael Beiteinu backed it",
    michaeli: "The Labor party was absent from the debate — neither for nor against",
    abbas: "Ra'am among the 9 opponents"
  }
},

m2: {
  title: "A Palestinian state: opposition in principle",
  tf: "The Knesset adopted a resolution opposing the establishment of a Palestinian state — not only unilateral recognition of one.",
  tf_explain: "True. Five months after the February vote, in July 2024, the Knesset widened the line: a declaration against the very establishment of a Palestinian state west of the Jordan. This time the political picture was different — and Lapid was no longer in the chamber.",
  bill_title: "Declaration against the establishment of a Palestinian state",
  bill_date: "18 July 2024",
  bill_summary: "\"The Knesset opposes the establishment of a Palestinian state west of the Jordan\" — a declaration initiated by the right-wing factions days before Netanyahu's trip to Washington. Passed 68 to 9. Counter-proposals by Ra'am and Hadash-Ta'al to recognise a Palestinian state were rejected 62 to 9.",
  source_name: "Kan News",
  notes: {
    elkin: "The bill's sponsor: \"You can see a lot of empty seats here belonging to parties that would rather be absent\"",
    gantz: "National Unity backed it: \"Recognising a Palestinian state after 7 October would be a prize for terror\"",
    lapid: "The twist: this time the leader of the opposition was absent from the vote",
    netanyahu: "The prime minister was absent too — days before his speech to Congress",
    saar: "\"The establishment of a Palestinian state would endanger Israel's security and its future\"",
    odeh: "Hadash-Ta'al among the 9 opponents; their counter-proposal to recognise a Palestinian state was rejected"
  }
}

}};
