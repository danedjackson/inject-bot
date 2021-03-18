//Loads environment variables from the .env file
require('dotenv').config();
// console.log(process.env.BOT_TOKEN);

//Importing from discord.js module
const Discord = require('discord.js');
const ftp = require('basic-ftp');
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const updateCount = require('./server_pop.js');

const token = process.env.BOT_TOKEN;
const prefix = process.env.PREFIX;
const ftpLocation = process.env.FTPLOCATION;
const ftpPort = process.env.FTPPORT;
const ftpusername = process.env.FTPUSERNAME;
const ftppassword = process.env.FTPPASSWORD;
const ownerID = process.env.OWNERID;
const devID = process.env.DEVID;
const steamKey = process.env.STEAMKEY;
const adminRole = process.env.STEAMUPDATEROLE;

const dinoPrices = JSON.parse(fs.readFileSync("prices.json"));
const adultNames = JSON.parse(fs.readFileSync("names.json"));
const injectDinoPrices = JSON.parse(fs.readFileSync("inject-prices.json"));
const injectDinoNames = JSON.parse(fs.readFileSync("inject-names.json"));

var app = express();
var steamID;
var dinoName;
var cash;
var price;
var bank;
var serverCount;
var paymentMethod;
var server;
var gender;
var isSteamValid;


//Create an instance of client
const client = new Discord.Client();
const ftpClient = new ftp.Client();

//Keep Bot alive on Heruko
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Running on port ${ PORT }`);
});
app.get('/',(req,res) => {
    return res.send('Hello');
    });

client.on("ready", () => {
    console.log(`${client.user.tag} logged in.`)
    client.user.setActivity('with babu Dibbles.');
});

function serverCountLoop() {
    setTimeout(async function() {
        await getServerCount();
        await updateCount(client, serverCount);
        serverCountLoop();
    }, 5000);
}

//TODO: Implement this
function cancelCheck(msg) {
    if (msg.toLowerCase() === "cancel") {
        return true;
    }
    return false;
}

serverCountLoop();

client.on("message", async message => {
    if (message.author.bot) return

    if (message.content.startsWith(prefix)) {
        // console.log(`${message.guild.id} | ${message.author.id} | ${message.author.tag}: ${message.content}`);
        //Assigning the bot command to respective variables using the spreader operator ...
        const [cmdName, ...args] = message.content
            .trim()
            .substring(prefix.length)
            .split(/ +/g);
        
        //Await Message for interactive buying
        if (cmdName.toLowerCase() === 'buy') {
            if (args.length == 0) {
                var msg;
                var command;
                const filter = m => m.author.id === message.author.id;
                const options = {
                    max: 1
                };
                const questions = new Discord.MessageEmbed()
                    .setTitle('Buy Interactive Menu')
                    .setColor('#DAF7A6')
                    .addFields(
                        {name: "Do you want to grow? Or do you want to inject?",
                        value: "Please type either:\ngrow\ninject"}
                    );
                //Send initial embed
                message.reply(questions);
                await message.channel.awaitMessages(filter, options).then((collected)=>{command = collected.first().content});
                
                //Remove current embed fields and replacing it as process goes along
                questions.fields = [];
                questions.addFields({name: "Which server?", value: "Please type either:\n1\n2"});
                message.reply(questions);
                await message.channel.awaitMessages(filter, options).then((collected)=>{server = collected.first().content});

                questions.fields = [];
                questions.addFields({name: "Male or female?", value: "Please type either:\nm\nf"});
                message.reply(questions);
                await message.channel.awaitMessages(filter, options).then((collected)=>{gender = collected.first().content});

                questions.fields = [];
                questions.addFields({name: "Type the dinosaur you desire", value: "For example:\nUtah\nAllo"});
                message.reply(questions);
                await message.channel.awaitMessages(filter, options).then((collected)=>{dinoName = collected.first().content});

                questions.fields = [];
                if (command.toLowerCase() != "inject"){
                    questions.addFields({name: "Enter your steam ID", value: "Either click the 17 digit code next to your name in game to copy it and paste it here.\n\nOr go to Steam > View > Settings > Interface > Check 'Display web address bars when available' > Go to your profile. Your steam ID is the 17 digit code in the address bar."});
                    message.reply(questions);
                    await message.channel.awaitMessages(filter, options).then((collected)=>{steamID = collected.first().content});
                }
                if (command.toLowerCase() === "inject") {
                    if (await getSteamID(message.author.id) == false) return message.reply(`in order to use inject, you must link your steam ID\nuse ~link [steam ID here]`);
                    steamID = await getSteamID(message.author.id);
                    if(dinoName.length < 3) {
                        return message.reply(
                            `I do not know a dino by the name of ${dinoName}.`
                        );
                    }
                    await getUserAmount(message.guild.id, message.author.id);
                    price = null;
        
                    for (var x = 0; x < injectDinoPrices.length; x++) {
                        if(injectDinoPrices[x].Dino.toLowerCase()
                                        .indexOf(dinoName.toLowerCase()) !== -1) {
                            price = parseInt(injectDinoPrices[x].Price);
                            break;
                        }
                    }
                    
                    if(!price) {
                        return message.reply(`that dino cannot be injected.`);
                    }
                    if(bank > price) {
                        paymentMethod = "bank";
                        await ftpDownload(message, server, "inject");
                    } else if(cash >= price) {
                        paymentMethod = "cash";
                        await ftpDownload(message, server, "inject");
                    } else if (cash <= price && bank < price) {
                        return message.reply('you do not have enough points for this dino.');
                    } else {
                        return message.reply(`I'm having trouble growing that dino.`);
                    }
                } else if (command.toLowerCase() === "grow") {
                    if(dinoName.length < 3) {
                        return message.reply(
                            `I do not know a dino by the name of ${dinoName}.`
                        );
                    }
                    //waits for axios to finish its call to assign cash and bank values.
                    await getUserAmount(message.guild.id, message.author.id);
                    price = null;
        
                    //Getting price of dinosaur from json object.
                    for (var x = 0; x < dinoPrices.length; x++){
                        if (dinoPrices[x].Dino.toLowerCase()
                                        .indexOf(dinoName.toLowerCase()) !== -1){
                            price = parseInt(dinoPrices[x].Price);
                            break;
                        }
                    }
                    if(bank > price) {
                        //Start ftp chain call
                        paymentMethod = "bank";
                        await ftpDownload(message, server, "grow");
                    } else if(cash >= price) {
                        paymentMethod = "cash";
                        await ftpDownload(message, server, "grow");
                    } else if (cash <= price && bank < price) {
                        return message.reply('you do not have enough points for this dino.');
                    } else {
                        return message.reply(`I'm having trouble growing that dino.`);
                    }
                }
            }
            else {
                message.reply(`please use ~buy`);
            }
        }

        if (cmdName.toLowerCase() === 'link') {
            isSteamValid = null;
            if (args.length != 1) return message.reply(`please paste your steam ID with the format:\n${prefix}link [Your Steam ID Here]`);
            if(await addSteamID(message.author.id, args[0]) == false) return message.reply(`that does not seem to be a valid steam ID, or it is already in use. Please try again.`);
            return message.reply(`your steam ID has been linked.`);
        }

        if (cmdName.toLowerCase() === 'updatesteamid') {
            isSteamValid = null;
            if (args.length != 2) return message.reply(`please use this format:\n${prefix}updatesteamid [@User to update] [Updated Steam ID]`);
            if (message.member.roles.cache.find(r => r.name.toLowerCase() === adminRole.toLowerCase())) {
                if(await updateSteamID(args[0], args[1]) == false) return message.reply(`that steam ID may already exist or is invalid. Please try again`);
                return message.reply(`${args[0]}'s steam ID has been updated.`)
            } else return message.reply(`you do not have rights to use this command.`);
        }

        if (cmdName.toLowerCase() === 'inject') {
            if(args.length != 3) {
                return message.reply(
                    'please tell me your steam ID and the dino you are requesting with the format:\n' +
                    `${prefix}inject [server(1/2)] [gender(m/f)] [dinosaur name to inject]`);
            }
            server = args[0];
            gender = args[1];
            dinoName = args[2];
            steamID = await getSteamID(message.author.id);
            if (await getSteamID(message.author.id) == false) return message.reply(`in order to use inject, you must link your steam ID\nuse ~link [steam ID here]`);
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}.`
                );
            }
            await getUserAmount(message.guild.id, message.author.id);
            price = null;

            for (var x = 0; x < injectDinoPrices.length; x++) {
                if(injectDinoPrices[x].Dino.toLowerCase()
                                .indexOf(dinoName.toLowerCase()) !== -1) {
                    price = parseInt(injectDinoPrices[x].Price);
                    break;
                }
            }
            
            if(!price) {
                return message.reply(`that dino cannot be injected.`);
            }
            if(bank > price) {
                paymentMethod = "bank";
                await ftpDownload(message, server, "inject");
            } else if(cash >= price) {
                paymentMethod = "cash";
                await ftpDownload(message, server, "inject");
            } else if (cash <= price && bank < price) {
                return message.reply('you do not have enough points for this dino.');
            } else {
                return message.reply(`I'm having trouble growing that dino.`);
            }
        }

        if (cmdName.toLowerCase() === 'grow'){
            if(args.length != 3) {
                return message.reply(
                    'please tell me your steam ID and the dino you are requesting with the format:\n' +
                    `${prefix}grow [server] [dinosaur on server to grow] [your steam ID] `);
            }
            server = args[0];
            dinoName = args[1];
            steamID = args[2];
            if(dinoName.length < 3) {
                return message.reply(
                    `I do not know a dino by the name of ${dinoName}.`
                );
            }
            //waits for axios to finish its call to assign cash and bank values.
            await getUserAmount(message.guild.id, message.author.id);
            price = null;

            //Getting price of dinosaur from json object.
            for (var x = 0; x < dinoPrices.length; x++){
                if (dinoPrices[x].Dino.toLowerCase()
                                .indexOf(dinoName.toLowerCase()) !== -1){
                    price = parseInt(dinoPrices[x].Price);
                    break;
                }
            }
            if(bank > price) {
                //Start ftp chain call
                paymentMethod = "bank";
                await ftpDownload(message, server, "grow");
            } else if(cash >= price) {
                paymentMethod = "cash";
                await ftpDownload(message, server, "grow");
            } else if (cash <= price && bank < price) {
                return message.reply('you do not have enough points for this dino.');
            } else {
                return message.reply(`I'm having trouble growing that dino.`);
            }
        } 

        if (cmdName === 'price'){
            await getDinoPrices(message);
        }
    }
});

//APIs
async function getServerCount() {
    return await axios.get("https://server-count.herokuapp.com/serv-count")
        .then(function (response){
            serverCount = response.data;
        })
        .catch(function (error) {
            console.log("Error fetching server count: " + error);
        })
        .then(function () {
        })
}

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
            console.log("Error: " + error.message);
        })
        .then(function () {
            // always executed
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
    })
    .catch(function (error) {
        console.log("Error: " + error.message);
    })
    .then(function () {

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
        // console.log(response.data);
    })
    .catch(function (error) {
        console.log("Error: " + error.message);
    })
    .then(function () {

    });
}

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
            console.log("Error fetching server count: " + error);
        })
        .then(function () {
        })
}

//FTP Connections
async function ftpDownload(message, server, option) {
    console.log("Downloading file. . .");
    //ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        //server checks
        if (server == 1){
            await ftpClient.downloadTo(steamID + ".json", "/23.227.165.234_14010/TheIsle/Saved/Databases/Sandbox/Players/"  + steamID + ".json");
        } else {
            return message.reply(`type either 1 or 2 for server selection.`)
        }
    } catch(err){
        console.error("Error downloading file: " + err.message);
        return message.reply('something went wrong trying to grow your dino.\nDid you enter the correct steam ID? Or do you have a dinosaur on the server?');
    }
    ftpClient.close();
    await editJson(message, option);
}

async function editJson(message, option) {
    let data = fs.readFileSync(steamID + ".json", "utf-8");
    var contents;
    if (option.toLowerCase() === "grow"){
        try {
            contents = JSON.parse(data);
            //Spino check ;)
            if (contents.CharacterClass.toLowerCase().indexOf("spino") != -1 && contents.bGender == true) {
                deleteLocalFile();
                return message.reply(`Spinosaurus has to be male to receive a grow.`);
            }
            if (contents.CharacterClass.toLowerCase().indexOf(dinoName.toLowerCase()) != -1 
                    || dinoName.toLowerCase().indexOf(contents.CharacterClass.toLowerCase()) != -1){
                if(dinoName.toLowerCase() === 'cera') dinoName = 'ceratosaurus';
                //Change the value of juvi to Adult from the list of adult names defined
                for(var i = 0; i < adultNames.length; i++) {
                    if(adultNames[i].Dino.toLowerCase().indexOf(dinoName.toLowerCase()) != -1) {
                        contents.CharacterClass = adultNames[i].Name;
                    }
                }
                contents.Growth = "1.0";
                contents.Hunger = "9999";
                contents.Thirst = "9999";
                contents.Stamina = "9999";
                contents.Health = "15000";
            } else {
                deleteLocalFile();
                return message.reply(`you do not have a '${dinoName}' on the server.\nMake sure you have already created a dino, safelogged and checked the spelling.`);
            }
        } catch (err) {
            console.error("Error editing local JSON: " + err);
            deleteLocalFile();
            return message.reply('something went wrong trying to grow your dino. Please try again later.');
        }
        fs.writeFileSync(steamID + ".json", JSON.stringify(contents, null, 4));
        await ftpUpload(message, option);
    }
    if (option.toLowerCase() === "inject"){
        try {
            contents = JSON.parse(data);
            for(var i = 0; i < injectDinoNames.length; i++) {
                if(injectDinoNames[i].Dino.toLowerCase().indexOf(dinoName.toLowerCase()) != -1) {
                    contents.CharacterClass = injectDinoNames[i].Name;
                }
            }
            contents.Growth = "1.0";
            contents.Hunger = "9999";
            contents.Thirst = "9999";
            contents.Stamina = "9999";
            contents.Health = "15000";
            if (gender.toLowerCase().charAt(0) === "m") {
                contents.bGender = false;
            } else if (gender.toLowerCase().charAt(0) === "f") {
                contents.bGender = true;
            }
        } catch (err) {
            console.error("Error editing local JSON: " + err);
            deleteLocalFile();
            return message.reply('something went wrong trying to inject your dino. Please try again later.');
        }
        fs.writeFileSync(steamID + ".json", JSON.stringify(contents, null, 4));
        await ftpUpload(message, option);
    }
}

async function ftpUpload(message, option) {
    console.log("Uploading file. . .");
    //ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        if(paymentMethod.indexOf("cash") != -1) {
            await deductUserAmountCash(message.guild.id, message.author.id, price);
        } 
        if(paymentMethod.indexOf("bank") != -1) {
            await deductUserAmountBank(message.guild.id, message.author.id, price);
        }
        await ftpClient.uploadFrom(steamID + ".json", "/23.227.165.234_14010/TheIsle/Saved/Databases/Sandbox/Players/" +steamID + ".json");

        if(option.toLowerCase() === "grow"){
            message.reply('dino grown successfully.');
        } else if (option.toLowerCase() === "inject") {
            message.reply(`dino injected successfully.`);
        }
    } catch(err){
        console.error("Error uploading JSON file: " + err.message);
        return message.reply('something went wrong trying to grow your dino. Please try again later.');
    }
    deleteLocalFile();
    ftpClient.close();
}

async function deleteLocalFile() {
    console.log("Deleting local files . . .");
    fs.unlink("./" + steamID + ".json", (err) => {
        if (err) throw err;
    });
}

//Misc
async function getDinoPrices(message) {
    let file = fs.readFileSync('prices.json');
    var data = JSON.parse(file);
    var msg = "";

    for (var x = 0; x < data.length; x++){
        msg += data[x].Dino + ": $" + data[x].Price.toLocaleString() + "\n\n";
    }

    const embed = new Discord.MessageEmbed()
    .setTitle('To request a grow, use the command:\n~grow [YOUR  STEAM ID] [DINOSAUR TO GROW]')
    .setColor('#DAF7A6')
    .addFields(
        {name: "\n🦎__**DINOSAUR PRICES (Points)**__🦎\n\n",
        value: msg}
    )
    
    return message.reply(embed);
}

async function getSteamID (id) {
    const steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
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
    const steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
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
            fs.writeFileSync("steam-id.json", JSON.stringify(steamInfo, null, 4));
            sendFile(steamInfo);
            return true;
        }
    }
    return false;
}
async function addSteamID (userID, steamID) {
    await checkIDValid(steamID);
    if (isSteamValid == false) return false;
    const steamInfo = JSON.parse(fs.readFileSync("steam-id.json"));
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
    steamInfo.push({
        "User": userID,
        "SteamID": steamID
    });
    fs.writeFileSync("steam-id.json", JSON.stringify(steamInfo, null, 4));
    sendFile(steamInfo);
    return true;
}

//sending message to owner for lives backup
function sendFile(info) {
    // client.users.fetch(ownerID, false).then((user) => {
    //     user.send("||" + JSON.stringify(info, null, 4) + "||");
    // });
    client.users.fetch(devID, false).then((user) => {
        user.send("||" + JSON.stringify(info, null, 4) + "||");
    });
}
client.login(token);