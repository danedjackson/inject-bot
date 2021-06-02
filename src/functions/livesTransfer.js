
const fs = require('fs');
const path = require('path');

function transferLives(message, toUserID, amount) {
    var deducted = false;
    var fromUserFound = false;
    var toUserFound = false;
    amount = parseInt(amount);

    if ( message.author.id === toUserID ){
        message.reply(`you cannot transfer lives to yourself!`);
        return false;
    }
    if ( amount < 1 ) {
        message.reply(`you must transfer 1 or more lives.`);
        return false;
    }

    var lives = JSON.parse(fs.readFileSync(path.resolve("../updatedLivesBot/lives.json")));
    for (var [userID, livesAmount] of Object.entries(lives)) {
        if( toUserID === userID ) {
            toUserFound = true;
            lives[toUserID] = parseInt(livesAmount + amount);
        }
        if (message.author.id === userID) {
            fromUserFound = true;
            lives[message.author.id] = parseInt(livesAmount -= amount);
            if (livesAmount <= -1){
                message.reply(`you do not have enough lives to transfer.`);
                return false;
            }
            deducted = true;
        }
    }
    if (!fromUserFound) {
        message.reply(`I could not find your lives information, please try again.`);
        return false;
    }
    
    if (deducted) {
        if( !toUserFound ) {
            lives[toUserID] = parseInt(0 + amount);
        }

        fs.writeFileSync(path.resolve("../updatedLivesBot/lives.json"), JSON.stringify(lives, null, 4));
        console.log(`${message.author.username} | ${message.author.id} transferred ${amount} lives to user: ${toUserID}`);
        
        if( amount == 1 ){
            message.reply(`you have successfully transferred ${amount} life to <@${toUserID}>`);
        } else {
            message.reply(`you have successfully transferred ${amount} lives to <@${toUserID}>`);
        }
        return true;
    }
    message.reply(`something went wrong.`);
    return false;
}

module.exports = { transferLives };