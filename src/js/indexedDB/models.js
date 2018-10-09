/**
 * 创建schema，对应着fileSystem中的一个directory
 * @type {Schema}
 */
const storyShema = [
  ['name', 'name', {unique: false}],
  ['time', 'time', {unique: false}],
  ['order', 'order', {unique: false}]
]

const imageSchema = [
  ['name', 'name', {unique: false}],
  ['story_id', 'story_id', {unique: false}],
  ['url', 'url', {unique: false}],
  ['time', 'time', {unique: false}]
]

export default {
  imageSchema,
  storyShema
}
