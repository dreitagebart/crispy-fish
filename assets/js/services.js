const electron = require('electron')
const shell = electron.shell
const clipboard = electron.clipboard
const ipc = electron.ipcRenderer
const AutoLaunch = require('auto-launch')
const isDev = require('electron-is-dev')
const path = require('path')
const fs = require('fs')

angular.module('app.services', [])

.factory('NotesProvider', function() {
  var NotesProvider
  var key
  var noteId = 0

  // constructor
  NotesProvider = function() {
    debugger
    this.notes = getNotes()
    noteId = this.notes.length
    return this.notes
  }

  // public
  NotesProvider.getId = function() {
    return ++noteId
  }

  NotesProvider.commit = function(notes) {
    if(!notes) return
    localStorage.setItem('cf-notes', JSON.stringify(notes))
  }

  NotesProvider.setNote = function(note) {
    var object = emptyNote()
    for(key in note) {
      if(note.hasOwnProperty(key)) object[key] = note[key]
    }  
    return object
  }

  // private
  function bootstrap() {
    return [{
      id: NotesProvider.getId(),
      title: "First Note",
      text: "Here is your first note. You can delete it by clicking the close button on the upper right side",
      type: "text",
      created: Date.now()
    }]
  }

  function emptyNote() {
    return {
      id: NotesProvider.getId(),
      title: "",
      text: "",
      type: "text",
      color: "",
      created: Date.now()
    }
  }

  function getNotes() {
    var value = localStorage.getItem('cf-notes')
    if(!value) return bootstrap()
    return JSON.parse(value) 
  }

  // return object
  return NotesProvider

})

.factory('SettingsProvider', function() {
  
  var SettingsProvider
  var key

  // constructor
  SettingsProvider = function() {
    debugger
    this.settings = getSettings()
    registerShortcut(this.settings.general.shcut[0], this.settings.general.shcut[1])
    setAutoLaunch(this.settings.general.autolaunch)
    return this.settings
  }

  // public
  SettingsProvider.setFolder = function(folder) {
    var object = emptyFolder()
    for(key in folder) {
      if(folder.hasOwnProperty(key)) object[key] = folder[key]
    }  
    return object
  }

  SettingsProvider.commit = function(settings) {
    if(!settings) return
    localStorage.setItem('cf-settings', JSON.stringify(settings))
  }
  
  SettingsProvider.setZoom = function(zoom) {
    document.body.style.zoom = zoom
  }

  SettingsProvider.getTask = function() {
    task = {}
    task.duration = 0
    task.name = null
    task.current = null
    task.active = false
    task.minutes = 0
    task.seconds = 0
    task.max = 0
    task.started = false
    return task
  }
  
  SettingsProvider.getPath = function() {
    if(isDev) return path.join(process.cwd())   
    return path.join(process.resourcesPath, 'app')
  }

  // private

  function bootstrap() {
    return {
      general: {
        autolaunch: false,
        shcut: ["Control", "Space"]
      }, 
      task: {
        notify: true,
        sound: "airhorn.wav"
      },
      catalogue: [],
      folders: [],
      layout: {
        size: "100%",
        theme: "darken",
        transnavbar: true
      }
    }
  }

  function emptyFolder() {
    return {
      path: "",
      ext: ["all"],
      dir: false
    }
  }

  function getSettings() {
    var value = localStorage.getItem('cf-settings')
    if(!value) return bootstrap()
    return JSON.parse(value)  
  }
  
  function setAutoLaunch(bool) {
    var cfAutoLaunch = new AutoLaunch({
      name: 'crispy fish launcher',
      isHidden: true
    })

    cfAutoLaunch.isEnabled().then(function(enabled) {
      if(enabled) {
        if(!bool) return cfAutoLaunch.disable()
      }
      if(bool) return cfAutoLaunch.enable()
    }).then(function(err) {
      if(err) return console.log(err)
    })
  }

  function registerShortcut(key1, key2) {
    var combination = `${key1}+${key2}`
    ipc.send('register-shortcut', combination)    
  }
  
  // return object
  return SettingsProvider  
})