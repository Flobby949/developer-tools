"use strict";
// 实体类转Mock数据工具
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasNestedObjects = exports.generateFormMock = exports.generateJsonBodyMock = void 0;
/**
 * 解析Java实体类
 */
const parseJavaEntity = (entityCode) => {
    const classes = [];
    // 移除注释和多余空格
    const cleanCode = entityCode
        .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
        .replace(/\/\/.*$/gm, '') // 移除行注释
        .replace(/\s+/g, ' ') // 合并多个空格
        .trim();
    // 匹配所有类定义
    const classRegex = /public\s+class\s+(\w+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let classMatch;
    while ((classMatch = classRegex.exec(cleanCode)) !== null) {
        const className = classMatch[1];
        const classBody = classMatch[2];
        const fields = parseJavaFields(classBody);
        classes.push({ name: className, fields });
    }
    return classes;
};
/**
 * 解析Java类的字段
 */
const parseJavaFields = (classBody) => {
    const fields = [];
    // 匹配private字段声明
    const fieldRegex = /private\s+([A-Za-z0-9<>,\s]+)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(classBody)) !== null) {
        const rawType = fieldMatch[1].trim();
        const fieldName = fieldMatch[2];
        const isArray = rawType.includes('List<') || rawType.includes('[]');
        const cleanType = rawType
            .replace(/List<([^>]+)>/g, '$1') // List<String> -> String
            .replace(/\[\]/g, '') // String[] -> String
            .trim();
        const isCustomType = !isBasicJavaType(cleanType);
        fields.push({
            name: fieldName,
            type: cleanType,
            isArray,
            isCustomType,
        });
    }
    return fields;
};
/**
 * 判断是否为Java基本类型
 */
const isBasicJavaType = (type) => {
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
    ];
    return basicTypes.includes(type);
};
/**
 * 生成Java类型的Mock值
 */
const generateMockValue = (type, fieldName) => {
    const lowerFieldName = fieldName.toLowerCase();
    switch (type) {
        case 'String':
            if (lowerFieldName.includes('name'))
                return 'Mock Name';
            if (lowerFieldName.includes('email'))
                return 'mock@example.com';
            if (lowerFieldName.includes('phone'))
                return '13800138000';
            if (lowerFieldName.includes('address'))
                return 'Mock Address';
            if (lowerFieldName.includes('id'))
                return 'mock-id-123';
            if (lowerFieldName.includes('code'))
                return 'MOCK001';
            if (lowerFieldName.includes('desc') || lowerFieldName.includes('description'))
                return 'Mock Description';
            if (lowerFieldName.includes('url'))
                return 'https://mock.example.com';
            return 'Mock String';
        case 'Integer':
        case 'int':
            if (lowerFieldName.includes('id'))
                return 1;
            if (lowerFieldName.includes('age'))
                return 25;
            if (lowerFieldName.includes('count') || lowerFieldName.includes('number'))
                return 10;
            if (lowerFieldName.includes('page'))
                return 1;
            if (lowerFieldName.includes('size') || lowerFieldName.includes('limit'))
                return 20;
            return 100;
        case 'Long':
        case 'long':
            if (lowerFieldName.includes('id'))
                return 1001;
            if (lowerFieldName.includes('time') || lowerFieldName.includes('timestamp'))
                return Date.now();
            return 1000;
        case 'Double':
        case 'double':
            if (lowerFieldName.includes('price') || lowerFieldName.includes('amount'))
                return 99.99;
            if (lowerFieldName.includes('rate'))
                return 0.85;
            return 123.45;
        case 'Float':
        case 'float':
            if (lowerFieldName.includes('price') || lowerFieldName.includes('amount'))
                return 99.9;
            return 123.4;
        case 'Boolean':
        case 'boolean':
            if (lowerFieldName.includes('active') || lowerFieldName.includes('enable'))
                return true;
            if (lowerFieldName.includes('delete') || lowerFieldName.includes('disable'))
                return false;
            return true;
        case 'BigDecimal':
            return 999.99;
        case 'Date':
        case 'LocalDateTime':
            return new Date().toISOString();
        case 'LocalDate':
            return new Date().toISOString().split('T')[0];
        default:
            return null;
    }
};
/**
 * 生成JSON Body格式的Mock数据
 */
const generateJsonBodyMock = (entityCode) => {
    try {
        const classes = parseJavaEntity(entityCode);
        if (classes.length === 0) {
            throw new Error('未找到有效的Java类定义');
        }
        // 使用第一个类作为主类
        const mainClass = classes[0];
        const mockData = generateClassMockData(mainClass, classes);
        return JSON.stringify(mockData, null, 2);
    }
    catch (error) {
        throw new Error('解析Java实体类失败: ' + error.message);
    }
};
exports.generateJsonBodyMock = generateJsonBodyMock;
/**
 * 生成Form格式的Mock数据
 */
const generateFormMock = (entityCode) => {
    try {
        const classes = parseJavaEntity(entityCode);
        if (classes.length === 0) {
            throw new Error('未找到有效的Java类定义');
        }
        const mainClass = classes[0];
        const formData = [];
        // 只处理非嵌套的字段
        for (const field of mainClass.fields) {
            if (!field.isCustomType) {
                const mockValue = generateMockValue(field.type, field.name);
                if (mockValue !== null) {
                    if (field.isArray) {
                        // 数组类型在Form中使用多个同名字段
                        formData.push(`${field.name}=${mockValue}`);
                        formData.push(`${field.name}=${mockValue}`);
                    }
                    else {
                        formData.push(`${field.name}=${mockValue}`);
                    }
                }
            }
        }
        return formData.join('\n');
    }
    catch (error) {
        throw new Error('解析Java实体类失败: ' + error.message);
    }
};
exports.generateFormMock = generateFormMock;
/**
 * 生成类的Mock数据对象
 */
const generateClassMockData = (classInfo, allClasses) => {
    const mockData = {};
    for (const field of classInfo.fields) {
        if (field.isCustomType) {
            // 自定义类型
            const customClass = allClasses.find((c) => c.name === field.type);
            if (customClass) {
                // 如果找到了自定义类的定义，递归生成
                if (field.isArray) {
                    mockData[field.name] = [generateClassMockData(customClass, allClasses)];
                }
                else {
                    mockData[field.name] = generateClassMockData(customClass, allClasses);
                }
            }
            else {
                // 没有找到自定义类定义，使用空对象
                if (field.isArray) {
                    mockData[field.name] = [{}];
                }
                else {
                    mockData[field.name] = {};
                }
            }
        }
        else {
            // 基本类型
            const mockValue = generateMockValue(field.type, field.name);
            if (mockValue !== null) {
                if (field.isArray) {
                    mockData[field.name] = [mockValue, mockValue];
                }
                else {
                    mockData[field.name] = mockValue;
                }
            }
        }
    }
    return mockData;
};
/**
 * 检测是否包含嵌套对象
 */
const hasNestedObjects = (entityCode) => {
    try {
        const classes = parseJavaEntity(entityCode);
        if (classes.length === 0)
            return false;
        const mainClass = classes[0];
        return mainClass.fields.some((field) => field.isCustomType);
    }
    catch {
        return false;
    }
};
exports.hasNestedObjects = hasNestedObjects;
