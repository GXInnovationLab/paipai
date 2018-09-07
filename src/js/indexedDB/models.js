/**
 * 创建schema，这个schema对应的数据将用来记录用户的网页点击操作
 * @type {Schema}
 */
const clickEventSchema = [
  ['url', 'url', {unique: false}],
  ['time', 'time', {unique: false}],
  ['x', 'x', {unique: false}],
  ['y', 'y', {unique: false}],
  ['story_id', 'story_id', {unique: false}]
]

/**
 * 创建schema，这个schema对应的数据将用来记录用户
 * 访问一个静态html文件的url的行为
 * @type {Schema}
 */
const storyShema = [
  ['name', 'name', {unique: false}],
  ['time', 'time', {unique: false}],
  ['url', 'url', {unique: false}]
]

export default {
  clickEventSchema,
  storyShema
}
