const fs = require('fs');
const axios = require('axios');
const ownerID = process.env.OWNERID;
const steamKey = process.env.STEAMKEY;

//sending message to owner for lives backup
function sendFile(client, info) {
    client.users.fetch(ownerID, false).then((user) => {
        user.send("||" + JSON.stringify(info, null, 4) + "||");
    });
}

async function checkIDValid(id) {
    return await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamKey}&format=json&steamids=${id}`)
        .then(function(response) {
            console.log(response.data);
            console.log(response.data.response.players[0].steamid);
            if (response.data != null) {
                return true;
            } else {
                return false;
            }
        })
        .catch(function (error) {
            console.log("Error fetching server count: " + error);
        })
        .then(function () {
        })
}
module.exports = {
    getSteamId: async function (id) {
        const steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
        for (var x = 0; x < steamInfo.length; x++) {
            if (id == steamInfo[x].User)
                return steamInfo[x].SteamID;
        }
        return false;
    },
    updateSteamID: async function (id, newID) {
        if (! await checkIDValid(id) == false) return false;
        const steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
        //Search for user
        for (var x = 0; x < steamInfo.length; x++) {
            //Found user
            if (id == steamInfo[x].User)
                //Update user
                steamInfo[x].SteamID = newID;
                fs.writeFileSync("steam-id.json", JSON.stringify(steamInfo, null, 4));
                sendFile(steamInfo);
                return true;
        }
        return false;
    },
    addSteamID: async function (id, steamID) {
        if (await checkIDValid(id) == false) return false;
        if (await checkIDValid(steamID) == false) return false;
        const steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
        //Search for user
        for (var x = 0; x < steamInfo.length; x++) {
            //Found user
            if (id == steamInfo[x].User)
                //User already exists
                return false;
            else {
                steamInfo.push({
                    "User": id,
                    "SteamID": steamID
                });
                fs.writeFileSync("steam-id.json", JSON.stringify(steamInfo, null, 4));
                sendFile(steamInfo);
                return true;
            }
        }
        return false;
    }
}