// 雅思题库生成器：原创生成雅思题型题目（听力/阅读/写作/口语）
// 设计原则：
//  1) 答案与文本同源生成（阅读事实、听力填空词、选择正确项均来自同一生成逻辑），保证判分正确。
//  2) 难度(direction)真实可分级：每题带 band（雅思 5.0–9.0），内容随 band 真实缩放（听力 section/词汇、
//     阅读篇幅与题目陷阱、写作提示抽象度、口语 part 分布），不再是无意义的随机标签。
//  3) 不复制任何受版权保护的真题；past 源标注“真题风格模拟”，用真实考过的话题/题型分布生成。
// 运行：node server/scripts/generateQuestions.js
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const genDir = join(__dirname, '..', '..', 'src', 'mock', 'generated')
const pastDir = join(__dirname, '..', '..', 'src', 'mock', 'past')
mkdirSync(genDir, { recursive: true })
mkdirSync(pastDir, { recursive: true })

// ---------------- 基础工具 ----------------
const rnd = (n) => Math.floor(Math.random() * n)
const pick = (a) => a[rnd(a.length)]
const pickN = (a, n) => {
  const c = [...a]
  const out = []
  while (out.length < n && c.length) out.push(c.splice(rnd(c.length), 1)[0])
  return out
}
const randInt = (a, b) => a + rnd(b - a + 1)
const chance = (p) => Math.random() < p
const pad = (i, n = 5) => String(i).padStart(n, '0')
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// ---------------- band（雅思真实难度档） ----------------
// 9 个档：5.0 / 5.5 / 6.0 / 6.5 / 7.0 / 7.5 / 8.0 / 8.5 / 9.0
const BANDS = [5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0]
// band -> 1..5 星级（保留给前端 el-rate 展示，不影响筛选）
function bandToDifficulty(band) {
  return Math.min(5, Math.max(1, Math.round(band - 4))) // 5->1,6->2,7->3,8->4,9->5
}
// 各档题量均衡：把 n 个题均匀分配到 9 个 band 档，再打乱
function assignBands(n) {
  const per = Math.floor(n / BANDS.length)
  let rem = n - per * BANDS.length
  const plan = []
  for (const b of BANDS) {
    let c = per
    if (rem > 0) { c++; rem-- }
    for (let i = 0; i < c; i++) plan.push(b)
  }
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[plan[i], plan[j]] = [plan[j], plan[i]]
  }
  return plan
}
// 难度越高，用词越“学术/生僻”
function lvlWord(band, easy, hard) {
  return band >= 7 ? hard : easy
}
// 年份（真题风格库用）：2001–2025 均匀分布，保证任意年份都能筛到
const YEARS = [2001, 2004, 2007, 2010, 2013, 2016, 2019, 2022, 2025]
function pastYear() {
  // 覆盖全区间 2001-2025，每年都有题可筛
  return 2001 + rnd(25)
}

// 稳健的否定动词：保证与原文事实相反（remained stable 不能还写 remained stable）
function negateVerb(v) {
  if (v === 'increased') return 'declined'
  if (v === 'declined') return 'increased'
  if (v === 'doubled') return 'halved'
  if (v === 'halved') return 'doubled'
  return 'changed significantly'
}

// ---------------- 共享话题池（真实雅思高频主题） ----------------
const TOPICS = [
  'environment', 'technology', 'health', 'education', 'business', 'science',
  'history', 'culture', 'society', 'sports', 'transport', 'food', 'media',
  'government', 'art', 'energy', 'urban', 'tourism', 'family', 'space'
]
const TOPIC_CN = {
  environment: '环境', technology: '科技', health: '健康', education: '教育',
  business: '商业', science: '科学', history: '历史', culture: '文化',
  society: '社会', sports: '运动', transport: '交通', food: '饮食',
  media: '媒体', government: '政府', art: '艺术', energy: '能源',
  urban: '城市', tourism: '旅游', family: '家庭', space: '太空'
}
const TOPIC_FACTS = {
  environment: ['carbon emissions', 'renewable energy', 'deforestation', 'ocean plastic', 'urban green space', 'wildlife habitats'],
  technology: ['artificial intelligence', 'smartphones', 'social media', 'automation', 'cloud computing', 'cybersecurity'],
  health: ['physical activity', 'mental wellbeing', 'processed food', 'sleep quality', 'vaccination', 'healthcare access'],
  education: ['online learning', 'childhood literacy', 'university tuition', 'teacher training', 'study abroad', 'standardised testing'],
  business: ['remote work', 'small enterprises', 'global trade', 'consumer spending', 'start-up funding', 'supply chains'],
  science: ['space exploration', 'genetic research', 'climate modelling', 'quantum computing', 'vaccine development', 'marine biology'],
  history: ['ancient trade routes', 'industrial revolution', 'medieval cities', 'colonial archives', 'archaeological sites', 'oral traditions'],
  culture: ['traditional music', 'public festivals', 'migration patterns', 'language loss', 'folk crafts', 'museum visits'],
  society: ['ageing populations', 'income inequality', 'community volunteering', 'urban migration', 'social trust', 'gender balance'],
  sports: ['youth coaching', 'stadium design', 'sports sponsorship', 'injury prevention', 'elite training', 'public fitness'],
  transport: ['high-speed rail', 'electric vehicles', 'cycle lanes', 'air traffic', 'public transit', 'ride sharing'],
  food: ['local farming', 'food waste', 'dietary habits', 'organic produce', 'food security', 'fusion cuisine'],
  media: ['news consumption', 'streaming services', 'digital literacy', 'advertising', 'podcasts', 'misinformation'],
  government: ['public spending', 'voting turnout', 'policy reform', 'infrastructure', 'taxation', 'open data'],
  art: ['public sculpture', 'art education', 'gallery attendance', 'digital art', 'street murals', 'art funding'],
  energy: ['solar power', 'wind farms', 'battery storage', 'fuel prices', 'grid reliability', 'nuclear phase-out'],
  urban: ['housing density', 'commuting time', 'green roofs', 'smart cities', 'zoning laws', 'walkability'],
  tourism: ['ecotourism', 'overtourism', 'heritage sites', 'visitor spending', 'seasonal demand', 'local guides'],
  family: ['parental leave', 'household size', 'childcare costs', 'extended families', 'work-life balance', 'elder care'],
  space: ['satellite data', 'planet exploration', 'space debris', 'telescope surveys', 'private launches', 'low gravity']
}
const UNIVERSITIES = ['Oxford', 'Cambridge', 'Melbourne', 'Toronto', 'Singapore', 'Tokyo', 'Berlin', 'Cape Town', 'Sydney', 'Edinburgh', 'MIT', 'Nairobi']
const CITIES = ['London', 'Sydney', 'Toronto', 'Berlin', 'Singapore', 'Tokyo', 'Dublin', 'Auckland', 'Vancouver', 'Copenhagen']
const PCTS = [12, 18, 23, 31, 37, 44, 52, 61, 68, 73, 79, 85]

// =================================================================
// 听力 Listening（内容随 band 缩放：section、词汇、干扰项）
// =================================================================
const LISTENING_AUDIO = [
  'https://download.samplelib.com/mp3/sample-6s.mp3',
  'https://download.samplelib.com/mp3/sample-9s.mp3',
  'https://download.samplelib.com/mp3/sample-15s.mp3'
]
const SURNAMES = ['Smith', 'Lee', 'Patel', 'Garcia', 'Khan', 'Nguyen', 'Brown', 'Müller', 'Rossi', 'Tanaka', 'Silva', 'Kim', 'Cohen', 'Okafor', 'Andersson']
const STREETS = ['Park Road', 'High Street', 'River Lane', 'Market Square', 'Lake View', 'Hill Crescent', 'Station Road', 'Green Avenue']
const FACILITIES = ['the library', 'the gym', 'the main office', 'the community centre', 'the reception', 'the sports hall', 'the lab', 'the café']
const COURSES = ['Business English', 'Graphic Design', 'Data Analysis', 'Nursing', 'Culinary Arts', 'Software Engineering', 'Environmental Science', 'Marketing']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function money() { return '£' + randInt(80, 2500) }
function phone() { return '0' + randInt(100, 999) + ' ' + randInt(100, 999) + ' ' + randInt(1000, 9999) }
function dateStr() { return pick(MONTHS) + ' ' + randInt(1, 28) }
function yearStr() { return String(pick(YEARS)) }
function clock() { return randInt(8, 20) + ':' + pick(['00', '15', '30', '45']) }

// band -> 听力 section（低分日常，高分学术）
function listeningSection(band) {
  if (band <= 5.5) return pick([1, 2])
  if (band <= 7.0) return pick([2, 3])
  return pick([3, 4])
}

// 听力：表格/笔记填空（答案嵌入 transcript）
function listeningFill(band) {
  const sec = listeningSection(band)
  const scenarios = [
    () => { const v = money(); return { transcript: `Agent: Hello, how can I help you? Tenant: I'm looking for a flat. Agent: The monthly rent is ${v}, and you can collect the key from the office. Tenant: Great, thank you.`, q: 'What is the monthly rent?', answer: v, topic: '生活场景', tags: ['form completion', 'rent', `Section ${sec}`] } },
    () => { const v = phone(); return { transcript: `Reception: Please leave a contact number. Guest: Sure, it's ${v}. Reception: Got it, we'll call if there's any change.`, q: 'What is the contact phone number?', answer: v, topic: '生活场景', tags: ['note completion', 'phone', `Section ${sec}`] } },
    () => { const v = dateStr(); return { transcript: `Officer: When would you like to start? Student: I'd prefer ${v}. Officer: Fine, we can arrange that.`, q: 'On what date does the student want to start?', answer: v, topic: '教育', tags: ['form completion', 'date', `Section ${sec}`] } },
    () => { const v = pick(SURNAMES); return { transcript: `Host: May I take your name? Visitor: Yes, it's ${v}. Host: Thank you, ${v}, your booking is confirmed.`, q: 'What is the visitor’s surname?', answer: v, topic: '生活场景', tags: ['form completion', 'name', `Section ${sec}`] } },
    () => { const v = pick(STREETS); return { transcript: `Guide: The meeting point is on ${v}, next to the bus stop. Tourist: Okay, ${v}, I've noted it down.`, q: 'On which street is the meeting point?', answer: v, topic: '旅游', tags: ['note completion', 'place', `Section ${sec}`] } },
    () => { const v = pick(FACILITIES); return { transcript: `Staff: You need to return the form to ${v}. Student: Sorry, to where? Staff: ${v}, on the ground floor.`, q: 'Where should the form be returned?', answer: v, topic: '教育', tags: ['note completion', 'place', `Section ${sec}`] } },
    () => { const v = pick(COURSES); return { transcript: `Tutor: Which course are you enrolling in? Student: ${v}, please. Tutor: Excellent choice.`, q: 'Which course is the student enrolling in?', answer: v, topic: '教育', tags: ['form completion', 'course', `Section ${sec}`] } },
    () => { const v = clock(); return { transcript: `Lecturer: The seminar begins at ${v}. Please arrive a little earlier. Student: Noted, ${v} it is.`, q: 'At what time does the seminar begin?', answer: v, topic: '教育', tags: ['note completion', 'time', `Section ${sec}`] } }
  ]
  const s = pick(scenarios)()
  let transcript = s.transcript
  // 高分档加一句干扰信息（增加抓取难度，但答案仍在原文）
  if (band >= 7) {
    transcript += ` (Note: ${pick(['the price may vary by season', 'a deposit is also required', 'this is subject to availability', 'you should confirm by email'])}.)`
  }
  return {
    section: 'listening', type: 'fill-blank',
    title: `Section ${sec} · 信息填空（Band ${band}）`,
    topic: s.topic, tags: s.tags,
    audioUrl: pick(LISTENING_AUDIO),
    transcript,
    explanation: `录音中直接给出了答案：${s.answer}。`,
    answer: s.answer
  }
}

// 听力：单选（正确项文本出现在 transcript）
function listeningChoice(band) {
  const topic = pick(['environment', 'technology', 'health', 'business', 'science'])
  const subj = pick(TOPIC_FACTS[topic])
  const opts = pickN(TOPIC_FACTS[topic].filter((x) => x !== subj), 2).concat(subj)
  const shuffled = pickN(opts, 3)
  const correct = shuffled[2]
  const letters = ['A', 'B', 'C']
  const options = {}
  const order = pickN([0, 1, 2], 3)
  order.forEach((oi, idx) => { options[letters[idx]] = shuffled[oi] })
  const correctLetter = letters[order.indexOf(2)]
  const sec = listeningSection(band)
  let transcript = `Speaker: Today we focus on ${correct}. Many researchers argue that ${correct} will shape the next decade, though ${shuffled[order[0]]} also matters.`
  if (band >= 7.5) {
    transcript += ` Some institutions, such as ${pick(UNIVERSITIES)}, have prioritised ${correct} in their recent strategy.`
  }
  const q = lvlWord(band, 'What is the main focus of the talk?', 'According to the speaker, which development is identified as the principal driver of change?')
  return {
    section: 'listening', type: 'choice',
    title: `Section ${sec} · 学术单选（Band ${band}）`,
    topic: TOPIC_CN[topic], tags: ['multiple choice', `Section ${sec}`, topic],
    audioUrl: pick(LISTENING_AUDIO),
    transcript,
    options,
    explanation: `录音明确提到重点是 ${correct}，对应选项 ${correctLetter}。`,
    answer: correctLetter
  }
}

// 听力：匹配（说话人 → 主题）
function listeningMatch(band) {
  const speakers = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4', 'Speaker 5']
  const n = band >= 7 ? randInt(4, 5) : randInt(3, 4)
  const usedSpeakers = speakers.slice(0, n)
  const items = pickN(TOPIC_FACTS[pick(Object.keys(TOPIC_FACTS))], n)
  const letters = ['A', 'B', 'C', 'D', 'E']
  const options = {}
  items.forEach((it, i) => { options[letters[i]] = it })
  const questionList = []
  const answer = []
  const transcriptParts = []
  usedSpeakers.forEach((sp, i) => {
    const item = items[i]
    const letter = letters[i]
    questionList.push({ no: i + 1, text: `${sp} talks about` })
    answer.push(letter)
    transcriptParts.push(`${sp} mainly discusses ${item}.`)
  })
  const sec = listeningSection(band)
  return {
    section: 'listening', type: 'match',
    title: `Section ${sec} · 观点匹配（Band ${band}）`,
    topic: '教育', tags: ['matching', `Section ${sec}`],
    audioUrl: pick(LISTENING_AUDIO),
    transcript: transcriptParts.join(' '),
    options,
    questionList,
    explanation: '根据录音中每位说话人讨论的主题进行匹配。',
    answer
  }
}

function genListening(n, source, prefix) {
  const bands = assignBands(n)
  const out = []
  for (let i = 0; i < n; i++) {
    const band = bands[i]
    const r = chance(0.6) ? listeningFill(band) : chance(0.5) ? listeningChoice(band) : listeningMatch(band)
    const year = source === 'past' ? pastYear() : undefined
    out.push({ id: prefix + pad(i + 1), source, band, difficulty: bandToDifficulty(band), year, ...r })
  }
  return out
}

// =================================================================
// 阅读 Reading（事实同源：先造事实，再写文章与题目；band 缩放篇幅/陷阱）
// =================================================================
function makeFacts(topic, k) {
  const subs = pickN(TOPIC_FACTS[topic], k)
  const facts = []
  for (const sub of subs) {
    const univ = pick(UNIVERSITIES)
    const city = pick(CITIES)
    const sortedYears = [...YEARS].sort((a, b) => a - b)
    const y1 = pick(sortedYears.slice(0, -1))
    let y2 = pick(sortedYears.filter((y) => y > y1))
    if (y2 === undefined) y2 = y1 + randInt(2, 6) // 兜底，避免 undefined
    const pct = pick(PCTS)
    const money = '£' + randInt(2, 50) + ' million'
    const verb = pick(['increased', 'declined', 'remained stable', 'doubled', 'halved'])
    const obj = pick(['over the period', `between ${y1} and ${y2}`, 'in the last decade'])
    facts.push({
      sub, univ, city, y1, y2, pct, money, verb, obj,
      pos: `A study by ${univ} found that ${sub} ${verb} ${obj}.`,
      neg: `A study by ${univ} found that ${sub} ${negateVerb(verb)} ${obj}.`,
      pctPos: `${city} saw a ${pct}% rise in ${sub} between ${y1} and ${y2}.`,
      pctNeg: `${city} saw a ${pct}% fall in ${sub} between ${y1} and ${y2}.`,
      fund: `${city} invested ${money} in ${sub} programmes.`
    })
  }
  return facts
}

// 阅读通用学术衔接句（不触发事实正则、不含答案 token，安全用于扩写篇幅）
const READING_CONTEXT = [
  'The topic has attracted growing attention from both scholars and policymakers.',
  'A broader literature suggests the pattern may vary across regions and institutions.',
  'Methodological care is needed when comparing figures from different sources.',
  'Commentators note that long-term observation is essential to confirm any trend.',
  'The findings carry implications for planning, investment and public services.',
  'Previous studies in similar settings reported comparable shifts over time.',
  'Researchers caution against over-interpreting short-term fluctuations in the data.',
  'The data were drawn from official statistics and independent household surveys.',
  'Such outcomes are often shaped by local context as much as by global forces.',
  'Experts stress that context matters when interpreting results from a single study.',
  'The discussion reflects wider debates about measurement and accountability.',
  'Further research is planned to test the pattern in other cities and sectors.',
  'Policymakers highlight the need for consistent metrics across administrations.',
  'The evidence base remains incomplete, and caution is therefore appropriate.',
  'Public agencies have begun to publish more granular information on the issue.',
  'International comparisons should account for differences in definitions and scope.',
  'The trend intersects with questions of equity, efficiency and sustainability.',
  'Analysts warn that correlation does not by itself establish causation.',
  'Local universities have expanded collaboration with government research units.',
  'Citizen science and open data are improving the quality of available evidence.',
  'The scale of the change has prompted a review of existing support programmes.',
  'Funding agencies now ask for clearer links between outputs and outcomes.',
  'Training programmes aim to strengthen analytical capacity at the grassroots.',
  'The episode illustrates the value of transparent, repeatable evaluation methods.',
  'Longitudinal designs are better suited to distinguishing signal from noise.',
  'Stakeholders across sectors have called for a more coordinated response.',
  'The story is less about a single number than about a system under adjustment.',
  'Careful communication of uncertainty is now seen as part of scientific duty.',
  'The lesson for other regions is to invest early in monitoring infrastructure.',
  'Debate continues over how best to balance rigour with timely decision making.',
]

// 按 band 生成「背景/方法/讨论/展望」等固定扩写段，进一步拉长 passage（不含事实，安全）
function readingContextParas(topic, band) {
  const n = band < 6 ? 1 : band < 7 ? 2 : band < 8 ? 3 : 5
  const builders = [
    (t) => [`Background. ${cap(t)} sits within a broader set of social and economic changes.`, pick(READING_CONTEXT), pick(READING_CONTEXT)],
    (t) => [`Methods. Data were collected from official statistics and independent surveys.`, pick(READING_CONTEXT), pick(READING_CONTEXT)],
    (t) => [`Discussion. The results invite comparison with earlier work in similar settings.`, pick(READING_CONTEXT), pick(READING_CONTEXT)],
    (t) => [`Outlook. Policymakers are considering steps to sustain the observed direction.`, pick(READING_CONTEXT), pick(READING_CONTEXT)],
  ]
  const out = []
  for (let i = 0; i < n; i++) out.push(builders[i % builders.length](topic).join(' '))
  return out
}

function readingTFNG(band) {
  const topic = pick(TOPICS)
  const k = band < 6 ? 3 : band < 7 ? 4 : band < 8 ? 4 : 5
  const facts = makeFacts(topic, k)
  const ctxCount = band < 6 ? 3 : band < 6.5 ? 4 : band < 7.5 ? 5 : 10
  const paras = []
  // 引言段（背景）
  paras.push([`${cap(topic)} has become a focal point for researchers and policy discussions.`, pick(READING_CONTEXT), pick(READING_CONTEXT)].join(' '))
  facts.forEach((f, i) => {
    const lines = [cap(f.pos)]
    for (let c = 0; c < ctxCount; c++) lines.push(pick(READING_CONTEXT))
    if (band >= 7 && i === k - 1) lines.push(`${cap(f.fund)} Researchers caution that such trends require long-term monitoring.`)
    paras.push(lines.join(' '))
  })
  // 额外背景/方法/讨论/展望段（按 band 递增，显著拉长）
  for (const p of readingContextParas(topic, band)) paras.push(p)
  // 结论段
  paras.push([pick(READING_CONTEXT), pick(READING_CONTEXT), `In sum, the evidence points to a need for coordinated, long-term action on ${topic}.`].join(' '))
  const passage = paras.join('\n\n')
  const questionList = []
  const answer = []
  const stems = [
    (f) => cap(f.pos),
    (f) => cap(f.neg),
    (f) => cap(f.pctPos),
    (f) => `${pick(CITIES)} recorded a significant drop in ${f.sub} recently.`,
    (f) => `Most experts agree that ${f.sub} is the top priority for ${f.city}.`
  ]
  const types = ['TRUE', 'FALSE', 'NOT GIVEN']
  const plan = ['TRUE', 'FALSE']
  while (plan.length < k) {
    // 高分档更多 NOT GIVEN（更刁钻）
    plan.push(band >= 7.5 ? pick(['NOT GIVEN', 'NOT GIVEN', 'TRUE', 'FALSE']) : pick(types))
  }
  const planShuffled = pickN(plan, k)
  facts.forEach((f, i) => {
    const t = planShuffled[i]
    let text
    if (t === 'TRUE') text = stems[0](f)
    else if (t === 'FALSE') text = stems[1](f)
    else text = chance(0.5) ? stems[3](f) : stems[4](f)
    questionList.push({ no: i + 1, text })
    answer.push(t)
  })
  return {
    section: 'reading', type: 'tfng',
    title: cap(topic) + ' · ' + TOPIC_CN[topic] + `（T/F/NG · Band ${band}）`,
    topic: TOPIC_CN[topic], tags: ['Academic', 'T/F/NG', topic],
    passage,
    explanation: '依据文章事实逐题判断；未提及的信息为 NOT GIVEN。',
    questionList, answer
  }
}

function readingHeading(band) {
  const topic = pick(TOPICS)
  const k = band < 6 ? 3 : band < 7 ? 4 : band < 8 ? 4 : 5
  const subs = pickN(TOPIC_FACTS[topic], k)
  const ctxCount = band < 7 ? 3 : 4
  const paras = subs.map((s) => {
    const lines = [
      `Research on ${s} has gained attention.`,
      `${pick(CITIES)} reported measurable changes, and ${pick(UNIVERSITIES)} published related findings.`
    ]
    for (let c = 0; c < ctxCount; c++) lines.push(pick(READING_CONTEXT))
    return lines.join(' ')
  })
  for (const p of readingContextParas(topic, band)) paras.push(p)
  const passage = paras.join('\n\n')
  const headingPool = subs.map((s) => 'The growth of ' + s)
  const distractors = pickN(['Historical background', 'Economic impact', 'Future challenges', 'Public opinion', 'Policy response'], Math.min(3, k))
  const allHeadings = headingPool.concat(distractors)
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const order = pickN(allHeadings.map((_, i) => i), allHeadings.length)
  const options = {}
  order.forEach((idx, i) => { options[letters[i]] = allHeadings[idx] })
  const questionList = []
  const answer = []
  subs.forEach((s, i) => {
    const target = 'The growth of ' + s
    const pos = allHeadings.indexOf(target)
    const letterIdx = order.indexOf(pos)
    questionList.push({ no: i + 1, text: `Paragraph ${i + 1}` })
    answer.push(letters[letterIdx])
  })
  return {
    section: 'reading', type: 'heading',
    title: cap(topic) + ` · 段落标题匹配（Band ${band}）`,
    topic: TOPIC_CN[topic], tags: ['Academic', 'heading', topic],
    passage,
    options, questionList, answer,
    explanation: '为每个段落选择最能概括其主旨的标题。'
  }
}

function readingSummary(band) {
  const topic = pick(TOPICS)
  const f = makeFacts(topic, 1)[0]
  const ctxCount = band < 7 ? 3 : 4
  const lines = [cap(f.pos), cap(f.pctPos), cap(f.fund)]
  for (let c = 0; c < ctxCount; c++) lines.push(pick(READING_CONTEXT))
  for (const p of readingContextParas(topic, band)) lines.push(p)
  const passage = lines.join(' ')
  const gaps = band >= 7 ? [f.sub, f.city, f.univ] : [f.sub, f.city]
  const questionList = gaps.map((_, i) => ({ no: i + 1, text: `Complete the summary with the correct word(s): gap ${i + 1}.` }))
  return {
    section: 'reading', type: 'summary',
    title: cap(topic) + ` · 摘要填空（Band ${band}）`,
    topic: TOPIC_CN[topic], tags: ['Academic', 'summary', topic],
    passage,
    questionList, answer: gaps,
    explanation: '根据文章填空，答案均为原文原词。'
  }
}

function genReading(n, source, prefix) {
  const bands = assignBands(n)
  const out = []
  for (let i = 0; i < n; i++) {
    const band = bands[i]
    const r = chance(0.7) ? readingTFNG(band) : chance(0.6) ? readingHeading(band) : readingSummary(band)
    const year = source === 'past' ? pastYear() : undefined
    out.push({ id: prefix + pad(i + 1), source, band, difficulty: bandToDifficulty(band), year, ...r })
  }
  return out
}

// =================================================================
// 写作 Writing（band 缩放提示抽象度/题型）
// =================================================================
const CHART_TYPES = [
  { t: 'line graph', v: 'line graph', obj: 'three types of transport' },
  { t: 'bar chart', v: 'bar chart', obj: 'energy use by sector' },
  { t: 'pie chart', v: 'pie chart', obj: 'household spending' },
  { t: 'table', v: 'table', obj: 'exam results by region' },
  { t: 'map', v: 'map', obj: 'a town centre redevelopment' },
  { t: 'process diagram', v: 'process diagram', obj: 'recycling paper' }
]
const ESSAY_STEMS = [
  'To what extent do you agree or disagree?',
  'Discuss both views and give your own opinion.',
  'What are the causes of this, and what measures could be taken?',
  'Do the advantages outweigh the disadvantages?',
  'How can this problem be solved?'
]
const ESSAY_EASY = [
  'universities should charge students for tuition',
  'children should learn a foreign language from primary school',
  'remote work improves employees’ quality of life',
  'fast food should be taxed to reduce obesity'
]
const ESSAY_HARD = [
  'space exploration is a more worthwhile use of public funds than solving problems on Earth',
  'the arts are as important to society as science and technology',
  'globalisation threatens cultural diversity more than it benefits economies',
  'governments should prioritise economic growth over environmental protection'
]
const ESSAY_MID = [
  'governments should invest more in public transport than in roads',
  'artificial intelligence will replace human teachers',
  'tourism brings more harm than good to local communities',
  'nuclear energy is essential for a low-carbon future'
]

function writingTask1(band) {
  const c = pick(CHART_TYPES)
  const subject = pick(['a city', 'a country', 'the region', 'the company'])
  const y1 = pick(YEARS); let y2 = pick(YEARS.filter((y) => y > y1)); if (y2 === undefined) y2 = y1 + 5
  const prompt = `The ${c.v} below shows ${c.obj} in ${subject} between ${y1} and ${y2}. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.`
  const samples = [
    { band: 6, content: `The ${c.t} gives information about ${c.obj} in ${subject} from ${y1} to ${y2}. Overall, there were some changes over the period. Some items went up while others went down. The most noticeable point is that one category changed the most.`, comments: '覆盖了主要信息，但句式较简单、缺少具体数据与对比连接词。' },
    { band: 8, content: `The ${c.t} illustrates ${c.obj} in ${subject} over the period ${y1}–${y2}. Overall, a clear trend emerges: one category rose markedly while another declined. Notably, the most significant change occurred in the final years, with figures diverging sharply. Comparisons reveal that the leading category consistently outperformed the others.`, comments: '总述清晰，数据对比准确，使用了概览句与衔接词，词汇与语法多样。' }
  ]
  return {
    section: 'writing', type: 'essay',
    task: 1,
    title: 'Task 1 · ' + cap(c.t) + `（Band ${band}）`,
    topic: '图表', tags: ['Academic', c.t],
    prompt, wordLimit: 150,
    tips: ['开头一句话总述图表主题', '按总体趋势分组（上升/下降）', '挑选最显著的数字对比', '不写个人观点'],
    samples
  }
}

function writingTask2(band) {
  const subj = band < 6 ? pick(ESSAY_EASY) : band < 7.5 ? pick(ESSAY_MID) : pick(ESSAY_HARD)
  const stem = pick(ESSAY_STEMS)
  const prompt = cap(`Some people believe that ${subj}. ${stem}`)
  const samples = [
    { band: 6, content: `In recent years, whether ${subj} has been debated. I think there are both good and bad points. On the one hand, it can bring benefits. On the other hand, there are also problems. In conclusion, we should consider both sides carefully.`, comments: '立场基本明确，但论证较泛、缺少具体例子与衔接。' },
    { band: 8, content: `The question of whether ${subj} is increasingly relevant. While proponents argue that it yields clear benefits, opponents raise valid concerns. This essay will examine both perspectives before concluding that a balanced approach is preferable, supported by evidence from several countries.`, comments: '立场清晰，双边论证充分，有例子与衔接词，语言准确多样。' }
  ]
  return {
    section: 'writing', type: 'essay',
    task: 2,
    title: 'Task 2 · 议论文' + `（Band ${band}）`,
    topic: '议论文', tags: ['Academic', 'essay'],
    prompt, wordLimit: 250,
    tips: ['开头 paraphrasing 题目并亮明立场', '主体段每段一个论点+例子', '使用讨论/对比连接词', '结尾重申立场并升华'],
    samples
  }
}

function writingLetter(band) {
  const situations = ['complaining about a faulty product', 'requesting information about a course', 'inviting a friend to a party', 'apologising for missing a meeting']
  const sit = pick(situations)
  const prompt = `You recently experienced a situation ${sit}. Write a letter to the relevant person. Include: what happened, why it matters, and what you would like them to do.`
  const samples = [
    { band: 6, content: `Dear Sir/Madam, I am writing about ${sit}. I was not happy because of the problem. I hope you can help me solve it soon. Thank you for your time.`, comments: '语气与目的基本清楚，但细节与礼貌用语可更充分。' },
    { band: 8, content: `Dear Sir/Madam, I am writing to formally express my concern regarding ${sit}. The issue has caused considerable inconvenience, and I would appreciate a prompt response outlining the steps you will take. I look forward to your reply.`, comments: '语气得体，结构清晰，诉求明确，用词正式准确。' }
  ]
  return {
    section: 'writing', type: 'letter',
    task: 1,
    title: 'Task 1 · 书信（General Training）' + `（Band ${band}）`,
    topic: '书信', tags: ['General', 'letter'],
    prompt, wordLimit: 150,
    tips: ['明确写信目的', '覆盖全部要点', '注意语气（正式/半正式）', '结尾礼貌收束'],
    samples
  }
}

function genWriting(n, source, prefix) {
  const bands = assignBands(n)
  const out = []
  for (let i = 0; i < n; i++) {
    const band = bands[i]
    const r = chance(0.4) ? writingTask1(band) : chance(0.8) ? writingTask2(band) : writingLetter(band)
    const year = source === 'past' ? pastYear() : undefined
    out.push({ id: prefix + pad(i + 1), source, band, difficulty: bandToDifficulty(band), year, ...r })
  }
  return out
}

// =================================================================
// 口语 Speaking（band 缩放 part 分布与抽象度）
// =================================================================
const PART1_TOPICS = [
  { t: 'hometown', q: ['Where is your hometown?', 'Is it a big city or a small town?', 'What do you like most about it?', 'Has it changed much since you were a child?'] },
  { t: 'hobbies', q: ['What do you usually do in your free time?', 'Did you have the same hobbies as a child?', 'Do you prefer indoor or outdoor activities?', 'Would you like to try a new hobby?'] },
  { t: 'food', q: ['What is your favourite food?', 'Do you like cooking?', 'What food is popular in your country?', 'Do you prefer eating at home or in restaurants?'] },
  { t: 'music', q: ['What kind of music do you like?', 'Did you learn a musical instrument?', 'Do you listen to music while working?', 'Is live music popular where you live?'] },
  { t: 'films', q: ['Do you enjoy watching films?', 'What genre do you prefer?', 'Do you prefer cinemas or streaming?', 'Who do you usually watch films with?'] },
  { t: 'sport', q: ['What sport do you like?', 'Do you play or just watch?', 'Is sport important in your school?', 'Have you tried any new sport recently?'] },
  { t: 'work', q: ['What do you do?', 'Do you enjoy your job?', 'What is a typical day like?', 'Would you like to change careers?'] },
  { t: 'study', q: ['What subject are you studying?', 'Why did you choose it?', 'Do you prefer studying alone or in groups?', 'What is your plan after graduation?'] },
  { t: 'weather', q: ['What is the weather like in your country?', 'What season do you like best?', 'Does weather affect your mood?', 'Do you prefer hot or cold places?'] },
  { t: 'books', q: ['Do you like reading?', 'What kind of books do you read?', 'Did you read more as a child?', 'Do you prefer paper or e-books?'] },
  { t: 'travel', q: ['Do you like travelling?', 'Where did you go recently?', 'Do you prefer beaches or mountains?', 'Travelling alone or with others?'] },
  { t: 'technology', q: ['What device do you use most?', 'Do you think technology helps students?', 'How do you use the internet daily?', 'Is technology changing your life?'] },
  { t: 'family', q: ['Who do you live with?', 'Are you close to your family?', 'What do you do together?', 'Has your family changed over time?'] },
  { t: 'friends', q: ['Do you make friends easily?', 'How often do you meet friends?', 'What makes a good friend?', 'Do you have friends from other countries?'] }
]
const PART2_SUBJECTS = [
  { obj: 'a person', q: 'Describe a person who has influenced you.', pts: ['who this person is', 'how you know them', 'what they did', 'why they influenced you'] },
  { obj: 'a place', q: 'Describe a place you would like to visit.', pts: ['where it is', 'how you heard about it', 'what you would do there', 'why you want to go'] },
  { obj: 'an object', q: 'Describe an object that is important to you.', pts: ['what it is', 'who gave it to you', 'how you use it', 'why it is important'] },
  { obj: 'an event', q: 'Describe a memorable event in your life.', pts: ['when it happened', 'who was there', 'what happened', 'why it was memorable'] },
  { obj: 'a book or film', q: 'Describe a book or film that impressed you.', pts: ['what it is', 'when you experienced it', 'what it is about', 'why it impressed you'] },
  { obj: 'a skill', q: 'Describe a skill you want to learn.', pts: ['what the skill is', 'why you want to learn it', 'how you would learn it', 'whether it would be difficult'] },
  { obj: 'a habit', q: 'Describe a healthy habit you have.', pts: ['what the habit is', 'when you started it', 'how it helps you', 'whether others should try it'] },
  { obj: 'a journey', q: 'Describe a journey you enjoyed.', pts: ['where you went', 'how you travelled', 'who you were with', 'why you enjoyed it'] }
]
const PART3_EASY = [
  ['Why do people like to learn from others?', 'Should schools invite more role models?', 'How has the idea of role models changed?'],
  ['Why do people move to big cities?', 'Is tourism good for local culture?', 'How can cities stay livable?'],
  ['Why do people keep personal belongings?', 'Is advertising making us buy more?', 'How will shopping change in future?']
]
const PART3_HARD = [
  ['To what extent should governments regulate individual lifestyle choices?', 'How might advances in technology reshape the concept of community?', 'In what ways could global inequality be addressed without harming growth?'],
  ['Why is lifelong learning important?', 'Should governments pay for training?', 'How will jobs change by 2050?'],
  ['Why is prevention better than cure?', 'Should health be a personal choice?', 'How can cities promote exercise?']
]

function speakingPart1() {
  const tp = pick(PART1_TOPICS)
  const sample = `Well, ${tp.q[0].toLowerCase().replace('?', '')} — I'd say it depends. For me, I enjoy it because it's a nice break from routine, and I try to do it regularly. It also helps me relax after a busy day.`
  return {
    section: 'speaking', type: 'part1',
    part: 1,
    title: 'Part 1 · ' + cap(tp.t),
    topic: cap(tp.t), tags: ['part1', tp.t],
    durationSec: 120,
    prompts: tp.q,
    sampleAnswer: sample,
    explanation: 'Part 1 考察日常交流，回答简洁自然、适当扩展即可。'
  }
}
function speakingPart2() {
  const s = pick(PART2_SUBJECTS)
  const cueCard = `${s.q}\nYou should say:\n- ${s.pts.join('\n- ')}\nand explain how you feel about it.`
  const sample = `I'd like to talk about ${s.obj}. ${s.pts[0]} is the first thing that comes to mind. I still remember the details clearly, and it left a strong impression on me because it changed how I see things. If I had the chance, I would do it again.`
  return {
    section: 'speaking', type: 'part2',
    part: 2,
    title: 'Part 2 · ' + cap(s.obj),
    topic: cap(s.obj), tags: ['part2', 'cue card'],
    durationSec: 120,
    cueCard,
    sampleAnswer: sample,
    prompts: ['What vocabulary would you use?', 'How can you structure the two minutes?'],
    explanation: 'Part 2 为一分钟准备、两分钟陈述，按题卡四个要点展开。'
  }
}
function speakingPart3(band) {
  const themes = band >= 7 ? PART3_HARD : PART3_EASY
  const idx = rnd(themes.length)
  const prompts = themes[idx]
  const sample = `From a broader view, these questions matter because society is changing fast. For example, policies and technology both play a role. I think a balanced solution is possible if we consider long-term effects, not just short-term gains.`
  return {
    section: 'speaking', type: 'part3',
    part: 3,
    title: 'Part 3 · 抽象讨论 ' + (idx + 1) + `（Band ${band}）`,
    topic: '讨论', tags: ['part3', 'discussion'],
    durationSec: 180,
    prompts,
    sampleAnswer: sample,
    explanation: 'Part 3 考察抽象思辨，需用例子支撑观点、展示因果与对比。'
  }
}

function genSpeaking(n, source, prefix) {
  const bands = assignBands(n)
  const out = []
  for (let i = 0; i < n; i++) {
    const band = bands[i]
    // 低分多 Part1，高分多 Part3
    const r = band <= 5.5 ? (chance(0.7) ? speakingPart1() : speakingPart2())
      : band <= 7.0 ? (chance(0.4) ? speakingPart1() : chance(0.6) ? speakingPart2() : speakingPart3(band))
        : (chance(0.5) ? speakingPart2() : speakingPart3(band))
    const year = source === 'past' ? pastYear() : undefined
    out.push({ id: prefix + pad(i + 1), source, band, difficulty: bandToDifficulty(band), year, ...r })
  }
  return out
}

// ---------------- 主流程 ----------------
// 练习库（practice）：每个模块 ≥ 10000 题（各 band 档均衡）
const PRACTICE_COUNTS = { listening: 10000, reading: 10000, writing: 10000, speaking: 10000 }
// 历年真题风格库（past）：约 100000 题，各 band 档均衡，带 year
const PAST_COUNTS = { listening: 30000, reading: 20000, writing: 25000, speaking: 25000 }

function writeBank(counts, source, prefix, dir) {
  const built = {
    listening: genListening(counts.listening, source, prefix + 'L'),
    reading: genReading(counts.reading, source, prefix + 'R'),
    writing: genWriting(counts.writing, source, prefix + 'W'),
    speaking: genSpeaking(counts.speaking, source, prefix + 'S')
  }
  let total = 0
  for (const [section, arr] of Object.entries(built)) {
    const file = join(dir, `${section}.json`)
    writeFileSync(file, JSON.stringify(arr, null, 0))
    total += arr.length
    console.log(`[${source}] generated ${arr.length} ${section} -> ${file}`)
  }
  return total
}

const t1 = writeBank(PRACTICE_COUNTS, 'practice', '', genDir)
const t2 = writeBank(PAST_COUNTS, 'past', 'P', pastDir)
console.log(`TOTAL generated: practice=${t1}, past=${t2}, all=${t1 + t2}`)
