$(function() {
  function getUserUrl(user, token) {
    return 'https://hackthenorth.firebaseio.com/users/' + user + '.json?auth=' + token;
  }

  var bind = function(user, token) {
    $(".create-team-button").click(function() {
      HackTheNorth.toggleButton(".create-team-button");
      createTeam(window.userID, token, function(err, teamName) {
        if(teamName) {
          window.team = teamName;
          var source = $("#team-template").html();
          var template = Handlebars.compile(source);
          var data = getTeamMembers(teamName, token);

          $(".team-members-section").html(template(data));
        }
        bind(user, token);
      });
    });


    $(".leave-team-button").click(function() {
      $(".leave-team-confirm-container").show();
      $(".leave-team-button").hide();
    });

    $(".leave-team-cancel-button").click(function() {
      $(".leave-team-confirm-container").hide();
      $(".leave-team-button").show();
    });

    $(".leave-team-confirm-button").click(function() {
      HackTheNorth.toggleButton(".leave-team-confirm-button");

      var teamName = window.team || window.user.team;
      deleteFromTeam(user, teamName, token, function(err) {
        if(err) {
          HackTheNorth.toggleButton(".leave-team-confirm-button");
          $(".leave-team-confirm-button").text("Error :(");
          return;
        }

        handleTeam({});
        bind(user, token);
      });
    });

    $(".join-team-form").submit(function(e) {
      e.preventDefault();
      HackTheNorth.toggleButton(".join-team-button");

      var teamCode = $(".invite-code-input").val();
      addToTeam(window.user, teamCode, token, function(err) {
        HackTheNorth.toggleButton(".join-team-button");

        if(err) {
          $(".join-team-button").text("Bad code :(");
          return;
        }

        var source = $("#team-template").html();
        var template = Handlebars.compile(source);
        var data = getTeamMembers(teamCode, token);

        $(".team-members-section").html(template(data));
        bind(user, token);
      });
    });

  }


  function handleTeam(user) {
    if(user.team) {
      var source = $("#team-template").html();
      var template = Handlebars.compile(source);
      var data = getTeamMembers(user.team, window.token);
      $(".team-members-section").html(template(data));
    } else {
      var source = $("#no-team-template").html();
      var template = Handlebars.compile(source);
      $(".team-members-section").html(template({}));
    }
  }

  function setWithdrawalStatus(bool, callback) {
    var req = $.ajax({
                      url: "https://hackthenorth.firebaseio.com/users/" + userData.id + "/withdrawn.json?auth=" + window.token,
                      type: 'PUT',
                      data: JSON.stringify(bool ? true : null)
                    })
                      .done(function(data) {
                        callback(null, data)
                      })
                      .fail(function(jqXHR, textStatus, errorThrown) {
                        callback(textStatus, null)
                      });
  }

  function handleApplicationStatus(userData) {
    $.get("https://hackthenorth.firebaseio.com/decisions/" + userData.id + ".json?auth=" + window.token, function(status) {
      var source;
      window.applicationStatus = status;

      if(status === "Accepted") {
        source = $("#application-status-accepted-template").html();
      }
      else if(status === "Rejected") {
        source = $("#application-status-rejected-template").html();
      }
      else if(status === "Waitlisted") {
        source = $("#application-status-waitlisted-template").html();
      }
      else {
        source = $("#application-status-processing-template").html();
      }

      var template = Handlebars.compile(source);
      $(".application-status").html(template(userData));

      $(".confirm-registration-button").click(function() {
        var source = $("#confirm-registration-template").html();
        var template = Handlebars.compile(source);
        $(".application-wrapper").html(template(userData));

        completeRegistrationSteps[0](userData);

        mixpanel.track("Start registration", {});
      });

      $(".application-withdrawal-checkbox").change(function() {
        var _this = this;
        _this.disabled = true;
        setWithdrawalStatus(this.checked, function(err, withdrawalStatus) {
          _this.disabled = false;

          mixpanel.track("Change withdrawal status", {
            "Status": _this.checked
          });
        });
      });

      mixpanel.people.set({
        "Decision": status
      });
    })
      .fail(function() {
        var source = $("#application-status-processing-template").html();
        var template = Handlebars.compile(source);
        $(".application-status").html(template(userData));
      });
  }


  function getApplicationData(token, callback) {
    var fbRef = new Firebase('https://hackthenorth.firebaseio.com/auth');

    fbRef.auth(token, function(err, data) {
      if(err) {
        callback(err, null, null);
        return;
      }

      var user = (data.auth && data.auth.email_hash) || null;
      window.userID = user;

      if(!user) {
        callback("No user found for token", null, null);
        return;
      }

      var userURL = getUserUrl(user, token);
      $.get(userURL)
        .done(function(data, textStatus, jqXHR) {

          // Go offline so we don't spawn too many concurrent connections and have to pay.
          window.user = data;
          Firebase.goOffline();
          callback(null, data, user);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          callback(errorThrown, null, null);
        });
    });
  }

  function submitApplicationData(user, token, data, callback) {
    var userURL = getUserUrl(user, token);

    var flags = userData.flags || {};
    flags.last_updated = new Date();
    $.extend(data, {
      flags: flags
    });

    $.ajax({
      url: userURL,
      type: 'PATCH',
      data: JSON.stringify(data)
    })
      .done(function(data, textStatus, jqXHR) {
        ga('send', 'event', 'form', 'submit', 'applicant-profile');

        callback(null);
      })
      .fail(function(qXHR, textStatus, errorThrown) {
        console.error("Error registering");
        console.error(errorThrown);

        ga('send', 'event', 'form', 'failure', 'applicant-profile');

        callback(errorThrown);
      });
  }

  function bindPageListeners(user, token, userData) {
    $(".application-form").submit(function(e) {
      e.preventDefault();

      var data = {};
      var payload = $(this).serializeArray();
      $.each(payload, function(index, nameValuePair) {
        data[nameValuePair.name] = nameValuePair.value;
      });

      HackTheNorth.toggleButton(".application-submit-button");

      submitApplicationData(user, token, data, function(err) {
        HackTheNorth.toggleButton(".application-submit-button");

        if(err) {
          $(".application-submit-button").text("Error saving :(");
        }
        else {
          $(".application-submit-button").text("Saved!");
        }
      });
    });
  }

  function errorFindingApplicationHTML() {
    return "<strong>Could not find your application</strong>"
          + "<br>Please contact "
          + "<a href='mailto:hello@hackthenorth.com'>hello@hackthenorth.com</a>"
          + " if you believe this is an error.";
  }

  function onPageLoad() {
    var token = extendToken(HackTheNorth.getParameterByName('token'));

    getApplicationData(token, function(err, data, user) {
      if(err) {
        $(".application-group").html(errorFindingApplicationHTML());
        return;
      }

      window.token = token;
      window.user = user;
      window.userData = data;

      mixpanel.identify(window.user);
      mixpanel.people.set({
        "$email": data.email,
        "$name": data.name,
        "$created": (new Date(data.timestamp*1000)).toISOString()
      });

      var source = $("#application-template").html();
      var template = Handlebars.compile(source);
      $(".application-form").html(template(data));

      handleTeam(data);
      bind(user, token);
      bindPageListeners(user, token, data);

      handleApplicationStatus(data);
    });
  }

  function onResumeChange(event) {
    if(event.eventPhase == 2) { // file added
      var data = {
        resume_url: event.fpfile.url,
        resume_s3_key: event.fpfile.key,
        resume_filename: event.fpfile.filename
      };

      mixpanel.track("Upload resume", {});

      submitApplicationData(window.user, window.token, data, function(err) {
        $.extend(window.userData, data);
        refreshRegistrationStep(window.userData);
      });
    }
  }

  function onWaiverChange(event) {
    if(event.eventPhase == 2) { // file added
      var data = {
        waiver_url: event.fpfile.url,
        waiver_s3_key: event.fpfile.key,
        waiver_filename: event.fpfile.filename
      };

      mixpanel.track("Upload waiver", {});

      submitApplicationData(window.user, window.token, data, function(err) {
        $.extend(window.userData, data);
      });
    }
  }

  function onReceiptChange(event) {
    if(event.eventPhase == 2) { // file added
      var receipts = window.userData.receipts || [];
      receipts = receipts.concat(event.fpfiles);

      var travelMethod = $(".travel-method-select").val();

      var data = {
        receipts: receipts,
        // Update travel method for registrationStep refresh.
        travel_method: travelMethod
      };

      mixpanel.track("Travel receipt uploaded", {
        "Method": travelMethod
      });

      submitApplicationData(window.user, window.token, data, function(err) {
        $.extend(window.userData, data);
        refreshRegistrationStep(window.userData);
      });
    }
  }


  function loadWaiver(userData) {
    userData.waiver_date = userData.waiver_date || (new Date()).toDateString();

    var source = $("#waiver-template").html();
    var template = Handlebars.compile(source);
    $(".registration-step").html(template(userData));

    filepicker.setKey("Am4vcKCCISSK4JcywwLtwz");

    var widget = $(".waiver-filepicker")[0];
    widget.onchange = onWaiverChange;
    filepicker.constructWidget(widget);

    mixpanel.track_links(".waiver-link", "Clicked Waiver");

    $(".under-18-checkbox").change(function() {

      if($(this).prop("checked")) {
        $(".under-18-section").show();
      }
      else {
        $(".under-18-section").hide();
      }
    });

    $(".waiver-form").submit(function(e) {
      e.preventDefault();

      // Set defaults for multiple-choice forms
      var data = {
        under_18: false,
      };
      var payload = $(this).serializeArray();
      $.each(payload, function(index, nameValuePair) {
        data[nameValuePair.name] = nameValuePair.value;
      });

      HackTheNorth.toggleButton(".waiver-submit-button");

      mixpanel.track("Agreed to waiver", {
        "Under 18": data.under_18
      });

      submitApplicationData(userData.id, token, data, function(err) {
        if(err) {
          HackTheNorth.toggleButton(".waiver-submit-button");
          $(".waiver-submit-button").text("Error :(");
          return;
        }


        $.extend(userData, data);

        nextRegistrationStep(userData);
      });
    });

    $(".registration-back-button").click(function(e) {
      // lol dirty hack
      e.preventDefault();
      window.location.reload();
    });
  }

  function loadResume(userData) {
    var source = $("#resume-template").html();
    var template = Handlebars.compile(source);
    $(".registration-step").html(template(userData));

    filepicker.setKey("Am4vcKCCISSK4JcywwLtwz");

    var widget = $(".resume-filepicker")[0];
    widget.onchange = onResumeChange;
    filepicker.constructWidget(widget);

    $(".registration-back-button").click(function() {
      prevRegistrationStep(userData);
    });

    $(".registration-next-button").click(function() {
      var checked = $(".interested-internship-checkbox").prop('checked');
      var data = {
        interested_internship: checked ? "true" : "false"
      };
      HackTheNorth.toggleButton(".registration-next-button");

      mixpanel.track("Finish resume", {
        "Interested in internship": checked
      });

      submitApplicationData(userData.id, token, data, function(err) {
        if(err) {
          HackTheNorth.toggleButton(".registration-next-button");
          $(".registration-next-button").text("Error :(");
          return;
        }

        $.extend(userData, data);
        nextRegistrationStep(userData);
      })
    });
  }

  function loadAdditionalInfo(userData) {
    var source = $("#additional-info-template").html();
    var template = Handlebars.compile(source);
    $(".registration-step").html(template(userData));

    $(".registration-back-button").click(function(e) {
      // bug fix hack: additional info form is submitted when pressing back.
      // prevent this behaviour to keep back button working.
      e.preventDefault();
      prevRegistrationStep(userData);
    });

    $(".additional-info-form").submit(function(e) {
      e.preventDefault();

      HackTheNorth.toggleButton(".additional-info-submit-button");

      // Set defaults for multiple-choice forms
      var data = {
        food_restrictions_vegetarian: "false",
        food_restrictions_gluten: "false",
        food_restrictions_kosher: "false",
        food_restrictions_vegan: "false",
        food_restrictions_halal: "false",
        food_restrictions_lactose: "false",
        interested_hardware_myo: "false",
        interested_hardware_pebble: "false",
        interested_hardware_spark: "false",
        interested_hardware_estimote: "false",
        interested_hardware_leap: "false",
        interested_hardware_3d_printing: "false"
      };
      var payload = $(this).serializeArray();
      $.each(payload, function(index, nameValuePair) {
        data[nameValuePair.name] = nameValuePair.value;
      });

      mixpanel.track("Finish additional info", data);

      submitApplicationData(userData.id, token, data, function(err) {
        if(err) {
          HackTheNorth.toggleButton(".additional-info-submit-button");
          $(".additional-info-submit-button").text("Error :(");
          return;
        }

        $.extend(userData, data);
        nextRegistrationStep(userData);
      });
    });
  }

  function loadFinished(userData) {
    var source;
    if(window.applicationStatus === "Accepted") {
      source = $("#finished-registration-template").html();
    }
    else {
      source = $("#finished-registration-waitlisted-template").html();
    }

    var template = Handlebars.compile(source);
    $(".registration-step").html(template(userData));

    $(".registration-back-button").click(function() {
      prevRegistrationStep(userData);
    });

    $(".finished-next-button").click(function() {
      mixpanel.track("83.333%", {});
      nextRegistrationStep(userData);
    });
  }

  function loadTravel(userData) {
    var source = $("#travel-template").html();
    var template = Handlebars.compile(source);
    $(".registration-step").html(template(userData));

    filepicker.setKey("Am4vcKCCISSK4JcywwLtwz");

    var widget = $(".receipts-filepicker").each(function() {
      this.onchange = onReceiptChange;
      filepicker.constructWidget(this);
    });

    mixpanel.track_links(".travel-guidelines-link", "Clicked Travel Guidelines");
    mixpanel.track_links(".reimbursement-chart-link", "Clicked Reimbursement Chart");

    var onTravelMethodChange = function(recordMetric) {
      return function() {
        var method = $(".travel-method-select").val();
        $(".travel-save-button").show();

        // Disable checkboxes not visible to prevent required input form checking
        $(".travel-method-section input[type=checkbox]").attr('disabled', true);

        $(".travel-method-section").hide();
        $(".travel-method-" + method).show();

        // Renable visible disabled checkboxes
        $(".travel-method-" + method + " input[type=checkbox]").attr('disabled', false);

        if(recordMetric) {
          mixpanel.track("Travel method selected", {
            "Method": method
          });
        }
      }
    };

    $(".travel-method-select").change(onTravelMethodChange(true));

    $(".travel-form").submit(function(e) {
      e.preventDefault();
      HackTheNorth.toggleButton(".travel-save-button");

      var data = {
        have_valid_na_passport: "false",
        understand_legal_entry: "false",
        understand_reimbursement: "false"
      };
      var payload = $(this).serializeArray();
      $.each(payload, function(index, nameValuePair) {
        data[nameValuePair.name] = nameValuePair.value;
      });

      mixpanel.track("Travel form saved", {
        "Method": data.travel_method,
        "Valid NA Passport": data.have_valid_na_passport,
        "Understand Legal Entry": data.understand_legal_entry,
        "Understand Reimbursement": data.understand_reimbursement,
      });

      submitApplicationData(window.user, window.token, data, function(err) {
        $.extend(window.userData, data);
        HackTheNorth.toggleButton(".travel-save-button");
        $(".travel-save-button").text("Saved!");
      });
    });

    $(".registration-back-button").click(function(e) {
      // lol dirty hack
      e.preventDefault();
      prevRegistrationStep(userData);
    });

    if(userData.travel_method) {
      onTravelMethodChange(false)();
    }
  }

  var completeRegistrationStep = 0;
  var completeRegistrationSteps = [
    loadWaiver,
    loadResume,
    loadAdditionalInfo,
    loadFinished,
    loadTravel
  ];

  function nextRegistrationStep(userData) {
    if(completeRegistrationStep < completeRegistrationSteps.length - 1) {
      completeRegistrationStep++;
      completeRegistrationSteps[completeRegistrationStep](userData);
    }
    else {
      console.error("No more registration steps");
    }
  }

  function prevRegistrationStep(userData) {
    if(completeRegistrationStep > 0) {
      completeRegistrationStep--;
      completeRegistrationSteps[completeRegistrationStep](userData);
    }
    else {
      console.error("No more registration steps");
    }
  }

  function refreshRegistrationStep(userData) {
    completeRegistrationSteps[completeRegistrationStep](userData);
  }

  onPageLoad();
});
