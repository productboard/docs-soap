'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _constants = require('./constants');

var _parseHTML = require('./parseHTML');

var _parseHTML2 = _interopRequireDefault(_parseHTML);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var wrapNodeAnchor = function wrapNodeAnchor(node, href) {
  var anchor = document.createElement(_constants.elements.ANCHOR);
  anchor.href = href;
  anchor.appendChild(node.cloneNode(true));
  return anchor;
};

var wrapNodeInline = function wrapNodeInline(node, style) {
  var el = document.createElement(style);
  el.appendChild(node.cloneNode(true));
  return el;
};

var wrapNode = function wrapNode(inner, result) {
  var newNode = result.cloneNode(true);
  if (!inner) {
    return newNode;
  }
  if (inner.style && inner.style.fontWeight === _constants.styles.BOLD) {
    newNode = wrapNodeInline(newNode, _constants.elements.BOLD);
  }
  if (inner.style && inner.style.fontStyle === _constants.styles.ITALIC) {
    newNode = wrapNodeInline(newNode, _constants.elements.ITALIC);
  }
  if (inner.style && inner.style.textDecoration === _constants.styles.UNDERLINE) {
    newNode = wrapNodeInline(newNode, _constants.elements.UNDERLINE);
  }
  if (inner.style && inner.style.textDecoration === _constants.styles.STRIKETHROUGH) {
    newNode = wrapNodeInline(newNode, _constants.elements.STRIKETHROUGH);
  }
  if (inner.style && inner.style.verticalAlign === _constants.styles.SUPERSCRIPT) {
    newNode = wrapNodeInline(newNode, _constants.elements.SUPERSCRIPT);
  }
  if (inner.style && inner.style.verticalAlign === _constants.styles.SUBSCRIPT) {
    newNode = wrapNodeInline(newNode, _constants.elements.SUBSCRIPT);
  }
  return newNode;
};

var applyBlockStyles = function applyBlockStyles(dirty) {
  var node = dirty.cloneNode(true);
  var newNode = document.createTextNode(node.textContent);
  var styledNode = document.createTextNode('');
  if (node.childNodes[0] && node.childNodes[0].style) {
    styledNode = node.childNodes[0];
  }
  if (node.childNodes[0] && node.childNodes[0].nodeName === 'A') {
    // flow-ignore Flow doesn't recognize that a childNode can be an HTMLAnchorElement
    newNode = wrapNodeAnchor(newNode.cloneNode(true), node.childNodes[0].href);
    styledNode = node.childNodes[0].childNodes[0];
  }
  newNode = wrapNode(styledNode, newNode);
  return newNode;
};

var applyInlineStyles = function applyInlineStyles(dirty) {
  var node = dirty.cloneNode(true);
  var newNode = document.createTextNode(node.textContent);
  var styledNode = node;
  if (node.nodeName === 'A') {
    // flow-ignore Flow doesn't recognize that cloneNode() can return an HTMLAnchorElement
    newNode = wrapNodeAnchor(newNode, node.href);
    if (node.childNodes[0] && node.childNodes[0].style) {
      styledNode = node.childNodes[0];
    }
  }
  newNode = wrapNode(styledNode, newNode);
  return newNode;
};

var getCleanNode = function getCleanNode(node) {
  if (node.childNodes && (node.childNodes.length <= 1 || node.nodeName === 'OL' || node.nodeName === 'UL')) {
    var _ret = function () {
      var newWrapper = null;
      var newNode = document.createTextNode(node.textContent);
      if (node.nodeName === 'UL' || node.nodeName === 'OL' || node.nodeName === 'LI') {
        newWrapper = document.createElement(node.nodeName);
        newNode = document.createDocumentFragment();
        var items = [];
        for (var i = 0; i < node.childNodes.length; i++) {
          items.push.apply(items, _toConsumableArray(getCleanNode(node.childNodes[i])));
        }
        items.map(function (i) {
          return newNode.appendChild(i);
        });
      } else if (node.nodeName === 'P') {
        newWrapper = document.createElement('p');
        newNode = applyBlockStyles(node);
      } else {
        newWrapper = document.createElement('span');
        newNode = applyInlineStyles(node);
      }
      if (newWrapper) {
        newWrapper.appendChild(newNode);
        return {
          v: [newWrapper]
        };
      }
      return {
        v: [node.cloneNode(true)]
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
  }
  if (node.childNodes) {
    var nodes = [];
    for (var i = 0; i < node.childNodes.length; i++) {
      nodes.push.apply(nodes, _toConsumableArray(getCleanNode(node.childNodes[i])));
    }
    return nodes;
  }
  return [node];
};

/**
 * parses the given "dirty" clipboard content and returns a (mostly) clean
 * HTML document with only the HTML content you want
 * @param dirty
 * @returns {HTMLElement}
 */
var getCleanDocument = function getCleanDocument(dirty) {
  // create a new document to preserve the integrity of the original data
  var body = document.createElement('body');
  var nodes = dirty.childNodes;
  var cleanNodes = [];

  // for each top level node, clean it up recursively
  for (var i = 0; i < nodes.length; i++) {
    cleanNodes.push.apply(cleanNodes, _toConsumableArray(getCleanNode(nodes[i])));
  }

  // append all of the clean nodes to the new document
  for (var _i = 0; _i < cleanNodes.length; _i++) {
    body.appendChild(cleanNodes[_i].cloneNode(true));
  }

  // all clean
  return body;
};

module.exports = function (clipboardContent) {
  if (typeof clipboardContent !== 'string') {
    throw new Error('Expected \'clipboardContent\' to be a string of HTML, received ' + (typeof clipboardContent === 'undefined' ? 'undefined' : _typeof(clipboardContent)));
  }
  if (clipboardContent.length <= 0) {
    throw new Error('Expected clipboardContent to have content, received empty string');
  }
  if (!clipboardContent.match(_constants.docsId)) {
    return (0, _parseHTML2.default)(clipboardContent.replace(/(\r\n|\n|\r)/, '')).outerHTML;
  }
  return getCleanDocument((0, _parseHTML2.default)(clipboardContent.replace(/(\r\n|\n|\r)/, ''))).outerHTML;
};