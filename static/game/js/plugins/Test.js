var Alias_ST_initialize = Scene_Title.prototype.initialize

Scene_Title.prototype.initialize = function() {
    Alias_ST_initialize.call(this)
    console.log('Called!');
}