'use strict'

const electron = require('electron')
const ipc = electron.ipcMain
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu
const Tray = electron.Tray
const path = require('path')
const globalShortcut = electron.globalShortcut

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')()

// prevent window being garbage collected
let launcherWindow
let notesWindow
let settingsWindow
let helpWindow
let aboutWindow
let snipWindow
let appIcon
let appMenu

function bootstrap() {
	createAppIcon()
	createLauncherWindow()
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
			app.exit(0) 
		}
	}	
		])

	appIcon.setContextMenu(appMenu)

	appIcon.on('click', function() {
		toggleLauncherWindow()
	})
}

function createSnipWindow() {
	if(!snipWindow) {
		snipWindow = new BrowserWindow({
			width: 10,
			height: 10,
			// show: true,
			useContentSize: true,
			skipTaskbar: true,
			fullscreen: false,
			frame: false,
			transparent: true,
			alwaysOnTop: false,
			enableLargerThanScreen: true
		})
		snipWindow.setMenu(null)
		// snipWindow.webContents.openDevTools()
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
			width: 600,
			height: 400,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		settingsWindow.maximize()
		// settingsWindow.webContents.openDevTools()
		settingsWindow.setMenu(null)
		settingsWindow.loadURL(`file://${__dirname}/settings.html`)
		settingsWindow.on('close', function(event) {
			settingsWindow.hide()
			event.preventDefault()
		})
	} else {
		settingsWindow.show()
	}
}

function createNotesWindow() {
	if(!notesWindow) {
		notesWindow = new BrowserWindow({
			width: 600,
			height: 400,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		notesWindow.maximize()
		notesWindow.setMenu(null)
		notesWindow.loadURL(`file://${__dirname}/notes.html`)
		notesWindow.on('close', function(event) {
			notesWindow.hide()
			event.preventDefault()
		})
	} else {
		notesWindow.show()
	}
}

function createLauncherWindow() {
	if(!launcherWindow) {
		launcherWindow = new BrowserWindow({
			width: 600,
			height: 400,
			frame: false,
			skipTaskbar: true 
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
		launcherWindow.show()
	}
} 

function createHelpWindow() {
	if(!helpWindow) {
		helpWindow = new BrowserWindow({
			width: 600,
			height: 400,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		helpWindow.maximize()
		helpWindow.setMenu(null)
		helpWindow.loadURL(`file://${__dirname}/help.html`)
		helpWindow.on('close', function() {
			helpWindow = null
		})		
	} else {
		helpWindow.show()
	}
}

function createAboutWindow() {
	if(!aboutWindow) {
		aboutWindow = new BrowserWindow({
			width: 600,
			height: 400,
			frame: false,
			alwaysOnTop: true,
			icon: path.join(__dirname, "assets/img/crispyfish.png")
		})
		aboutWindow.setMenu(null)
		aboutWindow.loadURL(`file://${__dirname}/about.html`)
		aboutWindow.on('close', function() {
			aboutWindow = null
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
		launcherWindow.reload()
		launcherWindow.show()		
	}
	settingsWindow.reload()
})

ipc.on('settings-cancelled', () => {
	if(settingsWindow) {
		settingsWindow.hide()
	}
	if(launcherWindow) {
		launcherWindow.show()		
	}
	settingsWindow.reload()
})

ipc.on('register-shortcut', function(event, args) {
	registerShortcut(args)
})

ipc.on('note-manager', function(event, args) {
	createNotesWindow()
})

ipc.on('note-manager', function(event, args) {
	createNotesWindow()
})

ipc.on('silent-refresh', function(event, arg) {
	ipc.send('silent-refresh')
})