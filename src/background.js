/* eslint-disable no-unused-vars */
'use strict'

import { app, protocol, BrowserWindow, dialog, Menu, ipcMain} from 'electron'
// import CANUDS from './uds/canuds.js'

import {
  createProtocol, 
} from 'vue-cli-plugin-electron-builder/lib'
import { compile } from 'vue-template-compiler'
import { mapState } from 'vuex'
import { CancellationToken } from "builder-util-runtime"
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

const path = require('path');
const log = require('electron-log');
// enable ipc 
log.transports.ipc.level='info'
console.log = log.log;

const { autoUpdater } = require("electron-updater")
const CANUDS = require('./uds/canuds.js')

const isDevelopment = process.env.NODE_ENV !== 'production'

// autoUpdater.logger = log;
// autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let canuds

var menuTemplate = [
  {
    label: "Github",
    submenu:[
      {
        label:'https://github.com/frankie-zeng/ECUBus',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/frankie-zeng/ECUBus')
        }
      }
    ]
  },
  {
  label: "Version",
  submenu:[
    {
      label:app.getVersion()
    },
    {
      label:'Check Update',
      click: async () => {
        autoUpdater.checkForUpdates();
      }
    }
  ]
}];
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createApiHelper () {
  // Create the browser window.
  let apiwin = new BrowserWindow({ width: 1200, height: 620, minWidth:1000, webPreferences: {
    nodeIntegration: false
  },
  show:false,
  // eslint-disable-next-line no-undef
  icon: `${__static}/logo.ico` })
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
    
  
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    // eslint-disable-next-line no-undef
    apiwin.loadURL(`${__static}/api_helper/index.html`)
  } else {
    // Load the index.html when not in development
    apiwin.loadURL(path.join(process.resourcesPath,'api_helper','index.html'))
  }
  
  apiwin.once('ready-to-show', () => {
    apiwin.show()
  })
  apiwin.on('closed', () => {
    apiwin = null
  })
}


function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ width: 1200, height: 620, minWidth:1000, webPreferences: {
    nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
    enableRemoteModule: true
  },
  show:false,
  // eslint-disable-next-line no-undef
  icon: `${__static}/logo.ico` })
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  try{
    canuds = new CANUDS(win)
    canuds.registerCallback(() => {
      canuds.eventHandle()
    })
  }catch(error){
    console.error(error);
  }
    
  
  
  
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
  
  win.once('ready-to-show', () => {
    autoUpdater.checkForUpdates();
    win.show()
  })
  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if(canuds!==null){
  //   canuds.Unload()
  //   canuds = null
  // }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installExtension(VUEJS_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }

  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
require('./events')

//updater
var cancellationToken
autoUpdater.on('update-available', (info) => {
  win.webContents.send('update-available', info);
})
autoUpdater.on('update-not-available', (info) => {
  win.webContents.send('update-not-available',info);
})
autoUpdater.on('error', (err) => {
  win.webContents.send('update-error',err);
})
autoUpdater.on('download-progress', (progressObj) => {
  win.webContents.send('update-download-progress',progressObj);
})
autoUpdater.on('update-downloaded', (info) => {
  win.webContents.send('update-downloaded',info);
});
ipcMain.on('installUpdate',()=>{
  autoUpdater.quitAndInstall(false,false);
})
ipcMain.on('checkUpdate',()=>{
  autoUpdater.checkForUpdates();
})
ipcMain.on('cancelUpdate',()=>{
  cancellationToken.cancel()
})
ipcMain.on('startUpdate',()=>{
  cancellationToken = new CancellationToken()
  autoUpdater.downloadUpdate(cancellationToken)
})
ipcMain.on("startApiHelper",()=>{
  createApiHelper()
})
