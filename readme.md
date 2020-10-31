# **![logo](extension/icons/favicon-48x48.png) Obsidian Bookmark**

![Screencap](docs/sceencap1.gif)

# A Chrome extension and nodejs server to allow web clipping to Obsidian.

The extension copies highlight areas of a web page to markdown, and sends it to a local node server. This then saves it as a markdown file in a folder, like an Obsidian vault, the user has chosen.

Until Obsidian supports adding new notes through their custom `Obsidian://` URL protocol, this might be the best way. 

Inspired by jplattel's [Obsidian clipper](https://github.com/jplattel/obsidian-clipper) - a much less janky solution. 

## Usage

With the node server running, clicking the extension icon will save the current page as a markdown bookmark. 

Any selected text or images will be included in the note.


## Installation

- Chrome extension:

    Open `chrome://extensions` and select `load unpacked`. Select the extension folder. 

- Node server:

    Running ObsidianBookmark.exe will open the server settings. 

    ![settings](docs/serverSettings.png)

    On starting the server, the app will minimize to the tray and can be accessed from there.