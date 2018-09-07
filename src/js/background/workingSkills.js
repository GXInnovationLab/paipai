import { paths } from 'Popup/router';
import db, { stores } from 'IndexedDB/controller';
import { getCurrentWindowActiveTabId } from 'Utils';
// import c from './components/index.js';
import displayGenerator from './displayGenerator';

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
    url: url
  }
  return await db.insert('stories', data);
}

const getStoryList = async function() {
  return await db.getAll('stories');
}

const getStoryAndItsEvents = async function(condition) {
  const clickEvents = await db.get('click_events', condition);
  const story = await db.get('stories', {
    id: condition.story_id
  });
  return { story, clickEvents };
}

const deleteStory = async function(condition) {
  const res = await db.delete('stories', {
    id: condition.story_id
  });
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
  ON_RECORD: async (status, popupCtx) => {
    status.backgroundIsDoing = status.backgroundWorkingStatusList.RECORDING;

    const tabId = await getCurrentWindowActiveTabId();
    status.tabId = tabId;
    status.route = paths.newStory;

    chrome.tabs.sendMessage(
      tabId,
      {
        command: 'ON_RECORD'
      }
    );

    const newStoryId = await addNewStory({
      name: popupCtx.name
    });

    popupCtx.storyId = newStoryId;
    status.ctx = popupCtx;
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

    const tabId = status.tabId;
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
    const result = await getStoryList({
    });
    return result;
  },

  GET_STORY_AND_ITS_EVENTS: async (status, story_id) => {
    const result = await getStoryAndItsEvents({ story_id });
    return result;
  },

  DELETE_STORY: async (status, story_id) => {
    const result = await deleteStory({ story_id });
    return result;
  },

  DISPLAY_COMPONENT_DESTROYED: async status => {
    status.backgroundIsDoing = status.backgroundWorkingStatusList.NOTHING;
    status.data = {};
    status.component = undefined;
    status.route = undefined;
  },

  R_U_STILL_ALIVE: () => {
    console.log(789)
  },

  GET_CHROME: async () => {
    return chrome;
  }
}
