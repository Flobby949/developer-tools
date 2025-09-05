import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/json-formatter',
    },
    {
      path: '/json-formatter',
      name: 'json-formatter',
      component: () => import('../views/json/JsonFormatter.vue'),
      meta: { title: 'JSON格式化' },
    },
    {
      path: '/json-to-entity',
      name: 'json-to-entity',
      component: () => import('../views/json/JsonToEntity.vue'),
      meta: { title: 'JSON转实体类' },
    },
    {
      path: '/yaml',
      name: 'yaml',
      component: () => import('../views/yaml/YamlTools.vue'),
      meta: { title: 'YAML工具' },
    },
    {
      path: '/url-encoder',
      name: 'url-encoder',
      component: () => import('../views/encode/UrlEncoder.vue'),
      meta: { title: 'URL编解码' },
    },
    {
      path: '/base64-encoder',
      name: 'base64-encoder',
      component: () => import('../views/encode/Base64Encoder.vue'),
      meta: { title: 'Base64编解码' },
    },
    {
      path: '/regex',
      name: 'regex',
      component: () => import('../views/regex/RegexTools.vue'),
      meta: { title: '正则表达式' },
    },
  ],
})

export default router
