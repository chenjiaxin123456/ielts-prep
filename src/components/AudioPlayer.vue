<template>
  <div class="audio-player">
    <audio
      ref="audioRef"
      :src="src || undefined"
      controls
      preload="none"
      class="native"
      @play="onPlay"
      @pause="onPause"
    ></audio>

    <div class="controls" v-if="src">
      <span class="label">语速</span>
      <el-radio-group :model-value="rate" size="small" @update:model-value="setRate">
        <el-radio-button :value="0.75">0.75x</el-radio-button>
        <el-radio-button :value="1">1x</el-radio-button>
        <el-radio-button :value="1.25">1.25x</el-radio-button>
        <el-radio-button :value="1.5">1.5x</el-radio-button>
      </el-radio-group>
    </div>

    <el-button
      v-if="transcript"
      :type="speech.speaking.value ? 'warning' : 'primary'"
      :icon="speech.speaking.value ? VideoPause : Microphone"
      plain
      :disabled="!speech.supported"
      @click="toggleRead"
    >
      {{ speech.speaking.value ? '停止朗读' : '朗读原文（离线 TTS）' }}
    </el-button>
    <span v-if="transcript && !speech.supported" class="hint">当前浏览器不支持语音合成</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Microphone, VideoPause } from '@element-plus/icons-vue'
import { useSpeech } from '@/composables/useSpeech'

const props = defineProps<{ src?: string; transcript?: string }>()

const audioRef = ref<HTMLAudioElement | null>(null)
const rate = ref(1)
const speech = useSpeech()

function setRate(v: number | string) {
  rate.value = Number(v)
  if (audioRef.value) audioRef.value.playbackRate = rate.value
}
function onPlay() {
  if (audioRef.value) audioRef.value.playbackRate = rate.value
}
function onPause() {}

function toggleRead() {
  if (speech.speaking.value) speech.stop()
  else speech.speak(props.transcript || '')
}

watch(
  () => props.transcript,
  () => speech.stop()
)
</script>

<style scoped lang="scss">
.audio-player {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 14px 16px;
}
.native {
  width: 100%;
}
.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.label {
  font-size: 13px;
  color: #6b7280;
}
.hint {
  font-size: 12px;
  color: #f59e0b;
}
</style>
