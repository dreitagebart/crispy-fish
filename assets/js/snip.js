const cropng = require("cropng")
const nativeImage = electron.nativeImage
const desktopCapturer = electron.desktopCapturer

angular.module('app', ['app.services', 'ngJcrop'])

.run(function() {

})

.config(function(ngJcropConfigProvider){
  // [optional] To change the jcrop configuration
  // All jcrop settings are in: http://deepliquid.com/content/Jcrop_Manual.html#Setting_Options
  ngJcropConfigProvider.setJcropConfig({
    bgColor: 'black',
    bgOpacity: .4,
    maxWidth: window.screen.width,
    maxHeight: window.screen.height,
    aspectRatio: false
  })
})

.controller('SnipCtrl', function($scope, SettingsProvider, $window, $document) {

  const cwdir = SettingsProvider.getPath()

  $scope.snipIt = function(fullscreen) {
    if(fullscreen) {
      clipboard.writeImage(nativeImage.createFromPath('assets/scr/screenshot.png'))
      return
    }

    var png = new cropng(path.join(cwdir, $scope.obj.src))
      
    png.crop({ 
      x: $scope.obj.coords[0], 
      y: $scope.obj.coords[1],
      height: $scope.obj.coords[5],
      width: $scope.obj.coords[4]
    }, function (error, image) {
      if(error) throw error
      clipboard.writeImage(nativeImage.createFromBuffer(image.data))
      $window.close()
    })
  }

  $scope.obj = {}

  // The url or the data64 for the image
  $scope.obj.src = 'assets/scr/screenshot.png'

  // Must be [x, y, x2, y2, w, h]
  $scope.obj.coords = [window.screen.width-60, 80, window.screen.width-61, 80, 1, 1]

  // You can add a thumbnail if you want
  $scope.obj.thumbnail = false

})