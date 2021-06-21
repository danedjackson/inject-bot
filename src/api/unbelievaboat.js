const axios = require('axios');

async function getUserAmount(guildID, userID) {
    return await axios.get(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, {
            headers: {
                'Authorization': process.env.MONEY_BOT_AUTH
            }
        })
        .then(function (response) {
            // handle success
            bank = response.data.bank;
            cash = response.data.cash;
        })
        .catch(function (error) {
            // handle error
            console.error("Error: " + error.message);
            return false;
        })
        .then(function () {
            // always executed
            return [bank, cash];
        }
    );
}

async function deductUserAmountCash(guildID, userID, price) {
    return await axios.patch(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "-" + price,
        bank: "0"
    }, 
    {
        headers: {
            'Authorization': process.env.MONEY_BOT_AUTH
        }
    })
    .then(function (response) {
        // console.log(response.data);
        return true;
    })
    .catch(function (error) {
        console.error("Error: " + error.message);
        return false;
    });
}
async function deductUserAmountBank(guildID, userID, price) {
    return await axios.patch(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "0",
        bank: "-" + price
    }, 
    {
        headers: {
            'Authorization': process.env.MONEY_BOT_AUTH
        }
    })
    .then(function (response) {
        return true;
    })
    .catch(function (error) {
        console.error("Error: " + error.message);
        return false;
    });
}
async function addUserAmountBank(guildID, userID, amount) {
    return await axios.patch(process.env.MONEY_BOT_URL + "/guilds/" + guildID + "/users/" + userID, 
    {
        cash: "0",
        bank: amount
    }, 
    {
        headers: {
            'Authorization': process.env.MONEY_BOT_AUTH
        }
    })
    .then(function (response) {
        return true;
    })
    .catch(function (error) {
        console.error("Error: " + error.message);
        return false;
    });
}

module.exports = { getUserAmount, deductUserAmountCash, deductUserAmountBank, addUserAmountBank }