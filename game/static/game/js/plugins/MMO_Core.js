//=============================================================================
// MMO Core
//=============================================================================

var MMO = MMO || {};
MMO.Core = MMO.Core || {};

var Imported = Imported || {};
Imported["MMO Core"] = 0.1;

//=============================================================================
/*:
* @plugindesc <MMO.Core>
* Connect to a server using websockets.
* 
* @author shivanshs9
*
* @param base_url
* @text Server Base URL
* @desc API server location
* @type text
* @default localhost:8000/
*
* @param use_js_get_host
* @text Use Host using js
* @desc Should use host using JS?
* @type boolean
* @default true
*
* @param protocol
* @text Server HTTP Protocol
* @desc API server protocol for HTTP connections - 'http' or 'https'
* @type select
* @option http
* @option https
* @default http
*
* @param core_endpoint
* @text Game Core Socket Endpoint
* @desc Websocket endpoint to use for critical game data exchange on login.
* @type text
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

/** @global MMO Game Network object.
 * @type {MMO_Game_Network}
 */
var $gameNetwork = null;

/**
 * MMO Game Network class for api calls.
 * @class MMO_Game_Network
 */
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
    this._httpProtocol = String(params['protocol']);

    let useJsHost = String(params['use_js_get_host']).trim().toLowerCase() === 'true';
    if (useJsHost) {
      this._serverURL = window.location.host + '/';
    } else {
      this._serverURL = String(params['base_url']);
    }
  
    this._socketProtocol = (this._httpProtocol === 'http') ? 'ws' : 'wss';
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

  _.prototype.getSocket = function(name) {
    return this._sockets[name];
  }

  _.prototype.getCoreSocket = function() {
    return this.getSocket('core');
  }
  
  _.prototype.connectSocket = function(socket_name, endpoint) {
    if (this._token == null) {
      console.log('Missing token!');
      return;
    }
    let options = {
      debug: true,
    }
    this._sockets[socket_name] = new ReWebSocket(
      this.getSocketUrl(endpoint), ['Token', this._token], options);
    var socket = this._sockets[socket_name];
    var _socket_send = socket.send;
    socket.send = function(data) {
      try {
        _socket_send(JSON.stringify(data));
      } catch(error) {
        console.error(error);
      }
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
_.gameDataEndpoint = String(params['core_endpoint']);

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

    Offline.options.checks.active = 'up';
    Offline.check();

    SceneManager.resume();
    Graphics._removeCanvasFilter();
  };

  var _socket_onclose = socket.onclose;
  socket.onclose = function(event) {
    _socket_onclose.call(this, event);
    alertToast("You're offline!");

    Offline.options.checks.active = 'down';
    Offline.check();
    SceneManager.stop();
    Graphics._applyCanvasFilter();
  };
}

//----------------------------------------------------------------------------
// Scene_Boot
//----------------------------------------------------------------------------
_.Scene_Boot_create = Scene_Boot.prototype.create;
Scene_Boot.prototype.create = function() {
  $gameNetwork = $gameNetwork || new MMO_Game_Network(params);

  _.Scene_Boot_create.call(this);
}

//----------------------------------------------------------------------------
// Graphics
//----------------------------------------------------------------------------
/**
 * @static
 * @method _removeCanvasFilter
 * @private
 */
Graphics._removeCanvasFilter = function() {
  if (this._canvas) {
      this._canvas.style.opacity = 1.0;
      this._canvas.style.filter = '';
      this._canvas.style.webkitFilter = '';
  }
};
})(MMO.Core);