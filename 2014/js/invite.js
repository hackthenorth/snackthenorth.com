
function extendToken(token) {
  var passurl = 'https://techyon.org/auth.php?token=' + token;
  
  var req = $.ajax({
    url : passurl,
    type : 'GET',
    async : false
  });
  
  var newToken = req.responseText;
  
  return newToken;
}


function receivedTeamMembers(err, data) {
  var source;
  if(data.length > 0) {
    // No need to do error checking, application.js will take care of this.
    source = $("#team-template").html();
  }
  else {
    source = $("#no-team-template").html();
  }

  var template = Handlebars.compile(source);
  $(".team-members-section").html(template({members:data}));
}


function getTeamMembers(teamID, token) {
  var url = 'https://hackthenorth.firebaseio.com/teams/' +teamID + '/members.json?auth=' + token;

  var req = $.ajax({
    url: url,
    type: 'GET',
    async : false
  });

  var data = JSON.parse(req.responseText);

  if(data && data.error) {
    return {code : "ERROR"};
  }

  var out = {};
  out['code'] = teamID;
  out['members'] = [];

  for(var i in data) {
    out.members.push({name: data[i], id: i});
  }

  return out;
}


var generateTeamName = function() {
  var length = 12;
  var charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var retVal = "";

  for(var i=0, n=charset.length; i<length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random()*n));
  }

  return retVal;
}


var addTeamToProfile = function(userID, authToken, teamID) {
  var url = 'https://hackthenorth.firebaseio.com/users/' + userID + '/team.json?auth=' + authToken;
  var req = $.ajax({
    url: url,
    type: 'PUT',
    data: JSON.stringify(teamID),
    async : false
  });
}


var createTeam = function(captainID, authToken, callback) {
  var name = generateTeamName();
  var url = 'https://hackthenorth.firebaseio.com/teams/' + name + '.json?auth=' + authToken;

  var load = {};
  load[captainID] = window.user.name;

  var req = $.ajax({
    url: url,
    type: 'PUT',
    data: JSON.stringify({captain: captainID, members: load}),
    async : false
  });

  var data = JSON.parse(req.responseText);

  if(data.error) {
    ga('send', 'event', 'form', 'failure', 'create-team');
    createTeam(captainID, authToken);
    return callback(data.error, null);
  }

  ga('send', 'event', 'form', 'submit', 'create-team');
  addTeamToProfile(captainID, authToken, name);
  return callback(null, name);
}


var addToTeam = function(userID, teamID, authToken, callback) {
  var url = 'https://hackthenorth.firebaseio.com/teams/' + teamID + '/members.json?auth=' + authToken;

  var load = {};
  load[userID] = window.user.name;

  var req = $.ajax({
    url: url,
    type: 'PATCH',
    data: JSON.stringify(load),
    async : false
  });

  var data = JSON.parse(req.responseText);

  if(data.error) {
    ga('send', 'event', 'form', 'submit', 'add-to-team');
    return callback(data.error, data);
  }

  ga('send', 'event', 'form', 'submit', 'add-to-team');
  addTeamToProfile(userID, authToken, teamID);
  return callback(null, name);
}


var deleteFromTeam = function(userID, teamID, authToken, callback) {
  var url = 'https://hackthenorth.firebaseio.com/teams/' + teamID + '/members/' + userID + '.json?auth=' + authToken;

  var req = $.ajax({
    url: url,
    type: 'PUT',
    data: JSON.stringify(null),
    async : false
  });

  var data = JSON.parse(req.responseText);

  if(data && data.error) {
    ga('send', 'event', 'form', 'submit', 'delete-from-team');
    return callback(data.error, data);
  }

  ga('send', 'event', 'form', 'submit', 'delete-from-team');
  addTeamToProfile(userID, authToken, null);
  return callback(null, name);
}
