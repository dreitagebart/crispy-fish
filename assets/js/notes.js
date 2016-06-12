angular.module('app', ['app.services', 'ngAnimate'])

.filter('moment', function() {
    return function(date) {
      return moment(date).fromNow()
    }
})

.controller('NotesCtrl', function($scope, SettingsProvider, NotesProvider, $document) {
  
  $document.ready(function() {
    SettingsProvider.setZoom($scope.settings.layout.size)
    angular.element('.dropdown-button').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false, // Does not change width of dropdown to that of the activator
      hover: true, // Activate on hover
      gutter: 0, // Spacing from edge
      belowOrigin: true, // Displays dropdown below the button
      alignment: 'left' // Displays dropdown with edge aligned to the left of button
    })
  })

  $scope.search = ""

  $scope.resetSearch = function() {
    angular.element('#search').focus()
    $scope.search = ""
  }

  $scope.isActive = false
  
  $scope.setActive = function(value) {
    $scope.isActive = value
  }
  
  $scope.layout = "block"
  
  $scope.switchLayout = function() {
    if($scope.layout === "block") return $scope.layout = "list"
    return $scope.layout = "block"
  }
  
  $scope.setEditMode = function() {
    if(!$scope.note.title) {
      $scope.isEditMode = false
      $scope.note = {}
    }
  }

  $scope.setEdit = function() {
    angular.forEach($scope.settings.notes, function(note) {
      if(note.edit === true) {
        $scope.note.title = note.title
        $scope.note.text = note.content
        $scope.isEditMode = true
        angular.element('#note-title').focus()
        return
      }      
    })
  }

  $scope.settings = new SettingsProvider()

  $scope.notes = new NotesProvider()
  
  $scope.resetNote = function() {
    $scope.note = {}
    $scope.isEditMode = false
  }
  
  $scope.newNote = function() {
    angular.element('#note-title').focus()
    $scope.isEditMode = true
    $scope.note = {}
  }

  $scope.setColorNote = function(value) {
    $scope.note.color = value
  }

  $scope.addNote = function() {
    debugger
    var note = NotesProvider.setNote($scope.note)

    $scope.notes.push(note)
    NotesProvider.commit($scope.notes)

    $scope.newNote()

    var $toastContent = $('<span>Note added...</span>')
    Materialize.toast($toastContent, 6000)
  }
  
  $scope.deleteNote = function(created) {
    var index = 0
    angular.forEach($scope.settings.notes, function(note) {
      if(created === note.created) return $scope.settings.notes.splice(index, 1)
      index++ 
    })
    
    NotesProvider.commit($scope.notes)

    var $toastContent = $('<span>Note deleted...</span>')
    Materialize.toast($toastContent, 6000)
  }
})
