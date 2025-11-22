import { createRouter, createWebHistory } from 'vue-router'
import CallbackView from '../views/CallbackView.vue'
import Home from '../views/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackView,
    },
  ],
})

export default router
