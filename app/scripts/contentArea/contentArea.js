// Holds all of the translation pairs and handles the interface with the Document service
// Content area is the place for global control of the /edit view
angular.module('controllers').controller('ContentAreaCtrl',
    ['$scope', 'Document', 'editSession', '$location', '$state', '$stateParams', '$modal', '$rootScope', '$log',
    function($scope, Document, editSession, $location, $state, $stateParams, $modal, $rootScope, $log) {

  // TODO: focus the edit area -- edit areas call the translation memory onFocus
  $scope.language = Document.targetLang;
  $scope.numSegments = Document.segments.length;
  // each segment is a reference to the segment in the Document service
  $scope.segments = Document.segments;

  // this fires once the view content has completely loaded
  $rootScope.$on('repeat-finished', function (event) {
    // quick hack -- just activate segment 0
    editSession.setSegment(0);

    var segmentId = $stateParams.segmentId;
    if (segmentId) {
      var anchorElem = document.getElementById('segment-' + segmentId);
      if (anchorElem) {
        var top = anchorElem.offsetTop;
        $("body").animate({scrollTop: top-60}, "slow");
      }
    }
  });

  // if the state changes during the session without a reload
  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams){
      var segmentId = toParams.segmentId;
      if (toState.name.match(/edit\.segment/) && segmentId) {
        var anchorElem = document.getElementById('segment-' + segmentId);
        if (anchorElem) {
          var top = anchorElem.offsetTop;
          $("body").animate({scrollTop: top-60}, "slow");
        }
      }
  });

  editSession.updateStat('pearl-document-loaded', -1, '');

  // DEV UTILS
  $scope.showXLIFF = editSession.debugXLIFF;
  // END DEV UTILS


  // watch the flag on the Documents service
  $scope.$watch(function() {

      return Document.revision;
    },
    function() {
      $log.log("ContentAreaCtrl: Number of segments in document: " + Document.segments.length);

      // segments is a list of [source, target] pairs
      $scope.segments = Document.segments;

    }
  );



}]);
