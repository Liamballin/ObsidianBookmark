const { 
    app, 
    BrowserWindow, 
    ipcMain, 
    dialog, 
    Menu, 
    Tray 
} = require('electron')

const open = require("open")

const express = require('express')
const serve = express()
const cors = require("cors")

const fs = require('fs')
const path = require('path')
var settings = require('./settings.json')

const port = settings.port || 43110;

//----------------------------------------- EXPRESS -----------------
serve.use(cors())

serve.get('/new/:bookmark', (req, res) => {

    let bm = JSON.parse(req.params.bookmark)

    console.log(bm)

    saveToVault(bm.text, bm.name)

    res.send('...') //todo send useful response
})

//ping route
serve.get('/', (req,res)=>{   

    res.send({alive:true})
})
//----------------------------------------- ELECTRON -----------------
var win;
var tray;
var isQuiting;


app.on('before-quit', function () {
    isQuiting = true;
  });


function createWindow(){

    tray = new Tray(path.join(__dirname, 'tray.png'))

    tray.setContextMenu(Menu.buildFromTemplate([
        {
          label: 'Show App', click: function () {

            win.show();
          }
        },
        {
          label: 'Quit', click: function () {

            isQuiting = true;

            app.quit();
          }
        }
      ]));

    win = new BrowserWindow({
        show:false,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // win.removeMenu()
    win.webContents.openDevTools()

    win.on('minimize',function(event){
        if(settings.close_to_tray){

            event.preventDefault();

            win.hide();
        }   
    });
    
    win.on('close', function (event) {

        if(settings.close_to_tray){

            if(!isQuiting){

                event.preventDefault();

                win.hide();

                event.returnValue = false
            }
        }   
    });

    win.loadFile('index.html')

    win.once('ready-to-show', () => {
        win.webContents.send("vault_loc", settings.vault_location)

        win.show()
    })
}


ipcMain.on("show-file-picker",(event,type) => {
    dialog.showOpenDialog({properties:['openDirectory']}).then(files => {
        if(!files){
            return;
        };
        var path = files.filePaths[0]

        if(type == "vault"){
            settings.vault_location = path;
        }else if(type == "save"){
            settings.save_location = path;
        }

        console.log("Set "+type+" directory to "+path)

        win.webContents.send("settings", settings)

        saveSettings()
    })
})
ipcMain.on("openObsidian",()=>{
    console.log("got openObsidian")
    openObsidian()
})

ipcMain.on("get_settings",()=>{
    win.webContents.send("settings",settings)
})

//----------------------------------------- OTHER -----------------

function saveToVault(data, filename){

    filename = filename.replace(/[/\\?%*:|"<>]/g, '-'); //regex illegal chars

    fs.writeFile(settings.vault_location+"/"+(filename)+".md", data, function(err){
        if(err){
            console.log(err)
        }else{
            console.log("Bookmark saved.")
        }
    })
}

function saveSettings(){

    fs.writeFile("./settings.json", JSON.stringify(settings, null, 2), function writeJSON(err) {

        if (err) return console.log(err);

        console.log(JSON.stringify(settings));

        console.log("writing to settings");
      });
}

function openObsidian(){
    console.log("basename:")
    console.log(path.basename(settings.vault_location))
    open("obsidian://vault/"+path.basename(settings.vault_location))
}

app.on('ready',()=>{

    serve.listen(port, () => {

        console.log(`Obsidian bookmark server running on localhost:${port}`)
    })

    createWindow()
})

