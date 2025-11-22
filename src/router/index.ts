import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import CallbackView from '../views/CallbackView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackView,
    },
  ],
})

export default router
