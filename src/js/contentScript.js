document.addEventListener('keydown', event => {
  console.log(event.code);
  const codeToCommand = {
    'ArrowRight': 'SKIP_FORWARD_IN_DEMO',
    'ArrowUp': 'PAGE_UP_IN_DEMO',
    'ArrowDown': 'PAGE_DOWN_IN_DEMO'
  };

  sendMsg({
    command: codeToCommand[event.code]
  })
});

const operations = {
  ON_RECORD: () => {
    document.addEventListener('click', trackClickEvent);
  },

  STOP_RECORD: () => {
    document.removeEventListener('click', trackClickEvent);
  },

  FRAME_UPDATED: (msg, sendResponse) => {
    updateFrame(msg, sendResponse, true);
  },

  FRAME_UPDATED_WITHOUT_TRIGGER_THE_EVENTS_BEFORE: msg => {
    updateFrame(msg, sendResponse, false);
  },

  DEMO_ONCLICK: msg => {
    const { data } = msg;
    clearEventsTrack();

    const { x, y } = data;
    clickPoint(x, y);
  },

  GO_TO: msg => {
    const { data } = msg;

    location.href = data;
  },

  GO_TO_OR_REFRESH: msg => {
    const { data } = msg;

    if (location.href === data) {
      location.reload();
    } else {
      const dataProtocolCheck = data.slice(0, 4);
      const presentProtocolCheck = location.href.slice(0, 4);
      if (
        dataProtocolCheck === 'file' &&
        dataProtocolCheck !== presentProtocolCheck
      ) {
        swal({
          type: 'warning',
          title: '',
          html: `
            The page url belongs to a local file. The program is not able to take you there, please copy the following url and redirect the web page manually:
            <br />
            <br />
            <span style="color: #1717b1">${data}</span>
          `
        });
      } else {
        location.href = data;
      }
    }
  },

  GET_CURRENT_PAGE: (msg, sendResponse) => {
    sendResponse(location.href);
  }
}

chrome.runtime.onMessage.addListener(
  function(msg, sender, sendResponse) {
    console.log(msg.command);
    operations[msg.command](msg, sendResponse);
  }
)
