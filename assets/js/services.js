const electron = require('electron')
const remote = electron.remote
const Menu = remote.Menu
const MenuItem = remote.MenuItem
const shell = electron.shell
const clipboard = electron.clipboard
const ipc = electron.ipcRenderer
const AutoLaunch = require('auto-launch')
const isDev = require('electron-is-dev')
const path = require('path')
const fs = require('fs')

angular.module('app.services', [])

.factory('ClipboardProvider', function() {
  
  const storage = require('electron-json-storage')
  
  var ClipboardProvider

  ClipboardProvider = function() {
    return this.clips = [{
      content: "First Clip",
      created: Date.now()
    }]
  }

  ClipboardProvider.getPath = function() {
    if(isDev) return path.join(process.cwd())   
    return path.join(process.resourcesPath, 'app')
  }

  ClipboardProvider.clip = function() {
    
    var clip = clipboard.readText()
    if(!clip) clip = clipboard.readImage()
    if(!clip) clip = clipboard.readHTML()

    var key = Date.now()
    var entry = {
      content: clip,
      created: Date.now()
    }
    storage.set(key.toString(), entry, function(error) {
      if(error) throw error
      return entry
    })
  }

  return ClipboardProvider
})

.factory('NotesProvider', function() {
  var NotesProvider
  var key
  const Xray = require('x-ray')
  const Dexie = require('dexie')

  var db = new Dexie('crispydb')
  
  db.version(1).stores({
    notes: '++id, created, title, text, color, type, url, done, reminder, remindme, reminded'
  })

  db.open().catch(function(error) {
    console.log("Open failed: " + error)
  })

  // constructor
  NotesProvider = function() {
    var notes = db.notes.toArray()
    return notes
  }

  // public
  NotesProvider.getRemindableNotes = function() {
    var remindable = db.notes.toArray()
    return remindable
  }

  NotesProvider.addNote = function(note) {
    var object = getNoteObject()
    for(key in note) {
      if(object.hasOwnProperty(key)) object[key] = note[key]
    } 
    db.notes.put(object)
    return object
  }

  NotesProvider.scrapeUrl = function(url) {
    var result 
    var xray = new Xray()
    return xray(url, 'title')
  }

  NotesProvider.deleteNote = function(id) {
    db.notes.where('id').equals(id).delete()
  }

  NotesProvider.dismissReminder = function(id) {
    debugger
    db.notes.update(id, {reminded: 1}).then(function(updated) {
      if(updated) {
        console.log(`note id ${id} updated`)
      } else {
        console.log(`could not update note id ${id}`)
      }
    })
  }

  // private
  function getNoteObject() {
    return {
      title: "",
      text: "",
      type: "text",
      color: "",
      url: "",
      created: Date.now(),
      reminder: "",
      remindme: 0,
      reminded: 0
    }
  }

  // return object
  return NotesProvider

})

.factory('SettingsProvider', function() {
  
  var SettingsProvider
  var key

  // constructor
  SettingsProvider = function() {
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
        sound: "vibrating.wav"
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
      ext: [],
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

.factory('SalutService', function() {

  var SalutService = {}
  var salutations
  
  salutations = [
    'Hey',
    'Hi',
    'Hola',
    'What\'s up?',
    'How\'s it going?',
    'How are you doing?',
    'You look awesome today',
    'What\'s going on?',
    'What\'s new?',
    'How\'s everything?',
    'How are things?',
    'How\'s life?',
    'How\'s your day?',
    'How\'s your day going?',
    'Good to see you',
    'Nice to see you',
    'Long time no see',
    'It\'s been a while',
    'Pleased to meet you',
    'How have you been?',
    'How do you do?',
    'Yo!',
    'Alright mate?',
    'You alright?',
    'Are you OK?',
    'Howdy!',
    'Whazzup?',
    'G’day mate!',
    'Shalom',
    'Howyadoin\'?',
    'Hey Dude',
    'Guten Tag',
    'Speak!',
    'Hello',
    'Hello there',
    'Alrighty then!'
  ]
  
  SalutService.salute = function() {
    var random = Math.floor(Math.random() * salutations.length)
    return salutations[random]
  }

  return SalutService

})