require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Trie = function() {
  this.words = 0;
  this.prefixes = 0;
  this.value = "";
  this.children = [];
};


/**
 * Add a value to the trie
 *
 * @param {String} value
 * @param {Number} index (optional)
 */
Trie.prototype.addValue = function(item, index) {
  if (!index) {
    index = 0;
  }
  if(item === null) {
    return;
  }

  var isObject = false;

  if(typeof item === 'object') {
    isObject = true;
  }

  if (isObject && item.key.length === 0) {
    return;
  }
  else if(!isObject && item.length === 0) {
    return;
  }

  if ((isObject && index === item.key.length) || (!isObject && index === item.length)) {
    this.words += 1;
    this.value = isObject ? item.value : item;
    return;
  }

  this.prefixes += 1;
  var key = isObject ? item.key[index] : item[index];
  if (this.children[key] === undefined) {
    this.children[key] = new Trie();
  }
  var child = this.children[key];
  child.addValue(item, index + 1);
};

/**
 * Remove a value form the trie
 *
 * @param {String} value
 * @param {Number} index (optional)
 */
Trie.prototype.removeValue = function(item, index) {
  if (!index) {
    index = 0;
  }

  if (item.length === 0) {
    return;
  }

  if (index === item.length) {
    this.words--;
    this.value="";
  }
  else {
    this.prefixes--;
    var key = item[index];
    var child = this.children[key];
    if(child) child.removeValue(item, index + 1);
    // to remove a node, we need remove it from parent's children array
    if(index === (item.length -1)) {
      if(Object.keys(child.children).length === 0) {// only remove when there is no children
        delete this.children[key];
      }
    }
  }
};

/** Get the count of instances of a word in the entire trie
 *
 * @param {String} word
 * @param {Number} index (optional)
 */
Trie.prototype.wordCount = function(value, index) {
  if (!index) {
    index = 0;
  }

  if (value.length === 0) {
    return 0;
  }

  if (index === value.length) {
    return this.words;
  } else {
    var key = value[index];
    var child = this.children[key];
    if (child) {
      return child.wordCount(value, index + 1);
    } else {
      return 0;
    }
  }
};

/** Get the count of instances of a prefix in the enture trie
 *
 * @param {String} prefix
 * @param {Number} index
 */
Trie.prototype.prefixCount = function(prefix, index) {
  if (!index) {
    index = 0;
  }

  if (prefix.length === 0) {
    return 0;
  }

  if (index === prefix.length) {
    return this.prefixes;
  } else {
    var key = prefix[index];
    var child = this.children[key];
    if (child) {
      return child.prefixCount(prefix, index + 1);
    } else {
      return 0;
    }
  }
};

/**
 * Check if a word exists in the trie
 *
 * @param {String} value
 */
Trie.prototype.wordExists = function(value) {
  if (value.length === 0) {
    return false;
  }

  return this.wordCount(value) > 0;
};

/**
 * Return all words with a prefix
 *
 * @param {String} prefix
 */
Trie.prototype.allChildWords = function(prefix) {
  var tmp, key, child
  if (!prefix) {
    prefix = '';
  }

  var words = [];
  if (this.words > 0) {
    if(this.value.lenth === 0) {
      tmp = new Object();
      tmp.key = prefix;
      tmp.value = prefix
      words.push(tmp);
    }
    else {
      tmp = new Object();
      tmp.key = prefix;
      tmp.value = this.value;
      words.push(tmp);
    }
  }

  for (key in this.children) {
    child = this.children[key];
    words = words.concat(child.allChildWords(prefix + key));
  }

  return words;
}

/**
 * Perform an autocomplete match
 *
 * @param {String} prefix
 * @param {Number} index
 */
Trie.prototype.autoComplete = function(prefix, index) {
  if (!index) {
    index = 0;
  }

  if (prefix.length === 0) {
    return [];
  }

  var key = prefix[index];
  var child = this.children[key];
  if (!child) {
    return [];
  } else {
    if (index === prefix.length - 1) {
      return child.allChildWords(prefix);
    } else {
      return child.autoComplete(prefix, index + 1);
    }
  }
};

exports.Trie = Trie;

},{}],"triecomplete":[function(require,module,exports){
var Trie = require('./lib/trie').Trie

var Autocomplete = function Autocomplete(name) {
  this.trie = new Trie()
  return this
}
Autocomplete.prototype.initialize = function(elements) {
  var self = this
  elements.forEach(function(element) {
    if(typeof element === 'object') {
      var item = {}
      item.key = element[0]
      item.value = element[1]
      self.addElement(item)
    }
    else {
      self.addElement(element)
    }
  })
}

Autocomplete.prototype.addElement = function(element) {
  this.trie.addValue(element)
}


Autocomplete.prototype.removeElement = function(element) {
  this.trie.removeValue(element)
}

Autocomplete.prototype.search = function(prefix) {
  return this.trie.autoComplete(prefix)
}

module.exports = Autocomplete

},{"./lib/trie":1}]},{},[]);
