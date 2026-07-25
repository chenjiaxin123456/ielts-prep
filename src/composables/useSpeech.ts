import { ref, onUnmounted } from 'vue'

// 偏好高质量英文女声（按名称关键字排序，越靠前越优先）
// 注：浏览器 TTS 只能用系统已安装语音，无法指定"刘亦菲"等名人声音，
// 这里尽量挑选最接近"好听英文女声"的默认语音，并允许用户在 UI 中切换。
const FEMALE_PRIORITY = ['jenny', 'aria', 'zira', 'samantha', 'tessa', 'female', 'google us english']

function isEnglish(v: SpeechSynthesisVoice) {
  return v.lang.toLowerCase().startsWith('en')
}

// 封装浏览器原生语音合成（SpeechSynthesis），用于离线朗读题目文本
export function useSpeech() {
  const speaking = ref(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const voices = ref<SpeechSynthesisVoice[]>([])
  const voiceName = ref<string>('') // 当前选中的语音名；'' 表示浏览器默认

  let current: SpeechSynthesisUtterance | null = null

  function pickDefaultEnglishFemale(): string {
    const en = voices.value.filter(isEnglish)
    for (const kw of FEMALE_PRIORITY) {
      const hit = en.find((v) => v.name.toLowerCase().includes(kw))
      if (hit) return hit.name
    }
    return en[0]?.name || ''
  }

  function loadVoices() {
    if (!supported) return
    const list = window.speechSynthesis.getVoices()
    if (!list.length) return
    voices.value = list
    // 仅在尚未选择时自动挑一个英文女声作为默认
    if (!voiceName.value) voiceName.value = pickDefaultEnglishFemale()
  }

  if (supported) {
    loadVoices()
    // 语音列表可能异步加载：部分浏览器首次 getVoices() 为空，触发 voiceschanged 后才就绪
    window.speechSynthesis.onvoiceschanged = loadVoices
  }

  function speak(text: string, opts: { rate?: number; lang?: string; onEnd?: () => void } = {}) {
    if (!supported) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = opts.lang || 'en-US'
    utt.rate = opts.rate ?? 1
    if (voiceName.value) {
      const v = voices.value.find((x) => x.name === voiceName.value)
      if (v) utt.voice = v
    }
    utt.onend = () => {
      speaking.value = false
      opts.onEnd?.()
    }
    current = utt
    speaking.value = true
    window.speechSynthesis.speak(utt)
  }

  function stop() {
    if (!supported) return
    window.speechSynthesis.cancel()
    speaking.value = false
  }

  onUnmounted(() => stop())

  return { speaking, supported, speak, stop, voices, voiceName }
}
