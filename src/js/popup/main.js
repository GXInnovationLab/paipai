// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
// import { MdApp, MdList } from 'vue-material/dist/components'
import VueMaterial from 'vue-material'
import VueIconfont from 'vue-iconfont';

import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

import api from 'Popup/backgroundApi';
import BackgroundProtocol from 'BackgroundProtocol';
import App from './App';
import newStore from './store';
import router from './router';
import loadIconfont from 'Middlewares/iconfont';
import './common.scss';

(async () => {
  loadIconfont(Vue);
  Vue.use(VueMaterial);
  Vue.config.productionTip = false;
  router.afterEach((to) => {
    api.command(BackgroundProtocol.POPUP_HASH_CHANGED, {hash: to.fullPath});
  });

  // const store = await resurrectStore(newStore);
  resurrectStore(newStore);
  window.s = newStore;
  /* eslint-disable no-new */
  new Vue({
    el: '#app',
    router,
    store: newStore,
    components: { App },
    template: '<App/>'
  });

  // sessionStorage.setItem('previousState', newStore)

  async function resurrectStore(newStore) {
    const previousState = await api.command(BackgroundProtocol.GET_PREVIOUS_STATE);

    if (previousState !== undefined) {
      const { store, url } = previousState;
      // const { url } = previousState;
      console.log('previous store.state', store.state);
      newStore.commit('replaceState', {newState: store.state});
      window.location.hash = url;
      // return previousState.store;
      // return store;
    }

    api.command(BackgroundProtocol.POPUP_MOUNTED, {
      store: newStore,
      hash: window.location.hash
    });


    // return newStore
  }
})();
