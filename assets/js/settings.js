const dialog = electron.remote.dialog
const recursiveReadSync = require('recursive-readdir-sync')
const walk = require('walk')

angular.module('app', ['app.services'])

.controller('SettingsCtrl', function($scope, $timeout, SettingsProvider, $document) {
  
  const cwdir = SettingsProvider.getPath()

  $scope.switchTheme = function(theme) {
    if(!$scope.settings.layout) $scope.settings.layout = {}
    $scope.settings.layout.theme = theme
  }

  $scope.requestNotify = function() {
    Notification.requestPermission().then(function(result) {
      console.log(result)
    })
  }

  $scope.zoom = 100

  $scope.setZoom = function(zoom) {
    $scope.zoom = $scope.zoom + zoom

    zoom = `${$scope.zoom}%`
    $scope.settings.layout.size = zoom
    SettingsProvider.setZoom(zoom)
  }

  $scope.settings = new SettingsProvider()

  $document.ready(function() {
    debugger
    SettingsProvider.setZoom($scope.settings.layout.size)
    angular.element('.button-collapse').sideNav()
    angular.element('select').material_select()    
    
    $scope.$watch('settings', function() {
      $scope.changed = true
    })
  })

  $scope.saveSettings = function() {
    let settings = $scope.settings
    SettingsProvider.commit(settings)
    ipc.send('settings-saved', settings) 
  }
  
  $scope.cancelSettings = function(force) {
    if(force) ipc.send('settings-cancelled')
    if($scope.changed) {
      angular.element('#askforsave').openModal()
      return
    }
    ipc.send('settings-cancelled')
  }

  $scope.sounds = fs.readdirSync(cwdir + "/assets/wav")
  
  $scope.playSound = function(sound) {
    if(!$scope.audio) {
      $scope.audio = new Audio()
    }
    $scope.audio.currentTime = 0
    $scope.audio.pause()
    $scope.audio.src = cwdir + "/assets/wav/" + sound
    $scope.audio.play()
  }
  
  $scope.currentExt = 0
  
  $scope.deleteFolder = function(index) {
    $scope.settings.folders.splice(index, 1)
  }
  
  $scope.addFolder = function() {
    debugger
    let dupl = false 
    dialog.showOpenDialog({
      properties: ['openDirectory']
    }, function (folder) {
      if(!folder) return
      angular.forEach($scope.settings.folders, function(sfolder) {
        if(sfolder.path === folder[0]) {
          Materialize.toast('Folder already added, choose another one...', 6000)
          return dupl = true    
        }
      })
      if(!dupl) {
        $timeout(function() {
          $scope.settings.folders.push(SettingsProvider.setFolder({
            path: folder[0]
          }))
        }, 0)
      }
    })
  }
  
  $scope.editExt = function(index) {
    $scope.currentExt = index
    $scope.exts = $scope.settings.folders[index].ext
    angular.element('#extmodal').openModal()
  }
  
  $scope.addExt = function(value) {
    if(!value) return
    $scope.exts.push(value)
    $scope.fileext = ""
  }
  
  $scope.saveExt = function() {
    let idx = $scope.currentExt
    $scope.settings.folders[idx].ext = $scope.exts
    angular.element('#extmodal').closeModal()
  }
  
  $scope.deleteExt = function(index) {
    $scope.exts.splice(index, 1)
  }
  
  $scope.refreshCat = function() {
    
    $scope.settings.catalogue = []
    // To be truly synchronous in the emitter and maintain a compatible api,
    // the listeners must be listed before the object is created
    angular.forEach($scope.settings.folders, function(folder) {
      options = {
        listeners: {
          names: function (root, nodeNamesArray) {
            
          }, 
          directories: function (root, dirStatsArray, next) {
            if(folder.dir) {
              angular.forEach(dirStatsArray, function(dir) {
                var entry = {}
                entry.path = root
                entry.file = dir.name
                entry.ext = "dir"
                
                $scope.settings.catalogue.push(entry)              
              })
            }
          }, 
          file: function (root, fileStats, next) {
            var ext = path.extname(fileStats.name)
            
            var entry = {}
            entry.path = root
            entry.file = fileStats.name
            entry.ext = ext.slice(1).toLowerCase()
            
            $scope.settings.catalogue.push(entry)        
            
            next()
          }, 
          errors: function (root, nodeStatsArray, next) {
            next()
          }
        }
      }

      walker = walk.walkSync(folder.path, options)  
    })
    
  //   debugger
  //   let files
  //   let ext
  //   let entry

  //   $scope.settings.catalogue = []
   
  //   angular.forEach($scope.settings.folders, function(folder) {
  //     if(folder.sub) {
  //       try {
  //         files = recursiveReadSync(folder.path)
  //         angular.forEach(files, function(file) {
  //           ext = path.extname(file)
  //           if(ext) {
  //             entry = {}
  //             entry.path = folder.path
  //             entry.file = file
  //             entry.ext = ext.slice(1).toLowerCase()
               
  //             $scope.settings.catalogue.push(entry)          
  //           }
  //         }) 
  //       } catch(err) {
  //         if(err.errno === 34) {
  //           console.log('Path does not exist');
  //         } else {
  //           throw err;
  //         }
  //       }
  //     } else {
  //       files = fs.readdirSync(folder.path)

  //       angular.forEach(files, function(file) {
  //         ext = path.extname(file)
  //         if(ext) {
  //           entry = {}
  //           entry.path = folder.path
  //           entry.file = file
  //           entry.ext = ext.slice(1).toLowerCase()
           
  //           $scope.settings.catalogue.push(entry)          
  //         }
  //       }) 
  //     }
  //   })
  }
})