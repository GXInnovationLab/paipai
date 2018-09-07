import { sendMsg } from 'Utils';

const componentGenerator = function(data) {
  const display = {
    skipforwardInDemo:  async function() {
      // if (this.skipForwardDisallowed()) {
      //   return;
      // }
      const { clickEvents } = data;
      let { eventIndex } = data;
      if ( eventIndex === undefined) {
        eventIndex = 0;
        this.eventIndex = eventIndex;
      } else {
        eventIndex = eventIndex + 1;
        data.eventIndex = eventIndex;
      }

      data.frameIndex = clickEvents[eventIndex].frameIndex;

      sendMsg({
        command: 'DEMO_ONCLICK',
        data: clickEvents[eventIndex]
      });
    }
  }

  return display;
}

export default componentGenerator;
