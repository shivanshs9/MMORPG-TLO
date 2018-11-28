Input.keyMapper[8] = 'backspace';

Window_NameInput.prototype.processHandling = function() {
    if (this.isOpen() && this.active) {
        if (Input.isTriggered('shift')) {
            this.processJump();
        }
        if (Input.isRepeated('backspace')) {
            this.processBack();
        }
        if (Input.isRepeated('cancel')) {
            this.processBack();
        }
        if (Input.isRepeated('ok')) {
            this.processOk();
        }
    }
};

Input._shouldPreventDefault = function(e) {
    if ($(e.target).is("input, textarea"))
        return false
    switch (e.keyCode) {
        case 8:     // backspace
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

//----------------------------------------------------------------------------
// Patch for YEP_ButtonCommonEvents
//----------------------------------------------------------------------------
(function(_) {
var _updateButtonEvents = Scene_Map.prototype.updateButtonEvents;
Scene_Map.prototype.updateButtonEvents = function() {
    if ($(document.activeElement).is('input', 'textarea'))
        return;
    _updateButtonEvents.call(this);
}
})();
