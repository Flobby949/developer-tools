<template>
  <ToolPanel title="调色盘" description="选择颜色并在 HEX / RGB / HSL / HSV 之间互转">
    <div class="palette-grid">
      <section class="picker-card">
        <label class="label">颜色选择</label>
        <div class="picker-row">
          <input type="color" v-model="pickerHex" class="color-input" @input="onPickerInput" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="alpha"
            class="alpha-range"
          />
          <span class="alpha-text">α {{ alpha.toFixed(2) }}</span>
        </div>
        <div class="preview" :style="{ background: previewCss }"></div>
      </section>

      <section class="formats-card">
        <label class="label">颜色格式</label>
        <div class="formats">
          <div class="format-item">
            <span class="format-name">HEX</span>
            <input
              class="format-input"
              v-model="hexText"
              @focus="onHexFocus"
              @blur="onHexBlur"
              @input="onHexTextInput"
            />
            <button class="btn" @click="copy(hexText)">复制</button>
          </div>
          <div class="format-item">
            <span class="format-name">RGB</span>
            <input
              class="format-input"
              v-model="rgbInput"
              @focus="onRgbFocus"
              @blur="onRgbBlur"
              @input="onRgbInput"
            />
            <button class="btn" @click="copy(rgbInput)">复制</button>
          </div>
          <div class="format-item">
            <span class="format-name">HSL</span>
            <input
              class="format-input"
              v-model="hslInput"
              @focus="onHslFocus"
              @blur="onHslBlur"
              @input="onHslInput"
            />
            <button class="btn" @click="copy(hslInput)">复制</button>
          </div>
          <div class="format-item">
            <span class="format-name">HSV</span>
            <input
              class="format-input"
              v-model="hsvInput"
              @focus="onHsvFocus"
              @blur="onHsvBlur"
              @input="onHsvInput"
            />
            <button class="btn" @click="copy(hsvInput)">复制</button>
          </div>
        </div>
      </section>
    </div>

    <!-- 常用色彩搭配 -->
    <section class="color-palettes-card">
      <label class="label">常用色彩搭配</label>
      <div class="palettes-grid">
        <div v-for="palette in colorPalettes" :key="palette.name" class="palette-item">
          <div class="palette-colors">
            <div
              v-for="color in palette.colors"
              :key="color"
              class="color-swatch"
              :style="{ backgroundColor: color }"
              :title="color"
              @click="applyColor(color)"
            ></div>
          </div>
          <div class="palette-name">{{ palette.name }}</div>
        </div>
      </div>
    </section>
  </ToolPanel>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'
import { copyToClipboard } from '@/utils'
import {
  detectAndParseColor,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  formatRgb,
  formatHsl,
  formatHsv,
  withAlpha,
  type RgbaColor,
} from '@/utils/colorUtils'
import { parseHex } from '@/utils/colorUtils'

const pickerHex = ref('#409EFF')
const hexText = ref('')
const isEditingHex = ref(false)
const isEditingRgb = ref(false)
const isEditingHsl = ref(false)
const isEditingHsv = ref(false)
const alpha = ref(1)
const rgbInput = ref('')
const hslInput = ref('')
const hsvInput = ref('')

// 常用色彩搭配
const colorPalettes = ref([
  {
    name: '警告红',
    colors: ['#F56C6C', '#F78989', '#F9A7A7', '#FBC4C4', '#FEF0F0'],
  },
  {
    name: '莫兰迪色系',
    colors: ['#D4A574', '#C9A96E', '#B5A88F', '#A89B8E', '#9B8E7E'],
  },
  {
    name: '马卡龙色系',
    colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'],
  },
  {
    name: '森系色彩',
    colors: ['#228B22', '#32CD32', '#9ACD32', '#ADFF2F', '#F0FFF0'],
  },
  {
    name: '暖秋色调',
    colors: ['#B8860B', '#DAA520', '#FFD700', '#FFA500', '#FF8C00'],
  },
  {
    name: '冷色调',
    colors: ['#4169E1', '#6495ED', '#87CEEB', '#B0E0E6', '#F0F8FF'],
  },
  {
    name: '粉嫩系列',
    colors: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFCCCB', '#FFE4E1'],
  },
  {
    name: '紫色渐变',
    colors: ['#4B0082', '#663399', '#9966CC', '#CC99FF', '#E6E6FA'],
  },
  {
    name: '大地色系',
    colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F5DEB3'],
  },
  {
    name: '薄荷清新',
    colors: ['#00CED1', '#48D1CC', '#7FFFD4', '#AFEEEE', '#E0FFFF'],
  },
  {
    name: '日式和风',
    colors: ['#DC143C', '#FF6347', '#FFA07A', '#FFE4E1', '#FFF0F5'],
  },
  {
    name: '商务灰调',
    colors: ['#2F4F4F', '#696969', '#808080', '#A9A9A9', '#D3D3D3'],
  },
])

const current = ref<RgbaColor>({ r: 64, g: 158, b: 255, a: 1 })

const previewCss = computed(() => formatRgb(withAlpha(current.value, alpha.value)))

const syncFromRgba = () => {
  const withA = withAlpha(current.value, alpha.value)
  if (!isEditingHex.value) {
    const hex = rgbToHex(withA).toUpperCase()
    // 如果透明度是 FF（完全不透明），只显示 6 位 HEX
    hexText.value = hex.length === 9 && hex.slice(-2) === 'FF' ? hex.slice(0, 7) : hex
  }
  const withoutA: RgbaColor = { r: current.value.r, g: current.value.g, b: current.value.b }
  pickerHex.value = rgbToHex(withoutA).toUpperCase()
  if (!isEditingRgb.value) {
    rgbInput.value = formatRgb(withA)
  }
  if (!isEditingHsl.value) {
    hslInput.value = formatHsl(rgbToHsl(withA))
  }
  if (!isEditingHsv.value) {
    hsvInput.value = formatHsv(rgbToHsv(withA))
  }
}

watch(alpha, syncFromRgba)

const copy = async (text: string) => {
  await copyToClipboard(text)
}

const onHexTextInput = () => {
  if (!hexText.value) return
  const parsed = detectAndParseColor(hexText.value)
  if (parsed) {
    current.value = parsed
    if (parsed.a !== undefined) alpha.value = parsed.a
    syncFromRgba()
  }
}

const onPickerInput = () => {
  const parsed = parseHex(pickerHex.value)
  if (parsed) {
    current.value = { r: parsed.r, g: parsed.g, b: parsed.b, a: alpha.value }
    syncFromRgba()
  }
}

const onHexFocus = () => {
  isEditingHex.value = true
}

const onHexBlur = () => {
  isEditingHex.value = false
  // 失焦时若为空，则回填当前值以保持一致
  if (!hexText.value) {
    const withA = withAlpha(current.value, alpha.value)
    const hex = rgbToHex(withA).toUpperCase()
    hexText.value = hex.length === 9 && hex.slice(-2) === 'FF' ? hex.slice(0, 7) : hex
  }
}

const onRgbFocus = () => {
  isEditingRgb.value = true
}

const onRgbBlur = () => {
  isEditingRgb.value = false
  if (!rgbInput.value) {
    const withA = withAlpha(current.value, alpha.value)
    rgbInput.value = formatRgb(withA)
  }
}

const onHslFocus = () => {
  isEditingHsl.value = true
}

const onHslBlur = () => {
  isEditingHsl.value = false
  if (!hslInput.value) {
    const withA = withAlpha(current.value, alpha.value)
    hslInput.value = formatHsl(rgbToHsl(withA))
  }
}

const onHsvFocus = () => {
  isEditingHsv.value = true
}

const onHsvBlur = () => {
  isEditingHsv.value = false
  if (!hsvInput.value) {
    const withA = withAlpha(current.value, alpha.value)
    hsvInput.value = formatHsv(rgbToHsv(withA))
  }
}

// 应用单个颜色
const applyColor = (color: string) => {
  const parsed = detectAndParseColor(color)
  if (parsed) {
    // 重置透明度为1（完全不透明）
    alpha.value = 1
    // 设置颜色，确保alpha为1
    current.value = { r: parsed.r, g: parsed.g, b: parsed.b, a: 1 }
    // 同步所有格式
    syncFromRgba()
  }
}

const onRgbInput = () => {
  if (!rgbInput.value) return
  const parsed = detectAndParseColor(rgbInput.value)
  if (parsed) {
    current.value = parsed
    if (parsed.a !== undefined) alpha.value = parsed.a
    syncFromRgba()
  }
}

const onHslInput = () => {
  if (!hslInput.value) return
  const parsed = detectAndParseColor(hslInput.value)
  if (parsed) {
    current.value = parsed
    if (parsed.a !== undefined) alpha.value = parsed.a
    syncFromRgba()
  }
}

const onHsvInput = () => {
  if (!hsvInput.value) return
  const parsed = detectAndParseColor(hsvInput.value)
  if (parsed) {
    current.value = parsed
    if (parsed.a !== undefined) alpha.value = parsed.a
    syncFromRgba()
  }
}

// 初始化
syncFromRgba()
</script>

<style scoped>
.palette-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-xl);
}

.picker-card,
.formats-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow);
}

.label {
  display: block;
  font-weight: 600;
  color: var(--color-text-light);
  margin-bottom: var(--spacing);
}

.picker-row {
  display: flex;
  align-items: center;
  gap: var(--spacing);
}

.color-input {
  width: 56px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
}

.alpha-range {
  flex: 1;
}

.alpha-text {
  width: 64px;
  text-align: right;
  color: var(--color-text-light);
}

.preview {
  margin-top: var(--spacing-lg);
  height: 120px;
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 16px 16px;
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0px;
}

.formats {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing);
}

.format-item {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  align-items: center;
  gap: var(--spacing);
}

.format-name {
  color: var(--color-text-light);
  font-weight: 600;
}

.format-input {
  width: 100%;
  padding: var(--spacing);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
}

.btn {
  padding: 6px 10px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
}

/* 色彩搭配板块样式 */
.color-palettes-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow);
  margin-top: var(--spacing-xl);
}

.palettes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.palette-item {
  cursor: pointer;
  border-radius: var(--radius);
  padding: var(--spacing);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.palette-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.palette-colors {
  display: flex;
  gap: 2px;
  margin-bottom: var(--spacing-sm);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.color-swatch {
  flex: 1;
  height: 32px;
  border-radius: 2px;
  transition: transform 0.1s ease;
}

.color-swatch:hover {
  transform: scale(1.1);
  z-index: 1;
  position: relative;
}

.palette-name {
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-light);
}

@media (max-width: 1024px) {
  .palette-grid {
    grid-template-columns: 1fr;
  }

  .palettes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
