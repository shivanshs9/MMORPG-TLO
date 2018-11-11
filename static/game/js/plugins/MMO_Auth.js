//=============================================================================
// MMO Auth
//=============================================================================

var MMO = MMO || {};
MMO.Auth = MMO.Auth || {};

var Imported = Imported || {};
Imported["MMO Auth"] = '0.0.1';

//=============================================================================
/*:
* @plugindesc <MMO.Auth>
* Authentication plugin for MMO system.
*
* @author shivanshs9
*
* @param Auth Endpoint for Login
* @desc Endpoint for login system
* @default auth/login/
* 
* @param Force Login on Startup
* @type boolean
* @desc Make the title screen into a login screen
* @default true
*
* @param Auto Load Game On Login
* @type boolean
* @desc Automatically load the game, if existing save, or start a new one.
* If true, requires 'MMO_Save' plugin.
* @default false
*
*  @help
* ============================================================================
* Introduction and Instructions
* ============================================================================
* You can use the login window in two ways.
*
*  1.  Set Force login on Startup parameter to true:
*      This will force the login screen on startup.
*
*  2.  Set Force login on Startup parameter to false:
*      You can use this plugin command to pop up the
*      login window at any point in your game:
*
*         MMO_LOGIN
*
*   The socket.io connection parameter refers to if you
*   want to automatically upgrade to sockets after login.
*
*/
//=============================================================================

function MMO_Scene_Auth_Login() {
  this.initialize.apply(this, arguments);
}

(function(_) {

"use strict";

_.alertNeedsMMOCore = function() {
  alert("The 'MMO_Core' plugin is required for 'MMO_Auth' plugin!");
}

if(!Imported["MMO Core"]) {
	_.alertNeedsMMOCore();
	return;
}

//----------------------------------------------------------------------------
// MMO.Auth
//----------------------------------------------------------------------------

const params = PluginManager.parameters('MMO_Auth');

_.loginEndpoint = String(params['Auth Endpoint for Login']);
_.loginRequired = String(params['Force Login on Startup']).trim().toLowerCase() === 'true';
_.autoLoadGame = String(params['Auto Load Game On Login']).trim().toLowerCase() === 'true';

_.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
  _.Game_Interpreter_pluginCommand.call(this, command, args);
  if (command.toUpperCase() === 'MMO_LOGIN' && $gameNetwork._token === null) {
    SceneManager.goto(MMO_Scene_Auth_Login);
  }
};

//----------------------------------------------------------------------------
// MMO Auth Scene Login
//
// Title scene including login form.
//----------------------------------------------------------------------------

MMO_Scene_Auth_Login.prototype = Object.create(Scene_Base.prototype);
MMO_Scene_Auth_Login.prototype.constructor = MMO_Scene_Auth_Login;

MMO_Scene_Auth_Login.prototype.initialize = function() {
    Scene_Base.prototype.initialize.call(this);
};

MMO_Scene_Auth_Login.prototype.reBindInput = function() {
    Input.initialize();
};

MMO_Scene_Auth_Login.prototype.create = function() {
    Scene_Base.prototype.create.call(this);
    this.createBackground();
};

MMO_Scene_Auth_Login.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    SceneManager.clearStack();
    this.playTitleMusic();
    this.startFadeIn(this.fadeSpeed(), false);
    this.createLoginForm();
};

MMO_Scene_Auth_Login.prototype.update = function() {
    Scene_Base.prototype.update.call(this);
};

MMO_Scene_Auth_Login.prototype.isBusy = function() {
    return Scene_Base.prototype.isBusy.call(this);
};

MMO_Scene_Auth_Login.prototype.terminate = function() {
    Scene_Base.prototype.terminate.call(this);
    SceneManager.snapForBackground();
};

MMO_Scene_Auth_Login.prototype.createLoginForm = function() {
  $("#ErrorPrinter").html(window.$htmlLoginForm);
  this.loginFormHandler = window.$htmlLoginFormHandler(
    bind(this, "attemptLogin")
  );
};

MMO_Scene_Auth_Login.prototype.successLogin = function(token) {
  $gameNetwork.setToken(token);
  if (_.autoLoadGame) {
    this.fadeOutAll();
    if (DataManager.isAnySavefileExists())
      SceneManager.push(Scene_Load);
    else
      SceneManager.push(Scene_Map);
  } else {
    SceneManager.goto(Scene_Title);
  }
}

MMO_Scene_Auth_Login.prototype.attemptLogin = function(params) {
  let username = params[0];
  let password = params[1];
  if (username.length === 0)
    return this.loginFormHandler.displayError("You must provide a username!");
  if (password.length === 0)
    return this.loginFormHandler.displayError("You must provide a password!");
  let that = this;
  that.loginFormHandler.displayInfo('Connecting <i class="fa fa-spin fa-spinner"></i>');
  let url = $gameNetwork.getHttpUrl(_.loginEndpoint);
  $.post(url, {
    username: username,
    password: password
  })
  .done(function (data) {
    if (data.token) {
      $("#ErrorPrinter").fadeOut({duration: 1000}).html("");
      that.loginFormHandler.displaySuccess("Ok: " + data.msg);
      that.successLogin(data.token);
    } else {
      that.loginFormHandler.displayError("Error: Invalid Response");
      console.error(data);
    }
  })
  .fail(function (jqXHR) {
    var data = jqXHR.responseJSON;
    console.error(data);
    return that.loginFormHandler.displayError("Error: " + data.detail);
  });
};

MMO_Scene_Auth_Login.prototype.createBackground = function() {
  if (_.loginRequired) {
    this._backSprite1 = new Sprite(ImageManager.loadTitle1($dataSystem.title1Name));
    this._backSprite2 = new Sprite(ImageManager.loadTitle2($dataSystem.title2Name));
    this.addChild(this._backSprite1);
    this.addChild(this._backSprite2);
    this.centerSprite(this._backSprite1);
    this.centerSprite(this._backSprite2);
    this.createForeground();
  } else {
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this.addChild(this._backgroundSprite);
  }
};

MMO_Scene_Auth_Login.prototype.createForeground = function() {
  this._gameTitleSprite = new Sprite(new Bitmap(Graphics.width, Graphics.height));
  this.addChild(this._gameTitleSprite);
  if ($dataSystem.optDrawTitle) {
    this.drawGameTitle();
  }
};

MMO_Scene_Auth_Login.prototype.drawGameTitle = function() {
  var x = 20;
  var y = Graphics.height / 4;
  var maxWidth = Graphics.width - x * 2;
  var text = $dataSystem.gameTitle;
  this._gameTitleSprite.bitmap.outlineColor = 'black';
  this._gameTitleSprite.bitmap.outlineWidth = 8;
  this._gameTitleSprite.bitmap.fontSize = 72;
  this._gameTitleSprite.bitmap.drawText(text, x, y, maxWidth, 48, 'center');
};

MMO_Scene_Auth_Login.prototype.centerSprite = function(sprite) {
  sprite.x = Graphics.width / 2;
  sprite.y = Graphics.height / 2;
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
};

MMO_Scene_Auth_Login.prototype.playTitleMusic = function() {
  AudioManager.playBgm($dataSystem.titleBgm);
  AudioManager.stopBgs();
  AudioManager.stopMe();
};

//----------------------------------------------------------------------------
// Override of Scene_Boot.start, for calling our own Scene_Title!
//----------------------------------------------------------------------------
_.Scene_Boot_start = Scene_Boot.prototype.start;
Scene_Boot.prototype.start = function() {
  if (!_.loginRequired) {
    _.Scene_Boot_start.call(this);
  }
  else {
    Scene_Base.prototype.start.call(this);
    SoundManager.preloadImportantSounds();
    if (DataManager.isBattleTest()) {
        DataManager.setupBattleTest();
        SceneManager.goto(Scene_Battle);
    } else if (DataManager.isEventTest()) {
        DataManager.setupEventTest();
        SceneManager.goto(Scene_Map);
    } else {
        this.checkPlayerLocation();
        DataManager.setupNewGame();
        SceneManager.goto(MMO_Scene_Auth_Login);
    }
    this.updateDocumentTitle();
  }
};
})(MMO.Auth);