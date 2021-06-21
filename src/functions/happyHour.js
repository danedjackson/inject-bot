const date = require('date-and-time');
const fs = require('fs');
const path = require('path');
const happyHourTimePath = path.resolve(__dirname, "../json/happy-hour.json");
const pattern = date.compile('HH:mm');

function setHappyHour ( timeFrom, timeTo ) {
    try {
        //The MMM/DD/YYYY does not matter and we'll just be looking at the HH:MM passed in
        timeFrom = new Date(`06/21/2021 ${timeFrom}`);
        timeTo = new Date(`06/21/2021 ${timeTo}`);

        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        happyHour.from = date.format(timeFrom, pattern);
        happyHour.to = date.format(timeTo, pattern);

        fs.writeFileSync(happyHourTimePath, JSON.stringify(happyHour, null, 4));
        return true;
    } catch ( err ) {
        console.log(`Error setting happy hour time: ${err}`);
        return false;
    }
}

function removeHappyHour ( ) {
    try {
        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        happyHour.from = null;
        happyHour.to = null;

        fs.writeFileSync(happyHourTimePath, JSON.stringify(happyHour, null, 4));
        return true;
    } catch ( err ) {
        console.log(`Error removing happy hour time: ${err}`);
        return false;
    }
}

function isHappyHour () {
    try {
        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        var now = date.format(new Date(), pattern);

        if (happyHour.from < now && happyHour.to > now) {
            return true;
        } else {
            return false;
        }
    } catch ( err ) {
        console.log(`Error checking happy hour time: ${err}`);
        return false;
    }
}

module.exports = { setHappyHour, removeHappyHour, isHappyHour };