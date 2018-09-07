import models from './models';
import db from './database';

export const stores = [
  {
    name: 'stories',
    keypath: 'id',
    schema: models.storyShema
  },
  {
    name: 'click_events',
    keypath: 'id',
    schema: models.clickEventSchema
  }
];

const connect = () => {
  db.createDB('demoRecorder', stores);
}

export default Object.assign({ connect }, db);
