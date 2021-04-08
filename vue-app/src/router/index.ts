import Vue from 'vue'
import VueRouter from 'vue-router'

import Landing from '../views/Landing.vue'
import JoinLanding from '../views/JoinLanding.vue'
import ProjectList from '../views/ProjectList.vue'
import ProjectView from '../views/Project.vue'
import RoundList from '../views/RoundList.vue'
import ProjectAdded from '../views/ProjectAdded.vue'
import RoundInformation from '../views/RoundInformation.vue'
import About from '../views/About.vue'
import ApplyVue from '../views/Apply.vue'
import RecipientRegistryView from '@/views/RecipientRegistry.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'landing',
    component: Landing,
  },
  {
    path: '/projects',
    name: 'projects',
    component: ProjectList,
  },
  {
    path: '/project/:id',
    name: 'project',
    component: ProjectView,
  },

  {
    path: '/round-informationm',
    name: 'round information',
    component: RoundInformation,
  },
  {
    path: '/rounds',
    name: 'rounds',
    component: RoundList,
  },
  {
    path: '/round/:address',
    name: 'round',
    component: ProjectList,
  },
  {
    path: '/about',
    name: 'about',
    component: About,
  },
  {
    path: '/apply/:step',
    name: 'apply',
    component: ApplyVue,
  },
  {
    path: '/project-added',
    name: 'project added',
    component: ProjectAdded,
  },
  {
    path: '/recipients',
    name: 'recipients',
    component: RecipientRegistryView,
  },
  {
    path: '/join',
    name: 'join',
    component: JoinLanding,
  },
]

const router = new VueRouter({
  base: window.location.pathname,
  routes,
})

export default router
