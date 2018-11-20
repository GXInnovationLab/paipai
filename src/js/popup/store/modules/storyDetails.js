// import shop from '../../api/shop'
import api from 'Popup/backgroundApi';
import BackgroundProtocol from 'BackgroundProtocol';

// initial state
const state = {
  story: {},
  order: [],
  images: {},
  // Is on record or not
  isRecording: false
}

// getters
const getters = {};

// actions
const actions = {
  getAll: async ({ commit }, payload) => {
    const storyId = parseInt(payload.storyId);
    const data = await api.command(BackgroundProtocol.GET_STORY_AND_ITS_IMAGES, storyId);
    const { story, images } = data;
    const imageObj = {};
    images.forEach( item => {
      imageObj[item.id] = {
        fileName: item.name,
        pageUrl: item.url
      };
    });
    const initData = {
      story,
      order: story.order,
      images: imageObj
    };
    commit('init', initData);
  }
}

// mutations
const mutations = {
  startRecording (state) {
    state.isRecording = true;
    api.command(BackgroundProtocol.ON_RECORD);
  },

  stopRecording (state) {
    state.isRecording = false;
  },

  init (state, initData) {
    const { story, order, images } = initData;
    state.story = story;
    state.order = order;
    state.images = images;
  },

  remove (state) {
    state.story = {};
    state.order = [];
    state.images = {};
    state.isRecording = false;
  },

  selectImage (state, {index}) {
    state.images[index].selected = !state.images[index].selected;
  },

  changeStoryName(state, { value }) {
    console.log(value)
    state.story.name = value;
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}