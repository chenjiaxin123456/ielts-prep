// 答案正确性自检：全量校验生成题库中答案与内容是否一致
// 运行：node server/scripts/verifyAnswers.js
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const mockDir = join(__dirname, '..', '..', 'src', 'mock')
const dirs = [
  { name: 'practice', dir: join(mockDir, 'generated') },
  { name: 'past', dir: join(mockDir, 'past') }
]
const sections = ['listening', 'reading', 'writing', 'speaking']

function norm(s) {
  return s.replace(/[^a-z0-9 ]/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim()
}
function negateVerb(v) {
  return v === 'increased' ? 'declined' : v === 'declined' ? 'increased' : v === 'doubled' ? 'halved' : v === 'halved' ? 'doubled' : 'changed significantly'
}

let total = 0
const errors = []
let checked = 0

function load(section, dir) {
  const p = join(dir, `${section}.json`)
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : []
}

// ---- 听力 ----
function checkListening(arr, src) {
  for (const q of arr) {
    total++
    if (q.type === 'fill-blank') {
      checked++
      if (!q.transcript || !q.transcript.includes(q.answer)) {
        errors.push(`[${src}/listening] ${q.id} 填空答案不在 transcript: ${q.answer}`)
      }
    } else if (q.type === 'choice') {
      checked++
      const correctText = q.options[q.answer]
      if (!correctText) errors.push(`[${src}/listening] ${q.id} 选项缺失 ${q.answer}`)
      else if (!q.transcript.includes(correctText)) errors.push(`[${src}/listening] ${q.id} 正确项不在 transcript: ${correctText}`)
    } else if (q.type === 'match') {
      checked++
      q.answer.forEach((letter, i) => {
        if (!q.options[letter]) errors.push(`[${src}/listening] ${q.id} 匹配答案 ${letter} 不在选项`)
        const item = q.options[letter]
        if (item && !q.transcript.includes(item)) errors.push(`[${src}/listening] ${q.id} 匹配项不在 transcript: ${item}`)
      })
    }
  }
}

// ---- 阅读 ----
function extractFacts(passage) {
  const facts = []
  const re = /found that (.+?) (increased|declined|remained stable|doubled|halved) (over the period|between \d+ and \d+|in the last decade)/gi
  for (const m of passage.matchAll(re)) {
    facts.push({ sub: norm(m[1]), verb: m[2] })
  }
  return facts
}
function checkReading(arr, src) {
  for (const q of arr) {
    total++
    if (q.type === 'tfng') {
      const facts = extractFacts(q.passage)
      q.questionList.forEach((qs, i) => {
        const a = q.answer[i]
        const t = norm(qs.text)
        checked++
        if (a === 'TRUE') {
          if (!facts.some((f) => t.includes(f.sub) && t.includes(f.verb))) errors.push(`[${src}/reading] ${q.id} Q${i + 1} TRUE 不成立`)
        } else if (a === 'FALSE') {
          if (!facts.some((f) => t.includes(f.sub) && t.includes(negateVerb(f.verb)))) errors.push(`[${src}/reading] ${q.id} Q${i + 1} FALSE 不成立`)
        }
      })
    } else if (q.type === 'heading') {
      checked++
      q.answer.forEach((letter) => { if (!q.options[letter]) errors.push(`[${src}/reading] ${q.id} 标题答案 ${letter} 不在选项`) })
    } else if (q.type === 'summary') {
      checked++
      q.answer.forEach((g, i) => { if (!q.passage.includes(g)) errors.push(`[${src}/reading] ${q.id} 摘要填空 gap${i + 1} 不在文章: ${g}`) })
    }
  }
}

function checkOther(arr, src) {
  for (const q of arr) { total++; /* 写作/口语为参考范文，无唯一标准答案，跳过自动判定 */ }
}

for (const d of dirs) {
  for (const s of sections) {
    const arr = load(s, d.dir)
    if (s === 'listening') checkListening(arr, d.name)
    else if (s === 'reading') checkReading(arr, d.name)
    else checkOther(arr, d.name)
  }
}

console.log(`自检完成：题目总数=${total}，逐题判定数=${checked}`)
if (errors.length === 0) {
  console.log('✅ 所有判定项答案与内容一致，0 错误。')
} else {
  console.log(`❌ 发现 ${errors.length} 处不一致：`)
  errors.slice(0, 50).forEach((e) => console.log('  - ' + e))
  process.exit(1)
}
