import '../../img/icon-128.png'
import '../../img/icon-34.png'

import workingSkills from './workingSkills';
import statusResolutions from './statusResolutions';
import db from 'IndexedDB/controller';
import fileSystem from './fileSystem';

window.fileSystem = fileSystem;
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

db.connect();

/**
 * 初始化文件系统
 */
fileSystem.load();

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
   * vuexStore
   * @type {Object}
   */
  vuexStore: undefined,
  /**
   * 挂载后台运行的组件，成分在./components中获取
   * @type {object}
   */
  component: undefined,
  popupHash: '/',

  backgroundIsDoing: backgroundWorkingStatusList.NOTHING,
  backgroundWorkingStatusList
}

window.bs = backgroundStatus;

const popupStatus = {
  RECORDING: () => {}
}

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
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

/**
 * [contentScriptMsgReceiver description]
 * @type {Object}
 */
const contentScriptMsgReceiver = {
  /**
   * [description]
   * @param  {[type]} req [description]
   * @return {[type]}     [description]
   */
  TAKE_SCREEN_SHOT: async req => {
    const { vuexStore } = backgroundStatus;
    const storyId = vuexStore.state.storyDetails.story.id;
    // use chrome.tabs apis to take the screenshot
    const base64Data = await Promise.resolve({
      then: resolve => chrome.tabs.captureVisibleTab(
        null, {format: 'png', quality: 100}, function(dataURI) {
          resolve(dataURI);
        }
      )
    });
    // create byteArray
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length)
    for (var i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    // create fileName
    const fileName = `${(new Date).getTime().toString().slice(-9)}.png`;
    // file name is same to the story id
    fileSystem.createFileInDirectory(fileName, byteArray, 'image/png', storyId);
    // create new image record
    const imageData = {
      name: fileName,
      story_id: storyId,
      time: (new Date()).getTime(),
      url: req.url
    };
    const newImageId = await db.insert('images', imageData);
    // create new story record

    const story = await db.get('stories', { id: storyId });
    story.order.push(newImageId);
    const res = await db.update('stories', story);
    // !!
    // both db.update and db.insert returns id.
    // the db operations can be optimized to return Objects
    // so that we don't have to do the following db operation.
    vuexStore.dispatch('storyDetails/getAll', {storyId});
  },

  GET_DEMO_DATA: async (req, sendResponse) => {
    sendResponse(backgroundStatus.demoData);
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

      receiverTotal[msg.command](msg.data, sendResponse);
    }
  }
)
