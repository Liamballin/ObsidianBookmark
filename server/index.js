const { 
    app, 
    BrowserWindow, 
    ipcMain, 
    dialog, 
    Menu, 
    Tray 
} = require('electron')



//express middleware
const bodyParser = require('body-parser');
const cors = require("cors")

const express = require('express')
const serve = express()

const fs = require('fs')
const request = require('request');
const path = require('path')
const open = require("open")



var settings = require('./settings.json')

const port = settings.port || 43110;

//----------------------------------------- EXPRESS -----------------
serve.use(cors())
serve.use(bodyParser.json());


serve.post('/new',(req,res)=>{

    let bm = req.body;

    downloadImages(bm).then(newNote=>{ //download images and replace links with local filepaths
        saveToVault(newNote.text, newNote.name)
        res.send('...') //todo send useful response
    })
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

    tray = new Tray(path.join(__dirname, './public/img/tray.png'))

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
    // win.webContents.openDevTools()

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

    win.loadFile('./public/index.html')
    // win.loadFile("tailwind.html")

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
        }else if(type == "attatchment"){
            settings.attatchment_location = path;
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

ipcMain.on("new_settings",(event,newSettings)=>{
    settings = newSettings;
    saveSettings()
})

ipcMain.on("start-server",()=>{
    console.log("Starting server...")
    startServer()
    win.hide()
})

//----------------------------------------- OTHER -----------------

function saveToVault(data, filename){
    return new Promise((resolve,reject)=>{
        filename = filename.replace(/[/\\?%*:|"<>]/g, '-'); //regex illegal chars

        let saveLocation = settings.save_location || settings.vault_location 
        saveLocation += "/"+(filename)+".md";
    
        fs.writeFile(saveLocation, data, function(err){
            if(err){
                reject(err)
            }else{
                console.log("Bookmark saved.")
                console.log(saveLocation)
                resolve(saveLocation)
            }
        })
    })

}

async function downloadImages(bm){
    return new Promise(async (resolve,reject)=>{
        if(settings.download_images){
            for(i = 0; i < bm.imageLinks.length;i++){
                let filePath = settings.attatchment_location+"\\"+path.basename(bm.imageLinks[i])
                await download(bm.imageLinks[i],filePath ).then(()=>{
                    console.log("Downloaded to "+filePath)
                    // bm.text = bm.text.replace(bm.imageLinks[i], path.relative(settings.save_location,filePath))
                    bm.text = bm.text.replace(bm.imageLinks[i], path.basename(filePath))

                }).catch(err=>{
                    console.log("Couldn't download "+path.basename(bm.imageLinks[i]))
                })
            }
        }
        resolve(bm)
    })

}




var download = function(uri, filename){
    
    return new Promise((resolve,reject)=>{
        // resolve(":)")
        request.head(uri, function(err, res, body){
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            if(err) reject(err);
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function(){resolve()});
          });
    })

    
  };
  

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

function startServer(){
    serve.listen(port, () => {

        console.log(`Obsidian bookmark server running on localhost:${port}`)
    })
}

app.on('ready',()=>{
    createWindow()
})

