const fs = require('fs');
const path = require('path');

class StorageManager {
    moveFile(localPath, remoteSubDir = '') {
        // In local desktop mode, we just keep files where they are or move to a central downloads folder
        console.log(`[Storage] Local mode: File at ${localPath}`);
    }
}

module.exports = new StorageManager();
