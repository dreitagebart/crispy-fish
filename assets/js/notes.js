angular.module('app', ['app.services', 'ngAnimate', 'truncate'])

.filter('moment', function() {
  return function(date) {
    return moment(date).fromNow()
  }
})

.filter('hostname', function() {
  return function(url) {
    if(!url) return
    return (new URL(url)).hostname
  }
})

.filter('reminder', function() {
  return function(date) {
    if(!date) return
    return moment(date).calendar(null, {
      sameDay: '[today, at] h:mm A',
      nextDay: '[tomorrow, at] h:mm A',
      nextWeek: '[next week] dddd[, at] h:mm A',
      sameElse: 'dddd[,] MM.DD.YYYY[, at] h:mm A'
    })
  }
})

.controller('NotesCtrl', function($scope, SettingsProvider, NotesProvider, $document, $timeout, $interval) {

  var reminder

  ipc.on('dismiss-reminder', (event, data) => {
    var index = 0
    angular.forEach($scope.notes, function(note) {
      if(note.id == data) $scope.notes[index].reminded = 1
      index++
    })
    NotesProvider.setReminded(data)
  })

  ipc.on('silent-refresh', (event, message) => {
    $timeout(function() {
      $scope.settings = new SettingsProvider()
    }, 0)
  })

  $scope.settings = new SettingsProvider()

  $document.ready(function() {
    $scope.startReminder()

    angular.element('.dropdown-button').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false, // Does not change width of dropdown to that of the activator
      hover: false, // Activate on hover
      gutter: 0, // Spacing from edge
      belowOrigin: true, // Displays dropdown below the button
      alignment: 'left' // Displays dropdown with edge aligned to the left of button
    })
  })

  $scope.deleteReminder = function() {
    $scope.note.reminder = null
  }

  $scope.stopReminder = function() {
    if(angular.isDefined(reminder)) {
      $interval.cancel(reminder)
      reminder = null
    }
  }
      
  $scope.startReminder = function() {
    if(angular.isDefined(reminder)) return
    reminder = $interval(function() {
      var remindme = false
      var notes = []
      var index = 0
      var now = Date.now()
      angular.forEach($scope.notes, function(note) {
        if(note.reminder && note.reminded == 0) {
          if(note.reminder < now) {
            notes.push(note)

            $scope.notes[index].remindme = 1
            remindme = true
          }
          index++
        }
      })
      if(remindme) {
        ipc.send('show-reminder', notes)
      }     
    }, 60000) //each minute
  }
  
  $scope.$on('$destroy', function() {
    // Make sure that the interval is destroyed too
    $scope.stopReminder()
  })

  $scope.addReminder = function(which) {
    var today = moment()
    var target
    if(which == 'test') {
      target = moment(today).add(10, 'seconds')
    }
    if(which == 'tomorrow') {
      target = moment(today).add(1, 'days').hour(8).minute(0).second(0)
    }
    if(which == 'week') {
      target = moment(today).add(1, 'weeks').hour(8).minute(0).second(0)
    }
    if(which == 'custom') {
      
    }
    
    $scope.note.reminder = target.valueOf()
  }

  $scope.getEmptyNote = function() {
    $scope.note = {
      title: "",
      text: "",
      type: "text",
      color: "",
      isUrl: false,
      pagetitle: "",
      url: "",
      reminder: "",
      remindme: 0,
      reminded: 0
    }
  }

  $scope.scrapeUrl = function() {
    var url = $scope.note.title
    if(!url.startsWith('http://') && !url.startsWith('https://')) return $scope.isUrl = false
    $scope.note.url = url
    $scope.note.type = 'url'
    var title = NotesProvider.scrapeUrl(url)
    title(function(error, result) {
      $timeout(function() {
        $scope.note.pagetitle = result
      }, 0)
    })
  }

  $scope.resetSearch = function() {
    angular.element('#search').focus()
    $scope.search = ""
  }
  
  $scope.layout = "block"
  
  $scope.switchLayout = function() {
    if($scope.layout === "block") return $scope.layout = "list"
    return $scope.layout = "block"
  }

  new NotesProvider().then(function(notes) {
    $timeout(function() {
      $scope.notes = notes
    }, 0)
  })
  
  $scope.showNote = function(note) {
    if(note.type == 'url') return shell.openExternal(note.url)

    angular.element('#notemodal').openModal()
    $scope.modal = note
    console.log(note)
  }

  $scope.resetNote = function() {
    $scope.note = {}
    $scope.isEditMode = false
  }
  
  $scope.newNote = function() {
    angular.element('#note-title').focus()
    $scope.isEditMode = true
    $scope.getEmptyNote()
  }

  $scope.setColorNote = function(value) {
    $scope.note.color = value
  }

  $scope.addNote = function() {
    if(!$scope.note.title && !$scope.note.text) {
      var $toastContent = $('<span>Please set a title or text for your note...</span>')
      return Materialize.toast($toastContent, 6000)
    }

    if($scope.note.type === "url") $scope.note.title = $scope.note.pagetitle
    var note = NotesProvider.addNote($scope.note)
    $scope.notes.push(note)
    $scope.resetNote()
    var $toastContent = $('<span>Note added...</span>')
    Materialize.toast($toastContent, 6000)
  }
  
  $scope.deleteNote = function(id) {
    var index = 0
    NotesProvider.deleteNote(id)
    angular.forEach($scope.notes, function(note) {
      if(note.id === id) {
        $scope.notes.splice(index, 1)
        return
      }
      index++
    })

    var $toastContent = $('<span>Note deleted... <a href="" ng-click="undoNote()">UNDO</a></span>')
    Materialize.toast($toastContent, 6000)
  }
})
