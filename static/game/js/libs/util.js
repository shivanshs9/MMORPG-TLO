function bind(toObject, methodName){
	return function() {
		toObject[methodName](arguments)
	}
}
