const date = require('date-and-time');
const fs = require('fs');
const path = require('path');
const happyHourTimePath = path.resolve(__dirname, "../json/happy-hour.json");
const timePattern = date.compile('HH:mm');
const dayPattern = date.compile('ddd');

function setHappyHour ( timeFrom, timeTo ) {
    try {
        //The MMM/DD/YYYY does not matter and we'll just be looking at the HH:MM passed in
        timeFrom = new Date(`06/21/2021 ${timeFrom}`);
        timeTo = new Date(`06/21/2021 ${timeTo}`);

        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        happyHour.from = date.format(timeFrom, timePattern);
        happyHour.to = date.format(timeTo, timePattern);

        fs.writeFileSync(happyHourTimePath, JSON.stringify(happyHour, null, 4));
        return true;
    } catch ( err ) {
        console.log(`Error setting happy hour time: ${err}`);
        return false;
    }
}

function addHappyHourDay( day ) {
    try{
        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        console.log(happyHour);
        happyHour['day'].push(day);
        console.log(happyHour);

        fs.writeFileSync(happyHourTimePath, JSON.stringify(happyHour, null, 4));
        return true;
    }catch ( err ) {
        console.log(`Error setting happy hour day: ${err}`);
        return false;
    }
}

function removeHappyHour ( ) {
    try {
        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        happyHour.from = null;
        happyHour.to = null;
        happyHour.day = [];

        fs.writeFileSync(happyHourTimePath, JSON.stringify(happyHour, null, 4));
        return true;
    } catch ( err ) {
        console.log(`Error removing happy hour time: ${err}`);
        return false;
    }
}

function isHappyHour () {
    try {
        var isHappyDay = false;
        var happyHour = JSON.parse( fs.readFileSync( happyHourTimePath ) );
        var nowTime = date.format(new Date(), timePattern);
        var nowDay = date.format(new Date(), dayPattern);
        for ( var x = 0; x < Object.keys(happyHour['day']).length; x++ ) {
            if ( nowDay.toLowerCase() === happyHour.day[x].toLowerCase() ) {
                isHappyDay = true;
                break;
            }
        }

        if ((happyHour.from < nowTime && happyHour.to > nowTime) || isHappyDay) {
            return true;
        } else {
            return false;
        }
    } catch ( err ) {
        console.log(`Error checking happy hour time: ${err}`);
        return false;
    }
}

module.exports = { setHappyHour, removeHappyHour, isHappyHour, addHappyHourDay };