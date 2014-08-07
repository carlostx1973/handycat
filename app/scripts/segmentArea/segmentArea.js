// the segment area is the area of the UI representing a single translation unit
// this is a source + target pair
angular.module('controllers')
.controller('SegmentAreaCtrl', [
  '$rootScope', '$scope', 'Wikipedia', 'Glossary', 'GermanStemmer', '$sce', '$log', 'ruleMap', 'copyPunctuation',
  'Morphology', 'Document', 'project', 'entityLinker', 'entityDB',
  function($rootScope, $scope, Wikipedia, Glossary, GermanStemmer, $sce, $log, ruleMap, copyPunctuation, Morphology,
           Document, Project, entityLinker, entityDB) {

  $scope.entities = {};
  $scope.entities.entityMap = {};
  $scope.entities.currentEntity = {};
  $scope.entities.entityData = {};

  $scope.test = { 'test': 'TEST'};

  $scope.project = Project;

  $scope.insertSurfaceForm = function(sf) {
    $log.log('INSERT SURFACE FORM: ' + sf);
    $scope.insertText(' ' + sf + ' ');
  };

  $scope.getLink = function() {
    $log.log($scope.entities.entityMap);
    return 'http://dbpedia.org/resource/' + $scope.entities.currentEntity.name;
  };

  // (1) - surface forms
  // (2) - entity name (in German)
  // (1) - return entity name
  $scope.$on('find-surface-forms', function(e, data) {
    $log.log('find-surface-forms heard in segmentArea');
    $scope.findSurfaceForms(data.sf);
  });

  $scope.findSurfaceForms = function(entityName) {

//    var entityName = 'Berlin';
    $log.log('entityName: ' + entityName);
    var sfPromise = entityDB.queryEntities(entityName);
    sfPromise.then(
      function(res) {
        $log.log('queried entities for surface form of: ' + entityName);
        $log.log(res.data);
        var surfaceForms = res.data;

        $scope.entities.currentEntity.surfaceForms = [];
        $scope.entities.currentEntity.name = entityName;
        angular.forEach(surfaceForms, function(sf) {
          var sfObj = { 'name': sf[0], 'count': parseFloat(sf[1]) };
          $log.log(sfObj);
          $scope.entities.currentEntity.surfaceForms.push(sfObj);
        });
        $log.log("surfaceForms:");
        $log.log($scope.entities.currentEntity.surfaceForms);
      }
    );
  };

  $scope.linkSourceEntities = function() {

    $log.log('linkSourceEntities');
    var annotationPromise = entityLinker.annotate($scope.segment.source);

    // see http://stackoverflow.com/questions/18690804/insert-and-parse-html-into-view-using-angularjs
    annotationPromise.then(
      function (res) {
        $log.log('entity linking res: ');
        $log.log(res.data);
        var result = res.data;
        if (result.Resources) {
          $scope.entities.entityData = result.Resources;
          $scope.entities.entityMap[result['@surfaceForm']] = result['@URI'];

          // tell the source area that we've got entities
          // source area should tag, compile, and replace
          $scope.$broadcast('update-source', { 'entityData': result.Resources });
        }
      },
      function(e) {
        $log.log('Error in entity linking request');
        $log.log(e);
      }
    );
  };

  // TODO: set this only when this is the active scope
  $scope.isActive = { active:true };

  // working: only one field on this object (not currentState AND completed)
  $scope.segmentState = { currentState: 'untranslated', completed: false };

  // this is the interface to segment state -- always change via this interface
  $scope.changeSegmentState = function changeSegmentState (stateName) {
    $scope.segmentState = stateName;
    $scope.$broadcast('change-segment-state', { 'newState': stateName })
  }

  /*
  $scope.activate = function(index) {
  $log.log("Index: " + $scope.index);
    $rootScope.$broadcast('activate-segment', index);
  };

  $scope.$on('activate-segment', function(event, index) {
      $log.log("Index: " + $scope.index + " " + "index: " + index);
    $scope.isActive.active = $scope.index == index;
  });*/

  $scope.language = Document.targetLang;

  // for the concordancer - default to English
  $scope.queryLang = 'en';

// currently the model names on the child controllers are different
  $scope.setSource = function(sourceSentence) {
    $log.log("setSource");
    $log.log("source is: " + sourceSentence);
    $scope.segment.source = sourceSentence;
  };
  $scope.setTarget = function(targetSentence) {
     $scope.segment.target = targetSentence;
  };

  // Text currently selected in the child editor
  $scope.setTextSelection = function(text, range) {
    $scope.selectedToken = text;
    $scope.selectedRange = range;
    $log.log('setTextSelection fired, selectedToken: '+$scope.selectedToken+' selectedRange: ' + $scope.selectedRange);
  };

  $scope.clearSelection = function() {
    $scope.selectedToken = '';
    $scope.selectedRange = '';
  };

  $scope.copySourcePunctuation = function(segment) {
    $log.log('copy source called from segment ' + segment);
    var source = $scope.segment.source;
    var target = $scope.segment.target;
    $scope.segment.target = copyPunctuation.copySourcePunctuation(source, target);

    Project.updateStat('copyPunctuation', $scope.$index);
    // Only adds the action to the edit history if it actually did something.
    if ($scope.segment.target !== target) {
      $scope.editHistory.push(
        ruleMap.newRule('copy-source-punctuation', '', '', 'Copy punctuation from source segment', segment));
    }
  };


  $scope.findAndReplace = function(original, change, segment) {
    var regexp = original;
    console.log($scope.segment.target);
    var newTarget = $scope.segment.target.replace(new RegExp(regexp), change);
    console.log(newTarget);
    if (newTarget !== $scope.segment.target) {
      $scope.segment.target = newTarget;
      var msg = 'Find and Replace: ' + original + " → " + change;
      $scope.editHistory.push(
        ruleMap.newRule('find-and-replace', original, change, msg, segment));
      Project.updateStat('pearl-find-and-replace', $scope.$index, msg);
    }
  };

  $scope.findAndReplaceTokens = function(original, change, segment) {
    var regexp = '\\b' + original + '\\b';
    console.log($scope.segment.target);
    var newTarget = $scope.segment.target.replace(new RegExp(regexp), change);
    console.log(newTarget);
    if (newTarget !== $scope.segment.target) {
      $scope.segment.target = newTarget;
      var msg = 'Find and Replace tokens: ' + original + " → " + change;
      $scope.editHistory.push(
        ruleMap.newRule('find-and-replace-tokens', original, change, msg, segment));
      Project.updateStat('pearl-find-and-replace-tokens', $scope.$index, msg);
    }
  };

  // sets the current target token
  $scope.setCurrentToken = function(token) {
     $scope.currentToken = token;
  };

  $scope.changeTokenNumber = function(param) {
    $log.log('Change token number param: ' + param);
    // toggle the working state of the button
    $scope.changeNumberWorking = true;

    // the current selection is a range object from the Ace Editor
    if ($scope.selectedToken && $scope.selectedRange) {
      $log.log('change token number');
      var phrase = $scope.selectedToken;
      $log.log('the phrase to change is: ' + phrase);

//      var res = Morphology.changeNumber(phrase, 'de');
      var res = Morphology.changeNumber(phrase, 'de', param);
      res.then(
        function(result) {
          $log.log('the result from the morphology server: ');
          $log.log(result);

          if (phrase !== result.data['converted_phrase']) {
            var msg = 'Change number: ' + phrase + " → " + result.data['converted_phrase'] + " " + param;
            $scope.editHistory.push(
              ruleMap.newRule('change-token-number', phrase, result.data['converted_phrase'], msg, $scope.$index));
            Project.updateStat('pearl-change-number', $scope.$index, msg);
          }

          // this function is on the AceCtrl
          $scope.insertText(result.data['converted_phrase']);
          $scope.changeNumberWorking = false;
          $scope.clearSelection();
        },
        function(err) {
          $log.log('changeNumber failed');
          $log.log(err);
          $scope.changeNumberWorking = false;
        }
      );
      $scope.$broadcast('change-token-number');

    }
  };
  $scope.changeTokenGender = function(param) {
    // toggle the working state of the button
    $scope.changeGenderWorking = true;

    // the current selection is a range object from the Ace Editor
    if ($scope.selectedToken && $scope.selectedRange) {
      $log.log('change token gender');
      var phrase = $scope.selectedToken;
      $log.log('the phrase to change is: ' + phrase);

      var res = Morphology.changeGender(phrase, 'de', param);
      res.then(
        function(result) {
          $log.log('the result from the morphology server: ');
          $log.log(result);

          if (phrase !== result.data['converted_phrase']) {
            var msg = 'Change gender: ' + phrase + " → " + result.data['converted_phrase'] + " " + param;
            $scope.editHistory.push(
              ruleMap.newRule('change-token-gender', phrase, result.data['converted_phrase'], msg, $scope.$index));
            Project.updateStat('pearl-change-gender', $scope.$index, msg);
          }

          // this function is on the AceCtrl
          $scope.insertText(result.data['converted_phrase']);
          $scope.changeGenderWorking = false;
          $scope.clearSelection();
        },
        function(err) {
          $log.log('changeGender failed');
          $log.log(err);
          $scope.changeGenderWorking = false;
        }
      );
      $scope.$broadcast('change-token-gender');
    }
  };
  $scope.changeTokenCase = function(param) {
    // toggle the working state of the button
    $scope.changeCaseWorking = true;

    // the current selection is a range object from the Ace Editor
    if ($scope.selectedToken && $scope.selectedRange) {
      $log.log('change token case');
      var phrase = $scope.selectedToken;
      $log.log('the phrase to change is: ' + phrase);

      var res = Morphology.changeCase(phrase, 'de', param);
      res.then(
        function(result) {
          $log.log('the result from the morphology server: ');
          $log.log(result);

          if (phrase !== result.data['converted_phrase']) {
            var msg = 'Change case: ' + phrase + " → " + result.data['converted_phrase'] + " " + param;
            $scope.editHistory.push(
              ruleMap.newRule('change-token-case', phrase, result.data['converted_phrase'], msg, $scope.$index));
            Project.updateStat('pearl-change-case', $scope.$index, msg);
          }

          // this function is on the AceCtrl
          $scope.insertText(result.data['converted_phrase']);
          $scope.changeCaseWorking = false;
          $scope.clearSelection();
        },
        function(err) {
          $log.log('changeCase failed: ' + err);
          $scope.changeCaseWorking = false;
        }
      );
    }
    $scope.$broadcast('change-token-case');
  };

  $scope.queryConcordancer = function(query, lang) {
    $log.log('query is: ' + query + ', lang is: ' + lang);
    $scope.concordancerError = false;
    Project.updateStat('queryConcordancer', $scope.$index, query);
    Wikipedia.getConcordances(query, lang);
  };

  $scope.$on('concordancer-updated', function() {
// does $scope.$apply happen automagically? - answer: no, so we have to listen for the event
    $scope.concordanceMatches = Wikipedia.currentQuery;
  });

  $scope.$on('concordancer-error', function() {
    $scope.concordancerError = true;
  });

  // special chars toolbar showing
  $scope.showSpecialChars = true;

  // testing the special chars directive
  $scope.germanChars = ['ä','ö','ü','Ä','Ö','Ü','ß'];
  $scope.insertChar = function(char) {
    $log.log("char to insert: " + char);
    $scope.insertText(char);
  };

  // convert a snippet to trusted html - TODO: this isn't reusable because we send back x.snippet
  $scope.getSnippet = function(concordanceMatch) {
    return $sce.trustAsHtml(concordanceMatch.snippet);
  };

  // used as a callback for the glossary
  var updateGlossaryArea = function(glossaryMatches) {
    $log.log('Inside callback, the glossary matches: ');
    $log.log(glossaryMatches);
    if (glossaryMatches)
      $scope.glossaryMatches = glossaryMatches.map(function(item) {
        return item.text;
      });
  };

// TODO: collapse (remove from DOM) when this segment goes out of focus
  $scope.isCollapsed = {collapsed: true, clicked: false};
  $scope.toggleToolbar = function(bool) {
    if (arguments.length > 0) {
      $scope.isCollapsed = { collapsed: bool };
// TODO: there is a broken corner-case here
    } else {
      $scope.isCollapsed = { collapsed: !$scope.isCollapsed.collapsed };
    }
    $log.log("isCollapsed: the value of isCollapsed is: " + $scope.isCollapsed.collapsed);
  };

  $scope.clearEditor = function() {
   $log.log('clear editor fired on the segment control');
   $scope.$broadcast('clear-editor');
  };

//  $scope.getOtherWordForms = function(stemmedToken) {
//    $log.log('other word forms called with: ' + stemmedToken);
//    $scope.otherWordForms = GermanStemmer.getOtherForms(stemmedToken);
//  };

// TODO: use a promise
  // prep the model
  var glossary = {};
  glossary.glossaryQuery = undefined;
  $scope.glossary = glossary;
  $scope.queryGlossary = function(query, fromLang, toLang) {
    Glossary.getMatches(query, updateGlossaryArea, fromLang, toLang);
    Project.updateStat('queryGlossary', $scope.$index, query);
  };

  // Informs other segments that they should make a change.
  // The event argument is a unique object created by the ruleMap service.
  // The event will probably be received by the broadcaster as well so the action handlers
  // should check first if the edit should be applied or not.
  $scope.propagateEdit = function(index) {
    $rootScope.$broadcast('propagate-action', $scope.editHistory[index]);
    Project.updateStat('propagateAction', $scope.$index, $scope.editHistory[index].operation);
  };

  // Trigger propagated edits
  $scope.$on('propagate-action', function(event, edit) {
    if ($scope.segmentState.completed)
      return; // do not modify completed segments

    var from = edit.segment;

    $log.log(edit);
    if (edit.operation == 'copy-source-punctuation') {
      $scope.copySourcePunctuation(from);
    } else if (edit.operation == 'find-and-replace-tokens') {
      $scope.findAndReplaceTokens(edit.original, edit.change, from);
    } else if (edit.operation == 'find-and-replace') {
      $scope.findAndReplace(edit.original, edit.change, from);
    } else if (edit.operation == 'change-token-number') {
      $scope.findAndReplaceTokens(edit.context, edit.change, from);
    } else if (edit.operation == 'change-token-gender') {
      $scope.findAndReplaceTokens(edit.context, edit.change, from);
    } else if (edit.operation == 'change-token-case') {
      $scope.findAndReplaceTokens(edit.context, edit.change, from);
    }
    // Add more action handlers here if needed.
  });

  $scope.addToEditHistory = function(edit) {
    $scope.editHistory.push(edit);
  };

  // List of edit actions performed on this segment
  $scope.editHistory = [];

  // TODO: project should listen for this event, we shouldn't have a separate function to update the project
  $scope.segmentFinished = function(segId) {
    $log.log("segId is: " + segId);

    $scope.segmentState.completed = true;
    Project.updateStat('segmentFinished', segId);

    Document.completedSegments[segId] = true;
    Project.setActiveSegment(segId);
    Project.focusNextSegment();

    $scope.isActive.active = false;

    // Update the current segment
    $scope.segment.targetDOM.textContent = $scope.segment.target;
    Document.revision++;
  };

  // Re-opens a finished segment. Undoes what segmentFinished() did
  $scope.reopen = function(idx) {
    $scope.segmentState.completed = false;
    Project.setActiveSegment(idx-1);
    Project.focusNextSegment();
    $scope.isActive.active = true;
  };


}]);

