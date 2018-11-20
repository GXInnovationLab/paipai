let appDBName = 'demoRecorder';

/**
 * 创建数据库
 * @param  {String} dbName 数据库名称
 * @param  {Array} stores 数据库包含的存储空间store(数据表)的集合
 */
const createDB = function(dbName, stores) {
  appDBName = dbName;
  let db;
  // 打开数据库
  const request = indexedDB.open(dbName);

  // 连接数据库的失败处理
  request.onerror = function(e) {
  }

  /**
   * 在版本发生变动时会触发upgradeneeded事件。onupgradeneeded
   * 是我们唯一可以修改数据库结构的地方。
   * 在这里面，我们可以创建和删除对象存储空间以及构建和删除索引
   */
  request.onupgradeneeded = function(e) {
    db = e.target.result;
    stores.forEach( item => {
      const { name, schema } = item;
      const keyPath = item.keyPath === undefined ? 'id' : item.keyPath

      const objectStore = db.createObjectStore(name, {keyPath, autoIncrement: true});
      schema.forEach( columns => {
        objectStore.createIndex(...columns)
      });
    });
  }
}

/**
 * 获取数据列表
 * @param  {String=} dbName 数据库名称(可选)
 * @param  {String} storeName 存储空间名称
 * @return {Object}           Promise对象，添加成功之后会触发它的resolve方法
 *                            并在resolve中传入查询结果
 */
const getAll = function() {
  let dbName;
  let storeName;
  if ( arguments.length <= 1 ) {
    dbName = appDBName;
    storeName = arguments[0];
  } else {
    dbName = arguments[0];
    storeName = arguments[1];
  }

  return new Promise( resolve => {
    indexedDB.open(dbName).onsuccess = function(e) {
      const db = e.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = function(event) {
        resolve(req.result)
      }

    }
  })
}

/**
 * 获取数据
 * @param  {String=} dbName 数据库名称(可选)
 * @param  {String} storeName 存储空间名称
 * @param  {Object} condition 查询条件
 * @return {Object}           Promise对象，添加成功之后会触发它的resolve方法
 *                            并在resolve中传入查询结果
 */
const get = function() {
  let dbName;
  let storeName;
  let condition;
  if ( arguments.length <= 2 ) {
    dbName = appDBName;
    storeName = arguments[0];
    condition = arguments[1];
  } else {
    dbName = arguments[0];
    storeName = arguments[1];
    condition = arguments[2];
  }

  return new Promise( resolve => {
    indexedDB.open(dbName).onsuccess = function(e) {
      const db = e.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      const keys = Object.keys(condition)
      const key = keys[0];

      const onsuccess = function(event) {
        resolve(event.target.result);
      };
      if (key === 'id') {
        store.get(condition[key]).onsuccess = onsuccess;
      } else {
        const index = store.index(key);
        index.getAll(condition[key]).onsuccess = onsuccess;
      }
    }
  })
}

/**
 * 删除数据
 * @param  {String=} dbName 数据库名称(可选)
 * @param  {String} storeName 存储空间名称
 * @param  {Object} condition 查询条件
 * @return {Object}           Promise对象，添加成功之后会触发它的resolve方法
 */
const delete_ = function() {
  let dbName;
  let storeName;
  let condition;
  if ( arguments.length <= 2 ) {
    dbName = appDBName;
    storeName = arguments[0];
    condition = arguments[1];
  } else {
    dbName = arguments[0];
    storeName = arguments[1];
    condition = arguments[2];
  }

  return new Promise( resolve => {
    indexedDB.open(dbName).onsuccess = function(e) {
      const db = e.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      const keys = Object.keys(condition);
      const key = keys[0];

      const onDelSuccess = function(deletedItem) {
        resolve(deletedItem);
      };

      const onGetSuccess = function(event) {
        const deletingItem = event.target.result;
        store.delete(condition[key]).onsuccess = () => onDelSuccess(deletingItem);
      };

      if (key === 'id') {
        store.get(condition[key]).onsuccess = onGetSuccess;
      } else {
        // const index = store.index(key);
        // index.delete(condition[key]).onsuccess = onsuccess;
      }
    }
  })
}

/**
 * 添加数据
 * @param  {String=} dbName 数据库名称(可选)
 * @param  {String} storeName 存储空间名称
 * @param  {Object} data      添加的数据
 * @return {Object}           Promise对象，添加成功之后会触发它的resolve方法
 *                            并在resolve中传入新添加数据的keypath值
 */
const insert = function() {
  let dbName;
  let storeName;
  let data;
  if ( arguments.length <= 2 ) {
    dbName = appDBName;
    storeName = arguments[0];
    data = arguments[1];
  } else {
    dbName = arguments[0];
    storeName = arguments[1];
    data = arguments[2];
  }

  /**
   * 正文
   */
  return new Promise( resolve => {
    indexedDB.open(dbName).onsuccess = function(e) {
      const db = e.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const req = store.add(data);

      req.onsuccess = function(event) {
        resolve(event.target.result);
      }
    }
  })
}

/**
 * 修改数据
 * @param  {String=} dbName 数据库名称(可选)
 * @param  {String} storeName 存储空间名称
 * @param  {Object} data      修改的数据
 * @return {Object}           Promise对象，添加成功之后会触发它的resolve方法
 *                            并在resolve中传入新添加数据的keypath值
 */
const update = function() {
  let dbName;
  let storeName;
  let data;
  if ( arguments.length <= 2 ) {
    dbName = appDBName;
    storeName = arguments[0];
    data = arguments[1];
  } else {
    dbName = arguments[0];
    storeName = arguments[1];
    data = arguments[2];
  }

  /**
   * 正文
   */
  return new Promise( resolve => {
    indexedDB.open(dbName).onsuccess = function(e) {
      const db = e.target.result;
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      // indexedDB会自动根据data中的主键(id)进行更新，只需传入新的data即可
      const req = store.put(data);

      req.onsuccess = function(event) {
        resolve(event.target.result);
      }
    }
  })
}

export default {
  createDB,
  get,
  getAll,
  insert,
  delete: delete_,
  update
}
