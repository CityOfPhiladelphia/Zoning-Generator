import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue';


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: App,
    },
    {
      path: '/:address',
      name: 'address',
      component: App,
    },
  ]
})

router.afterEach((to, from) => {
  console.log('router.afterEach to:', to, 'from:', from);
  
})

export default router
