const win = require('electron').remote 
const math = require('mathjs')
const notifier = require('node-notifier')

angular.module('app', ['app.services', 'ngAnimate'])

.filter('cfilter', function () {
  return function (values, input) {
    if(!input) return
    var output = []
    var regex = new RegExp(input, 'i')

    for(var i = 0; i < values.length; i++) {
      var res = values[i].file.search(regex)
      if(res >= 0) {
        output.push(values[i])
      }
    }
    return output
  }
})

.controller('LauncherCtrl', function($scope, SalutService, SettingsProvider, $document, $timeout) {
  
  ipc.on('salute', (event, message) => {
    Materialize.toast(SalutService.salute(), 6000)
  })

  ipc.on('silent-refresh', (event, message) => {
    $timeout(function() {
      $scope.settings = new SettingsProvider()
    }, 0)
  })

  $scope.settings = new SettingsProvider()

  $document.ready(function() {

    particlesJS.load('particles-js', 'assets/js/particle-bubble.json', function() {
      console.log('particles loaded')
    })

    Materialize.toast(SalutService.salute(), 6000)

    document.addEventListener("visibilitychange", function() {
      if(!document.hidden) {
        angular.element("#typeahead").select().focus()
      }
    }, false)

    const menu = new Menu()
    menu.append(new MenuItem({label: 'Settings', click: function() {
      ipc.send('show-settings')
    }}))
    menu.append(new MenuItem({label: 'Notes', click: function() {
      ipc.send('note-manager')
    }}))
    menu.append(new MenuItem({label: 'Snip', click: function() {
      ipc.send('snip-it')
    }}))
    menu.append(new MenuItem({type: 'separator'}))
    menu.append(new MenuItem({label: 'About', click: function() {
      ipc.send('show-about')
    }}))
    menu.append(new MenuItem({type: 'separator'}))
    menu.append(new MenuItem({label: 'Help', click: function() {
      ipc.send('show-help')
    }}))
    menu.append(new MenuItem({type: 'separator'}))
    menu.append(new MenuItem({label: 'Exit', click: function() {
      ipc.send('quit')
    }}))

    window.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      menu.popup(remote.getCurrentWindow())
    }, false)

  })
})

.directive('typeahead', function($timeout, SettingsProvider, $interval) {
  return {
    restrict: 'AEC',
    scope: {
      items: '=',
      prompt: '@',
      ttitle: '@',
      tsubtitle: '@',
      model: '=',
      onSelect: '&'
    },
    link: function(scope, elem, attrs) {
      
      var stop
      var cwdir = SettingsProvider.getPath()
      var settings = new SettingsProvider()

      var getPadded = function(num){
        return num < 10 ? ('0' + num) : num
      }
      
      scope.seconds = getPadded(0)
      scope.minutes = getPadded(0)
      
      scope.$watch('model', function() {
        
        if(!scope.model) return
        scope.current = 0
        if(scope.model.startsWith('task')) {
          scope.isTask = true
        } else {
          scope.isTask = false
        }
        
        if(scope.model.startsWith('note')) {
          scope.isNote = true
        } else {
          scope.isNote = false
        }

        if(scope.model.startsWith('?')) {
          scope.isDict = true
        } else {
          scope.isDict = false
        }

        if(scope.model.startsWith('=')) {
          scope.isMath = true
          scope.calc = scope.model.slice(1)
          if(!scope.calc) return 
          try {
            var res = math.eval(scope.calc)
          } catch(e) {
            return
          }
          scope.mathResult = res
        } else {
          scope.isMath = false
          scope.mathResult = ""
        }
      })

      scope.hasResults = function() {
        if(!scope.model) return 
        return scope.filtered.length
      }
      
      scope.shoveOn = function() {
        scope.selected = false
      }
      
      scope.handleExecute = function(exec, folder) {
        debugger
        if(folder) {
          shell.showItemInFolder(exec)          
        } else {
          shell.openExternal(exec)
        }
        scope.model = ""
        scope.current = 0
        scope.selected = true
        $timeout(function() {
          scope.onSelect()
        }, 0)
      }

      scope.progval = {
        width: 0
      }
      
      scope.closeTask = function() {
        scope.stopTask()
        scope.task.active = false
      }
      
      scope.saveTask = function() {
        scope.task = scope._task
        scope.task.active = true
        angular.element('#taskmanager').closeModal()
      }
      
      scope.cancelTask = function() {
        angular.element('#taskmanager').closeModal()
      }
      
      scope.editDuration = function(number) {
        if(number < 0) {
          if(scope._task.duration === 0) return
          scope._task.duration = scope._task.duration + number
          scope._task.max = scope.task.duration * 60 
          return
        }
        if(scope._task.duration > 60) return
        scope._task.duration = scope._task.duration + number
        scope._task.max = scope._task.duration * 60
      }
      
      scope.resetTask = function() {
        scope.task.current = 0
        scope.left()
        if (angular.isDefined(stop)) {
          $interval.cancel(stop)
          stop = undefined
          scope.task.started = false
        }
      } 

      scope.stopTask = function() {
        if(scope.task.minutes === 0) return
        if(angular.isDefined(stop)) {
          $interval.cancel(stop)
          stop = undefined
          scope.task.started = false
        }
      }
      
      scope.left = function() {
        scope.task.minutes = getPadded(Math.floor(scope.task.current / 60))
        scope.task.seconds = getPadded(scope.task.current - scope.task.minutes * 60)
      }
      
      scope.startTask = function() {
        if(scope.task.duration == 0) return
        if(angular.isDefined(stop)) return
        stop = $interval(function() {
          scope.task.started = true
          
          var prog = parseInt(( 100 * scope.task.current ) / scope.task.max) 
          
          scope.progval = {
            width: prog + "%"
          }
          
          //for testing: 
          // debugger
          // if(scope.task.current < 298) scope.task.current = 299
          
          if(scope.task.current == scope.task.max) { 
            scope.stopTask()

            if(settings.task.notify) {
              notifier.notify({
                title: "Time is up!",
                message: scope.task.duration + " minutes left for task " + scope.task.name,
                wait: true 
              })
              notifier.on('click', function() {
                win.getCurrentWindow().show()
              })
            }

            var audio = new Audio(path.join(cwdir,'/assets/wav', settings.task.sound))
            return audio.play()
          }
          scope.task.current = scope.task.current + 1
          scope.left()
        }, 1000)
      }
  
      scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        scope.stopTask()
      })
      
      scope.reset = function() {
        scope.model = null
        angular.element('#typeahead').focus()
      }
      
      scope.handleSelection = function() {
        var i = scope.current
        var exec = path.join(scope.filtered[i].path, scope.filtered[i].file)
        shell.openExternal(exec)
        scope.reset()
      }

      scope.current = 0
      scope.selected = true
      scope.isCurrent = function(index) {
        return scope.current == index
      }
      scope.setCurrent = function(index) {
        scope.current = index
      }
      
      elem.bind('keydown', function(event) {
      let current
      let exec
      if(event.which === 13) { //enter
        if(!scope.model) return

        if(scope.isTask) {
          if(angular.isUndefined(scope.task)) scope.task = SettingsProvider.getTask()
          scope._task = scope.task
          angular.element('#taskmanager').openModal()  
          scope.reset()    
          return
        }

        if(scope.isDict) {
          var dict = scope.model.substring(1)
          ipc.send('dict', dict.trim())
          $timeout(function() {
            scope.reset()
          }, 0)
          return
        }

        if(scope.isNote) return ipc.send("note-manager")
        
        var model = scope.filtered[scope.current]
        if(angular.isDefined(model)) {
          exec = path.join(model.path, model.file)
          scope.handleExecute(exec, event.ctrlKey)
        } else {
          exec = "http://www.google.com/search?source=crispyfish&q="
          scope.handleExecute(encodeURI(exec.concat(scope.model)))
        }
      }

      if(event.which === 40) { //down
        event.preventDefault()
        if(!scope.hasResults()) return
        current = scope.current + 1
        if(current === scope.filtered.length) return
        $timeout(function() {
          scope.setCurrent(current)         
        }, 0)
      }
      if(event.which === 38) { //up
        event.preventDefault()
        if(!scope.hasResults()) return
        current = scope.current - 1
        if(current < 0) return
        $timeout(function() {
          scope.setCurrent(current)         
        }, 0)        
      }
    })    
      
    },
    templateUrl: 'assets/tpl/typeahead.html'
  }
})