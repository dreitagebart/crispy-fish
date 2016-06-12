angular.module('app', ['hc.marked'])

.config(['markedProvider', function (markedProvider) {
  markedProvider.setOptions({
    gfm: true
  })
}])

.controller('HelpCtrl', function() {
  


  
})