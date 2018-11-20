//=============================================================================
// MMO Chat
//=============================================================================

var MMO = MMO || {};
MMO.Chat = MMO.Chat || {};

var Imported = Imported || {};
Imported["MMO Chat"] = 0.1;

//=============================================================================
/*:
* @plugindesc <MMO.Chat>
* Realtime Chat plugin for MMO system.
*
* @author shivansh9
*
*
* @help
* =============================================================================
* Introduction
* =============================================================================
* This plugin allows chatting between players on the map.
*
*
*/

(function(_) {

"use strict";

//----------------------------------------------------------------------------
// Params
//----------------------------------------------------------------------------
const params = $plugins.filter(function(p)
{ return p.description.contains('<MMO.Chat>'); })[0].parameters;

})(MMO.Chat);
