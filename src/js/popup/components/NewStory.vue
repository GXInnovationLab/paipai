<template>
  <md-app class='home normal-size' md-waterfall md-mode="fixed">
    <md-app-toolbar class='md-primary md-elevation-4 md-toolbar--header'>
      <div class="story-name">
        <input
          type="text"
          name="name"
          class="story-name__input"
          v-model="storyName"
          maxlength='36'
          ref="storyNameInput"
        >
      </div>
      <div class="header__button-group">
        <md-button class='md-icon-button md-primary md-icon-button--common' v-on:click='addNewStory'>
          <i class="iconfont icon-add"></i>
        </md-button>
        <router-link
          class='create-new-story'
          :to='{ path: `/display/${this.$route.params.id}` }'
          title='Create New Story'
        >
          <md-button class='md-icon-button md-primary md-icon-button--common'>
            <i class="iconfont icon-edit"></i>
          </md-button>
        </router-link>
        <router-link
          class='create-new-story'
          to='/home'
          title='Create New Story'
        >
          <md-button class='md-icon-button md-primary md-icon-button--common'>
            <i class="iconfont icon-filelist"></i>
          </md-button>
        </router-link>
      </div>
    </md-app-toolbar>
    <md-app-content class='home-content'>
      <!-- <center class='counter-container'>
          <time>{{ counterFormat(counter) }}</time>
      </center> -->

      <section class='et_image-list'>
        <div
          class='et_image-list-item'
          v-for='(item, index) in $store.state.storyDetails.order'
          v-bind:item='item'
        >
          <img v-bind:src="getImgSrc(item)" :ref='`image-${item}`'/>
          <p>
            {{`${index + 1} in ${$store.state.storyDetails.order.length}`}}
          </p>
        </div>
      </section>
      <center class='trigger-button'>
        <md-button class='md-fab' v-on:click='onRecord'>
          <i class="iconfont icon-camera" v-if='!$store.state.storyDetails.isRecording'></i>
          <i class="iconfont icon-pause" v-else></i>
        </md-button>
      </center>
    </md-app-content>
  </md-app>
</template>

<script>

import Head from 'Components/common/Head';
import BackgroundProtocol from 'BackgroundProtocol';
import api from 'Popup/backgroundApi';
import { counterFormat } from 'Utils';

export default {
  name: 'NewStory',
  data() {
    return this.initializeData();
  },

  computed: {
    storyDetails() {
      return this.$store.state.storyDetails
    },

    getImgSrc() {
      const { images } = this.$store.state.storyDetails;
      return item => {
        return `filesystem:${window.location.origin}/persistent/${this.$route.params.id}/${images[item].fileName}`;
      }
    },

    getStoryId() {
      return this.$route.params.id;
    },

    storyName: {
      get () {
        return this.$store.state.storyDetails.story.name
      },

      set (value) {
        console.log(value);
        this.$store.commit('storyDetails/changeStoryName', { value });
        api.command(BackgroundProtocol.CHANGE_STORY_NAME);
      }
    }
  },

  watch: {
    getStoryId() {
      this.get();
    }
  },

  methods: {
    initializeData() {
      return {
        name: '',
        counter: 0,
        countingInverval: undefined,
        /**
         * 这个变量在popup中没有用途，是为了方便background存储数据
         * @type {Number}
         */
        storyId: undefined
      }
    },

    stopRecord() {
      /**
       * 停止录制
       */
      this.$store.commit('storyDetails/stopRecording');
      api.command(BackgroundProtocol.STOP_RECORD);
    },

    startRecord() {
      /**
       * 开始录制
       */
      this.$store.commit('storyDetails/startRecording');


      api.command(BackgroundProtocol.ON_RECORD, this);
    },

    onRecord() {
      if (this.$store.state.storyDetails.isRecording) {
        this.stopRecord();
      } else {
        this.startRecord();
        // chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
        //   console.log(msg.command);
        // });
      }
    },

    addNewStory: async function() {
      this.remove();
      const newStoryId = await api.command(BackgroundProtocol.ADD_NEW_STORY);
      this.$router.push(`/new/${newStoryId}`);
    },

    remove() {
      this.$store.commit('storyDetails/remove');
    },

    get() {
      // console.log('this.storyDetails', this.storyDetails)
      this.$store.dispatch('storyDetails/getAll', {storyId: this.$route.params.id});
    },

    counterFormat(distance) {
      return counterFormat(distance);
    }

  },

  async mounted() {
    this.$refs.storyNameInput.focus();
    this.get();
    this.startRecord();
    /**
     * 后台会自动将this的各种属性替换掉
     */
    // const backgroundStatus = await api.command('SYNC_RECORDING_STATUS', this);

    /**
     * 非录制状态下backgroundStatus的返回值为false
     */
    // if ( backgroundStatus && this.isRecording ) {
    //   this.counter = this.getTimeDistance();
    // }
  },

  destroyed() {
    this.remove();
    this.stopRecord();
  },

  components: {
    'popup-header': Head
  }
}
</script>

<style scoped>
  .counter-container {
    height: 40px;
    line-height: 40px;
    background: #7b7b7b;
  }

  .counter-container time {
    font-size: 20px;
    color: #fff
  }

  .trigger-button {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }

  .trigger-button a {
    display: block;
    text-decoration: none;
    width: 80px;
    height: 80px;
    line-height: 80px;
    border-radius: 50%;
    background: #0066cc;
    opacity: 0.7;
  }

  .trigger-button a:hover {
    opacity: 1;
  }

  .trigger-button a:active {
    box-shadow: inset 0 5px 5px #4f4c6c;
  }

  .trigger-button i {
    color: #fff;
    font-size: 27px;
  }

  .story-name {
    flex: 1 1 auto;
    height: 40px;
  }

  .story-name__input {
    width: 100%;
    height: 100%;
    font-size: 18px;
    background: #00000000;
    color: #fff;
    border: none;
    padding-left: 10px;
  }

</style>
