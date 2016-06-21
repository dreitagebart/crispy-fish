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

.controller('NotesCtrl', function($scope, SettingsProvider, NotesProvider, $document, $timeout) {
  
  $document.ready(function() {
    SettingsProvider.setZoom($scope.settings.layout.size)
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

  $scope.getEmptyNote = function() {
    $scope.note = {
      title: "",
      text: "",
      type: "text",
      color: "",
      isUrl: false,
      pagetitle: "",
      url: ""
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
    // $scope.note.hostname = (new URL(url)).hostname
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
  
  $scope.settings = new SettingsProvider()

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
