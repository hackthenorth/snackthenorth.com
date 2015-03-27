var b = document.getElementsByClassName('sponsor-button')[0];
b.onclick = function() {
  this.innerHTML = "sponsor@hackthenorth.com";
}

var menuToggle = document.getElementsByClassName('navbar-toggle')[0];
var menu = document.getElementsByClassName('menu')[0];

menuToggle.onclick = function(){
  if(menu.className === 'menu active'){
    menu.className = 'menu';
  } else {
    menu.className += ' active';
  }
}

menu.onclick = function (){
  this.className = 'menu';
}

function unixTimeStamp() {
  return Math.round(new Date().getTime()/1000);
}

function register() {
  ga('send', 'event', 'button', 'click', 'apply');
  var user_email = document.getElementById('email').value;
  var url = 'https://htn.firebaseio.com/signups.json';
  var payload = {email: user_email, time: unixTimeStamp()};
  if (user_email.length > 0) {
    var oReq = new XMLHttpRequest();
    oReq.onreadystatechange = function() {
      if (oReq.readyState == 4 && oReq.status === 200) {
        var response = JSON.parse(oReq.responseText);
        var $error = document.getElementById('error');
        var $confirmation = document.getElementById('confirmation');
        if ('error' in response) {
          $error.style.display = 'block';
        }
        else {
          $error.style.display = 'none';
          $confirmation.style.display = 'block';
        }
      }
    }
    var data = JSON.stringify(payload);
    oReq.open("POST", url, true);
    oReq.setRequestHeader("Content-type", "application/json");
    oReq.setRequestHeader("Content-length", data.length);
    oReq.setRequestHeader("Connection", "close");
    oReq.send(data);
  }
}


