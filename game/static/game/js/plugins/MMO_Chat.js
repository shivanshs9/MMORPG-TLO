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
 * @param chat_endpoint
 * @text Chat Socket Endpoint
 * @desc Websocket endpoint to use for chatting.
 * @default chat/
 *
 * @param auto_join_map_room
 * @text Force Join Room On Map Enter
 * @desc Should Join the Current Map Room on entering the map?
 * @type boolean
 * @default true
 *
 * @param auto_leave_map_room
 * @text Force Leave Room On Map Exit
 * @desc Should Leave the Previous Map Room on leaving the map?
 * @type boolean
 * @default true
 *
 * @param chat_window
 * @text Chat Window Properties
 * @type struct<chatWindow>
 *
 *
 * @help
 * =============================================================================
 * Introduction
 * =============================================================================
 * This plugin allows chatting between players.
 *
 * Plugin commands:
 * 'ToggleChat' - Used to toggle a chat.
 * 'DisableChat' - Used to disable a chat.
 * 'EnableChat' - Used to enable a chat.
 *
 * To disable chat system on a particular map, just tag it with 
 * '<MMO_NoChat>' in the Map Notes.
 *
 */

/*~struct~chatWindow:
 * @param width
 * @text Chat Window Width
 * @desc Desired width of chat window
 * @type number
 * @min 200
 * @default 500
 *
 * @param height
 * @text Chat Window Height
 * @desc Desired height of chat window
 * @type number
 * @min 200
 * @default 200
 * 
 * @param x
 * @text X position
 * @desc Desired X offset
 * @default 0
 * 
 * @param y
 * @text Y position
 * @desc Desired Y offset
 * @default Graphics.boxHeight - 200
 * 
 * @param style
 * @text CSS Stylesheet
 * @desc Style to use for Chat Window
 * @type note
 * @default
 * 
 * @param base_font_size
 * @text Base Font Size
 * @desc Base font size to use for text inside chat window (in px).
 * @type number
 * @default 12
 * 
 */

function Window_MMO_Chat() {
	this.initialize.apply(this, arguments);
}

(function(_) {

"use strict";

//----------------------------------------------------------------------------
// Params
//----------------------------------------------------------------------------
const params = $plugins.filter(function(p)
{ return p.description.contains('<MMO.Chat>'); })[0].parameters;

_.chatSocketEndpoint = String(params['chat_endpoint'] || 'chat/');
_.forceJoinRoom = String(params['auto_join_map_room'] || 'true').trim().toLowerCase() === 'true';
_.forceLeaveRoom = String(params['auto_leave_map_room'] || 'true').trim().toLowerCase() === 'true';

_.chatProp = JSON.parse(params['chat_window']);

_._currentMap = null;
_._chatContainerId = 'chat_container';
_._chatWindow = null;
_._socket = null;

_._messageListRooms = 'chat.list_rooms';
_._messageListMessages = 'chat.room.list_messages';
_._messageRoomNewMessage = 'chat.room.new_message';
_._messageNewRoom = 'chat.new_room';

_._commandListRooms = 'chat.list_rooms';
_._commandListMessages = 'chat.room.list_messages';
_._commandSendMessage = 'chat.room.send_message';
_._commandJoinRoom = 'chat.join_room';
_._commandLeaveRoom = 'chat.leave_room';

//----------------------------------------------------------------------------
// MMO.Chat
//----------------------------------------------------------------------------
(function() {
_.setupSocket = function() {
	if (_._socket)
		return;

	_._socket = $gameNetwork.connectSocket('chat', _.chatSocketEndpoint);

	let _socket_onmessage = _._socket.onmessage;
	_._socket.onmessage = function(event) {
		_socket_onmessage.call(this, event);

		let data = JSON.parse(event.data);
		if (data.type === _._messageListRooms)
			_.updateListRooms(data.data);
		else if (data.type === _._messageListMessages)
			_.setRoomMessages(data);
		else if (data.type === _._messageRoomNewMessage)
			_.newRoomMessage(data);
		else if (data.type === _._messageNewRoom)
			_.newRoom(data);
		else
			console.log(data);
	};
};

_.updateListRooms = function(data) {
	if (!_._chatWindow)
		return;

	_._chatWindow.updateRooms(data);
};

_.setRoomMessages = function(data) {
	if (!_._chatWindow)
		return;

	_._chatWindow.setMessages(data.room, data.data);
};

_.fetchRooms = function() {

};

_.addRoom = function(room) {
	_._socket.send({
		command: _._commandListMessages,
		room: room
	});
};

_.sendMessage = function(room, msg) {
	if (!_._chatWindow)
		return;

	_._socket.send({
		command: _._commandSendMessage,
		room: room,
		message: msg
	});
};

_.newRoomMessage = function(data) {
	if (!_._chatWindow)
		return;

	_._chatWindow.updateMessage(data);
};

_.newRoom = function(data) {
	if (!_._chatWindow)
		return;

	_._chatWindow.newRoom(data.room);
};

_.joinRoom = function(room, isTempRoom) {
	_._socket.send({
		command: _._commandJoinRoom,
		room: room,
		ephemeral: !!isTempRoom
	});
};

_.leaveRoom = function(room) {
	_._socket.send({
		command: _._commandLeaveRoom,
		room: room
	});

	if (!_._chatWindow)
		return;

	_._chatWindow.removeRoom(room);
};

_.toggleChatWindow = function() {
	if (!_._chatWindow)
		return;
	
	if (_._chatWindow.isVisible())
		_._chatWindow.close();
	else
		_._chatWindow.open();
};

_.disableChat = function() {
	if (!_._chatWindow)
		return;

	_._chatWindow.hide();
};

_.enableChat = function() {
	if (!_._chatWindow)
		return;

	_._chatWindow.show();
};
})();

//----------------------------------------------------------------------------
// Window_MMO_Chat
//----------------------------------------------------------------------------
(function($) {
$.prototype.initialize = function(x, y) {
	this.width = this.windowWidth();
	this.height = this.windowHeight();
	this.x = eval(x);
	this.y = eval(y);
	this.currentRoom = null;
	this._container = document.querySelector(`#${_._chatContainerId}`);

	if (!this._container) {
		this.prepareElements();
		this.createChatWindow();
	}

	this.refresh();
};

$.prototype.getChatStyle = function() {
	let fontSize = Number(_.chatProp.base_font_size);

	return `
	  img {
		max-width:100%;
	  }
  
	  .chat-window {
		background: white;
		border: 1px solid #c4c4c4;
		clear: both;
		overflow: hidden;
		position: absolute;
		width: 100%;
	  }
  
	  .chat-sidebar {
		background: #f8f8f8 none repeat scroll 0 0;
		float: left;
		overflow: hidden;
		width: 20%;
		height: 100%;
		border-right: 1px solid #c4c4c4;
	  }
  
	  .chat-main {
		float: left;
		width: 100%;
		height: 100%;
		display: flex;
		flex-flow: column;
	  }
  
	  .top-bar {
		padding: 10px;
		border-bottom: 1px solid #c4c4c4;
		width: 100%;
	  }
  
	  .heading {
		float: left;
	  }
  
	  .heading h4 {
		color: #05728f;
		font-size: ${fontSize + 4}px;
		margin: auto;
	  }
  
	  .list-rooms {
		height: 100%;
		overflow-y: auto;
	  }
  
	  .info-room {
		overflow:hidden;
		clear:both;
		display: flex;
		align-items: center;
		justify-content: center;
	  }
  
	  .item-room {
		border-bottom: 1px solid #c4c4c4;
		margin: 0;
		padding: 8px;
	  }
  
	  .room-name h5 {
		font-size: ${fontSize + 2}px;
		color: #464646;
	  }
  
	  .room-name {
		float: left;
		width: 80%;
	  }
  
	  .item-room.active {
		background: #ebebeb;
	  }
  
	  .list-messages {
		flex: 2;
		overflow-y: auto;
	  }
  
	  .message-img {
		width: 30px;
		float: left;
	  }
  
	  .item-message-out {
		margin: 10px 10px;
		display: flex;
		justify-content: flex-end;
	  }
  
	  .item-message-in {
		margin: 10px 10px;
		display: flex;
		justify-content: flex-start;
	  }
  
	  .message {
		padding: 0 0 0 10px;
		vertical-align: top;
		width: 80%;
	  }
  
	  p.message-body {
		border-radius: 3px;
		font-size: ${fontSize}px;
		margin: 0;
		padding: 5px 10px 5px 12px;
	  }

	  .item-message-in p.message-body {
		background: #ebebeb none repeat scroll 0 0;
		color: #646464;
		margin-left: 35px;
	  }
  
	  .item-message-out p.message-body {
		background: #05728f none repeat scroll 0 0;
		color:#fff;
	  }
  
	  .message-timestamp {
		color: #747474;
		display: block;
		font-size: ${fontSize - 1}px;
		margin: 8px 0 0;
	  }
  
	  .message-input input {
		background: rgba(0, 0, 0, 0) none repeat scroll 0 0;
		border: medium none;
		color: #4c4c4c;
		font-size: ${fontSize}px;
		min-height: 20px;
		width: 100%;
	  }
  
	  .inputbar {
		border-top: 1px solid #c4c4c4;
		position: relative;
		height: 40px;
		width: 100%;
	  }
  
	  .send-message {
		width: 30px;
		align-self: center;
	  }
	  
	  .message-input {
		display: flex;
		justify-content: space-between;
		padding: 0 5px;
	  }

	  .chat-close {
		float: right;
		width: 30px;
		align-self: center;
	  }

	  .chat-open {
		width: 30px;
		position: absolute;
		align-self: center;
	  }

	  .room-options {
		margin-right: 5px;
		cursor: pointer;
	  }
	`;
};

$.prototype.getChatHtml = function() {
	return `
	<style>
		${this.getChatStyle()}
		${_.chatProp.style}
	</style>

	<div class="chat-window d-none">
		<div class="chat-main">
			<div class="top-bar">
				<span class="dropdown">
					<a class="room-options-toggle d-none" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
						<i class="fa fa-ellipsis-v" aria-hidden="true"></i>
					</a>
					<div class="dropdown-menu room-options-list">
						<button class="dropdown-item" type="button" id="option_details">View details</button>
						<button class="dropdown-item" type="button" id="option_leave">Leave room</button>
						<button class="dropdown-item" type="button" id="option_report">Report room</button>
					</div>
				</span>
				<select class="selectpicker show-tick room-change" data-style="btn-primary">
					<option class="_internal" selected="true" style="display:none" value="__none"> -- choose an option -- </option>
					<option class="_internal" data-icon="fa fa-plus" value="__add_room">Join a room!</option>
				</select>
				<button class="btn btn-danger btn-circle chat-close" type="button">
					<i class="fa fa-angle-double-down" aria-hidden="true"></i>
				</button>
			</div>

			<div class="list-messages"></div>

			<div class="inputbar d-none">
				<div class="message-input">
				<input type="text" class="write-message" placeholder="Type a message" />
				<button class="btn btn-info btn-circle send-message" type="button">
					<i class="fa fa-paper-plane-o" aria-hidden="true"></i>
				</button>
				</div>
			</div>
		</div>
	</div>

	<button class="btn btn-success btn-circle chat-open" type="button">
		<i class="fa fa-angle-double-up" aria-hidden="true"></i>
	</button>
	`;
};

$.prototype.createChatWindow = function() {
	this._container.innerHTML = this.getChatHtml();

	this.setup();
};

$.prototype.getChatWindow = function() {
	let query = `div#${_._chatContainerId} div.chat-window`;
	return document.querySelector(query);
};

$.prototype.getMessageInput = function() {
	let query = `div#${_._chatContainerId} input.write-message`;
	return document.querySelector(query);
};

$.prototype.getRoomChangeBox = function() {
	let query = `div#${_._chatContainerId} select.room-change`;
	return document.querySelector(query);
};

$.prototype.getRoomOptions = function() {
	let query = `div#${_._chatContainerId} div.room-options-list *`;
	return document.querySelector(query);
};

$.prototype.getSendMessageBtn = function() {
	let query = `div#${_._chatContainerId} .send-message`;
	return document.querySelector(query);
};

$.prototype.getRoomMessages = function(room) {
	let query = `div#${_._chatContainerId} div.list-messages div.room-messages#${room}`;
	return document.querySelector(query);
};

$.prototype.getChatOpenButton = function() {
	let query = `div#${_._chatContainerId} button.chat-open`;
	return document.querySelector(query);
};

$.prototype.getChatCloseButton = function() {
	let query = `div#${_._chatContainerId} button.chat-close`;
	return document.querySelector(query);
};

$.prototype.getInputBar = function() {
	let query = `div#${_._chatContainerId} div.chat-window div.inputbar`;
	return document.querySelector(query);
};

$.prototype.hideInputBar = function() {
	var $ = jQuery;
	$(this.getInputBar()).addClass('d-none');
};

$.prototype.showInputBar = function() {
	var $ = jQuery;
	$(this.getInputBar()).removeClass('d-none');
};

$.prototype.hideRoomOptions = function() {
	var $ = jQuery;
	$(`div#${_._chatContainerId} a.room-options-toggle`).addClass('d-none');
};

$.prototype.showRoomOptions = function() {
	var $ = jQuery;
	$(`div#${_._chatContainerId} a.room-options-toggle`).removeClass('d-none');
};

$.prototype.hasRoom = function(room) {
	var $ = jQuery;

	let roomChange = this.getRoomChangeBox();
	return $(roomChange).children(`#${room}`).length > 0;
};

$.prototype.addRoom = function(room) {
	var $ = jQuery;

	if (this.hasRoom(room))
		return;
	
	let roomChange = this.getRoomChangeBox();
	var roomElement = document.createElement('option');
	roomElement.value = roomElement.textContent = room;
	roomChange.insertBefore(roomElement, roomChange.lastElementChild);

	let query = `div#${_._chatContainerId} div.list-messages`;
	let container = document.querySelector(query);
	$(container).append(`<div class="room-messages" id="${room}"></div>`);

	_.addRoom(room);
};

$.prototype.showRoom = function(room) {
	var $ = jQuery;

	$('.room-messages').addClass('d-none');
	$(this.getRoomMessages(room)).removeClass('d-none');
}

$.prototype.clearRooms = function() {
	var $ = jQuery;
	let roomChange = this.getRoomChangeBox();

	$(roomChange).children('*').not('._internal').remove();
	$('.room-messages').addClass('d-none');
};

$.prototype.removeRoom = function(room) {
	var $ = jQuery;
	let roomChange = this.getRoomChangeBox();
	$(roomChange).remove(`#${room}`);
	roomChange.value = '__none';
	$(this.getRoomMessages(room)).remove();
	$(roomChange).selectpicker('refresh');

	this.updateCurrentRoom();
};

$.prototype.updateCurrentRoom = function() {
	let roomChange = this.getRoomChangeBox();
	let selectedOption = roomChange.value;
	if (selectedOption === '__none') {
		this.currentRoom = null;
		this.hideInputBar();
		this.hideRoomOptions();
		return;
	}
	this.showInputBar();
	this.showRoomOptions();
	let selectedRoom = selectedOption;
	if (!this.currentRoom || !this.hasRoom(this.currentRoom) || selectedRoom !== this.currentRoom) {
		this.currentRoom = selectedRoom;
		this.showRoom(this.currentRoom);
	}
};

$.prototype.clearRoomMessages = function(room) {
	var $ = jQuery;

	let listMsgs = this.getRoomMessages(room);
	$(listMsgs).empty();
};

$.prototype.newRoom = function(room) {
	var $ = jQuery;
	let roomChange = this.getRoomChangeBox();
	this.addRoom(room);
	$(roomChange).selectpicker('refresh');

	this.updateCurrentRoom();
};

$.prototype.updateRooms = function(rooms) {
	var $ = jQuery;
	this.clearRooms();

	if (rooms.length === 0)
		return;
	
	let roomChange = this.getRoomChangeBox();

	for (let i = 0; i < rooms.length; i++) {
		this.addRoom(rooms[i].name);
	}
	$(roomChange).selectpicker('refresh');
	this.showRoom(this.currentRoom);

	this.updateCurrentRoom();
};

$.prototype.createInMsg = function(msg) {
	let container = document.createElement('div');
	container.className = 'item-message-in';
	let msgElement = document.createElement('div');
	msgElement.className = 'message';

	let player = document.createElement('div');
	player.className = 'message-img';
	player.title = msg.sender_name;
	let image = document.createElement('img');
	image.src = msg.sender_avatar;
	player.appendChild(image);

	let body = document.createElement('p');
	body.className = 'message-body';
	body.textContent = msg.body;

	let timestamp = document.createElement('span');
	timestamp.className = 'message-timestamp';
	timestamp.textContent = msg.send_at;

	msgElement.appendChild(player);
	msgElement.appendChild(body);
	msgElement.appendChild(timestamp);

	container.appendChild(msgElement);

	return container;
};

$.prototype.createOutMsg = function(msg) {
	let container = document.createElement('div');
	container.className = 'item-message-out';
	let msgElement = document.createElement('div');
	msgElement.className = 'message';

	let body = document.createElement('p');
	body.className = 'message-body';
	body.textContent = msg.body;

	let timestamp = document.createElement('span');
	timestamp.className = 'message-timestamp';
	timestamp.textContent = msg.send_at;

	msgElement.appendChild(body);
	msgElement.appendChild(timestamp);

	container.appendChild(msgElement);

	return container;
};

$.prototype.setMessages = function(room, messages) {
	this.clearRoomMessages(room);

	let listMsgs = this.getRoomMessages(room);
	let fragment = document.createDocumentFragment();
	for (let i = 0; i < messages.length; i++) {
		let msg = messages[i];

		var msgElement;
		if (msg.is_self)
			msgElement = this.createOutMsg(msg);
		else
			msgElement = this.createInMsg(msg);

		fragment.appendChild(msgElement);
	}
	listMsgs.appendChild(fragment);
};

$.prototype.updateMessage = function(data) {
	let room = data.room;
	let message = data.data;
	let is_self = data.is_self;

	let listMsgs = this.getRoomMessages(room);

	var msgElement;
	if (is_self)
		msgElement = this.createOutMsg(message);
	else
		msgElement = this.createInMsg(message);

	listMsgs.appendChild(msgElement);
}

$.prototype.submitMessage = function() {
	var messageInput = this.getMessageInput();
	var msg = messageInput.value;
	var room = this.currentRoom;

	_.sendMessage(room, msg);

	messageInput.value = '';
};

$.prototype.prepareElements = function() {
	var container = document.createElement("div");
	container.id = _._chatContainerId;
	container.style.position = 'absolute';
	container.style.margin = '0';
    container.style.left = '0';
    container.style.top = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = "0";
    container.style.display = "none";
	
	document.body.appendChild(container);

	Graphics._centerElement(container);

	this._container = container;
	return container;
};

$.prototype.setup = function() {
	var $ = jQuery;

	var chatProp = this.getChatWindow();
	var messageInput = this.getMessageInput();
	var roomChangeSelect = this.getRoomChangeBox();
	var sendMessageBtn = this.getSendMessageBtn();
	var openChatBtn = this.getChatOpenButton();
	var closeChatBtn = this.getChatCloseButton();
	let roomOptions = this.getRoomOptions();

	$(roomChangeSelect).selectpicker();
	$(chatProp).bind('click touchstart', this.onFocus.bind(this));
	$(sendMessageBtn).bind('click', this.submitMessage.bind(this));
	$(messageInput).keypress(this.onKeyPress.bind(this));
	$(roomChangeSelect).on('change', this.onRoomChange.bind(this));
	$(closeChatBtn).bind('click', this.close.bind(this));
	$(openChatBtn).bind('click', this.open.bind(this));
	$(roomOptions).bind('click', function(e) {
		let target = e.target;
		if (target.id === 'option_details')
			this.showRoomDetails();
		else if (target.id === 'option_leave')
			this.leaveRoomConfirmation();
		else if (target.id === 'option_report')
			this.showReportRoomDialog();
		else
			console.log(e);
	});

	$(window).bind('resize', this.onResize.bind(this));

	this.setSize(this.width, this.height);
	this.onResize();
};

$.prototype.close = function() {
	var $ = jQuery;
	$(this.getChatWindow()).addClass('d-none');
	$(this.getChatOpenButton()).removeClass('d-none');
};

$.prototype.open = function() {
	var $ = jQuery;
	$(this.getChatWindow()).removeClass('d-none');
	$(this.getChatOpenButton()).addClass('d-none');
};

$.prototype.showRoomDetails = function() {

};

$.prototype.leaveRoomConfirmation = function() {
	let result = confirm(`Are you sure you want to leave "${this.currentRoom}"`);
	if (result)
		_.leaveRoom(this.currentRoom);
};

$.prototype.showReportRoomDialog = function() {
	console.log('whhyyyyyyyy????');
};

$.prototype.openDialogJoinRoom = function() {
	console.log('join room!');
};

$.prototype.setRoomChangeSelected = function(value) {
	var $ = jQuery;
	let roomChange = this.getRoomChangeBox();

	value = value || '__none';
	roomChange.value = value;
	$(roomChange).selectpicker('refresh');
};

$.prototype.onRoomChange = function(e) {
	let target = e.target;
	let optionElem = target.options[target.selectedIndex];
	if (optionElem.className === '_internal') {
		if (target.value === '__add_room')
			this.openDialogJoinRoom();
		this.setRoomChangeSelected(this.currentRoom);
		return;
	}

	this.updateCurrentRoom();
};

$.prototype.setSize = function(width, height) {
	var chatProp = this.getChatWindow();

	chatProp.style.width = (width * Graphics._realScale) + 'px';
	chatProp.style.height = (height * Graphics._realScale) + 'px';
};

$.prototype.setPosition = function(x, y) {
	var window = this.getChatWindow();
	var btn = this.getChatOpenButton();

	if (x < 0)
		x = 0;
	if (y < 0)
		y = 0;

	if (x > Graphics.boxWidth - this.width)
		x = Graphics.boxWidth - this.width;
	if (y > Graphics.boxHeight - this.height)
		y = Graphics.boxHeight - this.height;

	window.style.left = Graphics._canvas.getBoundingClientRect().left + x + 'px';
	window.style.top = Graphics._canvas.getBoundingClientRect().top + y + 'px';

	let btnX = 10;
	let btnY = Graphics.boxHeight - 40;
	btn.style.left = Graphics._canvas.getBoundingClientRect().left + btnX + 'px';
	btn.style.top = Graphics._canvas.getBoundingClientRect().top + btnY + 'px';
};

$.prototype.onResize = function() {
	this.setPosition(this.x, this.y);
};

$.prototype.onFocus = function(e) {
	var $ = jQuery;
	$(e.target).focus();
};

$.prototype.onKeyPress = function(e) {
	if (e.which == 13) { //enter
		this.submitMessage();
	}
};

$.prototype.show = function() {
	this._container.style.display = 'block';
	this._container.style.zIndex = 1000;
};

$.prototype.hide = function() {
	this._container.style.display = 'none';
	this._container.style.zIndex = 0;
};

$.isActive = function() {
	var $ = jQuery;
	return $(document.activeElement).parents('.chat-window').length > 0;
};

$.prototype.isVisible = function() {
	var $ = jQuery;
	return $(this.getChatWindow()).is(':visible');
};

$.prototype.windowWidth = function() {
	return eval(_.chatProp.width);
};

$.prototype.windowHeight = function() {
	return eval(_.chatProp.height);
};

$.prototype.refresh = function() {
	// this.contents.clear();
};

$.prototype.terminate = function() {
	if (this._container)
		document.body.removeChild(this._container);
	this._container = null;
};

})(Window_MMO_Chat);

//----------------------------------------------------------------------------
// Scene_Map
//----------------------------------------------------------------------------
(function($) {
	var _create = $.prototype.create;
	$.prototype.create = function() {
		_create.apply(this, arguments);

		_.setupSocket();
	}

	var _start = $.prototype.start;
	$.prototype.start = function() {
		_start.call(this);

		let mapName = this.getMapName($gameMap.mapId());
		if (_._currentMap === mapName)
			return;

		if (_.forceLeaveRoom) {
			_.leaveRoom(_._currentMap);
		}

		_._currentMap = mapName;

		if ($dataMap.meta["MMO_NoChat"]) {
			_.disableChat();
			return;
		}
		_.enableChat();

		if (_.forceJoinRoom) {
			_.joinRoom(mapName, true);
		}
	};

	$.prototype.getMapName = function() {
		return 'Map-' + String($gameMap.mapId());
	};

	var _createDisplayObjects = $.prototype.createDisplayObjects;
	$.prototype.createDisplayObjects = function() {
		_createDisplayObjects.call(this);

		this.createMMOChatWindow();
	};

	$.prototype.createMMOChatWindow = function() {
		if (!_._chatWindow)
			_._chatWindow = new Window_MMO_Chat(_.chatProp.x, _.chatProp.y);
	};

	var _terminate = $.prototype.terminate;
	$.prototype.terminate = function() {
		_terminate.call(this);

		_._chatWindow.hide();
	};

	var _isMenuCalled = $.prototype.isMenuCalled;
	$.prototype.isMenuCalled = function() {
		return !Window_MMO_Chat.isActive() && _isMenuCalled.call(this);
	};

})(Scene_Map);

//----------------------------------------------------------------------------
// Game_Player
//----------------------------------------------------------------------------
(function($) {
	var _canMove = $.prototype.canMove;
	$.prototype.canMove = function() {
		return !Window_MMO_Chat.isActive() && _canMove.call(this);
	};
})(Game_Player);

//----------------------------------------------------------------------------
// Game_Interpreter
//----------------------------------------------------------------------------
(function($) {
var _pluginCommand = $.prototype.pluginCommand;
$.prototype.pluginCommand = function(command, args) {
	_pluginCommand.apply(this, arguments);

	if (command.trim().toLowerCase() === 'togglechat') {
		_.toggleChatWindow();
	} else if (command.trim().toLowerCase() === 'disablechat') {
		_.disableChat();
	} else if (command.trim().toLowerCase() === 'enablechat') {
		_.enableChat();
	}
};
})(Game_Interpreter);

})(MMO.Chat);
