import models from './models';
import db from './database';

export const stores = [
  {
    name: 'stories',
    keypath: 'id',
    schema: models.storyShema
  },
  {
    name: 'images',
    keypath: 'id',
    schema: models.imageSchema
  }
];

const connect = () => {
  db.createDB('demoRecorder', stores);
}

export default Object.assign({ connect }, db);
