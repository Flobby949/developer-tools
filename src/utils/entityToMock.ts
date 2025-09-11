// 实体类转Mock数据工具

/**
 * 字段信息定义
 */
interface FieldInfo {
  name: string
  type: string
  isArray: boolean
  isCustomType: boolean
}

/**
 * 类信息定义
 */
interface ClassInfo {
  name: string
  fields: FieldInfo[]
}

/**
 * 语言类型
 */
type LanguageType = 'java' | 'golang'

/**
 * 解析Java实体类
 */
const parseJavaEntity = (entityCode: string): ClassInfo[] => {
  const classes: ClassInfo[] = []

  // 移除注释和多余空格
  const cleanCode = entityCode
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
    .replace(/\/\/.*$/gm, '') // 移除行注释
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()

  // 匹配所有类定义（支持abstract类和普通类）
  const classRegex =
    /(public\s+(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*))\}/g
  let classMatch

  while ((classMatch = classRegex.exec(cleanCode)) !== null) {
    const className = classMatch[2]
    const classBody = classMatch[3]

    const fields = parseJavaFields(classBody)
    classes.push({ name: className, fields })
  }

  return classes
}

/**
 * 解析Golang结构体
 */
const parseGolangStruct = (entityCode: string): ClassInfo[] => {
  const classes: ClassInfo[] = []

  // 移除注释和多余空格
  const cleanCode = entityCode
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
    .replace(/\/\/.*$/gm, '') // 移除行注释
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()

  // 匹配所有结构体定义
  const structRegex = /type\s+(\w+)\s+struct\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g
  let structMatch

  while ((structMatch = structRegex.exec(cleanCode)) !== null) {
    const structName = structMatch[1]
    const structBody = structMatch[2]

    const fields = parseGolangFields(structBody)
    classes.push({ name: structName, fields })
  }

  return classes
}

/**
 * 解析Java类的字段
 */
const parseJavaFields = (classBody: string): FieldInfo[] => {
  const fields: FieldInfo[] = []

  // 匹配字段声明（支持private、protected、final、transient等修饰符）
  const fieldRegex =
    /(private|protected)(?:\s+final)?(?:\s+transient)?(?:\s+static)?\s+([A-Za-z0-9<>,\s\[\]]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*[^;]+)?\s*;/g
  let fieldMatch

  while ((fieldMatch = fieldRegex.exec(classBody)) !== null) {
    const rawType = fieldMatch[2].trim()
    const fieldName = fieldMatch[3]

    // 处理数组和集合类型
    const isArray = rawType.includes('List<') || rawType.includes('Set<') || rawType.includes('[]')

    const cleanType = rawType
      .replace(/List<([^>]+)>/g, '$1') // List<String> -> String
      .replace(/Set<([^>]+)>/g, '$1') // Set<String> -> String
      .replace(/\[\]/g, '') // String[] -> String
      .trim()

    const isCustomType = !isBasicJavaType(cleanType)

    fields.push({
      name: fieldName,
      type: cleanType,
      isArray,
      isCustomType,
    })
  }

  return fields
}

/**
 * 解析Golang结构体的字段
 */
const parseGolangFields = (structBody: string): FieldInfo[] => {
  const fields: FieldInfo[] = []

  // 匹配字段定义 FieldName Type `json:"field_name"` 或 `form:"field_name"`
  const fieldRegex = /(\w+)\s+([\w\[\]\*]+)(?:\s+`([^`]*)`)?/g
  let fieldMatch

  while ((fieldMatch = fieldRegex.exec(structBody)) !== null) {
    const originalFieldName = fieldMatch[1]
    const rawType = fieldMatch[2].trim()
    const tags = fieldMatch[3] || ''

    // 从标签中提取字段名，优先使用json标签，然后form标签，最后使用原字段名
    let fieldName = originalFieldName
    if (tags) {
      const jsonMatch = tags.match(/json:\s*"([^"]+)"/)
      const formMatch = tags.match(/form:\s*"([^"]+)"/)

      if (jsonMatch && jsonMatch[1] && jsonMatch[1] !== '-') {
        fieldName = jsonMatch[1]
      } else if (formMatch && formMatch[1] && formMatch[1] !== '-') {
        fieldName = formMatch[1]
      } else {
        // 将Go风格的字段名转为snake_case
        fieldName = originalFieldName
          .replace(/([A-Z])/g, '_$1')
          .toLowerCase()
          .replace(/^_/, '')
      }
    } else {
      // 没有标签时，将Go风格的字段名转为snake_case
      fieldName = originalFieldName
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '')
    }

    const isArray = rawType.includes('[]')
    const cleanType = rawType.replace(/\[\]/g, '').replace(/\*/g, '') // 移除数组和指针标记

    const isCustomType = !isBasicGolangType(cleanType)

    fields.push({
      name: fieldName,
      type: cleanType,
      isArray,
      isCustomType,
    })
  }

  return fields
}

/**
 * 判断是否为Java基本类型
 */
const isBasicJavaType = (type: string): boolean => {
  const basicTypes = [
    'String',
    'Integer',
    'int',
    'Long',
    'long',
    'Double',
    'double',
    'Float',
    'float',
    'Boolean',
    'boolean',
    'BigDecimal',
    'Date',
    'LocalDateTime',
    'LocalDate',
    'Object',
    // 新增集合类型
    'List',
    'Set',
    'Map',
    'Collection',
  ]
  return basicTypes.includes(type)
}

/**
 * 判断是否为Golang基本类型
 */
const isBasicGolangType = (type: string): boolean => {
  const basicTypes = [
    'string',
    'bool',
    'int',
    'int8',
    'int16',
    'int32',
    'int64',
    'uint',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'float32',
    'float64',
    'byte',
    'rune',
    'interface{}',
  ]
  return basicTypes.includes(type)
}

/**
 * 生成Java类型Mock值
 */
const generateJavaMockValue = (
  type: string,
  fieldName: string,
): string | number | boolean | object | null => {
  const lowerFieldName = fieldName.toLowerCase()

  switch (type) {
    case 'String':
      if (lowerFieldName.includes('name')) return 'Mock Name'
      if (lowerFieldName.includes('email')) return 'mock@example.com'
      if (lowerFieldName.includes('phone')) return '13800138000'
      if (lowerFieldName.includes('address')) return 'Mock Address'
      if (lowerFieldName.includes('id')) return 'mock-id-123'
      if (lowerFieldName.includes('code')) return 'MOCK001'
      if (lowerFieldName.includes('desc') || lowerFieldName.includes('description'))
        return 'Mock Description'
      if (lowerFieldName.includes('url')) return 'https://mock.example.com'
      return 'Mock String'

    case 'Integer':
    case 'int':
      if (lowerFieldName.includes('id')) return 1
      if (lowerFieldName.includes('age')) return 25
      if (lowerFieldName.includes('count') || lowerFieldName.includes('number')) return 10
      if (lowerFieldName.includes('page')) return 1
      if (lowerFieldName.includes('size') || lowerFieldName.includes('limit')) return 20
      return 100

    case 'Long':
    case 'long':
      if (lowerFieldName.includes('id')) return 1001
      if (lowerFieldName.includes('time') || lowerFieldName.includes('timestamp')) return Date.now()
      return 1000

    case 'Double':
    case 'double':
      if (lowerFieldName.includes('price') || lowerFieldName.includes('amount')) return 99.99
      if (lowerFieldName.includes('rate')) return 0.85
      return 123.45

    case 'Float':
    case 'float':
      if (lowerFieldName.includes('price') || lowerFieldName.includes('amount')) return 99.9
      return 123.4

    case 'Boolean':
    case 'boolean':
      if (lowerFieldName.includes('active') || lowerFieldName.includes('enable')) return true
      if (lowerFieldName.includes('delete') || lowerFieldName.includes('disable')) return false
      return true

    case 'BigDecimal':
      return 999.99

    case 'Date':
    case 'LocalDateTime':
      return new Date().toISOString()

    case 'LocalDate':
      return new Date().toISOString().split('T')[0]

    case 'Set':
    case 'List':
    case 'Collection':
      // 集合类型返回空数组
      return []

    case 'Map':
      // Map类型返回空对象
      return {}

    default:
      return null
  }
}

/**
 * 生成Golang类型Mock值
 */
const generateGolangMockValue = (
  type: string,
  fieldName: string,
): string | number | boolean | null => {
  const lowerFieldName = fieldName.toLowerCase()

  switch (type) {
    case 'string':
      if (lowerFieldName.includes('name')) return 'Mock Name'
      if (lowerFieldName.includes('email')) return 'mock@example.com'
      if (lowerFieldName.includes('phone')) return '13800138000'
      if (lowerFieldName.includes('address')) return 'Mock Address'
      if (lowerFieldName.includes('id')) return 'mock-id-123'
      if (lowerFieldName.includes('code')) return 'MOCK001'
      if (lowerFieldName.includes('desc') || lowerFieldName.includes('description'))
        return 'Mock Description'
      if (lowerFieldName.includes('url')) return 'https://mock.example.com'
      return 'Mock String'

    case 'int':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'int64':
    case 'uint':
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'uint64':
      if (lowerFieldName.includes('id')) return 1
      if (lowerFieldName.includes('age')) return 25
      if (lowerFieldName.includes('count') || lowerFieldName.includes('number')) return 10
      if (lowerFieldName.includes('page')) return 1
      if (lowerFieldName.includes('size') || lowerFieldName.includes('limit')) return 20
      return 100

    case 'float32':
    case 'float64':
      if (lowerFieldName.includes('price') || lowerFieldName.includes('amount')) return 99.99
      if (lowerFieldName.includes('rate')) return 0.85
      return 123.45

    case 'bool':
      if (lowerFieldName.includes('active') || lowerFieldName.includes('enable')) return true
      if (lowerFieldName.includes('delete') || lowerFieldName.includes('disable')) return false
      return true

    case 'byte':
    case 'rune':
      return 65 // ASCII 'A'

    default:
      return null
  }
}

/**
 * 生成Mock值（根据语言分发）
 */
const generateMockValue = (
  type: string,
  fieldName: string,
  language: LanguageType = 'java',
): string | number | boolean | object | null => {
  switch (language) {
    case 'java':
      return generateJavaMockValue(type, fieldName)
    case 'golang':
      return generateGolangMockValue(type, fieldName)
    default:
      return null
  }
}

/**
 * 生成JSON Body格式的Mock数据（Java）
 */
export const generateJsonBodyMock = (entityCode: string): string => {
  return generateJsonBodyMockWithLanguage(entityCode, 'java')
}

/**
 * 生成JSON Body格式的Mock数据（支持多语言）
 */
export const generateJsonBodyMockWithLanguage = (
  entityCode: string,
  language: LanguageType,
): string => {
  try {
    let classes: ClassInfo[] = []

    switch (language) {
      case 'java':
        classes = parseJavaEntity(entityCode)
        if (classes.length === 0) {
          throw new Error('未找到有效的Java类定义')
        }
        break
      case 'golang':
        classes = parseGolangStruct(entityCode)
        if (classes.length === 0) {
          throw new Error('未找到有效的Golang结构体定义')
        }
        break
      default:
        throw new Error('不支持的语言类型')
    }

    // 使用第一个类作为主类
    const mainClass = classes[0]
    const mockData = generateClassMockData(mainClass, classes, language)

    return JSON.stringify(mockData, null, 2)
  } catch (error) {
    throw new Error(`解析${language}实体类失败: ` + (error as Error).message)
  }
}

/**
 * 生成Form格式的Mock数据（Java）
 */
export const generateFormMock = (entityCode: string): string => {
  return generateFormMockWithLanguage(entityCode, 'java')
}

/**
 * 生成Form格式的Mock数据（支持多语言）
 */
export const generateFormMockWithLanguage = (
  entityCode: string,
  language: LanguageType,
): string => {
  try {
    let classes: ClassInfo[] = []

    switch (language) {
      case 'java':
        classes = parseJavaEntity(entityCode)
        if (classes.length === 0) {
          throw new Error('未找到有效的Java类定义')
        }
        break
      case 'golang':
        classes = parseGolangStruct(entityCode)
        if (classes.length === 0) {
          throw new Error('未找到有效的Golang结构体定义')
        }
        break
      default:
        throw new Error('不支持的语言类型')
    }

    const mainClass = classes[0]
    const formData: string[] = []

    // 只处理非嵌套的字段
    for (const field of mainClass.fields) {
      if (!field.isCustomType) {
        const mockValue = generateMockValue(field.type, field.name, language)
        if (mockValue !== null) {
          if (field.isArray) {
            // 数组类型在Form中使用多个同名字段
            formData.push(`${field.name}=${mockValue}`)
            formData.push(`${field.name}=${mockValue}`)
          } else {
            formData.push(`${field.name}=${mockValue}`)
          }
        }
      }
    }

    return formData.join('\n')
  } catch (error) {
    throw new Error(`解析${language}实体类失败: ` + (error as Error).message)
  }
}

/**
 * 生成类的Mock数据对象
 */
const generateClassMockData = (
  classInfo: ClassInfo,
  allClasses: ClassInfo[],
  language: LanguageType = 'java',
): Record<string, unknown> => {
  const mockData: Record<string, unknown> = {}

  for (const field of classInfo.fields) {
    if (field.isCustomType) {
      // 自定义类型
      const customClass = allClasses.find((c) => c.name === field.type)
      if (customClass) {
        // 如果找到了自定义类的定义，递归生成
        if (field.isArray) {
          mockData[field.name] = [generateClassMockData(customClass, allClasses, language)]
        } else {
          mockData[field.name] = generateClassMockData(customClass, allClasses, language)
        }
      } else {
        // 没有找到自定义类定义，使用空对象
        if (field.isArray) {
          mockData[field.name] = [{}]
        } else {
          mockData[field.name] = {}
        }
      }
    } else {
      // 基本类型
      const mockValue = generateMockValue(field.type, field.name, language)
      if (mockValue !== null) {
        if (field.isArray) {
          mockData[field.name] = [mockValue, mockValue]
        } else {
          mockData[field.name] = mockValue
        }
      }
    }
  }

  return mockData
}

/**
 * 检测是否包含嵌套对象（Java）
 */
export const hasNestedObjects = (entityCode: string): boolean => {
  return hasNestedObjectsWithLanguage(entityCode, 'java')
}

/**
 * 检测是否包含嵌套对象（支持多语言）
 */
export const hasNestedObjectsWithLanguage = (
  entityCode: string,
  language: LanguageType,
): boolean => {
  try {
    let classes: ClassInfo[] = []

    switch (language) {
      case 'java':
        classes = parseJavaEntity(entityCode)
        break
      case 'golang':
        classes = parseGolangStruct(entityCode)
        break
      default:
        return false
    }

    if (classes.length === 0) return false

    const mainClass = classes[0]
    return mainClass.fields.some((field) => field.isCustomType)
  } catch {
    return false
  }
}
