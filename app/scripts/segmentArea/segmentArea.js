// the segment area is the area of the UI representing a single translation unit
// this is a source + target pair
angular.module('controllers')
.controller('SegmentAreaCtrl', ['$scope', 'Wikipedia', 'Glossary', '$sce', '$log', function($scope, Wikipedia, Glossary, $sce, $log) {
// TODO: display the results of the concordancer here, not from the AceCtrl

  // Note: don't do $scope.$watches, because we reuse this controller many times!

  // TODO: set this only when this is the active scope
  $scope.active = true;

  // Toolbar open
  $scope.toolbarOpen = false;
  $scope.queryConcordancer = function(query) {
    $log.log('query is: ' + query);
    Wikipedia.getConcordances(query);
  };
  $scope.$on('concordancer-updated', function(e) {
// does $scope.$apply happen automagically? - answer: no, so we have to listen for the event
    $scope.concordanceMatches = Wikipedia.currentQuery;
  })

//   http://glosbe.com/gapi/tm?from=eng&dest=deu&format=json&phrase="the company grew"&pretty=true

  // convert a snippet to trusted html - TODO: this isn't reusable becuase we send back x.snippet
  $scope.getSnippet = function(concordanceMatch) {
    return $sce.trustAsHtml(concordanceMatch.snippet);
  }

  // used as a callback for the glossary
  var updateGlossaryArea = function(glossaryMatches) {
    $scope.glossaryMatches = glossaryMatches;
  }
// TODO: use a callback
  $scope.queryGlossary = function(query) {
    Glossary.getMatches(query, updateGlossaryArea);

  }

}]);

