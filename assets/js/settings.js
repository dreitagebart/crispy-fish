const dialog = electron.remote.dialog
const walk = require('walk')

angular.module('app', ['app.services'])

.controller('SettingsCtrl', function($scope, $timeout, SettingsProvider, $document) {
  
  const cwdir = SettingsProvider.getPath()

  var changed, foldersChanged = false
  
  $scope.switchTheme = function(theme) {
    if(!$scope.settings.layout) $scope.settings.layout = {}
    $scope.settings.layout.theme = theme
  }

  $scope.requestNotify = function() {
    Notification.requestPermission().then(function(result) {
      console.log(result)
    })
  }

  $scope.settings = new SettingsProvider()

  $document.ready(function() {
    angular.element('.button-collapse').sideNav()
    angular.element('select').material_select()    
    
    $scope.$watch('settings', function() {
      changed = true
    })
  })

  ipc.on('ask-for-save', (event, message) => { 
    $scope.cancelSettings()
  })

  $scope.saveSettings = function() {
    if(foldersChanged) $scope.refreshCat(false)
    let settings = $scope.settings
    SettingsProvider.commit(settings)
    ipc.send('settings-saved', settings) 
  }
  
  $scope.cancelSettings = function(force) {
    if(force) ipc.send('settings-cancelled')
    if(changed) {
      return angular.element('#askforsave').openModal()
    }
    ipc.send('settings-cancelled')
  }
  
  $scope.sounds = fs.readdirSync(path.join(cwdir, '/assets/wav'))
  
  $scope.playSound = function(sound) {
   
    if(!$scope.audio) {
      $scope.audio = new Audio()
    }
    $scope.audio.currentTime = 0
    $scope.audio.pause()
    $scope.audio.src = path.join(cwdir, '/assets/wav/', sound)
    $scope.audio.play()
  }
  
  $scope.currentExt = 0
  
  $scope.deleteFolder = function(index) {
    foldersChanged = true
    $scope.settings.folders.splice(index, 1)
  }
  
  $scope.addFolder = function() {
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
          foldersChanged = true
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
  
  $scope.showCatalogue = function() {
    angular.element('#catmodal').openModal()
  }

  $scope.refreshCat = function(showmodal) {
    
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
              // angular.forEach(dirStatsArray, function(dir) {
              //   var entry = {}
              //   entry.path = root
              //   entry.file = dir.name
              //   entry.ext = "dir"
                
              //   $scope.settings.catalogue.push(entry)              
              // })
              next()
            }
          }, 
          file: function (root, fileStats, next) {
            var ext = path.extname(fileStats.name)
            ext = ext.slice(1).toLowerCase()
            
            if(folder.ext.indexOf(ext) < 0 && folder.ext.length) return next()           
            
            var entry = {}
            entry.path = root
            entry.file = fileStats.name
            entry.ext = ext
            
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
    if(showmodal) $scope.showCatalogue()
  }
})