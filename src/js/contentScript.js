import swal from 'sweetalert2';

const sendMsg = msg => {
  return new Promise( resolve => {
    chrome.runtime.sendMessage(msg, function(response) {
      resolve(response);
    })
  })
}

const trackClickEvent = function(e) {
  const msg = {
    command: 'CLICK_EVENT',
    data: {
      x: e.clientX,
      y: e.clientY,
      url: location.href
    }
  };

  sendMsg(msg);
}

let clickEventsStorage = [];
const renderClickEventsTrack = () => {
  clickEventsStorage.forEach( item => {
    const { x, y } = item;
    const div = document.createElement('div');
    div.className = 'et-click-event-track';
    div.style.top = y + 'px';
    div.style.left = x + 'px';
    div.style.width = '10px';
    div.style.height = '10px';
    div.style.background = '#272766cf';
    div.style.background = 'blue';
    div.style.boxShadow = '0 0 0 20px #0000ff44';
    div.style.position = 'fixed';
    div.style.borderRadius = '50%';
    div.style.zIndex = '9999';
    div.style.opacity = '1';
    div.style.transition = 'all .5s';
    /* border: solid 20px #0000ff11; */
    document.body.append(div);
  })
}

const clearEventsTrack = () => {
  document.querySelectorAll('.et-click-event-track').forEach( element => {
    element.style.opacity = '0';
    element.style.boxShadow = '0 0 0 80px #0000ff44';
    setTimeout(() => element.remove(), 500);
  })
}

const updateFrame = (msg, sendResponse, triggerRemainingEvents) => {
  const { data } = msg;
  /**
   * 清除页面上渲染后的点击轨迹
   */
  clearEventsTrack();
  if (triggerRemainingEvents) {
    /**
     * 将页面上渲染了轨迹但还没有触发的点击事件触发掉，并同时从storage中移除
     */
    for ( let i = 0; i < clickEventsStorage.length; i ++ ) {
      const eventItem = clickEventsStorage.shift();
      const { x, y } = eventItem;
      clickPoint(x, y);
    }
  }
  if ( data.length > 0 ) {
    clickEventsStorage = data;
    renderClickEventsTrack();
  }
}

const clickPoint = (x, y) => {
  // const thePoint = document.elementFromPoint( x/1.1, y/1.1 );
  console.log(`x, y: ${x} ${y}`,)
  let thePoint = document.elementFromPoint( x, y );
  document.querySelectorAll('.et-click-event-track').forEach( element => {
    element.style.display = 'none';
  })
  while(typeof thePoint.click !== 'function') {
    thePoint = thePoint.parentElement;
  }
  thePoint.click();
  document.querySelectorAll('.et-click-event-track').forEach( element => {
    element.style.display = 'block';
  })
}

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
