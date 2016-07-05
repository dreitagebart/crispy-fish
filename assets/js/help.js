angular.module('app', ['hc.marked'])

.config(['markedProvider', function (markedProvider) {
  markedProvider.setOptions({
    gfm: true
  })
}])

.controller('HelpCtrl', function($scope, $timeout) {

  ipc.on('silent-refresh', (event, message) => {
    debugger
    $timeout(function() {
      $scope.settings = new SettingsProvider()
    }, 0)
  })
})