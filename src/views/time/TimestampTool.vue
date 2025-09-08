<template>
  <ToolPanel title="时间戳工具" description="支持秒/毫秒与日期互转，并按所选时区显示">
    <!-- 时间戳转日期时间 -->
    <div class="card">
      <div class="section-header">
        <h3>时间戳 → 日期时间</h3>
        <div class="actions">
          <button class="btn" @click="setNow">现在</button>
        </div>
      </div>

      <div class="form-row">
        <label class="label">时间戳</label>
        <input
          class="input"
          v-model.trim="timestampInput"
          placeholder="例如: 1700000000 或 1700000000000"
        />
        <select class="select" v-model="timestampUnit">
          <option value="seconds">秒</option>
          <option value="milliseconds">毫秒</option>
        </select>
        <button class="btn" @click="normalizeUnit">切换单位</button>
      </div>

      <div class="form-row">
        <label class="label">显示时区</label>
        <select class="select" v-model="displayTimeZone">
          <option v-for="tz in timeZones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </div>

      <div v-if="parsedMs != null" class="tz-grid">
        <div class="tz-head">时区</div>
        <div class="tz-head">
          {{ showMsInOutput ? 'YYYY-MM-DD HH:mm:ss.SSS' : 'YYYY-MM-DD HH:mm:ss' }}
        </div>
        <div class="tz-head">
          {{ showMsInOutput ? 'YYYY/MM/DD HH:mm:ss.SSS' : 'YYYY/MM/DD HH:mm:ss' }}
        </div>
        <div class="tz-cell">本地时区 ({{ localTimeZone }})</div>
        <div class="tz-cell tz-val">
          <span>{{ formatYMDHMS(parsedMs, localTimeZone, '-', showMsInOutput) }}</span>
          <button
            class="copy-btn"
            :data-text="formatYMDHMS(parsedMs, localTimeZone, '-', showMsInOutput)"
            @click="copyText(formatYMDHMS(parsedMs, localTimeZone, '-', showMsInOutput), $event)"
            title="复制"
          >
            📋
          </button>
        </div>
        <div class="tz-cell tz-val">
          <span>{{ formatYMDHMS(parsedMs, localTimeZone, '/', showMsInOutput) }}</span>
          <button
            class="copy-btn"
            :data-text="formatYMDHMS(parsedMs, localTimeZone, '/', showMsInOutput)"
            @click="copyText(formatYMDHMS(parsedMs, localTimeZone, '/', showMsInOutput), $event)"
            title="复制"
          >
            📋
          </button>
        </div>
        <div class="tz-cell">{{ displayTimeZone }}</div>
        <div class="tz-cell tz-val">
          <span>{{ formatYMDHMS(parsedMs, displayTimeZone, '-', showMsInOutput) }}</span>
          <button
            class="copy-btn"
            :data-text="formatYMDHMS(parsedMs, displayTimeZone, '-', showMsInOutput)"
            @click="copyText(formatYMDHMS(parsedMs, displayTimeZone, '-', showMsInOutput), $event)"
            title="复制"
          >
            📋
          </button>
        </div>
        <div class="tz-cell tz-val">
          <span>{{ formatYMDHMS(parsedMs, displayTimeZone, '/', showMsInOutput) }}</span>
          <button
            class="copy-btn"
            :data-text="formatYMDHMS(parsedMs, displayTimeZone, '/', showMsInOutput)"
            @click="copyText(formatYMDHMS(parsedMs, displayTimeZone, '/', showMsInOutput), $event)"
            title="复制"
          >
            📋
          </button>
        </div>
      </div>

      <div v-else class="hint">请输入有效的时间戳</div>
    </div>

    <!-- 日期时间转时间戳 -->
    <div class="card">
      <div class="section-header">
        <h3>日期时间 → 时间戳</h3>
        <div class="actions">
          <button class="btn" @click="setDateNow">现在</button>
        </div>
      </div>

      <div class="form-row">
        <label class="label">日期时间</label>
        <input
          class="input"
          v-model.trim="dateInput"
          placeholder="YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD HH:mm:ss"
        />
      </div>

      <div class="form-row">
        <label class="label">源时区</label>
        <select class="select" v-model="sourceTimeZone">
          <option v-for="tz in timeZones" :key="tz" :value="tz">{{ tz }}</option>
        </select>
      </div>

      <div v-if="convertedUtcMs != null" class="result-grid">
        <div class="result-item">
          <span class="key">时间戳 (秒):</span>
          <div class="tz-val">
            <span class="val">{{ Math.trunc((convertedUtcMs as number) / 1000) }}</span>
            <button
              class="copy-btn"
              @click="copyText(String(Math.trunc((convertedUtcMs as number) / 1000)), $event)"
              title="复制"
            >
              📋
            </button>
          </div>
        </div>
        <div class="result-item">
          <span class="key">时间戳 (毫秒):</span>
          <div class="tz-val">
            <span class="val">{{ convertedUtcMs }}</span>
            <button class="copy-btn" @click="copyText(String(convertedUtcMs), $event)" title="复制">
              📋
            </button>
          </div>
        </div>
      </div>

      <div v-else class="hint">请输入有效的日期时间</div>
    </div>
  </ToolPanel>
  <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ToolPanel from '@/components/ToolPanel.vue'

// 常见时区（可按需扩展）
const timeZones = [
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'UTC',
]

// 时间戳 → 日期时间
const timestampInput = ref('')
const timestampUnit = ref<'seconds' | 'milliseconds'>('seconds')
const displayTimeZone = ref<string>('Asia/Shanghai')

const parseTimestampToMs = (v: string, unit: 'seconds' | 'milliseconds'): number | null => {
  if (!v) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (unit === 'seconds') return Math.trunc(n) * 1000
  return Math.trunc(n)
}

const parsedMs = computed(() => parseTimestampToMs(timestampInput.value, timestampUnit.value))
const showMsInOutput = computed(() => timestampUnit.value === 'milliseconds')
const localTimeZone = computed(() => Intl.DateTimeFormat().resolvedOptions().timeZone)

const setNow = () => {
  const now = Date.now()
  if (timestampUnit.value === 'seconds') {
    timestampInput.value = String(Math.trunc(now / 1000))
  } else {
    timestampInput.value = String(now)
  }
}

const normalizeUnit = () => {
  if (parsedMs.value == null) return
  if (timestampUnit.value === 'seconds') {
    // 切换到毫秒
    timestampUnit.value = 'milliseconds'
    timestampInput.value = String(parsedMs.value)
  } else {
    // 切换到秒
    timestampUnit.value = 'seconds'
    timestampInput.value = String(Math.trunc((parsedMs.value as number) / 1000))
  }
}

const formatYMDHMS = (ms: number, tz: string, dateSep: '-' | '/', withMs = false): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(new Date(ms))
    const get = (type: string) => parts.find((p) => p.type === type)?.value || ''
    const y = get('year')
    const m = get('month')
    const d = get('day')
    const hh = get('hour')
    const mm = get('minute')
    const ss = get('second')
    const sss = String(new Date(ms).getMilliseconds()).padStart(3, '0')
    return withMs
      ? `${y}${dateSep}${m}${dateSep}${d} ${hh}:${mm}:${ss}.${sss}`
      : `${y}${dateSep}${m}${dateSep}${d} ${hh}:${mm}:${ss}`
  } catch {
    const dt = new Date(ms)
    const pad = (n: number) => String(n).padStart(2, '0')
    const base = `${dt.getFullYear()}${dateSep}${pad(dt.getMonth() + 1)}${dateSep}${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
    return withMs ? `${base}.${String(dt.getMilliseconds()).padStart(3, '0')}` : base
  }
}

// 复制功能，带视觉反馈
const copyText = async (text: string, e?: Event) => {
  try {
    await navigator.clipboard.writeText(text)
    const target = e?.target as HTMLElement | undefined
    if (target) {
      target.classList.add('copied')
      setTimeout(() => target.classList.remove('copied'), 800)
    }
    showToast('已复制到剪贴板')
  } catch {
    // 降级处理
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      const target = e?.target as HTMLElement | undefined
      if (target) {
        target.classList.add('copied')
        setTimeout(() => target.classList.remove('copied'), 800)
      }
      showToast('已复制到剪贴板')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

// Toast：简易实现，与 JWT 的消息条风格一致
const toastMessage = ref('')
const toastVisible = ref(false)
const showToast = (msg: string) => {
  toastMessage.value = msg
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
    toastMessage.value = ''
  }, 1800)
}

// 日期时间 → 时间戳
const dateInput = ref('')
const sourceTimeZone = ref<string>('Asia/Shanghai')

const setDateNow = () => {
  const now = Date.now()
  // 用源时区格式化当前时间为 YYYY-MM-DD HH:mm:ss.SSS（包含毫秒）
  dateInput.value = formatYMDHMS(now, sourceTimeZone.value, '-', true)
}

// 将“在某时区的本地日期时间”解析为对应UTC毫秒
// 实现思路：
// 1) 将用户输入的“YYYY-MM-DD HH:mm:ss[.SSS]”或“YYYY/MM/DD HH:mm:ss[.SSS]”解析为各组件
// 2) 先按这些组件构造一个“UTC视角”的时间（Date.UTC）
// 3) 计算该时间在目标时区的偏移（分钟），再用迭代法校正一次，得到最终UTC毫秒
type DateParts = {
  y: number
  m: number
  d: number
  hh: number
  mm: number
  ss: number
  sss?: number
}

const parseDateParts = (s: string): DateParts | null => {
  const t = s.trim().replace(/T/, ' ').replace(/\//g, '-').replace(/\s+/, ' ')
  const m = t.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,3}))?)?$/,
  )
  if (!m) return null
  const y = Number(m[1])
  const mon = Number(m[2])
  const d = Number(m[3])
  const hh = Number(m[4])
  const mm = Number(m[5])
  const ss = Number(m[6] ?? '0')
  const sss = Number(m[7] ?? '0')
  if ([y, mon, d, hh, mm, ss, sss].some((v) => !Number.isFinite(v))) return null
  const parts: DateParts = { y, m: mon, d, hh, mm, ss, sss }
  return parts
}

const getTzOffsetMinutes = (utcMs: number, tz: string): number => {
  // 通过格式化得到相同时刻在目标时区的本地各组件，再与UTC计算差值以近似偏移
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcMs))

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || '0')
  const y = get('year')
  const m = get('month')
  const d = get('day')
  const hh = get('hour')
  const mi = get('minute')
  const ss = get('second')

  const localMs = Date.UTC(y, m - 1, d, hh, mi, ss)
  // 偏移 = 本地(按该tz理解的UTC构造) - 实际UTC
  return Math.round((localMs - utcMs) / 60000)
}

const convertLocalInTZToUtcMs = (parts: DateParts, tz: string): number | null => {
  // 初始假设：该本地时刻对应的UTC毫秒 approx1
  const approxUtc =
    Date.UTC(parts.y, parts.m - 1, parts.d, parts.hh, parts.mm, parts.ss) + (parts.sss ?? 0)
  // 计算该时刻在 tz 的偏移（分钟）
  const off1 = getTzOffsetMinutes(approxUtc, tz)
  const utc1 = approxUtc - off1 * 60000
  // 再计算一次，避免夏令时边界误差
  const off2 = getTzOffsetMinutes(utc1, tz)
  return utc1 - (off2 - off1) * 60000
}

const convertedUtcMs = computed<number | null>(() => {
  const p = parseDateParts(dateInput.value)
  if (!p) return null
  try {
    return convertLocalInTZToUtcMs(p, sourceTimeZone.value)
  } catch {
    return null
  }
})

// 无需单位切换与UTC字符串显示
</script>

<style scoped>
.card {
  margin-bottom: 2rem;
  padding: 1.25rem;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: var(--color-heading);
}

.actions .btn {
  margin-left: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 100px 1fr max-content max-content;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.form-row .label {
  color: var(--color-text-light);
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 4px;
}

.select {
  padding: 0.45rem 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 4px;
}

.btn {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--color-border);
  background: var(--color-background-mute);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.result-item {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0.5rem;
  align-items: center;
}

.result-item .key {
  color: var(--color-text-light);
}

.result-item .val {
  font-family: 'Courier New', monospace;
}

.hint {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

/* 三列表格：时区、-格式、/格式 */
.tz-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 0.5rem 0.75rem;
  align-items: center;
  margin-top: 0.75rem;
}

.tz-head {
  font-weight: 600;
  color: var(--color-heading);
}

.tz-cell {
  font-family: 'Courier New', monospace;
}

.tz-val {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.copy-btn {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  border-radius: 4px;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  background: var(--color-background-mute);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.copy-btn.copied {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: scale(1.05);
}

/* Toast */
.toast {
  position: fixed;
  left: 50%;
  top: 20px;
  transform: translateX(-50%);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--color-text);
  box-shadow: var(--shadow);
  z-index: 1100;
  opacity: 0.98;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 90px 1fr;
  }
  .tz-grid {
    grid-template-columns: 1fr;
  }
}
</style>
