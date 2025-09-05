// 工具类型定义

export interface ToolItem {
  name: string
  path: string
  icon?: string
  description?: string
}

export interface ToolCategory {
  title: string
  tools: ToolItem[]
}

// JSON工具相关类型
export interface JsonTool {
  format: (json: string) => string
  compress: (json: string) => string
  toEntity: (json: string, language: string) => string
}

// 编码转换相关类型
export interface EncodeTool {
  urlEncode: (text: string) => string
  urlDecode: (text: string) => string
  base64Encode: (text: string) => string
  base64Decode: (text: string) => string
}

// 正则表达式相关类型
export interface RegexResult {
  match: boolean
  matches: string[]
  groups?: { [key: string]: string }
}

// YAML工具相关类型
export interface YamlTool {
  yamlToProperties: (yaml: string) => string
  propertiesToYaml: (properties: string) => string
}
