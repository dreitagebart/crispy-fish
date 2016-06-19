const desktopCapturer = require('electron').desktopCapturer
const remote = require('electron').remote
const fs = require('fs')
const path = require('path')
const isDev = require('electron-is-dev')

const cwdir = function() {
  if(isDev) return path.join(process.cwd())   
  return path.join(process.resourcesPath, 'app')
}

document.onreadystatechange = function () {
  if (document.readyState === "complete") {
    desktopCapturer.getSources({
      types: ['screen'], 
      thumbnailSize: {
        width: window.screen.width, 
        height: window.screen.height
      }},
      (error, sources) => {
        if (error) throw error
        fs.writeFileSync(cwdir() + '/assets/scr/screenshot.png', sources[0].thumbnail.toPng())
        var win = remote.getCurrentWindow()
        win.setBounds({
          x: 0,
          y: 0,
          width: window.screen.width,
          height: window.screen.height
        })
        win.setResizable(false)
        win.show()
        win.loadURL(`file://${__dirname}/snip.html`)
    })
  }
}