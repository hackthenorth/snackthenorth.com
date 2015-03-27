(function() {
  // Creates Handlebars helpers for filling in form data from template data
  // usage: {{<helperName> a b}}
  // output: <helperName> if a == b, otherwise ""

  Handlebars.registerHelper('checked', function(option, value){
    if(!option || !value) {
      return '';
    }
    if(option.toString() === value.toString()) {
      return ' ' + 'checked';
    } else {
      return ''
    }
  });

  Handlebars.registerHelper('selected', function(option, value){
    if(!option || !value) {
      return '';
    }
    if(option.toString() === value.toString()) {
      return ' ' + 'selected';
    } else {
      return ''
    }
  });

  Handlebars.registerHelper('firstWord', function(string) {
    var words = string.split(" ");
    return words.length && words[0];
  });
})();

var HackTheNorth = (function() {
  var toggleButtonFunction = function(selector) {
    var button = $(selector);
    if(button.attr('disabled') == 'disabled') {
      button.removeAttr('disabled').removeClass('spinner');
    } else {
      button.attr('disabled', 'disabled').addClass('spinner');
    }
  };

  // From: http://stackoverflow.com/a/901144/534640
  var getParameterByNameFunction = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  return {
    toggleButton: toggleButtonFunction,
    getParameterByName: getParameterByNameFunction
  };
})();
