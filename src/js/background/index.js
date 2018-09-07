import '../../img/icon-128.png'
import '../../img/icon-34.png'

import workingSkills from './workingSkills';
import statusResolutions from './statusResolutions';
import database from 'IndexedDB/controller';
// import db from './indexedDB/index';

/**
 * 由于popup很容易被用户关闭，而且开发者没有能力阻止popup关闭它，
 * 所以一些类似“屏幕录像”和“自动demo”的持续性工作需要交给background来做
 *
 * 如果用户在background进行这类持续性工作时打开popup，popup需要根据background
 * 正在进行的工作类型(background的工作状态)
 * 来使用不同的方法来获取初始化状态(popup的路由，vue组件状态)，
 * 进而将这种状态在使用vue.js编写的popup应用上展现给用户
 *
 */

database.connect();

/**
 * 下面是background会从事的持续性工作的识别码
 */

const backgroundWorkingStatusList = {
  /**
   * 无所事事
   * @type {undefined}
   */
  NOTHING: 'NOTHING',
  /**
   * 正在进行屏幕录像
   * @type {String}
   */
  RECORDING: 'RECORDING',
  /**
   * 正在进行自动demo
   * @type {String}
   */
  DISPLAYING: 'DISPLAYING'
};

/**
 * background的工作状态
 */
const backgroundStatus = {
  active: false,
  /**
   * vue工程Popup的路由，用来在popup的app渲染之后做默认的路由跳转
   * @type {String}
   */
  route: undefined,
  /**
   * 正在录制的页面的tabId
   * @type {Number}
   */
  tabId: undefined,
  /**
   * vue组件上下文，详细内容在popup/components/NewStory.vue中
   * @type {Object}
   */
  ctx: {},
  /**
   * 挂载后台运行的组件，成分在./components中获取
   * @type {object}
   */
  component: undefined,

  backgroundIsDoing: backgroundWorkingStatusList.NOTHING,
  backgroundWorkingStatusList
}

const popupStatus = {
  RECORDING: () => {}
}

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    console.log(request)
  }
)

window.getBackgroundStatus = () => {
  return backgroundStatus;
}

window.api = {
  command: async(cmd, v) => {
    const res = await workingSkills[cmd](backgroundStatus, v);
    return res;
  },

  getRecordingStoryId: () => {
    return backgroundStatus.ctx.storyId;
  }
}

// chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   chrome.tabs.sendMessage(tabs[0].id, )
// })
const contentScriptMsgReceiver = {
  CLICK_EVENT: req => {
    const data = {
      x: req.x,
      y: req.y,
      url: req.url,
      time: (new Date).getTime(),
      story_id: backgroundStatus.ctx.storyId
    }
    console.log('req.url: ', req.url);

    database.insert('click_events', data);
  }
}

chrome.runtime.onMessage.addListener(
  function(msg, sender, sendResponse) {
    if (sender.tab) {
      const receiverTotal = backgroundStatus.component === undefined ?
        contentScriptMsgReceiver :
        Object.assign(
          contentScriptMsgReceiver,
          backgroundStatus.component.msgReceiver
        );
      console.log(receiverTotal);

      receiverTotal[msg.command](msg.data);
    }
  }
)

window.st = function() {
  console.log(backgroundStatus)
}
