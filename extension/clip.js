(function() {
    var date = new Date().toISOString().slice(0,19)
    var title = document.title
    var url = window.location.href
    var host = window.location.host
    var defaultNoteFormat =  
    `## [{title}]({url})
    Clipped from {host} on {date}.

## {clip}`
    
        var noteFormat = defaultNoteFormat
        var sel = rangy.getSelection().toHtml();
        var turndownService = new TurndownService()
        var selection = turndownService.turndown(sel)

        noteFormat = noteFormat.replace('{clip}', selection)
        noteFormat = noteFormat.replace('{date}', date)
        noteFormat = noteFormat.replace('{url}', url)
        noteFormat = noteFormat.replace('{title}', title)
        noteFormat = noteFormat.replace('{host}', host)

        // console.log(noteFormat)

        let bookmark = {
            text:(noteFormat),
            name:(dateString()+title)
        }
        console.log(bookmark)
        fetch('http://localhost:43110/new/'+encodeURIComponent(JSON.stringify(bookmark)))

})();


function dateString(){
    let rawDate = new Date()
    let filename = ""+rawDate.getFullYear()+(rawDate.getMonth()+1)+rawDate.getDate()+rawDate.getHours()+rawDate.getMinutes()+"  "
    return(filename)
}