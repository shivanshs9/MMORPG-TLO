//=============================================================================
// MMO Core
//=============================================================================

var MMO = MMO || {};
MMO.Core = MMO.Core || {};

var Imported = Imported || {};
Imported["MMO Core"] = '0.0.1';

//=============================================================================
/*:
* @plugindesc <MMO.Core>
* Connect to a server using websockets.
* 
* @author shivanshs9
*
* @param Server Base URL
* @desc API server location
* @default localhost:8000/
* 
* @param Server HTTP Protocol
* @desc API server protocol for HTTP connections - 'http' or 'https'
* @default http
* 
* @param Game Core Socket Endpoint
* @desc Websocket endpoint to use for critical game data exchange on login.
* @default game/
*
* @help
* ============================================================================
* Introduction
* ============================================================================
* This entire core just points and connects to your api/sockets!
*
*/
//=============================================================================

var $gameNetwork = null;

function MMO_Game_Network() {
  this.initialize.apply(this, arguments);
}

(function(_) {

"use strict";

//----------------------------------------------------------------------------
// MMO_Game_Network
//----------------------------------------------------------------------------
(function(_) {
  _.prototype.initialize = function(params) {
    this._httpProtocol = String(params['Server HTTP Protocol']);
    this._socketProtocol = (this._httpProtocol === 'http') ? 'ws' : 'wss';
    this._serverURL = String(params['Server Base URL']);
    this._sockets = {};
    this._token = null;
    this.username = null;
  };
  
  _.prototype.setToken = function(token) {
    this._token = token;
    this.postLogin()
  }
  
  _.prototype.getHttpUrl = function(endpoint) {
    return this._httpProtocol + '://' + this._serverURL + endpoint;
  }
  
  _.prototype.getSocketUrl = function(endpoint) {
    return this._socketProtocol + '://' + this._serverURL + endpoint;
  }
  
  _.prototype.postLogin = function() {
    console.log("Post Login");
  }
  
  _.prototype.authenticateRequest = function(settings) {
    if (this._token) {
      settings['headers'] = {
        Authorization: "Token " + this._token
      }
    }
    return settings;
  }
  
  _.prototype.connectSocket = function(socket_name, endpoint) {
    if (this._token == null) {
      console.log('Missing token!');
      return;
    }
    this._sockets[socket_name] = new ReWebSocket(
      this.getSocketUrl(endpoint), ['Token', this._token], {debug: true});
    var socket = this._sockets[socket_name];
    var _socket_send = socket.send;
    socket.send = function(data) {
      _socket_send(JSON.stringify(data));
    };
    socket.onopen = function(event) {
      console.log('Socket Opened: ' + event.currentTarget.url);
    };
    socket.onclose = function(event) {
      console.log('Socket Closed');
    };
    return socket;
  };
  })(MMO_Game_Network);

//----------------------------------------------------------------------------
// MMO.Core
//----------------------------------------------------------------------------
const params = $plugins.filter(function(p)
{ return p.description.contains('<MMO.Core>'); })[0].parameters;

_.messageTypeNewUser = "game.new_user";
_.messageTypeLeaveUser = "game.leave_user";
_.messageTypeListUsers = "game.list_users";
_.messageTypeDescribeUser = "game.describe_user";
_.gameDataEndpoint = String(params['Game Core Socket Endpoint']);

_.MMO_Game_Network_postLogin = MMO_Game_Network.prototype.postLogin;
MMO_Game_Network.prototype.postLogin = function() {
  _.MMO_Game_Network_postLogin.call(this);

  let socket = this.connectSocket('core', _.gameDataEndpoint);
  socket.onmessage = function(event) {
    let data = JSON.parse(event.data);
    let count = parseInt($("#countUsers").html());
    if (data.type === _.messageTypeNewUser) {
      $("#countUsers").html(count + 1);
      alertToast(data.username + " is online!");
    } else if (data.type === _.messageTypeLeaveUser) {
      $("#countUsers").html(count - 1);
      alertToast(data.username + " left!");
    } else if (data.type === _.messageTypeListUsers) {
      $("#countUsers").html(data.users.length);
    } else if (data.type === _.messageTypeDescribeUser) {
      $gameNetwork.username = data.username;
    }
  };
  var _socket_onopen = socket.onopen;
  socket.onopen = function(event) {
    _socket_onopen.call(this, event);
    alertToast("You're online!");
  };
  var _socket_onclose = socket.onclose;
  socket.onclose = function(event) {
    _socket_onclose.call(this, event);
    alertToast("You're offline!");
  }
}

//----------------------------------------------------------------------------
// Scene_Boot
//----------------------------------------------------------------------------
_.Scene_Boot_create = Scene_Boot.prototype.create;
Scene_Boot.prototype.create = function() {
  $gameNetwork = $gameNetwork || new MMO_Game_Network(params);

  _.Scene_Boot_create.call(this);
}

//-----------------------------------------------------------------------------
// Overriding 'Input._onKeyDown' to pass 'event' as parameter
// to 'Input._shouldPreventDefault'
//-----------------------------------------------------------------------------

Input._onKeyDown = function(event) {
  if (this._shouldPreventDefault(event)) {
      event.preventDefault();
  }
  if (event.keyCode === 144) {    // Numlock
      this.clear();
  }
  var buttonName = this.keyMapper[event.keyCode];
  if (buttonName) {
      this._currentState[buttonName] = true;
  }
};

//-----------------------------------------------------------------------------
// Overriding Input._shouldPreventDefault to allow the use of the 'backspace key'
// in input forms.
//-----------------------------------------------------------------------------

Input._shouldPreventDefault = function(e) {
  switch (e.keyCode) {
    case 8:     // backspace
      if ($(e.target).is("input, textarea"))
        break;
    case 33:    // pageup
    case 34:    // pagedown
    case 37:    // left arrow
    case 38:    // up arrow
    case 39:    // right arrow
    case 40:    // down arrow
        return true;
  }
  return false;
};
})(MMO.Core);