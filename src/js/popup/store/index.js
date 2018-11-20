import Vue from 'vue';
import Vuex from 'vuex';
import storyDetails from './modules/storyDetails';

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
  modules: {
    storyDetails
  },
  mutations: {
    replaceState(state, {newState}) {
      const keys = Object.keys(newState);
      keys.forEach( key => {
        state[key] = newState[key];
      })
    }
  },
  strict: debug,
  // plugins: debug ? [createLogger()] : []
})