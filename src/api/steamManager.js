const fs = require('fs');
const axios = require('axios');
const path = require('path');
const steamKey = process.env.STEAMKEY;
var isSteamValid;

async function checkIDValid(id) {
    return await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${steamKey}&format=json&steamids=${id}`)
        .then(function(response) {
            if (response.data.response.players == "" || response.data.response.players== null || response.data.response.players == undefined ) {
                isSteamValid = false;
            } else {
                isSteamValid = true;
            }
        })
        .catch(function (error) {
            console.error("Error fetching server count: " + error);
        })
        .then(function () {
        })
}
async function getSteamID (id) {
    var steamInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../json/steam-id.json")));
    for (var x = 0; x < steamInfo.length; x++) {
        if (id == steamInfo[x].User)
            return steamInfo[x].SteamID;
    }
    return false;
}
async function updateSteamID (id, newID) {
    let userID = id.substring(3, id.length-1);
    await checkIDValid(newID);
    if (isSteamValid == false) return false;
    var steamInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../json/steam-id.json")));
    //Search if new ID already exists
    for (var i = 0; i < steamInfo.length; i++) {
        if(newID == steamInfo[i].SteamID) {
            return false;
        }
    }
    //Search for user
    for (var x = 0; x < steamInfo.length; x++) {
        //Found user
        if (userID == steamInfo[x].User){
            //Update user
            steamInfo[x].SteamID = newID;
            fs.writeFileSync(path.resolve(__dirname, "../json/steam-id.json"), JSON.stringify(steamInfo, null, 4));
            return true;
        }
    }
    return false;
}
async function addSteamID (userID, steamID) {
    await checkIDValid(steamID);
    if (isSteamValid == false) return false;
    var steamInfo = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../json/steam-id.json")));
    //Search for user
    for (var x = 0; x < steamInfo.length; x++) {
        //Found user
        if (userID == steamInfo[x].User)
            //User already exists
            return false;
    }
    //Check if steam id already exists
    for (var i = 0; i < steamInfo.length; i++) {
        if (steamID == steamInfo[i].SteamID){
            return false;
        }
    }
    //Replacing every character that is not a digit with empty.
    steamID = steamID.replace(/\D/g, '');
    steamInfo.push({
        "User": userID,
        "SteamID": steamID
    });
    fs.writeFileSync(path.resolve(__dirname, "../json/steam-id.json"), JSON.stringify(steamInfo, null, 4));
    return true;
}

module.exports = {getSteamID, updateSteamID, addSteamID}