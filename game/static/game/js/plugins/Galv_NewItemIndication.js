//-----------------------------------------------------------------------------
//  Galv's New Item Indication
//-----------------------------------------------------------------------------
//  For: RPGMAKER MV
//  Galv_NewItemIndication.js
//-----------------------------------------------------------------------------
//  2017-11-18 - Version 1.2 - Fixed cache issue introduced in MV update
//  2017-02-11 - Version 1.1 - changed refresh to be when the cursor leaves the
//                             item instead of views it initially.
//  2017-01-25 - Version 1.0 - release
//-----------------------------------------------------------------------------
// Terms can be found at:
// galvs-scripts.com
//-----------------------------------------------------------------------------

var Imported = Imported || {};
Imported.Galv_NewItemIndication = true;

var Galv = Galv || {};              // Galv's main object
Galv.NII = Galv.NII || {};          // Galv's stuff


//-----------------------------------------------------------------------------
/*:
 * @plugindesc (v.1.2) Adds a 'new' icon over items that have been obtained for the first time
 * 
 * @author Galv - galvs-scripts.com
 *
 * @param New Icon Image
 * @desc Image from /img/system/ that will be placed on top of item icons
 * @default newIcon
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param Icon X Offset
 * @desc Move the 'new' icon horizonatally this number of pixels.
 * @default 0
 *
 * @param Icon Y Offset
 * @desc Move the 'new' icon vertically this number of pixels.
 * @default 0
 *
 * @help
 *   Galv's New Item Indication
 * ----------------------------------------------------------------------------
 * This plugin adds an image over weapon/item/armor icons that have been
 * obtained for the first time in the game to indicate that it's a new item.
 * This 'new' image disappears once the player examines it (moves the cursor 
 * over it to see the help text and then moves away from it) in the menu.
 *
 * This image should be placed in /img/system/ and works best if it is the same
 * size as the icons (default: 32x32 pixels).
 *
 *
 */



//-----------------------------------------------------------------------------
//  CODE STUFFS
//-----------------------------------------------------------------------------

(function() {

Galv.NII.newIcon = PluginManager.parameters('Galv_NewItemIndication')["New Icon Image"];
Galv.NII.ox = Number(PluginManager.parameters('Galv_NewItemIndication')["Icon X Offset"]);
Galv.NII.oy = Number(PluginManager.parameters('Galv_NewItemIndication')["Icon Y Offset"]);

Galv.NII.becomeOld = function(item) {
	if (!item) return;
	if (item.itypeId) var type = 'items';
	if (item.wtypeId) var type = 'weapons';
	if (item.atypeId) var type = 'armors';
	
	if (type) {
		$gameSystem._seenItems[type][item.id] = 1;
		return true;
	}
	return false;
};


//-----------------------------------------------------------------------------
//  SCENE BOOT
//-----------------------------------------------------------------------------

Galv.NII.Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
Scene_Boot.loadSystemImages = function() {
	Galv.NII.Scene_Boot_loadSystemImages.call(this);
	ImageManager.reserveSystem(Galv.NII.newIcon);
};


//-----------------------------------------------------------------------------
//  GAME SYSTEM
//-----------------------------------------------------------------------------

Galv.NII.Game_System_initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
	Galv.NII.Game_System_initialize.call(this);
	this._seenItems = {
		items: [],     // each index contains undefined or 0 (new), 1 (old/not seen)
		weapons: [],
		armors: []
	};
};


//-----------------------------------------------------------------------------
//  WINDOW ITEMLIST
//-----------------------------------------------------------------------------

Galv.NII.Window_ItemList_initialize = Window_ItemList.prototype.initialize;
Window_ItemList.prototype.initialize = function(x, y, width, height) {
	Galv.NII.Window_ItemList_initialize.call(this, x, y, width, height);
	this._viewedNewIndex = null;
};

Galv.NII.Window_ItemList_drawItemName = Window_ItemList.prototype.drawItemName;
Window_ItemList.prototype.drawItemName = function(item, x, y, width) {
	Galv.NII.Window_ItemList_drawItemName.call(this,item,x,y,width);
    if (item) {
		if (item.itypeId) var type = 'items';
		if (item.wtypeId) var type = 'weapons';
		if (item.atypeId) var type = 'armors';

		if (type && !$gameSystem._seenItems[type][item.id]) {
			var bitmap = ImageManager.loadSystem(Galv.NII.newIcon);
			var pw = bitmap.width;
			var ph = bitmap.height;
			var sx = 0;
			var sy = 0;
			this.contents.blt(bitmap, sx, sy, pw, ph, x + 2, y + 2);
		}
    }
};

Galv.NII.Window_ItemList_deactivate = Window_ItemList.prototype.deactivate;
Window_ItemList.prototype.deactivate = function() {
	Galv.NII.Window_ItemList_deactivate.call(this);
	if (this._viewedNewIndex != null) {
		this.refresh();
		this._viewedNewIndex = null;
	}
};

Galv.NII.Window_ItemList_updateHelp = Window_ItemList.prototype.updateHelp;
Window_ItemList.prototype.updateHelp = function() {
	Galv.NII.Window_ItemList_updateHelp.call(this);
	
	if (this._viewedNewIndex != null) {
		this.redrawItem(this._viewedNewIndex);
		this._viewedNewIndex = null;
	}
	
	var addToOld = Galv.NII.becomeOld(this.item());
	if (addToOld) {
		this._viewedNewIndex = this.index();
	}
};

})();