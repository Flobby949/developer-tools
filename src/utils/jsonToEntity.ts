// JSON转实体类工具

/**
 * 辅助类型定义
 */
interface ClassInfo {
  name: string
  properties: Array<{
    name: string
    type: string
    originalKey: string
  }>
}

/**
 * 获取Java类型
 */
const getJavaType = (value: unknown, key: string, allClasses: ClassInfo[]): string => {
  if (value === null) return 'Object'
  if (typeof value === 'string') return 'String'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Integer' : 'Double'
  }
  if (typeof value === 'boolean') return 'Boolean'
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getJavaType(value[0], key + 'Item', allClasses)
      return `List<${itemType}>`
    }
    return 'List<Object>'
  }
  if (typeof value === 'object' && value !== null) {
    const className = capitalize(toCamelCase(key))
    // 检查是否已经生成过这个类
    if (!allClasses.find((c) => c.name === className)) {
      generateNestedClass(value as Record<string, unknown>, className, allClasses)
    }
    return className
  }
  return 'Object'
}

/**
 * 获取TypeScript类型
 */
const getTypeScriptType = (value: unknown, key: string, allInterfaces: ClassInfo[]): string => {
  if (value === null) return 'any'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getTypeScriptType(value[0], key + 'Item', allInterfaces)
      return `${itemType}[]`
    }
    return 'any[]'
  }
  if (typeof value === 'object' && value !== null) {
    const interfaceName = capitalize(toCamelCase(key))
    // 检查是否已经生成过这个接口
    if (!allInterfaces.find((i) => i.name === interfaceName)) {
      generateNestedInterface(value as Record<string, unknown>, interfaceName, allInterfaces)
    }
    return interfaceName
  }
  return 'any'
}

/**
 * 获取C#类型
 */
const getCSharpType = (value: unknown, key: string, allClasses: ClassInfo[]): string => {
  if (value === null) return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double'
  if (typeof value === 'boolean') return 'bool'
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getCSharpType(value[0], key + 'Item', allClasses)
      return `List<${itemType}>`
    }
    return 'List<object>'
  }
  if (typeof value === 'object' && value !== null) {
    const className = capitalize(toCamelCase(key))
    if (!allClasses.find((c) => c.name === className)) {
      generateNestedCSharpClass(value as Record<string, unknown>, className, allClasses)
    }
    return className
  }
  return 'object'
}

/**
 * 获取Python类型提示
 */
const getPythonType = (value: unknown, key: string, allClasses: ClassInfo[]): string => {
  if (value === null) return 'Optional[Any]'
  if (typeof value === 'string') return 'str'
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float'
  if (typeof value === 'boolean') return 'bool'
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getPythonType(value[0], key + 'Item', allClasses)
      return `List[${itemType}]`
    }
    return 'List[Any]'
  }
  if (typeof value === 'object' && value !== null) {
    const className = capitalize(toCamelCase(key))
    if (!allClasses.find((c) => c.name === className)) {
      generateNestedPythonClass(value as Record<string, unknown>, className, allClasses)
    }
    return className
  }
  return 'Any'
}

/**
 * 计算类的复杂度（属性数量）
 */
const getClassComplexity = (classInfo: ClassInfo): number => {
  return classInfo.properties.length
}

/**
 * 按复杂度排序类（从大到小）
 */
const sortClassesByComplexity = (classes: ClassInfo[], mainClassName: string): ClassInfo[] => {
  // 找到主类
  const mainClass = classes.find((c) => c.name === mainClassName)
  if (!mainClass) return classes

  // 其他类按复杂度排序（从大到小）
  const otherClasses = classes
    .filter((c) => c.name !== mainClassName)
    .sort((a, b) => getClassComplexity(b) - getClassComplexity(a))

  // 主类在最前面，然后是按复杂度排序的其他类
  return [mainClass, ...otherClasses]
}
const generateNestedClass = (
  obj: Record<string, unknown>,
  className: string,
  allClasses: ClassInfo[],
) => {
  const properties = Object.entries(obj).map(([key, value]) => ({
    name: toCamelCase(key),
    type: getJavaType(value, key, allClasses),
    originalKey: key,
  }))

  allClasses.push({ name: className, properties })
}

/**
 * 生成嵌套TypeScript接口
 */
const generateNestedInterface = (
  obj: Record<string, unknown>,
  interfaceName: string,
  allInterfaces: ClassInfo[],
) => {
  const properties = Object.entries(obj).map(([key, value]) => ({
    name: key,
    type: getTypeScriptType(value, key, allInterfaces),
    originalKey: key,
  }))

  allInterfaces.push({ name: interfaceName, properties })
}

/**
 * 生成嵌套C#类
 */
const generateNestedCSharpClass = (
  obj: Record<string, unknown>,
  className: string,
  allClasses: ClassInfo[],
) => {
  const properties = Object.entries(obj).map(([key, value]) => ({
    name: capitalize(toCamelCase(key)),
    type: getCSharpType(value, key, allClasses),
    originalKey: key,
  }))

  allClasses.push({ name: className, properties })
}

/**
 * 生成嵌套Python类
 */
const generateNestedPythonClass = (
  obj: Record<string, unknown>,
  className: string,
  allClasses: ClassInfo[],
) => {
  const properties = Object.entries(obj).map(([key, value]) => ({
    name: key.toLowerCase(),
    type: getPythonType(value, key, allClasses),
    originalKey: key,
  }))

  allClasses.push({ name: className, properties })
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
    const allClasses: ClassInfo[] = []

    // 生成主类
    const mainClassProperties = Object.entries(obj).map(([key, value]) => ({
      name: toCamelCase(key),
      type: getJavaType(value, key, allClasses),
      originalKey: key,
    }))

    allClasses.unshift({ name: className, properties: mainClassProperties })

    // 按复杂度排序
    const sortedClasses = sortClassesByComplexity(allClasses, className)

    let result = ''

    // 生成所有类
    for (const classInfo of sortedClasses) {
      result += `public class ${classInfo.name} {\n`

      // 生成字段
      for (const prop of classInfo.properties) {
        result += `    private ${prop.type} ${prop.name};\n`
      }

      result += '\n'

      // 生成getter和setter
      for (const prop of classInfo.properties) {
        const methodName = capitalize(prop.name)

        result += `    public ${prop.type} get${methodName}() {\n`
        result += `        return ${prop.name};\n`
        result += `    }\n\n`

        result += `    public void set${methodName}(${prop.type} ${prop.name}) {\n`
        result += `        this.${prop.name} = ${prop.name};\n`
        result += `    }\n\n`
      }

      result += '}\n\n'
    }

    return result.trim()
  } catch {
    throw new Error('Invalid JSON format')
  }
}

/**
 * JSON转TypeScript接口
 */
export const jsonToTypeScript = (jsonString: string, interfaceName: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)
    const allInterfaces: ClassInfo[] = []

    // 生成主接口
    const mainInterfaceProperties = Object.entries(obj).map(([key, value]) => ({
      name: key,
      type: getTypeScriptType(value, key, allInterfaces),
      originalKey: key,
    }))

    allInterfaces.unshift({ name: interfaceName, properties: mainInterfaceProperties })

    // 按复杂度排序
    const sortedInterfaces = sortClassesByComplexity(allInterfaces, interfaceName)

    let result = ''

    // 生成所有接口
    for (const interfaceInfo of sortedInterfaces) {
      result += `interface ${interfaceInfo.name} {\n`

      for (const prop of interfaceInfo.properties) {
        result += `  ${prop.name}: ${prop.type};\n`
      }

      result += '}\n\n'
    }

    return result.trim()
  } catch {
    throw new Error('Invalid JSON format')
  }
}

/**
 * JSON转C#类
 */
export const jsonToCSharp = (jsonString: string, className: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)
    const allClasses: ClassInfo[] = []

    // 生成主类
    const mainClassProperties = Object.entries(obj).map(([key, value]) => ({
      name: capitalize(toCamelCase(key)),
      type: getCSharpType(value, key, allClasses),
      originalKey: key,
    }))

    allClasses.unshift({ name: className, properties: mainClassProperties })

    // 按复杂度排序
    const sortedClasses = sortClassesByComplexity(allClasses, className)

    let result = ''

    // 生成所有类
    for (const classInfo of sortedClasses) {
      result += `public class ${classInfo.name}\n{\n`

      for (const prop of classInfo.properties) {
        result += `    public ${prop.type} ${prop.name} { get; set; }\n`
      }

      result += '}\n\n'
    }

    return result.trim()
  } catch {
    throw new Error('Invalid JSON format')
  }
}

/**
 * JSON转Python类
 */
export const jsonToPython = (jsonString: string, className: string = 'Entity'): string => {
  try {
    const obj = JSON.parse(jsonString)
    const allClasses: ClassInfo[] = []

    // 生成主类
    const mainClassProperties = Object.entries(obj).map(([key, value]) => ({
      name: key.toLowerCase(),
      type: getPythonType(value, key, allClasses),
      originalKey: key,
    }))

    allClasses.unshift({ name: className, properties: mainClassProperties })

    // 按复杂度排序
    const sortedClasses = sortClassesByComplexity(allClasses, className)

    let result = 'from typing import List, Optional, Any\nfrom dataclasses import dataclass\n\n'

    // 生成所有类
    for (const classInfo of sortedClasses) {
      result += '@dataclass\n'
      result += `class ${classInfo.name}:\n`

      for (const prop of classInfo.properties) {
        result += `    ${prop.name}: ${prop.type}\n`
      }

      result += '\n'
    }

    return result.trim()
  } catch {
    throw new Error('Invalid JSON format')
  }
}
