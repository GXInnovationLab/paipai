import VueIconfont from 'vue-iconfont';

export default Vue => {
  Vue.use(VueIconfont, [
    {
      tag: 'v-icon',
      prefix: 'v-icon',
      type: 'font'
    }
  ]);
}
