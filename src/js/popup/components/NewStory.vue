<template>
  <div class="new-story normal-size">
    <popup-header
      back-route='/'
      back-page-name='Home'
      page-title='New Story'
    ></popup-header>
    <center class='counter-container'>
        <time>{{ counterFormat(counter) }}</time>
    </center>
    <center class='trigger-button'>
      <a href="javascript: void(0)" v-on:click='onRecord'>
        <v-icon name='record' v-if='isRecording === false' />
        <v-icon name='stop' v-else style="font-size: 33px" />
      </a>
    </center>
    <center class='story-name'>
      <input v-model='name' placeholder="Story Name" v-if='isRecording === false'/>
      <span v-if='isRecording === true'>Story {{name}} is being recorded</span>
    </center>

  </div>
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
  methods: {

    initializeData() {
      return {
        name: '',
        counter: 0,
        startTimestamp: 0,
        isRecording: false,
        countingInverval: undefined,
        /**
         * 这个变量在popup中没有用途，是为了方便background存储数据
         * @type {Number}
         */
        storyId: undefined
      }
    },

    onRecord() {
      if (this.isRecording === true) {
        /**
         * 停止录制
         */
        this.isRecording = false;
        clearInterval(this.countingInverval);

        const initData = this.initializeData();
        Object.keys(initData).forEach( key => {
          this[key] = initData[key];
        });
        this.counter = 0;

        api.command(BackgroundProtocol.STOP_RECORD);
      } else {
        /**
         * 开始录制
         */
        this.isRecording = true;
        this.startTimestamp = (new Date).getTime();

        api.command(BackgroundProtocol.ON_RECORD, this);
        this.startCounting();
      }
    },

    startCounting() {
      this.countingInverval = window.setInterval(() => {
        const distance = this.getTimeDistance();
        this.counter = distance;
      }, 500)
    },

    getTimeDistance() {
        return (new Date).getTime() - this.startTimestamp;
    },

    counterFormat(distance) {
      return counterFormat(distance);
    }

  },
  mounted: async function() {
    /**
     * 后台会自动将this的各种属性替换掉
     */
    const backgroundStatus = await api.command('SYNC_RECORDING_STATUS', this);

    /**
     * 非录制状态下backgroundStatus的返回值为false
     */
    if ( backgroundStatus && this.isRecording ) {
      this.counter = this.getTimeDistance();
      this.startCounting();
    }
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
    top: 46%;
    left: 50%;
    transform: translate(-50%, -50%);
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
    font-size: 30px;
  }

  .story-name {
    position: absolute;
    /*bottom: 55px;*/
    bottom: 280px;
    width: 100%;
  }

  .story-name * {
    font-size: 17px;
  }

  .story-name span {
    color: #777
  }

  .story-name input {
    border: none;
    padding: 5px 10px;
    border-bottom: 2px solid #aaa;
    text-align: center
  }

</style>
