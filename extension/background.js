
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.executeScript(null, { file: "lib/rangy.js" }, function() {
        chrome.tabs.executeScript(null, { file: "lib/turndown.js" }, function() {
            chrome.tabs.executeScript(tab.ib, {file: 'clip.js'});
        });
    });   

});

chrome.browserAction.setPopup({
    popup: "dialog.html"
   });

var ping = setInterval(()=>{
    checkServer();
},5000)
var state;
var lastState;
function checkServer(){
    fetch("http://localhost:43110/").then(status=>{
        state = 1;
    }).catch(error=>{
        state = 0;
    })

    if(state != lastState){ //network change
    let newPath;
        if(state){
            newPath = "./icons/favicon-128x128.png"
        }else{
            newPath = "./icons/favicon-128x128_error.png"
        }
        chrome.browserAction.setIcon({path:newPath})
    }

    lastState = state;
}
