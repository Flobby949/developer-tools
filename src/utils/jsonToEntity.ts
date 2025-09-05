// JSON转实体类工具

/**
 * 获取JavaScript类型
 */
const getJsType = (value: any): string => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/**
 * 获取Java类型
 */
const getJavaType = (value: any): string => {
  if (value === null) return 'Object'
  if (typeof value === 'string') return 'String'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Double'
  }
  if (typeof value === 'boolean') return 'Boolean'
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getJavaType(value[0])
      return `List<${itemType}>`
    }
    return 'List<Object>'
  }
  if (typeof value === 'object') return 'Object'
  return 'Object'
}

/**
 * 获取TypeScript类型
 */
const getTypeScriptType = (value: any): string => {
  if (value === null) return 'any'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getTypeScriptType(value[0])
      return `${itemType}[]`
    }
    return 'any[]'
  }
  if (typeof value === 'object') return 'object'
  return 'any'
}

/**
 * 首字母大写
 */
const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 驼峰命名转换
 */
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * JSON转Java实体类
 */
export const jsonToJava = (jsonString: string, className: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)

    let result = `public class ${className} {\n`

    for (const [key, value] of Object.entries(obj)) {
      const type = getJavaType(value)
      const fieldName = toCamelCase(key)
      result += `    private ${type} ${fieldName};\n`
    }

    result += '\n'

    // 生成getter和setter
    for (const [key, value] of Object.entries(obj)) {
      const type = getJavaType(value)
      const fieldName = toCamelCase(key)
      const methodName = capitalize(fieldName)

      result += `    public ${type} get${methodName}() {\n`
      result += `        return ${fieldName};\n`
      result += `    }\n\n`

      result += `    public void set${methodName}(${type} ${fieldName}) {\n`
      result += `        this.${fieldName} = ${fieldName};\n`
      result += `    }\n\n`
    }

    result += '}'

    return result
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

/**
 * JSON转TypeScript接口
 */
export const jsonToTypeScript = (jsonString: string, interfaceName: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)

    let result = `interface ${interfaceName} {\n`

    for (const [key, value] of Object.entries(obj)) {
      const type = getTypeScriptType(value)
      result += `  ${key}: ${type};\n`
    }

    result += '}'

    return result
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

/**
 * JSON转C#类
 */
export const jsonToCSharp = (jsonString: string, className: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)

    let result = `public class ${className}\n{\n`

    for (const [key, value] of Object.entries(obj)) {
      let type = 'object'
      if (typeof value === 'string') type = 'string'
      else if (typeof value === 'number') type = Number.isInteger(value) ? 'int' : 'double'
      else if (typeof value === 'boolean') type = 'bool'
      else if (Array.isArray(value)) type = 'List<object>'

      const propertyName = capitalize(toCamelCase(key))
      result += `    public ${type} ${propertyName} { get; set; }\n`
    }

    result += '}'

    return result
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

/**
 * JSON转Python类
 */
export const jsonToPython = (jsonString: string, className: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)

    let result = `class ${className}:\n`
    result += `    def __init__(self):\n`

    for (const [key, value] of Object.entries(obj)) {
      const fieldName = key.toLowerCase()
      result += `        self.${fieldName} = None\n`
    }

    return result
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}
