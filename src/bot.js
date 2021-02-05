//Loads environment variables from the .env file
require('dotenv').config();
// console.log(process.env.BOT_TOKEN);

//Importing from discord.js module
const { Client } = require('discord.js');
const ftp = require('basic-ftp');
const fs = require('fs');

const token = process.env.BOT_TOKEN;
const prefix = process.env.PREFIX;
const ftpLocation = process.env.FTPLOCATION;
const ftpPort = process.env.FTPPORT;
const ftpusername = process.env.FTPUSERNAME;
const ftppassword = process.env.FTPPASSWORD;

var steamID;
var dinoName;

console.log(prefix);
//Create an instance of client
const client = new Client();
const ftpClient = new ftp.Client();

async function ftpDownload() {
    ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        console.log(await ftpClient.ftp.pwd);
        console.log(await ftpClient.list());
        await ftpClient.downloadTo(steamID + ".zip", "512KB.zip");
        // await ftpClient.downloadTo("Injection.json", steamID + ".json");
    } catch(err){
        console.error(err);
    }
    ftpClient.close();
    editJson(steamID);
}

function editJson() {
    let data = fs.readFileSync("Injection.json", "utf-8");
    var contents;
    try {
        contents = JSON.parse(data);
        contents.Growth = "1.0";
        contents.Hunger = "9999";
        contents.Thirst = "9999";
        contents.Stamina = "9999";
    } catch (err) {
        console.error(err);
    }
    console.log(contents);
    fs.writeFileSync(steamID + ".json", JSON.stringify(contents));
    ftpUpload();
}

async function ftpUpload() {
    console.log("Uploading file. . .")
    ftpClient.ftp.verbose = true;
    ftpClient.ftp.ipFamily = 4;
    try {
        await ftpClient.access({
            host: ftpLocation,
            port: ftpPort,
            user: ftpusername,
            password: ftppassword
        });
        await ftpClient.uploadFrom(steamID + ".json", "./upload/" + steamID + ".json");
    } catch(err){
        console.error(err);
    }
    ftpClient.close();
    deleteLocalFile();
}

async function deleteLocalFile() {
    console.log("Deleting local files . . .");
    fs.unlink("./" + steamID + ".json", (err) => {
        if (err) throw err;
    });
}

client.on("ready", () => {
    console.log(`${client.user.tag} logged in.`)
    client.user.setActivity('in VSCODE.');
});

client.on("message", async message => {
    console.log(`${message.author.tag}: ${message.content}`);
    if (message.author.bot) {return;}
    if (message.content.indexOf(prefix) !== 0) {return;}

    //Separate our command name and arguments.
    const args = message.content.slice(prefix).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === prefix+"inject") {
        steamID = args[0];
        dinoName = args[1];
        console.log(`In if block\n${message.author.tag}: ${message.content}`);
        ftpDownload();
    }
});

client.login(token);