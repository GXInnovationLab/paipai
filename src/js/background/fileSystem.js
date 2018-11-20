const createSuccessMsg = msg => {
  return {
    success: true,
    msg: msg || 'Success'
  }
}

const util = {};
util.toArray = function(list) {
    return Array.prototype.slice.call(list || [], 0);
};

const createFailedMsg = msg => {
  return {
    success: false,
    msg: msg || 'Failed'
  }
}

/**
 * request file system
 * @param  {[type]} fs [description]
 * @return {[type]}    [description]
 */
const fileSystemObj = {
  fs: null,
  size: 500 * 1024 * 1024, // 500M

  errorHandler: function(e) {
    switch (e.name) {
      case 'QuotaExceededError':
          break;
      case 'NotFoundError':
          break;
      case 'SecurityError':
          break;
      case 'InvalidStateError':
          break;
      case 'InvalidModificationError':
          break;
      default:
    }
  },

  /**
   * [initialize description]
   * @return {[type]} [description]
   */
  initialize: function() {
    window.requestFileSystem(window.PERSISTENT, this.size, function (fs) {
      fileSystemObj.fs = fs;
    })
  },

  /**
   * [load description]
   * @return {[type]} [description]
   */
  load: function() {
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    if (window.requestFileSystem) {
      navigator.webkitPersistentStorage.queryUsageAndQuota(function(usage, quota) {
        // check if the user has requested quota
        if (!quota) {
          // The user has NOT requested quota
          navigator.webkitPersistentStorage.requestQuota(
            fileSystemObj.size,
            function (grantedBytes) {
              fileSystemObj.initialize();
            },
            fileSystemObj.errorHandler
          );
        } else {
          fileSystemObj.initialize();
        }
      });
    }
  },

  /**
   * [description]
   * @return {[type]}                              [description]
   */
  createFile: function() {
    let fileName, byteArray, contentType, dirEntry;
    if (arguments.length === 4) {
      [fileName, byteArray, contentType, dirEntry] = arguments;
    } else if (arguments.length < 4) {
      [fileName, dirEntry] = arguments;
    } else {
      console.error('Arguments error');
      return;
    }
    return new Promise( resolve => {
      dirEntry = dirEntry !== undefined ? dirEntry : fileSystemObj.fs.root;
      dirEntry.getFile(fileName, {create: true, exlusive: true}, function(fileEntry) {
        // Create FileWriter instance
        byteArray !== undefined ?
        fileEntry.createWriter(function(fileWriter) {
          fileWriter.onwriteend = function(e) {
            resolve(createSuccessMsg('Write end'));
          };
          fileWriter.onerror = function(e) {
            resolve(createFailedMsg('Write failed'));
          };
          // Use ArrayBuffer, Blob instances to write file, but it's not recommended to use BlobBuilder
          fileWriter.write(new Blob([byteArray], {type: contentType}));
        }, fileSystemObj.errorHandler) :
        resolve(createSuccessMsg('Created'));
      }, fileSystemObj.errorHandler);
    });
  },

  /**
   * [description]
   * @param  {[type]} directoryName [description]
   * @param  {[type]} fileName      [description]
   * @param  {[type]} byteArray     [description]
   * @return {[type]}               [description]
   */
  createFileInDirectory: (fileName, byteArray, contentType, dirName) => new Promise((resolve, reject) => {
    fileSystemObj.fs.root.getDirectory(dirName, {}, async dirEntry => {
      const result = await fileSystemObj.createFile(fileName, byteArray, contentType, dirEntry);
      result.success ? resolve() : reject();
    });
  }),

  /**
   * [createFolder description]
   * @return {[type]} [description]
   */
  createDirectory: dirName => new Promise( resolve => {
    fileSystemObj.fs.root.getDirectory(dirName, {
      create: true,
      exclusive: true
    }, function () {
      resolve(createSuccessMsg());
    }, function (e) {
      invalidOpForEntryType_(e, cmd, dirName);
    });
  }),

  removeDirectory: dirName => new Promise( resolve => {
    fileSystemObj.fs.root.getDirectory(dirName, {}, dirEntry => {
      dirEntry.removeRecursively(() => {
        resolve(createSuccessMsg('Directory removed'));
      })
    })
  }),

  removeFile: fileName => new Promise( resolve => {
    fileSystemObj.fs.root.getFile(fileName, {}, fileEntry => {
      fileEntry.remove(() => {
        resolve(createSuccessMsg());
      })
    })
  }),

  /**
   * [readFile description]
   * @return {[type]} [description]
   */
  readFile: fileName => new Promise( resolve => {
    fileSystemObj.fs.root.getFile('log.txt', {}, function(fileEntry) {
      fileEntry.file(function(file) {
        const reader = new FileReader();
        reader.onloadend = function(e) {
          const txtArea = document.createElement('textarea');
          txtArea.value = this.result;
        };
        reader.readAsText(file);
      }, fileSystemObj.errorHandler)
    }, fileSystemObj.errorHandler)
  }),

  /**
   * [list description]
   * @return {[type]} [description]
   */
  list: () => new Promise( resolve => {
    const reader = fileSystemObj.fs.root.createReader();
    let entries = [];

    const readEntries = function() {
      reader.readEntries(function (results) {
        if (!results.length) {
          entries = entries.sort();
          resolve(entries);
        } else {
          entries = entries.concat(util.toArray(results));
          readEntries();
        }
      }, fileSystemObj.errorHandler);
    };

    readEntries();
  }),

  removeAllDirectories: async() => {
    const res = await fileSystem.list();
    res.forEach( item => {
      if (item.isDirectory) {
        fileSystem.removeDirectory(item.name)
      }
    });
    return true;
  },

  removeAll: async() => {
    const res = await fileSystem.list();
    res.forEach( item => {
      if (item.isDirectory) {
        fileSystemObj.removeDirectory(item.name);
      } else {
        fileSystemObj.removeFile(item.name);
      }
    });
    return true;
  }
};

window.f = fileSystemObj;

export default fileSystemObj;