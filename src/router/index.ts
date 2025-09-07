import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { title: '首页 - 开发者工具集' },
    },
    {
      path: '/json-formatter',
      name: 'json-formatter',
      component: () => import('../views/json/JsonFormatter.vue'),
      meta: { title: 'JSON格式化 - 开发者工具集' },
    },
    {
      path: '/json-to-entity',
      name: 'json-to-entity',
      component: () => import('../views/json/JsonToEntity.vue'),
      meta: { title: 'JSON转实体类 - 开发者工具集' },
    },
    {
      path: '/yaml',
      name: 'yaml',
      component: () => import('../views/yaml/YamlTools.vue'),
      meta: { title: 'YAML工具 - 开发者工具集' },
    },
    {
      path: '/url-encoder',
      name: 'url-encoder',
      component: () => import('../views/encode/UrlEncoder.vue'),
      meta: { title: 'URL编解码 - 开发者工具集' },
    },
    {
      path: '/base64-encoder',
      name: 'base64-encoder',
      component: () => import('../views/encode/Base64Encoder.vue'),
      meta: { title: 'Base64编解码 - 开发者工具集' },
    },
    {
      path: '/base64-file-converter',
      name: 'base64-file-converter',
      component: () => import('../views/encode/Base64FileConverter.vue'),
      meta: { title: 'Base64文件转换 - 开发者工具集' },
    },
    {
      path: '/regex',
      name: 'regex',
      component: () => import('../views/regex/RegexTools.vue'),
      meta: { title: '正则表达式测试 - 开发者工具集' },
    },
    {
      path: '/jwt-decoder',
      name: 'jwt-decoder',
      component: () => import('../views/jwt/JwtDecoder.vue'),
      meta: { title: 'JWT解析工具 - 开发者工具集' },
    },
    {
      path: '/md5-hasher',
      name: 'md5-hasher',
      component: () => import('../views/crypto/MD5Tool.vue'),
      meta: { title: 'MD5哈希工具 - 开发者工具集' },
    },
    {
      path: '/sha-hasher',
      name: 'sha-hasher',
      component: () => import('../views/crypto/SHAHasher.vue'),
      meta: { title: 'SHA哈希工具 - 开发者工具集' },
    },
    {
      path: '/aes-crypto',
      name: 'aes-crypto',
      component: () => import('../views/crypto/AESCrypto.vue'),
      meta: { title: 'AES加解密工具 - 开发者工具集' },
    },
    {
      path: '/rsa-crypto',
      name: 'rsa-crypto',
      component: () => import('../views/crypto/RSACrypto.vue'),
      meta: { title: 'RSA加解密工具 - 开发者工具集' },
    },
    {
      path: '/qrcode-tool',
      name: 'qrcode-tool',
      component: () => import('../views/qrcode/QRCodeTool.vue'),
      meta: { title: '二维码工具 - 开发者工具集' },
    },
  ],
})

// 路由守卫 - 动态更新页面标题
router.beforeEach((to, from, next) => {
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  } else {
    document.title = '开发者工具集 - 在线开发工具平台'
  }
  next()
})

export default router
