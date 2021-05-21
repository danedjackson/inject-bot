var { getUserAmount, deductUserAmountCash, deductUserAmountBank, addUserAmountBank } = require('../api/unbelievaboat');

async function transferPoints(message, toUserID, amount) {
    var deducted = false;
    var userAmount = await getUserAmount(message.guild.id, message.author.id);
    var userBank = parseInt(userAmount[0]);
    var userCash = parseInt(userAmount[1]);

    if ( userBank < amount && userCash < amount + 0 ) {
        return message.reply(`you do not have enough points to transfer`);
    } else if ( userBank >= amount ) {
        deducted = await deductUserAmountBank(message.guild.id, message.author.id, amount);
    } else if (userBank < amount && userCash >= amount) {
        deducted = await deductUserAmountCash(message.guild.id, message.author.id, amount);
    }
    //TODO: Add to user bal
    if ( await addUserAmountBank(message.guild.id, toUserID, amount) == true && deducted == true ) {
        return message.reply(`you have transfered ${amount} points to <@${toUserID}>'s bank balance.`);
    } else {
        return message.reply(`something went wrong during the transfer, please try again later.`);
    }
}

module.exports = { transferPoints };