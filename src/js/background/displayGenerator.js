import { sendMsg } from 'Utils';

const componentGenerator = function(status) {
  const skipforwardInDemo = async function() {
    const { clickEvents, eventIndex } = status.ctx.$data;
    if (eventIndex === undefined) {
      status.ctx.$data.eventIndex = 0;
      status.ctx.$data.frameIndex = clickEvents[0].frameIndex;
      sendMsg({
        command: 'DEMO_ONCLICK',
        data: clickEvents[0]
      });
    } else if (eventIndex < clickEvents.length - 1) {
      status.ctx.$data.eventIndex = eventIndex === undefined ?
        0 : eventIndex + 1;

      status.ctx.$data.frameIndex = clickEvents[status.ctx.$data.eventIndex].frameIndex;
      sendMsg({
        command: 'DEMO_ONCLICK',
        data: clickEvents[status.ctx.$data.eventIndex]
      });
    }
  };

  const pageUpInDemo = function() {
    const { eventIndex, clickEvents } = status.ctx.$data;
    const presentURL = clickEvents[eventIndex].url;

    if (eventIndex >= 2) {
      let URLbefore;
      let URLbeforeChanged = false;
      for ( let i = eventIndex; i >= 0; i -- ) {
        if (!URLbeforeChanged && clickEvents[i].url !== presentURL) {
          URLbefore = clickEvents[i].url;
          URLbeforeChanged = true;
        }
        if (URLbeforeChanged && clickEvents[i].url !== URLbefore) {
          status.ctx.$data.eventIndex = i + 1;
          status.ctx.$data.frameIndex = clickEvents[i + 1].frameIndex;
          sendMsg({
            command: 'GO_TO',
            data: URLbefore
          });
          return;
        }
      }
    } else if (eventIndex === 1) {
      status.ctx.$data.eventIndex = 0;
      status.ctx.$data.frameIndex = clickEvents[0].frameIndex;
      sendMsg({
        command: 'GO_TO',
        data: clickEvents[0].url
      })
    } else {
      status.ctx.$data.eventIndex = undefined;
      status.ctx.$data.frameIndex = 0;
      sendMsg({
        command: 'GO_TO',
        data: status.ctx.$data.story.url
      })
    }
  }

  const display = {

    init: async function() {
      // console.log('init data: ', data);
      // const { clickEvents } = data;
      // let { eventIndex } = data;
      // if ( eventIndex === undefined) {
      //   eventIndex = 0;
      //   this.eventIndex = eventIndex;
      // } else {
      //   eventIndex = eventIndex + 1;
      //    data.eventIndex = eventIndex;
      //  }

      // data.frameIndex = clickEvents[eventIndex].frameIndex;
    },

    msgReceiver: {
      'SKIP_FORWARD_IN_DEMO': skipforwardInDemo,
      'PAGE_UP_IN_DEMO': pageUpInDemo
    }
  }
  display.init();

  return display;
}

export default componentGenerator;
