import Vue from 'vue'
import VueRouter from 'vue-router'
import PCAN from './../views/Pcan.vue'
import HOME from './../views/Home.vue'
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HOME
  },
  {
    path: '/uds/pcan',
    name: 'pcan',
    component: PCAN
  },
]

const router = new VueRouter({
  routes
})

export default router
