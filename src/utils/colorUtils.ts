export interface RgbaColor {
  r: number
  g: number
  b: number
  a?: number
}

export interface HslColor {
  h: number
  s: number
  l: number
  a?: number
}

export interface HsvColor {
  h: number
  s: number
  v: number
  a?: number
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

// Parsing utilities
export const parseHex = (hex: string): RgbaColor | null => {
  const cleaned = hex.trim().replace(/^#/, '')
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(cleaned)) {
    return null
  }
  let r = 0,
    g = 0,
    b = 0,
    a: number | undefined
  if (cleaned.length === 3 || cleaned.length === 4) {
    r = parseInt(cleaned[0] + cleaned[0], 16)
    g = parseInt(cleaned[1] + cleaned[1], 16)
    b = parseInt(cleaned[2] + cleaned[2], 16)
    if (cleaned.length === 4) a = parseInt(cleaned[3] + cleaned[3], 16) / 255
  } else if (cleaned.length === 6 || cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16)
    g = parseInt(cleaned.slice(2, 4), 16)
    b = parseInt(cleaned.slice(4, 6), 16)
    if (cleaned.length === 8) a = parseInt(cleaned.slice(6, 8), 16) / 255
  }
  return { r, g, b, a }
}

export const parseRgb = (rgb: string): RgbaColor | null => {
  const re = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i
  const m = rgb.trim().match(re)
  if (!m) return null
  const r = clamp(parseInt(m[1], 10), 0, 255)
  const g = clamp(parseInt(m[2], 10), 0, 255)
  const b = clamp(parseInt(m[3], 10), 0, 255)
  const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : undefined
  return { r, g, b, a }
}

export const parseHsl = (hsl: string): HslColor | null => {
  const re =
    /^hsla?\(\s*(-?\d*\.?\d+)\s*,\s*(\d*\.?\d+)%\s*,\s*(\d*\.?\d+)%(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i
  const m = hsl.trim().match(re)
  if (!m) return null
  const h = ((parseFloat(m[1]) % 360) + 360) % 360
  const s = clamp(parseFloat(m[2]), 0, 100)
  const l = clamp(parseFloat(m[3]), 0, 100)
  const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : undefined
  return { h, s, l, a }
}

export const parseHsv = (hsv: string): HsvColor | null => {
  const re =
    /^hsva?\(\s*(-?\d*\.?\d+)\s*,\s*(\d*\.?\d+)%\s*,\s*(\d*\.?\d+)%(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i
  const m = hsv.trim().match(re)
  if (!m) return null
  const h = ((parseFloat(m[1]) % 360) + 360) % 360
  const s = clamp(parseFloat(m[2]), 0, 100)
  const v = clamp(parseFloat(m[3]), 0, 100)
  const a = m[4] !== undefined ? clamp(parseFloat(m[4]), 0, 1) : undefined
  return { h, s, v, a }
}

// Conversions
export const rgbToHex = ({ r, g, b, a }: RgbaColor): string => {
  const to2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  const base = `#${to2(r)}${to2(g)}${to2(b)}`
  if (a === undefined) return base
  return base + to2(Math.round(clamp(a, 0, 1) * 255))
}

export const hexToRgb = (hex: string): RgbaColor | null => {
  return parseHex(hex)
}

export const rgbToHsl = ({ r, g, b, a }: RgbaColor): HslColor => {
  const r1 = r / 255
  const g1 = g / 255
  const b1 = b / 255
  const max = Math.max(r1, g1, b1)
  const min = Math.min(r1, g1, b1)
  const d = max - min
  let h = 0
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    switch (max) {
      case r1:
        h = 60 * (((g1 - b1) / d) % 6)
        break
      case g1:
        h = 60 * ((b1 - r1) / d + 2)
        break
      case b1:
        h = 60 * ((r1 - g1) / d + 4)
        break
    }
  }
  if (h < 0) h += 360
  return { h, s: s * 100, l: l * 100, a }
}

export const hslToRgb = ({ h, s, l, a }: HslColor): RgbaColor => {
  const s1 = clamp(s, 0, 100) / 100
  const l1 = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * l1 - 1)) * s1
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l1 - c / 2
  let r1 = 0,
    g1 = 0,
    b1 = 0
  if (h >= 0 && h < 60) {
    r1 = c
    g1 = x
    b1 = 0
  } else if (h < 120) {
    r1 = x
    g1 = c
    b1 = 0
  } else if (h < 180) {
    r1 = 0
    g1 = c
    b1 = x
  } else if (h < 240) {
    r1 = 0
    g1 = x
    b1 = c
  } else if (h < 300) {
    r1 = x
    g1 = 0
    b1 = c
  } else {
    r1 = c
    g1 = 0
    b1 = x
  }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  }
}

export const rgbToHsv = ({ r, g, b, a }: RgbaColor): HsvColor => {
  const r1 = r / 255
  const g1 = g / 255
  const b1 = b / 255
  const max = Math.max(r1, g1, b1)
  const min = Math.min(r1, g1, b1)
  const d = max - min
  let h = 0
  const v = max
  const s = max === 0 ? 0 : d / max
  if (d !== 0) {
    switch (max) {
      case r1:
        h = 60 * (((g1 - b1) / d) % 6)
        break
      case g1:
        h = 60 * ((b1 - r1) / d + 2)
        break
      case b1:
        h = 60 * ((r1 - g1) / d + 4)
        break
    }
  }
  if (h < 0) h += 360
  return { h, s: s * 100, v: v * 100, a }
}

export const hsvToRgb = ({ h, s, v, a }: HsvColor): RgbaColor => {
  const s1 = clamp(s, 0, 100) / 100
  const v1 = clamp(v, 0, 100) / 100
  const c = v1 * s1
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v1 - c
  let r1 = 0,
    g1 = 0,
    b1 = 0
  if (h >= 0 && h < 60) {
    r1 = c
    g1 = x
    b1 = 0
  } else if (h < 120) {
    r1 = x
    g1 = c
    b1 = 0
  } else if (h < 180) {
    r1 = 0
    g1 = c
    b1 = x
  } else if (h < 240) {
    r1 = 0
    g1 = x
    b1 = c
  } else if (h < 300) {
    r1 = x
    g1 = 0
    b1 = c
  } else {
    r1 = c
    g1 = 0
    b1 = x
  }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  }
}

// Stringify utilities
export const formatRgb = ({ r, g, b, a }: RgbaColor): string => {
  if (a === undefined || a >= 1) return `rgb(${r}, ${g}, ${b})`
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`
}

export const formatHsl = ({ h, s, l, a }: HslColor): string => {
  const hR = Number(h.toFixed(1))
  const sR = Number(s.toFixed(1))
  const lR = Number(l.toFixed(1))
  if (a === undefined || a >= 1) return `hsl(${hR}, ${sR}%, ${lR}%)`
  return `hsla(${hR}, ${sR}%, ${lR}%, ${Number(a.toFixed(3))})`
}

export const formatHsv = ({ h, s, v, a }: HsvColor): string => {
  const hR = Number(h.toFixed(1))
  const sR = Number(s.toFixed(1))
  const vR = Number(v.toFixed(1))
  if (a === undefined || a >= 1) return `hsv(${hR}, ${sR}%, ${vR}%)`
  return `hsva(${hR}, ${sR}%, ${vR}%, ${Number(a.toFixed(3))})`
}

export const toDisplayHex = (rgba: RgbaColor): string => {
  return rgbToHex(rgba).toUpperCase()
}

export const detectAndParseColor = (input: string): RgbaColor | null => {
  const s = input.trim()
  return (
    parseHex(s) ||
    parseRgb(s) ||
    ((): RgbaColor | null => {
      const hsl = parseHsl(s)
      if (!hsl) return null
      return hslToRgb(hsl)
    })() ||
    ((): RgbaColor | null => {
      const hsv = parseHsv(s)
      if (!hsv) return null
      return hsvToRgb(hsv)
    })()
  )
}

export const withAlpha = (color: RgbaColor, alpha: number | undefined): RgbaColor => {
  if (alpha === undefined) return color
  return { ...color, a: clamp(alpha, 0, 1) }
}
