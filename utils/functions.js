/**
 * 获取时间 时:分 秒.毫秒
 * @param  {某个能被Date解析的类型} time 时间
 * @return {String} 时:分 秒.毫秒
 */
export const getTimeMinuteSecond = time => {
  const date = new Date(time);
  const h = date.getHours();
  let minute = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();
  if ( minute.toString().length === 1 ) {
    minute = `0${minute}`
  }
  return `${h}:${minute} ${s}.${ms}s`;
}

/**
 * 获取时间 月-日 时:分
 * @param  {某个能被Date解析的类型} time 时间
 * @return {String} 月-日 时:分:秒
 */
export const getApproximateTime = time => {
  const date = new Date(time);
  const month = date.getMonth();
  const theDate = date.getDate()
  const day = date.getDay();
  const h = date.getHours();
  let minute = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();

  if ( minute.toString().length === 1 ) {
    minute = `0${minute}`
  }

  return `${month + 1}-${theDate} ${h}:${minute}:${s}`;
}

/**
 * 这个方法用来解析无法通过 location.search 访问的 queryString
 * 将 queryString 转换成 键-值 关系对象
 * @return {Object}
 */
export const getQueryBySearch = () => {
  const search = window.location.href.split('?')[1];
  const searchItems = search.split('&');
  const query = {};

  for ( let i = 0; i < searchItems.length; i ++ ) {
    const item = searchItems[i];
    const keyValue = item.split('=');
    const key = keyValue[0];
    const value = keyValue[1];
    query[key] = value;
  }

  return query;
}

/**
 * 这个方法用来将整数秒转换成 分钟:秒 的字符串格式
 * @param  {Number} seconds 整数秒
 * @return {String}         "分钟:秒" 字符串
 */
export const convertSecondsToMS = seconds => {

  const newMinutes = Math.floor(seconds / 60);
  const newSeconds = seconds % 60;

  return `${newMinutes}:${newSeconds}`;
}

export const counterFormat = tstamp => {
  const totalSeconds = Math.floor(tstamp / 1000);
  let minutes = Math.floor(totalSeconds / 60).toString();
  let seconds = (totalSeconds % 60).toString();

  if ( minutes.length <= 1 ) {
    minutes = `0${minutes}`;
  }
  if ( seconds.length <= 1 ) {
    seconds = `0${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

export function getCurrentWindowActiveTabId() {
  return new Promise((resolve) => {
    chrome.tabs.query({
      active: true
    }, res => {
      resolve(res[0].id)
    })
  })
}

export const sendMsg = async function(msg, callback) {
  const tabId = await getCurrentWindowActiveTabId();
  return new Promise( resolve => {
    chrome.tabs.sendMessage(tabId, msg, res => resolve(res));
  });
}

/**
 * Download multiple images
 * @param  {Array} images - The array of the src strings of the images that you intend to download
 * @return {[type]}        [description]
 */
export const downloadImages = function(sources) {
  sources.forEach( src => downloadImage(src));
}

/**
 * Download single image
 * @param  {[type]} src - The src string of the image thate you intend to download
 * @return {[type]}     [description]
 */
const downloadImage = src => {
    var link = document.createElement('a');
    link.href = src;
    link.download = true;
    link.style.display = "none";
    var event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true
    });

    document.body.appendChild(link);
    link.dispatchEvent(event);
    document.body.removeChild(link);
}
