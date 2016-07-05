'use strict'

const electron = require('electron')
const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const Tray = electron.Tray
const path = require('path')
const globalShortcut = electron.globalShortcut
const Positioner = require('electron-positioner')

// adds debug features like hotkeys for triggering dev tools and reload
// require('electron-debug')()

// prevent window being garbage collected
let launcherWindow
let notesWindow
let settingsWindow
let clipboardWindow
let dictWindow
let helpWindow
let aboutWindow
let snipWindow
let appIcon
let appMenu

function bootstrap() {
	createAppIcon()
	createLauncherWindow()
	createClipboardWindow()
}

function registerShortcut(combination) {
	var keys = combination.split("+")
	globalShortcut.unregisterAll()
	globalShortcut.register('Super+S', function() {
		createSnipWindow()
	})
	globalShortcut.register(combination, function() {
		toggleLauncherWindow()
	})

	appIcon.setToolTip(`Press ${keys[0]} + ${keys[1]} to start crispy fish`)
}

function createAppIcon() {
	appIcon = new Tray(path.join(__dirname, "assets/img/crispyfish.png"))
	appMenu = Menu.buildFromTemplate([{ 
		id: 'launcher',
		label: 'Show Launcher', 
		click: function() {
			createLauncherWindow()
		}
	},
	{ 
		label: 'Settings', 
		click: function() {
			createSettingsWindow()
		}
	},
	{ 
		label: 'Notes', 
		click: function() {
			createNotesWindow()
		}
	},
	{ 
		label: 'Snip', 
		// accelerator: "Windows+S",
		click: function() {
			createSnipWindow()
		}
	},
	{ 
		type: 'separator' 
	},
	{ 
		label: 'About', 
		click: function() {
			createAboutWindow()
		}
	},
	{ 
		type: 'separator' 
	},
	{
		label: 'Help',
		click: function() {
			createHelpWindow()
		}
	},
	{ 
		type: 'separator' 
	},
	{ 
		label: 'Exit', 
		click: function() {
			appIcon.destroy()
			app.exit(0) 
		}
	}])

	appIcon.setContextMenu(appMenu)

	appIcon.on('click', function() {
		toggleLauncherWindow()
	})
}

function createDictWindow(dict) {
	var url = `http://www.dict.cc/?s=${dict}`
	
	if(!dictWindow) {
		dictWindow = new BrowserWindow({
			minimizable: false,
			skipTaskbar: true
		})
		dictWindow.setMenu(null)
		dictWindow.maximize()
		dictWindow.loadURL(encodeURI(url))
		dictWindow.on('close', function() {
			dictWindow = null
		})
		dictWindow.on('blur', function() {
			dictWindow.close()
			dictWindow = null
		})
	} else {
		dictWindow.show()
		dictWindow.loadURL(encodeURI(url))
	}
}

function createClipboardWindow() {
	if(!clipboardWindow) {
		clipboardWindow = new BrowserWindow({
			show: false,
			width: 400,
			height: 420,
			skipTaskbar: true,
			frame: false
		})
		
		var positioner = new Positioner(clipboardWindow)
		positioner.move('bottomRight')

		clipboardWindow.loadURL(`file://${__dirname}/clipboard.html`)
		clipboardWindow.on('blur', function() {
			clipboardWindow.hide()
		})
	} else {
		clipboardWindow.show()
	}
}

function createSnipWindow() {
	if(!snipWindow) {
		snipWindow = new BrowserWindow({
			width: 10,
			height: 10,
			show: false,
			useContentSize: true,
			skipTaskbar: true,
			fullscreen: false,
			frame: false,
			transparent: true,
			alwaysOnTop: false,
			enableLargerThanScreen: true
		})
		snipWindow.setMenu(null)
		snipWindow.loadURL(`file://${__dirname}/capture.html`)
		snipWindow.on('close', function(event) {
			snipWindow = null
		})
	} else {
		snipWindow.show()
	}
}

function createSettingsWindow() {
	if(!settingsWindow) {
		settingsWindow = new BrowserWindow({
			show: false,
			minWidth: 800,
			minHeight: 600,
			width: 800,
			height: 600,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		settingsWindow.maximize()
		settingsWindow.webContents.openDevTools()
		settingsWindow.setMenu(null)
		settingsWindow.loadURL(`file://${__dirname}/settings.html`)
		settingsWindow.on('close', function(event) {
			settingsWindow.webContents.send('ask-for-save')
			event.preventDefault()
		})
		settingsWindow.once('ready-to-show', function() {
			console.log("fire")
			settingsWindow.show()
		})
	} else {
		settingsWindow.show()
	}
}

function createNotesWindow() {
	if(!notesWindow) {
		notesWindow = new BrowserWindow({
			show: false,
			width: 800,
			height: 600,
			minWidth: 800,
			minHeight: 600,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		notesWindow.maximize()
		notesWindow.setMenu(null)
		notesWindow.loadURL(`file://${__dirname}/notes.html`)
		notesWindow.on('close', function(event) {
			notesWindow = null
		})
		notesWindow.once('ready-to-show', function() {
			console.log("doit")
			notesWindow.show()
		})
	} else {
		notesWindow.show()
	}
}

function createLauncherWindow() {
	if(!launcherWindow) {
		launcherWindow = new BrowserWindow({
			show: false,
			width: 600,
			height: 400,
			frame: false,
			skipTaskbar: true,
			resizable: false 
		})
		launcherWindow.once('ready-to-show', function() {
			console.log("ready-to-show")
			launcherWindow.show()
		})	
		launcherWindow.loadURL(`file://${__dirname}/launcher.html`)
		launcherWindow.on('blur', function() {
			launcherWindow.hide()
		})
	
	} else {
		launcherWindow.show()
	}
}

function toggleLauncherWindow() {
	if(launcherWindow.isVisible()) {
		launcherWindow.hide()
	} else {
		launcherWindow.webContents.send('salute')
		launcherWindow.show()
	}
} 

function createHelpWindow() {
	if(!helpWindow) {
		helpWindow = new BrowserWindow({
			show: false,
			width: 600,
			height: 400,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		helpWindow.maximize()
		helpWindow.setMenu(null)
		helpWindow.webContents.openDevTools()
		helpWindow.loadURL(`file://${__dirname}/help.html`)
		helpWindow.on('close', function() {
			helpWindow = null
		})		
		helpWindow.once('ready-to-show', function() {
			console.log("ready-to-show")
			helpWindow.show()
		})
	} else {
		helpWindow.show()
	}
}

function createAboutWindow() {
	if(!aboutWindow) {
		aboutWindow = new BrowserWindow({
			show: false,
			width: 600,
			height: 450,
			frame: true,
			resizable: false,
			minimizable: false,
			alwaysOnTop: false,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		aboutWindow.setMenu(null)
		aboutWindow.loadURL(`file://${__dirname}/about.html`)
		aboutWindow.on('close', function() {
			aboutWindow = null
		})		
		aboutWindow.once('ready-to-show', function() {
			console.log("ready-to-show")
			aboutWindow.show()
		})
	} else {
		aboutWindow.show()
	}
}

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	createLauncherWindow()
})

app.on('ready', () => {
	bootstrap()
})

ipc.on('settings-saved', (settings) => {
	if(settingsWindow) {
		settingsWindow.hide()
	}
	if(launcherWindow) {
		launcherWindow.webContents.send('silent-refresh')
		launcherWindow.show()		
	}
	if(notesWindow) {
		notesWindow.webContents.send('silent-refresh')
	}

	if(aboutWindow) {
		aboutWindow.webContents.send('silent-refresh')
	}

	if(helpWindow) {
		helpWindow.webContents.send('silent-refresh')
	}

	settingsWindow = null
})

ipc.on('settings-cancelled', () => {
	if(settingsWindow) {
		settingsWindow.hide()
	}
	if(launcherWindow) {
		launcherWindow.show()		
	}
	settingsWindow = null
})

ipc.on('register-shortcut', function(event, args) {
	registerShortcut(args)
})

ipc.on('note-manager', function(event, args) {
	createNotesWindow()
})

ipc.on('show-settings', function(event, args) {
	createSettingsWindow()
})

ipc.on('snip-it', function(event, args) {
	createSnipWindow()
})

ipc.on('show-help', function(event, args) {
	createHelpWindow()
})

ipc.on('show-about', function(event, args) {
	createAboutWindow()
})

ipc.on('quit', function(event, args) {
	appIcon.destroy()
	app.exit(0)
})

ipc.on('dict', function(event, args) {
	console.log(args)
	createDictWindow(args)
})