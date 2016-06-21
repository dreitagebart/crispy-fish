angular.module('app', ['app.services'])

.controller('AboutCtrl', function($scope, SettingsProvider) {
  
  $scope.settings = new SettingsProvider()

  $scope.openGithub = function() {
    shell.openExternal('http://github.com/dreitagebart/crispy-fish')
  }

  $scope.openTwitter = function() {
    shell.openExternal('http://twitter.com/dreitagebart')
  }

})
