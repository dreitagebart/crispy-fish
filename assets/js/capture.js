const desktopCapturer = require('electron').desktopCapturer
const remote = require('electron').remote
const fs = require('fs')

document.onreadystatechange = function () {
  debugger
  if (document.readyState == "complete") {
    desktopCapturer.getSources({
      types: ['screen'], 
      thumbnailSize: {
        width: window.screen.width, 
        height: window.screen.height
      }},
      (error, sources) => {
        debugger
        if (error) throw error
        fs.writeFileSync('fullback.png', sources[0].thumbnail.toPng())
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




