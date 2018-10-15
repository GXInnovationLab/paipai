import html2canvas from 'html2canvas';

/**
 * [description]
 * @param  {[type]} msg [description]
 * @return {[type]}     [description]
 */
const sendMsg = msg => {
  return new Promise( resolve => {
    chrome.runtime.sendMessage(msg, function(response) {
      resolve(response);
    })
  })
}

document.addEventListener('keydown', event => {
  console.log(event.code);
  const codeToCommand = {
    'ArrowRight': 'SKIP_FORWARD_IN_DEMO',
    'ArrowUp': 'PAGE_UP_IN_DEMO',
    'ArrowDown': 'PAGE_DOWN_IN_DEMO',
    'Backslash': 'TAKE_SCREEN_SHOT',
  };

  const command = codeToCommand[event.code];

  // sendMsg({ command });
  if (typeof contentScriptOperations[command] === 'function') {
    contentScriptOperations[command]();
  }
});

const util = {};
util.toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
};

/**
 * content script operations
 */
const contentScriptOperations = {
  TAKE_SCREEN_SHOT: async() => {

    // const canvas = await html2canvas(document.body);
    // const base64Data = canvas.toDataURL("image/png");
    sendMsg({
      command: 'TAKE_SCREEN_SHOT',
      data: {
        url: window.location.href
      }
    });
  }
  // }
}

/**
 * [operations description]
 * @type {Object}
 */
const operations = {
  // ON_RECORD: () => {
  //   document.addEventListener('click', trackClickEvent);
  // },

  // STOP_RECORD: () => {
  //   document.removeEventListener('click', trackClickEvent);
  // }
}

chrome.runtime.onMessage.addListener(
  function(msg, sender, sendResponse) {
    console.log(msg.command);
    operations[msg.command](msg, sendResponse);
  }
)

if (window.location.pathname === '/paipai_demo.html') {
  (async () => {
    const res = await sendMsg({
      command: 'GET_DEMO_DATA',
      data: {
        url: window.location.href
      }
    });
    console.log('res: ', res);
  })()
}
