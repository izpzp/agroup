// Generated by CoffeeScript 1.7.1

/*
 * Composition Mod for CodeMirror
 * v2.0.2
 * Zhusee <zhusee2@gmail.com>
 *
 * Additional instance properties added to CodeMirror:
 *   - cm.display.inCompositionMode (Boolen)
 *   - cm.display.compositionHead (Pos)
 *   - cm.display.textMarkerInComposition (TextMarker)
 */

(function() {
  var PREFIX_LIST, TEXT_MARKER_CLASS_NAME, TEXT_MARKER_OPTIONS, capitalizeString, clearCompositionTextMarkers, getPrefixedPropertyName, initCompositionMode, modInitialized, resetInputTranslate, setInputTranslate;

  modInitialized = false;

  TEXT_MARKER_CLASS_NAME = "CodeMirror-text-in-composition";

  TEXT_MARKER_OPTIONS = {
    inclusiveLeft: true,
    inclusiveRight: true,
    className: TEXT_MARKER_CLASS_NAME
  };

  PREFIX_LIST = ['webkit', 'moz', 'o'];

  capitalizeString = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  getPrefixedPropertyName = function(propertyName) {
    var prefix, prefixedPropertyName, tempElem, _i, _len;
    tempElem = document.createElement('div');
    if (tempElem.style[propertyName] != null) {
      return propertyName;
    }
    for (_i = 0, _len = PREFIX_LIST.length; _i < _len; _i++) {
      prefix = PREFIX_LIST[_i];
      prefixedPropertyName = prefix + capitalizeString(propertyName);
      if (tempElem.style[prefixedPropertyName] != null) {
        return prefixedPropertyName;
      }
    }
    return false;
  };

  CodeMirror.defineOption('enableCompositionMod', false, function(cm, newVal, oldVal) {
    if (newVal && !modInitialized) {
      if (window.CompositionEvent != null) {
        return initCompositionMode(cm);
      } else {
        console.warn("Your browser doesn't support CompositionEvent.");
        return cm.setOption('enableCompositionMod', false);
      }
    }
  });

  CodeMirror.defineOption('debugCompositionMod', false, function(cm, newVal, oldVal) {
    var inputField;
    inputField = cm.display.input;
    if (typeof jQuery === "undefined" || jQuery === null) {
      return;
    }
    if (newVal) {
      $(inputField).on('input.composition-debug keypress.composition-debug compositionupdate.composition-debug', function(e) {
        return console.log("[" + e.type + "]", e.originalEvent.data, inputField.value, e.timeStamp);
      });
      return $(inputField).on('compositionstart.composition-debug compositionend.composition-debug', function(e) {
        return console.warn("[" + e.type + "]", e.originalEvent.data, inputField.value, cm.getCursor(), e.timeStamp);
      });
    } else {
      return $(inputField).off('.composition-debug');
    }
  });

  setInputTranslate = function(cm, translateValue) {
    var transformProperty;
    transformProperty = getPrefixedPropertyName("transform");
    return cm.display.input.style[transformProperty] = translateValue;
  };

  resetInputTranslate = function(cm) {
    return setInputTranslate("");
  };

  clearCompositionTextMarkers = function(cm) {
    var textMarker, textMarkersArray, _i, _len;
    textMarkersArray = cm.getAllMarks();
    for (_i = 0, _len = textMarkersArray.length; _i < _len; _i++) {
      textMarker = textMarkersArray[_i];
      if ((textMarker != null) && textMarker.className === TEXT_MARKER_CLASS_NAME) {
        textMarker.clear();
        if (cm.options.debugCompositionMod) {
          console.log("[TextMarker] Cleared");
        }
      }
    }
    return true;
  };

  initCompositionMode = function(cm) {
    var inputField, inputWrapper;
    inputField = cm.display.input;
    inputWrapper = cm.display.inputDiv;
    inputWrapper.classList.add('CodeMirror-input-wrapper');
    CodeMirror.on(inputField, 'compositionstart', function(event) {
      if (!cm.options.enableCompositionMod) {
        return;
      }
      cm.display.inCompositionMode = true;
      cm.setOption('readOnly', true);
      if (cm.somethingSelected()) {
        cm.replaceSelection("");
      }
      cm.display.compositionHead = cm.getCursor();
      if (cm.options.debugCompositionMod) {
        console.log("[compositionstart] Update Composition Head", cm.display.compositionHead);
      }
      inputField.value = "";
      if (cm.options.debugCompositionMod) {
        console.log("[compositionstart] Clear cm.display.input", cm.display.compositionHead);
      }
      return inputWrapper.classList.add('in-composition');
    });
    CodeMirror.on(inputField, 'compositionupdate', function(event) {
      var endPos, headPos, markerRange, pixelToTranslate;
      if (!cm.options.enableCompositionMod) {
        return;
      }
      headPos = cm.display.compositionHead;
      if (cm.display.textMarkerInComposition) {
        markerRange = cm.display.textMarkerInComposition.find();
        cm.replaceRange(event.data, headPos, markerRange.to);
        cm.display.textMarkerInComposition.clear();
        cm.display.textMarkerInComposition = void 0;
      } else {
        cm.replaceRange(event.data, headPos, headPos);
      }
      endPos = cm.getCursor();
      cm.display.textMarkerInComposition = cm.markText(headPos, endPos, TEXT_MARKER_OPTIONS);
      pixelToTranslate = cm.charCoords(endPos).left - cm.charCoords(headPos).left;
      return setInputTranslate(cm, "translateX(-" + pixelToTranslate + "px)");
    });
    return CodeMirror.on(inputField, 'compositionend', function(event) {
      var endPos, headPos, postCompositionEnd, textLeftComposition, _ref;
      if (!cm.options.enableCompositionMod) {
        return;
      }
      textLeftComposition = event.data;
      headPos = cm.display.compositionHead;
      endPos = cm.getCursor();
      cm.replaceRange(textLeftComposition, headPos, endPos);
      cm.display.inCompositionMode = false;
      cm.display.compositionHead = void 0;
      if ((_ref = cm.display.textMarkerInComposition) != null) {
        _ref.clear();
      }
      cm.display.textMarkerInComposition = void 0;
      cm.setOption('readOnly', false);
      inputWrapper.classList.remove('in-composition');
      clearCompositionTextMarkers(cm);
      postCompositionEnd = function() {
        if (cm.display.inCompositionMode) {
          return false;
        }
        inputField.value = "";
        if (cm.options.debugCompositionMod) {
          console.warn("[postCompositionEnd] Input Cleared");
        }
        CodeMirror.off(inputField, 'input', postCompositionEnd);
        if (cm.options.debugCompositionMod) {
          return console.log("[postCompositionEnd] Handler unregistered for future input events");
        }
      };
      return CodeMirror.on(inputField, 'input', postCompositionEnd);
    });
  };

}).call(this);