const date = require('date-and-time');
const fs = require('fs');
const path = require('path');
const transferHistoryPath = path.resolve(__dirname, "../json/transfer-history.json");
const pattern = date.compile('ddd, MMM DD YYYY HH:mm:ss');

function storeTransferHistory(userId) {
    var history = JSON.parse(fs.readFileSync(transferHistoryPath));
    var now = new Date();
    for (var x = 0; x < history.length; x++) {
        if (history[x].user == userId) {
            history[x].time = date.format(now, pattern);
            fs.writeFileSync(transferHistoryPath, JSON.stringify(history, null, 4));
            return true;
        }
    }
    history.push({
        "user": userId,
        "time": date.format(now, pattern)
    });
    fs.writeFileSync(transferHistoryPath, JSON.stringify(history, null, 4));
    return true;
}

function hoursSinceLastTransfer(userId) {
    var history = JSON.parse(fs.readFileSync(transferHistoryPath));
    var lastTransfer;

    for ( var x = 0; x < history.length; x++ ) {
        if ( history[x].user == userId ) {
            lastTransfer = new Date(history[x].time);
            var now = new Date();
            return (now.getTime() - lastTransfer.getTime())/( 1000 * 3600 );
        }
    }
    //Not found? Return -1
    return -1;
}

module.exports = { storeTransferHistory, hoursSinceLastTransfer };