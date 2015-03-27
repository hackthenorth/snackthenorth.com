$(function() {
  $("#apply-button").click(function() {
    ga('send', 'event', 'button', 'click', 'register');

    $("#home").toggleClass('active');
    $("#q1").select();
    return false;
  });

  $("#sponsor").click(function() {
    ga('send', 'event', 'button', 'click', 'sponsor');
  });

  var $himage = $("#home_image");
  var $hgradient = $("#home_gradient");
  var $home = $("#home");
  $hgradient.css("background", "#393939");

  $("body").mousemove(function(e) {
    if ($home.hasClass("active")){
      $hgradient.css("background", "#393939");
      return;
    }
    var x = e.pageX;
    var y = e.pageY;
    var offX = $hgradient.offset().left;
    var offY = $hgradient.offset().top;
    var gradient = (
      "(ellipse at " + (x-offX) + "px " + (y-offY) + "px, #777 0%, #393939 25%)");
    $hgradient.css("background", "radial-gradient" + gradient);
  })

  var resizeGradient = function() {
    var width = $himage.width();
    var height = $himage.height();
    var wwidth = $(window).width();

    //dirty hack to keep scaled image in the same(ish) vertical position
    var topOffset = Math.abs(wwidth-1100 > 0 ? 0 : wwidth-1100)/4;
    $hgradient.css("width", width);
    $hgradient.css("height", height);
    $himage.css("margin-top", topOffset);
    $hgradient.css("margin-top", topOffset);
  }

  $(window).resize(resizeGradient);
  $(window).on("load", function() {
    resizeGradient();
  });

  $(".application-back").click(function() {
    $("#home").removeClass("active");
  });

  $(".sponsor-us-lower-link").click(function() {
    ga('send', 'event', 'button', 'click', 'sponsor-lower');
  });

  // The code below is written at 1AM hacking together a form

  var nlform = new NLForm( document.getElementById( 'application-form' ) );

  var theForm = document.getElementById('application-form');
  theForm.setAttribute( "autocomplete", "off" );

  new stepsForm(theForm, {
    onSubmit: function(form) {
      // hide form
      classie.addClass(theForm.querySelector('.simform-inner'), 'hide');

      var payload = $("#application-form").serializeArray();

      var unixTimeStamp = function() {
        // Our Firebase backend wants seconds instead of milliseconds for timestamps.
        return Math.round(new Date().getTime()/1000);
      }

      var data = {
        timestamp: unixTimeStamp()
      };

      $.each(payload, function(index, nameValuePair) {
        data[nameValuePair.name] = nameValuePair.value;
      });

      $.post(
        'https://hackthenorth.firebaseio.com/signup.json',
        JSON.stringify(data)
      )
      .done(function() {
        $('.final-message').addClass('show');
        $(".final-message-email").text(data['email'])

        ga('send', 'event', 'form', 'submit', 'registration');
      })
      .fail(function(data) {
        console.error("Error applying");
        console.error(data);

        ga('send', 'event', 'form', 'failure', 'registration');
      });
    }
  });

  if(window.location.hash === "#apply") {
    window.setTimeout(function() {
      $("#apply-button").click();
    }, 1000);
  }

  console.log("If you're really determined about applying, we're sure you can hack it ;)");
});
