angular.module('app', ['app.services'])

.controller('AboutCtrl', function($scope, SettingsProvider, $timeout) {

  ipc.on('silent-refresh', (event, message) => {
    debugger
    $timeout(function() {
      $scope.settings = new SettingsProvider()
    }, 0)
  })

  $scope.settings = new SettingsProvider()

  $scope.openGithub = function() {
    shell.openExternal('http://github.com/dreitagebart/crispy-fish')
  }

  $scope.openTwitter = function() {
    shell.openExternal('http://twitter.com/dreitagebart')
  }

})
