//=============================================================================
// MMO Map
//=============================================================================

var MMO = MMO || {};
MMO.Map = MMO.Map || {};

var Imported = Imported || {};
Imported["MMO Map"] = 0.1;

//=============================================================================
/*:
* @plugindesc <MMO.Map>
* Realtime Map plugin for MMO system.
*
* @author shivansh9
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

_.spawnMapId = String(params["Remote Player Spawn Map ID"]);
_.spawnEventId = String(params["Remote Player Spawn Event ID"]);
_.shouldShowPlayerName = String(params["Show Player Name"]).trim().toLowerCase() === 'true';

_._enableCustomCharacter = Boolean(Imported["SumRndmDde Character Creator EX"]);

_._socket = null;
_._currentMap = null;
_._remotePlayerEvents = {};

_._commandEnterMap = "map.enter_map";
_._commandUpdateSelf = "map.update_self";
_._commandLeaveMap = "map.leave_map";
_._messageUpdatePlayer = "map.update_player";
_._messageLeavePlayer = "map.leave_player";


//----------------------------------------------------------------------------
// MMO.Map
//----------------------------------------------------------------------------
_.setupSocket = function() {
    if (_._socket)
        return;

    _._socket = $gameNetwork.getCoreSocket();

    let _socket_onmessage = _._socket.onmessage;
    _._socket.onmessage = function(event) {
        _socket_onmessage.call(this, event);

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

_.enterMap = function(mapId) {
    _._currentMap = mapId;
    _._socket.send({
        command: _._commandEnterMap,
        map: mapId
    });
}

_.leaveMap = function() {
    if (_._socket) {
        _._socket.send({
            command: _._commandLeaveMap,
            map: _._currentMap
        });
    }
    _._currentMap = null;

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
    this._name = name;
    this.setPosition(x, y);
};

$.prototype.event = function() {
    return $spawnPlayerMap.events[_.spawnEventId];
};

$.prototype.name = function() {
    return this._name;
}

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

$.prototype.parseText = function(text) {
    text = text.replace(/\\IGN/gi, this.name());
    return text;
};

})(MMO_Remote_Player_Event);

//----------------------------------------------------------------------------
// Window_EventMiniLabel
//----------------------------------------------------------------------------
if (Imported.YEP_EventMiniLabel) {
(function($) {
var _setText = $.prototype.setText;
$.prototype.setText = function(text) {
    if (this._character && this._character._isRemotePlayer)
        text = this._character.parseText(text);

    _setText.call(this, text);
};
})(Window_EventMiniLabel);
};

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
            map: $gameMap.mapId()
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
    if (mapId && _._currentMap === mapId)
        return;
    _.leaveMap();
    if (!$dataMap.meta["MMO_NoRemotePlayers"]) {
        _.setupSocket();
        _.enterMap(mapId);
    }
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
        let sprite = this._characterSprites[i];
        let event = sprite._character;
        if (event._isRemotePlayer && eId == event._eventId) {
            if (sprite._miniLabel) {
                SceneManager._scene._spriteset.removeChild(sprite._miniLabel);
            }
            this._tilemap.removeChild(sprite);
        }
    }
};

$.prototype.clearAllRemotePlayerEvents = function() {
    for (var i = 0; i < this._characterSprites.length; i++) {
        let sprite = this._characterSprites[i];
        let event = sprite._character;
        if (event._isRemotePlayer) {
            if (sprite._miniLabel) {
                SceneManager._scene._spriteset.removeChild(sprite._miniLabel);
            }
            this._tilemap.removeChild(sprite);
        }
    }
};
})(Spriteset_Map);

})(MMO.Map);
