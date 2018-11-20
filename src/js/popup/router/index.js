import Vue from 'vue';
import Router from 'vue-router';
import Home from 'Components/Home';
import NewStory from 'Components/NewStory';
import Display from 'Components/Display';
Vue.use(Router);

export const paths = {
  newStory: '/new/:id'
}

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/home',
      name: 'Home',
      component: Home
    },
    {
      path: paths.newStory,
      name: 'New Story',
      component: NewStory
    },
    {
      path: '/display/:id',
      name: 'Display',
      component: Display
    }
  ]
});
