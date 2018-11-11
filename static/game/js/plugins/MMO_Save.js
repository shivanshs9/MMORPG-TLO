//=============================================================================
// MMO Save
//=============================================================================

var MMO = MMO || {};
MMO.Save = MMO.Save || {};

var Imported = Imported || {};
Imported["MMO Save"] = '0.0.1';

//=============================================================================
/*:
* @plugindesc <MMO.Save>
* Cloud Save plugin for MMO system.
*
* @author shivansh9
*
* @param Save Endpoint
* @desc API endpoint to save game progress.
* @default game/save/
*
* @param Load Endpoint
* @desc API endpoint to load game progress.
* @default game/load/
*
* @param Player Data Endpoint
* @desc API endpoint to fetch/update player's data.
* Use plugin command, 'SavePlayerStats <Actor_ID>'.
* @default player/self/
*
* Plugin Commands:
* - 'SavePlayerStats <Actor_ID>'
* - 'SaveGame'
*
*/
//=============================================================================

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
// MMO.Save
//----------------------------------------------------------------------------

const params = PluginManager.parameters('MMO_Save');
_.saveEndpoint = String(params['Save Endpoint']);
_.loadEndpoint = String(params['Load Endpoint']);
_.playerEndpoint = String(params['Player Data Endpoint']);

_.postSaveData = function(data) {
  let settings = {
    url: $gameNetwork.getHttpUrl(_.saveEndpoint),
    data: data
  };
  $.post(settings).fail(function(data) {
    console.error(data);
  });
}

_.getLoadData = function() {
  let settings = {
    url: $gameNetwork.getHttpUrl(_.loadEndpoint),
    async: false
  };
  let result = null;
  $.get(settings).done(function(data) {
    result = data;
  }).fail(function(data) {
    console.log(data)
  })
  return result;
}

_.getPlayerData = function(success, error) {
  let url = $gameNetwork.getHttpUrl(_.playerEndpoint);
  $.get(url).done(success.bind(this)).fail(error.bind(this));
}

_.postPlayerData = function(data) {
  let url = $gameNetwork.getHttpUrl(_.playerEndpoint);
  let settings = {
    url: url,
    data: data
  }
  $.post(settings).fail(function(data) {console.error(data);});
}

_.savePlayerStats = function(actor) {
  let bitmap = actor.getCreatorBitmapFace();

  let avatarUri = bitmap.canvas.toDataURL();
  let level = actor.level;
  let gold = $gameParty.gold();
  let ign = actor.name();
  let art = actor.currentClass().name;
  let data = {
    ign: ign,
    avatar: avatarUri,
    level: level,
    gold: gold,
    art: art
  };
  _.postPlayerData(data);
}

_.jsonKey = function(saveFileId) {
  let name;
  if (saveFileId < 0) {
    name = "config_data";
  } else if (saveFileId === 0) {
    name = "global_data";
  } else {
    name = "save_data";
  }
  return name;
}

/**
 * Saves the game and returns true or false, depending on whether the save was a success. Can also be used for
 * autosave or quicksave.
 */
_.save = function() {
  $gameSystem.onBeforeSave();
  return DataManager.saveGame(1);
}

/**
 * Loads the game and returns true or false, depending on whether the load was a success. Can also be used for
 * quickload.
 */
_.load = function() {
  if(DataManager.loadGame(1)) {
    $gameSystem.onAfterLoad();
    Scene_Load.prototype.reloadMapIfUpdated.call(null);
    SceneManager.goto(Scene_Map);
    if(SceneManager._scene) { SceneManager._scene.fadeOutAll(); }
    return true;
  } else { return false; }
}

//-----------------------------------------------------------------------------
// DataManager
//-----------------------------------------------------------------------------

DataManager.isAnySavefileExists = function() { return this.isThisGameFile(1); };

//-----------------------------------------------------------------------------
// Game_Interpreter
//-----------------------------------------------------------------------------

_.Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
  _.Game_Interpreter_pluginCommand.apply(this, arguments);
  if (command.trim().toLowerCase() === 'saveplayerstats') {
    let actorId = parseInt(args[0]);
    let actor = $gameActors.actor(actorId);
    
    _.savePlayerStats(actor);
  } else if (command.trim().toLowerCase() === 'savegame') {
    _.save();
  }
}

//----------------------------------------------------------------------------
// Override of StorageManager.save and StorageManager.load
//----------------------------------------------------------------------------
_.StorageManager_save = StorageManager.save;
StorageManager.save = function(saveFileId, json) {
  // if (saveFileId < 0) {
  //   return _.StorageManager_save.call(this);
  // }
  let data = LZString.compressToBase64(json);
  let result = {}
  result[_.jsonKey(saveFileId)] = data;
  _.postSaveData(result);
}

_.StorageManager_load = StorageManager.load;
StorageManager.load = function(saveFileId) {
  // if (saveFileId < 0) {
  //   return _.StorageManager_load.call(this);
  // }
  let data;
  try {
     data = _.getLoadData()[_.jsonKey(saveFileId)];
  } catch (error) {}
  return LZString.decompressFromBase64(data);
}

StorageManager.exists = function(savefileId) {
  return true;
}

//----------------------------------------------------------------------------
// Override of Scene_File
//----------------------------------------------------------------------------
_.Scene_File_create = Scene_File.prototype.create;
Scene_File.prototype.create = function() {
  _.Scene_File_create.call(this);
  this.onSavefileOk();
};

Scene_File.prototype.createListWindow = function() {
  var x = 0;
  var y = this._helpWindow.height;
  var width = 0;
  var height = Graphics.boxHeight - y;
  this._listWindow = new Window_SavefileList(x, y, width, height);
  this._listWindow.select(this.firstSavefileIndex());
}

Scene_File.prototype.onActionCancel = function() {
  this.popScene();
}

//----------------------------------------------------------------------------
// Override of YEP Window_SaveAction
//----------------------------------------------------------------------------
if (Imported["YEP_SaveCore"]) {
  Window_SaveAction.prototype.makeCommandList = function() {
    var id = this.savefileId();
    var enabled = DataManager.isThisGameFile(id);
    var valid = DataManager.loadSavefileInfo(id);
    this.addCommand(this.getCommandName('load'), 'load', valid);
    this.addCommand(this.getCommandName('save'), 'save', this.isSaveEnabled());
  };

  Window_SaveAction.prototype.maxCols = function() {
    return 2;
  };
}

})(MMO.Save);