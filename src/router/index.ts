import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/json',
    },
    {
      path: '/json',
      name: 'json',
      component: () => import('../views/json/JsonTools.vue'),
      meta: { title: 'JSON工具' },
    },
    {
      path: '/yaml',
      name: 'yaml',
      component: () => import('../views/yaml/YamlTools.vue'),
      meta: { title: 'YAML工具' },
    },
    {
      path: '/encode',
      name: 'encode',
      component: () => import('../views/encode/EncodeTools.vue'),
      meta: { title: '编码转换' },
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
