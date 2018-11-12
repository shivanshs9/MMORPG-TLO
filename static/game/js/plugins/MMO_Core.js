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
* Introduction and Instructions
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
// MMO.Core
//----------------------------------------------------------------------------

const params = PluginManager.parameters('MMO_Core');

_.Scene_Boot_create = Scene_Boot.prototype.create;
Scene_Boot.prototype.create = function() {
  $gameNetwork = $gameNetwork || new MMO_Game_Network();

  _.Scene_Boot_create.call(this);
}

MMO_Game_Network.prototype.initialize = function() {
  this._httpProtocol = String(params['Server HTTP Protocol']);
  this._socketProtocol = (this._httpProtocol === 'http') ? 'ws' : 'wss';
  this._serverURL = String(params['Server Base URL']);
  this._sockets = {};
  this._token = null;

  this._gameDataEndpoint = String(params['Game Core Socket Endpoint']);
};

MMO_Game_Network.prototype.setToken = function(token) {
  this._token = token;
  this.postLogin()
}

MMO_Game_Network.prototype.getHttpUrl = function(endpoint) {
  return this._httpProtocol + '://' + this._serverURL + endpoint;
}

MMO_Game_Network.prototype.getSocketUrl = function(endpoint) {
  return this._socketProtocol + '://' + this._serverURL + endpoint;
}

MMO_Game_Network.prototype.postLogin = function() {
  console.log("Post Login");

  let socket = this.connectSocket('core', this._gameDataEndpoint);
  socket.onmessage = function(event) {
    console.log(event);
  };
  var _socket_onopen = socket.onopen;
  socket.onopen = function(event) {
    _socket_onopen.call(this, event);
    alert("You're online!");
  };
  var _socket_onclose = socket.onclose;
  socket.onclose = function(event) {
    _socket_onclose.call(this, event);
    alert("You're offline!");
  }
  setTimeout(function() {socket.send({command: 'command.list_users'})}, 1000);
}

MMO_Game_Network.prototype.authenticateRequest = function(settings) {
  if (this._token) {
    settings['headers'] = {
      Authorization: "Token " + this._token
    }
  }
  return settings;
}

MMO_Game_Network.prototype.connectSocket = function(socket_name, endpoint) {
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