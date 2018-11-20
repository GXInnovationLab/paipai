import { paths } from 'Popup/router';
import db, { stores } from 'IndexedDB/controller';
import { getCurrentWindowActiveTabId } from 'Utils';
// import c from './components/index.js';
import displayGenerator from './displayGenerator';
import fileSystem from './fileSystem';
window.f = fileSystem;

// function getCurrentWindowActiveTabId() {
//   return new Promise((resolve) => {
//     chrome.tabs.query({
//       active: true
//     }, res => {
//       resolve(res[0].id)
//     })
//   })
// }

function getCurrentWindowActiveTabURL() {
  return new Promise((resolve) => {
    chrome.tabs.query({
      active: true
    }, res => {
      resolve(res[0].url)
    })
  })
}

const addNewStory = async function(req) {
  const url = await getCurrentWindowActiveTabURL();
  const data = {
    name: req.name,
    time: (new Date).getTime(),
    url: url,
    order: []
  }
  return await db.insert('stories', data);
}

const getStoryList = async function() {
  return await db.getAll('stories');
}

/**
 * [description]
 * @param  {Object} condition {story_id}
 * @return {Object}           [description]
 */
const getStoryAndItsImages = async function(condition) {
  const images = await db.get('images', condition);
  const story = await db.get('stories', {
    id: condition.story_id
  });
  return { story, images };
}

const deleteStory = async function(condition) {
  const res = await db.delete('stories', {
    id: condition.story_id
  });

  fileSystem.removeDirectory((condition.story_id).toString());
  console.log('deleted');
  return res;
}

const updateStory = async function(data) {
  const res = await db.update('stories', data);

  return res;
}

const syncVueStatus = async (status, newCtx, type) => {
  if ( status.backgroundIsDoing !== type ) {
    return false;
  }
  const oldCtx = status.ctx;

  Object.keys(oldCtx.$data).forEach( key => {
    newCtx[key] = oldCtx[key];
  });

  status.ctx = newCtx;
  return true;
};

//
//
//
// async function return story_id ....
//
//
//

/**
 * 每一个方法都会接收一个status参数，
 * 这个参数对应的值是background中的backgroundStatus
 */
export default {
  ADD_NEW_STORY: async (status) => {
    status.backgroundIsDoing = status.backgroundWorkingStatusList.RECORDING;

    const tabId = await getCurrentWindowActiveTabId();
    status.tabId = tabId;

    // chrome.tabs.sendMessage(
    //   tabId,
    //   {
    //     command: 'ON_RECORD'
    //   }
    // );

    // Insert new story into indexedDB
    const storyList = await getStoryList({});
    const newStoryId = await addNewStory({
      name: `New File (${storyList.length + 1})`
      // name: popupCtx.name
    });

    // Create a directory in the file system
    await fileSystem.createDirectory(newStoryId);
    return newStoryId;
    // popupCtx.storyId = newStoryId;
    // status.route = paths.newStory;
    // status.ctx = popupCtx;
  },

  CHANGE_STORY_NAME: async (status) => {
    const result = await updateStory(status.vuexStore.state.storyDetails.story);
  },

  ON_RECORD: async (status, data) => {
    const tabId = await getCurrentWindowActiveTabId();
    chrome.tabs.sendMessage(
      tabId,
      {
        command: 'ON_RECORD'
      }
    );
  },

  ON_DISPLAY: async (status, data) => {
    const { route } = data;
    const popupCtx = data.ctx;

    status.backgroundIsDoing = status.backgroundWorkingStatusList.DISPLAYING;
    const { eventIndex, frameIndex, clickEvents } = popupCtx.$data;
    status.component = displayGenerator(status);
    status.route = route;
    status.ctx = popupCtx;
  },

  STOP_RECORD: async status => {
    status.backgroundIsDoing = status.backgroundWorkingStatusList.NOTHING;
    status.route = undefined;

    const tabId = await getCurrentWindowActiveTabId();
    chrome.tabs.sendMessage(
      tabId,
      {
        command: 'STOP_RECORD'
      }
    );
  },

  GET_STATUS_URL: async status => {
    return status.route;
  },

  SYNC_RECORDING_STATUS: async (status, newCtx) => {
    const type = status.backgroundWorkingStatusList.RECORDING;
    return await syncVueStatus(status, newCtx, type);
  },

  SYNC_DISPLAYING_STATUS: async (status, newCtx) => {
    const type = status.backgroundWorkingStatusList.DISPLAYING;
    return await syncVueStatus(status, newCtx, type);
  },

  GET_STORY_LIST: async (status) => {
    const result = await getStoryList({});
    return result;
  },

  GET_STORY_AND_ITS_EVENTS: async (status, story_id) => {
    const result = await getStoryAndItsEvents({ story_id });
    return result;
  },

  GET_STORY_AND_ITS_IMAGES: async (status, story_id) => {
    return await getStoryAndItsImages({ story_id });
  },

  DELETE_STORY: async (status, story_id) => {
    const result = await deleteStory({ story_id });
    return result;
  },

  UPDATE_STORY: async (status, data) => {
    const result = await updateStory(data);
    return result;
  },

  DISPLAY_COMPONENT_DESTROYED: async status => {
    status.backgroundIsDoing = status.backgroundWorkingStatusList.NOTHING;
    status.data = {};
    status.component = undefined;
    status.route = undefined;
  },

  GO_DEMO: async (status, data) => {
    const BLANK_HTML_NAME = 'paipai_demo.html';
    await fileSystem.createFile(BLANK_HTML_NAME);
    // const url = `filesystem:${window.location.origin}/persistent/${BLANK_HTML_NAME}`;
    chrome.tabs.create({ url: url });
    status.demoData = data;
    // const tabId = await getCurrentWindowActiveTabId();
    // status.tabId = tabId;
    // status.route = paths.newStory;

    // chrome.tabs.sendMessage(
    //   tabId,
    //   {
    //     command: 'ON_RECORD'
    //   }
    // );
  },

  POPUP_MOUNTED: (status, data) => {
    status.vuexStore = data.store;
    console.log(data.store)
  },

  POPUP_HASH_CHANGED: (status, data) => {
    status.popupHash = data.hash;
  },

  R_U_STILL_ALIVE: () => {
  },

  GET_CHROME: async () => {
    return chrome;
  },

  GET_PREVIOUS_STATE: async status => {
    return typeof status.vuexStore !== 'undefined' ? {
      store: status.vuexStore,
      url: status.popupHash
    } : undefined;
  }
}
