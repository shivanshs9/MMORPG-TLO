//=============================================================================
// MMO Map
//=============================================================================

var MMO = MMO || {};
MMO.Map = MMO.Map || {};

var Imported = Imported || {};
Imported["MMO Map"] = '0.0.1';

//=============================================================================
/*:
* @plugindesc <MMO.Map>
* Realtime Map plugin for MMO system.
*
* @author shivansh9
*
* @param Game Map Socket Endpoint
* @desc Websocket endpoint to use for sharing player location on Map.
* @default game/map/${map_id}/
*
* @param Remote Player Spawn Map ID
* @desc Map ID which contains the Remote Player spawn event.
* @default 1
*
* @param Remote Player Spawn Event ID
* @desc Event ID to use for Remote Player.
* @default 2
*
* @param Show Player Name
* @desc Should show Player name above each event?
* @type boolean
* @on Yes
* @off No
* @default true
*
* @param Remote Nasty Pop Text Options
* @desc Refers to the text options number in the Nasty_Text_Pop_Events
* for pop text above remote players.
* @default 1
*
*
* @help
* =============================================================================
* Introduction
* =============================================================================
* This plugin allows you to see other players on the map.
*
* To disable Remote players on a particular map, just tag it with 
* '<MMO_NoRemotePlayers>' in the Map Notes.
*
*/

function MMO_Remote_Player_Event() {
	this.initialize.apply(this, arguments);
}

(function(_) {

"use strict";

//----------------------------------------------------------------------------
// Params
//----------------------------------------------------------------------------
const params = $plugins.filter(function(p)
{ return p.description.contains('<MMO.Map>'); })[0].parameters;

_.gameMapSocket = String(params["Game Map Socket Endpoint"]);
_.spawnMapId = String(params["Remote Player Spawn Map ID"]);
_.spawnEventId = String(params["Remote Player Spawn Event ID"]);
_.shouldShowPlayerName = String(params["Show Player Name"]).trim().toLowerCase() === 'true';
_.remotePlayerTextOption = (Number(params["Remote Nasty Pop Text Options"]) - 1);

_._enableCustomCharacter = Boolean(Imported["SumRndmDde Character Creator EX"]);

_._socket = null;
_._remotePlayerEvents = {};

_._commandUpdateSelf = "command.update_self";
_._messageUpdatePlayer = "map.update_player";
_._messageLeavePlayer = "map.leave_player";

_.getEndpoint = function(mapId) {
	return _.gameMapSocket.interpolate({map_id: mapId});
};

_.setupSocket = function(mapId) {
	let endpoint = _.getEndpoint(mapId);
	_._socket = $gameNetwork.connectSocket('Map' + mapId, endpoint);
	_._socket.onmessage = function(event) {
		let data = JSON.parse(event.data);
		if (data.type === _._messageUpdatePlayer) {
			_.updateRemotePlayer(data.data);
		} else if (data.type === _._messageLeavePlayer) {
			_.leaveRemotePlayer(data.id);
		}
	}
}

_.leaveRemotePlayer = function(id) {
	if (!SceneManager._scene._spriteset || SceneManager._scene instanceof Scene_Battle)
		return;
	if (!_._remotePlayerEvents[id])
		return;
	let player = _._remotePlayerEvents[id]._eventId;
	$gameMap.clearRemotePlayer(player);
	delete _._remotePlayerEvents[id];
};

_.updateRemotePlayer = function(data) {
	if (!SceneManager._scene._spriteset || SceneManager._scene instanceof Scene_Battle)
		return;

	let id = data.id;
	let name = data.name;
	let player = _._remotePlayerEvents[id];
	if (!player) {
		player = $gameMap.addRemotePlayer(data.x, data.y, name);
	}
	player.setMoveSpeed(data.moveSpeed);
	player.setMoveFrequency(data.moveFrequency);
	player.moveStraight(data.direction);
	if (player.x !== data.x || player.y !== data.y)
		player.setPosition(data.x, data.y);

	player.setCreatorInfo(data.creatorInfo);

	_._remotePlayerEvents[id] = player;
};

_.reset = function() {
	if (_._socket)
		_._socket.close();
	_._socket = null;
	_._remotePlayerEvents = {};
	$gameMap.clearAllRemotePlayerEvents();
};

//----------------------------------------------------------------------------
// MMO_Remote_Player_Event
//----------------------------------------------------------------------------
(function($) {
$.prototype = Object.create(Game_Event.prototype);
$.prototype.constructor = $;

$.prototype.initialize = function(mapId, eventId, x, y, name) {
	Game_Event.prototype.initialize.call(this, mapId, eventId);

	this._isRemotePlayer = true;
	this._info = null;
	this.setPosition(x, y);

	this.namepop = name;
	this.setTextOptions(_.remotePlayerTextOption);
};

$.prototype.event = function() {
	return $spawnPlayerMap.events[_.spawnEventId];
};

$.prototype.hasSetImage = function() {
	return !!this._info;
};

$.prototype.getCreatorBitmap = function() {
	return $gameCharacterCreations.buildBitmapFromInfo(this._info);
};

$.prototype.setCreatorInfo = function(info) {
	if (!info || this._info === info)
		return;
	this._info = info;
	this._needsCustomCharacterUpdate = true;
}

})(MMO_Remote_Player_Event);

//----------------------------------------------------------------------------
// Data_Manager
//----------------------------------------------------------------------------
DataManager.loadRemotePlayerSpawnEvent = function(mapId) {
	let filename = 'Map%1.json'.format(mapId.padZero(3));
	this.loadDataFile('$spawnPlayerMap', filename);
}

DataManager.loadRemotePlayerSpawnEvent(_.spawnMapId);

//----------------------------------------------------------------------------
// Game_Player
//----------------------------------------------------------------------------
(function($) {

var _executeMove = $.prototype.executeMove;
$.prototype.executeMove = function(direction) {
	_executeMove.call(this, direction);
	if (_._socket) {
		_._socket.send({
			command: _._commandUpdateSelf,
			direction: direction,
			x: this.x,
			y: this.y,
			moveSpeed: this.realMoveSpeed(),
			moveFrequency: this.moveFrequency(),
			characterName: this.characterName(),
			characterIndex: this.characterIndex(),
			creatorInfo: this.getCreatorInfo(),
		});
	}
};

$.prototype.getCreatorInfo = function() {
	if (!_._enableCustomCharacter)
		return null;
	const actor = $gameParty.leader();
	return $gameCharacterCreations.getInfo(actor.actorId());
};

})(Game_Player);

//----------------------------------------------------------------------------
// Scene_Map
//----------------------------------------------------------------------------
(function($) {
var _start = $.prototype.start;
$.prototype.start = function() {
	_start.call(this);
	
	let mapId = $gameMap.mapId();
	_.reset();
	if (!$dataMap.meta["MMO_NoRemotePlayers"]) {
		_.setupSocket(mapId);
	}
}

var _callMenu = $.prototype.callMenu;
$.prototype.callMenu = function() {
	_._remotePlayerEvents = {};
	$gameMap.clearAllRemotePlayerEvents();

	_callMenu.call(this);
};
})(Scene_Map);

//----------------------------------------------------------------------------
// Game_Map
//----------------------------------------------------------------------------
(function($) {
$.prototype.addRemotePlayer = function(x, y, playerName) {
	let eId = this._events.length;
	let event = new MMO_Remote_Player_Event(this._mapId, eId, x, y, playerName);
	this._events[eId] = event;
	SceneManager._scene._spriteset.createRemotePlayer(eId);
	return event;
};

$.prototype.clearRemotePlayer = function(eId) {
	this._events[eId] = null;
	SceneManager._scene._spriteset.clearRemotePlayer(eId);
};

$.prototype.clearAllRemotePlayerEvents = function() {
	for (var i = 1; i < this._events.length; i++) {
		if (!this._events[i]) continue;
		if (this._events[i]._isRemotePlayer){
			this._events[i] = null;
		}
		SceneManager._scene._spriteset.clearAllRemotePlayerEvents();
	}
	this.removeNullEvents();
};

$.prototype.removeNullEvents = function() {
	for (var i = this._events.length - 1; i > 0; i--) {
		if (this._events[i] === null) {
			this._events.splice(i, 1);
		} else {
			break;
		}
	}
};
})(Game_Map);

//----------------------------------------------------------------------------
// Spriteset_Map
//----------------------------------------------------------------------------
(function($) {
$.prototype.createRemotePlayer = function(id) {
	var event = $gameMap._events[id];
	var sId = this._characterSprites.length;
	this._characterSprites[sId] = new Sprite_Character(event);
	this._characterSprites[sId].update(); // To remove occsaional full-spriteset visible issue
	this._tilemap.addChild(this._characterSprites[sId]);
};

$.prototype.clearRemotePlayer = function(eId) {
	for (var i = 0; i < this._characterSprites.length; i++) {
		var event = this._characterSprites[i]._character;
		if (event._isRemotePlayer && eId == event._eventId) {
			this._tilemap.removeChild(this._characterSprites[i]);
		}
	}
};

$.prototype.clearAllRemotePlayerEvents = function() {
	for (var i = 0; i < this._characterSprites.length; i++) {
		var event = this._characterSprites[i]._character;
		if (event._isRemotePlayer) {
			this._tilemap.removeChild(this._characterSprites[i]);
		}
	}
};
})(Spriteset_Map);

})(MMO.Map);