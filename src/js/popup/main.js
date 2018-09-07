// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueIconfont from 'vue-iconfont';
import App from './App';
import router from './router';
import loadIconfont from 'Middlewares/iconfont';
import './common.css';
Vue.config.productionTip = false;

loadIconfont(Vue);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
