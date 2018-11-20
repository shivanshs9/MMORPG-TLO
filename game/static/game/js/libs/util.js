function bind(toObject, methodName){
	return function() {
		toObject[methodName](arguments)
	}
}

String.prototype.interpolate = function(params) {
	const names = Object.keys(params);
	const vals = Object.values(params);
	return new Function(...names, `return \`${this}\`;`)(...vals);
}

function alertToast(message) {
	$("body").append("<span class ='toast'>" + message + "</span>");

	setTimeout(function(){
		$(".toast").remove();
	},3000);
}