angular.module('app', ['app.services'])

.controller('RemindCtrl', function($scope, SettingsProvider, NotesProvider, $timeout) {

  $scope.settings = new SettingsProvider()

  $scope.notes = []

  $scope.dismissReminder = function(id) {
    var index = 0
    angular.forEach($scope.notes, function(note) {
      if(note.id == id) $scope.notes.splice(index, 1)
      index++
    })

    ipc.send('dismiss-reminder', id)
    
    if($scope.notes.length == 0) remote.getCurrentWindow().close()
  }

  ipc.on('show-reminder', (event, args) => {
    if(args.length != $scope.notes.length) {
      $timeout(function() {
        var win = remote.getCurrentWindow()
        win.flashFrame(true)
        win.setTitle(`(${args.length}) reminder`)
        $scope.notes = args
      }, 0)
    }
  })

  // NotesProvider.getRemindableNotes().then(function(notes) {
  //   angular.forEach(notes, function(note) {
  //     if(note.remindme == 1) {
  //       $scope.notes.push(note)
  //     }
  //   })
  // }).catch(function(error) {
  //   debugger
  //   throw error
  // })

})
