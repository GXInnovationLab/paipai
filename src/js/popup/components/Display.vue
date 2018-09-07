<template>
  <div class='et_display-container'>
    <popup-header
      back-route='/'
      back-page-name='Home'
      page-title='Display'
    ></popup-header>
    <section class='et_event-displaying-cover'>
      <div
        class='et_click-event-display-item'
        v-for='(item, index) in clickEvents'
        v-bind:item='item'

        v-if='showClickTrack(item, index)'
        v-bind:style='getClickTrackStyle(item)'
      >

      </div>
    </section>
    <article>
      <header>
        Story {{story.name}} on {{getApproximateTime(story.time)}}
      </header>
      <section>
        <ul class='et_click-event-list'>
          <a
            href='javascript: void(0)'
            v-for='(item, index) in clickEvents'
            v-bind:item='item'

            v-bind:class='getClickListItemClass(item, index)'
            v-on:click='switchClickItem(item, index)'
          >
            <span>{{getTimeMinuteSecond(item.time)}}</span>
          </a>
          <center class='negative-notice' v-if='clickEvents.length === 0'>
            This story has no event
          </center>
        </ul>
        <div class='et_control'>
          <div class='et_progress-bar'>
            <div
              class='et_progress-slider'
              href='javascript: void(0)'
              v-bind:style='{ left: getProcessSliderLeft() + "px" }'
            ></div>
          </div>
          <div class='et_control-panel-container'>
            <div class='et_control-panel'>
              <div class='et_time-panel'>
                {{ generateTimePanel() }}
              </div>
              <div class='et_control-buttons' v-if='mode === `REVIEW`'>
                <a
                  v-bind:class='{
                    "et_control-button-disable": skipBackwardDisallowed()
                  }'
                  href='javascript: void(0)'
                  v-on:click='skipBackward'
                >
                  <v-icon name='skipbackward' />
                </a>
                <a href='javascript: void(0)' v-on:click='pause' v-if="typeof this.process === 'number'">
                  <v-icon name='pause' />
                </a>
                <a href='javascript: void(0)' v-on:click='play' v-else>
                  <v-icon name='play' />
                </a>
                <a
                  v-bind:class='{
                    "et_control-button-disable": skipForwardDisallowed()
                  }'
                  href='javascript: void(0)'
                  v-on:click='skipForward'
                >
                  <v-icon name='skipforward' />
                </a>
                <a href='javascript: void(0)' v-on:click='skipToTheEnd'>
                  <v-icon name='stop' />
                </a>
              </div>
              <div class="et_control-buttons" v-if='mode === `DEMO`'>
                <a
                  href='javascript: void(0)'
                  v-on:click='pageUp'
                >
                  <v-icon name='pageUp' />
                </a>
                <a
                  href='javascript: void(0)'
                  v-on:click='pageDown'
                >
                  <v-icon name='pageDown' />
                </a>
                <a
                  v-bind:class='{
                    "et_control-button-disable": skipForwardDisallowedInDemo()
                  }'
                  href='javascript: void(0)'
                  v-on:click='skipforwardInDemo'
                >
                  <v-icon name='skipforward' />
                </a>
                <a
                  v-bind:class='{
                    "et_control-button-disable": skipForwardDisallowedInDemo()
                  }'
                  href='javascript: void(0)'
                  v-on:click='pause'
                >
                  <v-icon name='pause' />
                </a>
                <a
                  href='javascript: void(0)'
                  v-on:click='replay'
                >
                  <v-icon name='replay' />
                </a>
              </div>
              <center class='mode-switches'>
                <button
                  v-bind:class='{
                    "active-mode-switch": mode === "REVIEW"
                  }'
                  v-on:click='switchMode(`REVIEW`)'
                >Review</button>
                <button
                  v-bind:class='{
                    "active-mode-switch": mode === "DEMO"
                  }'
                  v-on:click='switchMode(`DEMO`)'
                >Demo</button>
              </center>
            </div>
          </div>
        </div>
      </section>
    </article>
  </div>
</template>

<script>

import Head from 'Components/common/Head';
import BackgroundProtocol from 'BackgroundProtocol';
import api from 'Popup/backgroundApi';
import { counterFormat, convertSecondsToMS, getTimeMinuteSecond, getCurrentWindowActiveTabId, getApproximateTime } from 'Utils';
import router from '../router';

export default {
  name: 'Display',
  data() {
    return {
      ...this.getInitialData(),
      /**
       * 选择播放模式，
       * REVIEW: 供交互设计人员回顾用户行为
       * DEMO
       * @type {[type]}
       */
      mode: 'DEMO'
    };
  },
  methods: {
    getInitialData() {
      return {
        v: {
          Head, BackgroundProtocol, api,
          counterFormat, convertSecondsToMS, getTimeMinuteSecond, getCurrentWindowActiveTabId, getApproximateTime
        },
        story: {},
        clickEvents: [],
        frameArray: [],
        /**
         * 正在进行播放的 setInterval 返回的定时器编号
         * @type {Number}
         */
        process: undefined,
        /**
         * 帧指针，当前运行的帧在帧数组中的index
         * @type {Number}
         */
        frameIndex: 0,
        eventIndex: undefined,
        /**
         * 最后一次展示过的点击事件的index
         * @type {Number}
         */
        lastClickEventIndex: undefined,
        from: 0,
        to: 0,
        /**
         * 每秒帧数
         * @type {Number}
         */
        fps: 10,
        WIDTH: 305,
        /**
         * 进度条滑块的坐标值
         * @type {Number}
         */
        slider_x: 0,
        storyTimeLength: 0
      }
    },

    /**
     * 切换播放模式
     * @param  {String} mode 模式
     */
    switchMode(mode) {
      this.mode = mode;
      const initialData = this.getInitialData();
      Object.keys(initialData).forEach( key => {
        this[key] = initialData[key];
      });
      this.get();
    },

    /**
     * 获取数据，初始化播放的起止时间，并生成帧数组
     * @return {undefined}    (本函数会改变组件state，无需利用返回值)
     */
    get: async function() {
      const storyId = parseInt(this.$route.params.id)
      const data = await api.command(BackgroundProtocol.GET_STORY_AND_ITS_EVENTS, storyId);
      console.log(data)
      const { story, clickEvents } = data;
      this.story = story;
      this.clickEvents = clickEvents;
      this.sendMsg({
        command: 'GO_TO_OR_REFRESH',
        data: this.story.url
      })

      const storyTimeLength = this.getStoryTimeLength();

      this.from = 0;
      this.to = storyTimeLength;
      this.initFrameArray(0, storyTimeLength, this.fps);
      window.ctx = this;
    },

    getTimeMinuteSecond(time) {
      return getTimeMinuteSecond(time);
    },

    /**
     * 生成帧数组
     * @param  {Number} from 播放的起始时间，单位毫秒，值必须是1000的整数倍，必须小于to
     * @param  {Number} to   播放的结束时间，单位毫秒，值必须是1000的整数倍，必须大于from
     * @param  {Number} fps  每秒钟帧数
     * @return {undefined}   (本函数会改变组件state，无需利用返回值)
     */
    initFrameArray(from, to, fps) {
      // 待添加——from to是否合法的校验规则

      const frameArray = [];
      const frameAmount = (to - from) * fps / 1000;
      for ( let i = 0; i < frameAmount; i ++ ) {
        const frameElement = {
          clickEvents: []
        };
        frameArray.push(frameElement);
      }

      this.frameArray = frameArray;
      this.connectFramesAndClickEvents();
    },

    connectFramesAndClickEvents() {
      const { clickEvents, from, to, story, fps } = this;
      const storyTimestamp = new Date(story.time);

      /**
       * url相同的连续点击事件被划分在同一页(page)
       * @type {Object}
       */
      const pageList = {};
      for ( let i = 0; i < clickEvents.length; i ++ ) {
        const eventTimestamp = (new Date(clickEvents[i].time)).getTime();
        const eventTimePos = eventTimestamp - storyTimestamp;

        if (eventTimePos > from && eventTimePos < to) {
          const frameIndex = window.parseInt( eventTimePos / 1000 * fps );
          /**
           * 为每一个clickEvent添加所在的frame的index
           * 并将这个clickEvent的index push进frameArray
           */
          clickEvents[i]['frameIndex'] = frameIndex;
          this.frameArray[frameIndex].clickEvents.push(i);
        }

        clickEvents[i]['frameIndex'] = eventTimePos > from && eventTimePos < to ?
          window.parseInt( eventTimePos / 1000 * fps ) :
          undefined;
      }
    },

    /**
     * 根据story的起始时间和最后一个点击事件生成story的进行时间
     * 返回值为整秒，若不足整秒则进一
     * @return {Number} story的进行时间，单位毫秒，值为1000的整数倍
     */
    getStoryTimeLength() {
      const { story, clickEvents } = this;

      const storyTimestamp = new Date(story.time);
      const lastClickEventTimestamp = new Date(clickEvents[clickEvents.length - 1].time);

      const timeLength = lastClickEventTimestamp - storyTimestamp;

      return 1000 * ( window.parseInt(timeLength / 1000) + ((timeLength % 1000) > 0 ? 1 : 0) )
    },

    generateTimePanel() {
      const { frameIndex, story, fps, from, to } = this;
      const runningTime = window.Math.floor(frameIndex / fps );
      const totalTime = ( to - from ) / 1000 - 1;

      return `${convertSecondsToMS(runningTime)}/${convertSecondsToMS(totalTime)}`;
    },

    play() {
      const { frameIndex, frameArray } = this;
      if ( frameIndex === frameArray.length - 1 ) {
        this.frameIndex = 0;
      } else {
        this.process = window.setInterval(this.moveFrameIndex, 1000 / this.fps);
      }
    },

    /**
     * 检查是否 不 能切换上一个点击事件
     * @return {Boolean} 是否 不 能切换上一个点击事件
     */
    skipBackwardDisallowed() {
      const { lastClickEventIndex, frameIndex, clickEvents } = this;

      return lastClickEventIndex === undefined || (
        lastClickEventIndex === 0 &&
        clickEvents[lastClickEventIndex]['frameIndex'] === frameIndex
      );
    },

    /**
     * 切换到上一个点击事件
     * @return {undefined}
     */
    skipBackward() {
      if ( this.skipBackwardDisallowed() ) {
        return;
      }

      const { pause, clickEvents, lastClickEventIndex } = this;
      pause();

      const lastClickEventFrameIndex = clickEvents[lastClickEventIndex]['frameIndex'];

      if (lastClickEventFrameIndex === this.frameIndex) {
        const newLastClickEventIndex = lastClickEventIndex - 1;

        this.jumpByClickEventIndex(newLastClickEventIndex);
      } else {
        this.frameIndex = lastClickEventFrameIndex;
      }
    },

    /**
     * 检查是否 不 能切换下一个点击事件
     * @return {Boolean} 是否 不 能切换下一个点击事件
     */
    skipForwardDisallowed() {
      const { lastClickEventIndex, clickEvents, eventIndex } = this;

      if (lastClickEventIndex === undefined) {
        /**
         * DEMO mode
         */
        return eventIndex === clickEvents.length - 1;
      }
      return lastClickEventIndex === clickEvents.length - 1;
    },

    skipForwardDisallowedInDemo() {
      const { clickEvents, eventIndex } = this;
      return eventIndex === clickEvents.length - 1;
    },

    /**
     * 切换到下一个点击事件
     * @return {undefined}
     */
    skipForward() {
      if ( this.skipForwardDisallowed() ) {
        return;
      }
      const { lastClickEventIndex, clickEvents, pause, frameArray } = this;
      pause();

      const newClickEventIndex = typeof lastClickEventIndex === 'number' ?
        lastClickEventIndex + 1 :
        0;
      this.jumpByClickEventIndex(newClickEventIndex);

      const frameIndex = clickEvents[newClickEventIndex].frameIndex;
      const clickEventIndexes = frameArray[frameIndex].clickEvents;
      const clickEvents_inTheFrame  = clickEventIndexes.map( index => {
        return this.clickEvents[index];
      })
      const req = {
        command: 'FRAME_UPDATED',
        data: clickEvents_inTheFrame
      };

      this.sendMsg(req);
    },

    /**
     * 根据clickEvent index进行时间跳转
     * @param  {Number} newClickEventIndex
     * @return {undefined}
     */
    jumpByClickEventIndex(newClickEventIndex) {
      const { clickEvents } = this;
      const nextClickEventFrameIndex = clickEvents[newClickEventIndex]['frameIndex'];
      this.frameIndex = nextClickEventFrameIndex;
      this.lastClickEventIndex = newClickEventIndex;
    },

    /**
     * 根据frame index进行时间跳转
     * @param  {[type]} newFrameIndex [description]
     * @return {[type]}               [description]
     */
    jumpByFrameIndex(newFrameIndex) {
      const framePosition = this.getFramePosition(newFrameIndex);

      this.frameIndex = newFrameIndex;
      this.lastClickEventIndex = framePosition.clickEventIndex;
    },

    /**
     * 获取相应frame上一个相邻的、clickEvents列表不为空的frame的index
     * 返回值为 frameIndex 和这个frame中最后一个clickEvent的index
     * 若查找不到符合条件的index，则返回值为undefined
     * @param  {Number} frameIndex
     * @return {Object} { frameIndex, clickEventIndex }
     */
    getFramePosition(frameIndex) {
      const { clickEvents } = this.frameArray[frameIndex];

      if ( clickEvents.length > 0 ) {
        const clickEventIndex = clickEvents[clickEvents.length - 1];
        return {
          frameIndex: this.clickEvents[clickEventIndex]['frameIndex'],
          clickEventIndex: clickEventIndex
        };
      } else {
        return frameIndex >= 0 ?
          this.getFramePosition(frameIndex - 1) :
          undefined;
      }
    },

    pause() {
      window.clearInterval(this.process)
      this.process = undefined;
    },

    skipToTheEnd() {
      const lastFrameIndex = this.frameArray.length - 1;
      this.jumpByFrameIndex(lastFrameIndex);
    },

    /**
     * 移动帧指针
     * @return {undefined}
     */
    moveFrameIndex: async function() {
      const { frameArray, pause } = this;
      let { frameIndex } = this;
      if ( frameIndex === frameArray.length - 1 ) {
        pause();
      } else {
        frameIndex = frameIndex + 1;
        this.frameIndex = frameIndex;
      }

      const tabId = await getCurrentWindowActiveTabId();
      const clickEventIndexes = frameArray[frameIndex].clickEvents;

      const clickEvents  = clickEventIndexes.map( index => {
        return this.clickEvents[index];
      })

      this.sendMsg({
        command: 'FRAME_UPDATED',
        data: clickEvents
      });


    },

    getProcessSliderLeft() {
      return window.parseInt(this.WIDTH * this.frameIndex / (this.frameArray.length - 1));
    },

    /**
     * 在页面中显示用户点击的位置
     * @param  {Object} item 这个clickEvent
     * @return {Boolean}           这个clickEvent所在的frame的index同
     *                                process的frameIndex是否相等
     */
    showClickTrack(item, index) {
      const isActive = this.frameIndex === item.frameIndex;
      const frame = this.frameArray[this.frameIndex];
      const clickEvents_inTheFrame = frame.clickEvents;

      if ( clickEvents_inTheFrame.includes(index) ) {
        this.lastClickEventIndex = clickEvents_inTheFrame[clickEvents_inTheFrame.length - 1];
        // const thePoint = document.elementFromPoint( item.x, item.y );
        // const cover = document.getElementsByClassName('et_event-displaying-cover')[0];
        // cover.style.display = 'none';


        // console.log(thePoint)
        // thePoint.click();
        // setTimeout(() => {
        //   cover.style.display = 'block';

        // }, 100)

      }

      return isActive;
    },

    getClickTrackStyle(item) {
      return {
        left: item.x + 'px',
        top: item.y + 'px'
      }
    },

    getClickListItemClass(item, index) {
      return {
        'et_click-list-item-is-active': item.frameIndex === this.frameIndex,
        'et_click-list-item-is-last-active': this.lastClickEventIndex === index
      }
    },

    switchClickItem(item, index) {
      const { pause, frameIndex } = this;
      pause();
      this.frameIndex = item.frameIndex;
      this.lastClickEventIndex = index;
    },

    skipforwardInDemo: async function() {
      if (this.skipForwardDisallowed()) {
        return;
      }
      const { clickEvents } = this;
      let { eventIndex } = this;
      if ( eventIndex === undefined) {
        eventIndex = 0;
        this.eventIndex = eventIndex;
      } else {
        eventIndex = eventIndex + 1;
        this.eventIndex = eventIndex;
      }

      this.frameIndex = clickEvents[eventIndex].frameIndex;

      this.sendMsg({
        command: 'DEMO_ONCLICK',
        data: clickEvents[eventIndex]
      });
    },

    pageUp: async function() {
      const { eventIndex, clickEvents } = this;

      // const presentURL = await this.sendMsg({
      //   command: 'GET_CURRENT_PAGE'
      // });
      const presentURL = clickEvents[eventIndex].url;

      if (eventIndex >= 2) {
        console.log('eventIndex >= 2, eventIndex ===', eventIndex)
        let URLbefore;
        let URLbeforeChanged = false;
        for ( let i = eventIndex; i >= 0; i -- ) {
          if (!URLbeforeChanged && clickEvents[i].url !== presentURL) {
            URLbefore = clickEvents[i].url;
            URLbeforeChanged = true;
            debugger;
          }
          if (URLbeforeChanged && clickEvents[i].url !== URLbefore) {
            this.eventIndex = i + 1;
            this.frameIndex = clickEvents[i + 1].frameIndex;
            this.sendMsg({
              command: 'GO_TO',
              data: URLbefore
            });
            debugger;
            return;
          }
        }
      } else if (eventIndex === 1) {
        console.log('eventIndex === 1');
        this.eventIndex = 0;
        this.frameIndex = clickEvents[0].frameIndex;
        this.sendMsg({
          command: 'GO_TO',
          data: clickEvents[0].url
        })
      } else {
        console.log('else');
        this.eventIndex = undefined;
        this.frameIndex = 0;
        this.sendMsg({
          command: 'GO_TO',
          data: this.story.url
        })
      }
    },

    pageDown() {
      const { eventIndex, clickEvents, frameArray } = this;

      const presentURL = eventIndex === undefined ?
        this.story.url :
        clickEvents[eventIndex].url;

      for (
        let i = eventIndex === undefined ? 0 : eventIndex;
        i < clickEvents.length; i ++ ) {
        if (clickEvents[i].url !== presentURL) {
          this.eventIndex = i;
          this.frameIndex = clickEvents[i].frameIndex;
          this.sendMsg({
            command: 'GO_TO',
            data: clickEvents[i].url
          });
          return;
        }
      }
    },

    replay() {
      this.frameIndex = 0;
      this.eventIndex = undefined;
      this.lastClickEventIndex = undefined;

      this.sendMsg({
        command: 'GO_TO',
        data: this.story.url
      })
    },

    sendMsg: async function(msg, callback) {
      const tabId = await getCurrentWindowActiveTabId();
      return new Promise( resolve => {
        chrome.tabs.sendMessage(tabId, msg, res => resolve(res));
      });
    },

    getApproximateTime: function(tStamp) {
      return getApproximateTime(tStamp);
    }

  },

  props: ['id'],

  mounted: async function() {
    const backgroundStatus = await api.command('SYNC_DISPLAYING_STATUS', this);

    /**
     * 非录制状态下backgroundStatus的返回值为false
     */
    if ( backgroundStatus ) {
      const presentURL = await this.sendMsg({
        command: 'GET_CURRENT_PAGE'
      });

      const urlInStorage = this.clickEvents[this.eventIndex].url;
      if (urlInStorage !== presentURL) {
        this.sendMsg({
          command: 'GO_TO',
          data: urlInStorage
        });
      }
    } else {
      await this.get();
      api.command(BackgroundProtocol.ON_DISPLAY, {
        ctx: this,
        route: this.$route.path
      });
    }
    // chrome = await api.command(BackgroundProtocol.GET_CHROME);
  },

  destroyed: async function() {
    api.command(BackgroundProtocol.DISPLAY_COMPONENT_DESTROYED)
  },

  components: {
    'popup-header': Head
  }
}
</script>

<style scoped>
.et_event-displaying-cover {
  display: none;
}

.et_display-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.et_display-container * {
  box-sizing: border-box;
}

.et_display-container article {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.et_display-container header {
  height: 30px;
  line-height: 30px;
  padding: 0 20px;
  box-shadow: 0px 1px 4px #aaa;
  z-index: 1
}

.et_display-container article > section {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.et_click-event-list {
  flex: 1 1 1px;
  margin: 0;
  padding: 0;
  overflow: auto;
  box-shadow: inset 0px 1px 4px -1px #aaa;
  background: #f7f7f7
}

.et_click-event-list-titles {
  display: flex;
  justify-content: space-between;
  padding: 5px 20px
}

.et_click-event-list-titles span {

}

.et_click-event-list a {
  display: flex;
  justify-content: space-between;
  padding: 5px 20px;
  text-decoration: none;
  border-bottom: solid 1px #e4e4e4;
  background: #fff
}

.et_click-event-list a:hover {
  background: #ededed
}

.et_control {
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
}

.et_progress-bar {
  position: relative;
  height: 8px;
  background: #f2f2f2;
  box-shadow: inset 0 0 4px #ccc;
}

.et_progress-slider {
  position: absolute;
  display: block;
  width: 10px;
  height: 20px;
  background: #fff;
  border: solid 1px #999;
  border-radius: 3px;
  top: -7px;
  left: 20px;
  cursor: url(https://ssl.gstatic.com/ui/v1/icons/mail/images/2/openhand.cur), default !important
}

.et_control-panel-container {
  height: 117px;
  padding: 0 40px;
  background: #f7f7f7
}

.et_control-panel {
  background: #fff;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.et_control-buttons {
  display: flex;
  margin: 8px auto 35px auto;
}

.et_control-buttons a {
  text-decoration: none;
  margin: 0 4px;
}

.et_control-buttons a i {
  font-size: 20px;
  color: #888
}

.et_control-buttons a.et_control-button-disable i {
  color: #ddd
}

.et_control-buttons a.et_control-button-disable:hover i {
  color: #ddd
}

.et_control-buttons a:hover i {
  color: #444
}

.et_event-displaying-cover {
  position: fixed;
  z-index: 1000;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.et_click-event-display-item {
  position: absolute;
  width: 10px;
  height: 10px;
  background: blue;
  border-radius: 50%;
}

.et_click-event-list .et_click-list-item-is-active {
  background: #008fbf;
  color: #fff
}

.et_click-list-item-is-last-active {
  background: #eaeaff;
}

.negative-notice {
  padding: 7px;
  color: #777
}

.mode-switches button {
    border: none;
    width: 47%;
    height: 33px;
    color: #fff;
    background: #bfbfbf;
}

.mode-switches button.active-mode-switch {
  background: #007095
}
</style>
