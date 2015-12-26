function UserControls(domElement){
	this.domElement = domElement;
	this.controlElements = [];
	this.init();
}

UserControls.prototype.init = function() {
	var controlsAndDefaults = [
		{inputType: 'number', name: 'x', value: 33},
		{inputType: 'number', name: 'y', value: 3},
		{inputType: 'slider', name: 'quality', value: 0.0},
		{inputType: 'checkbox', name: 'rivers', value: true},
		{inputType: 'slider', name: 'terrain', value: 0.25},
		{inputType: 'slider', name: 'scale', value: 0.5},
		{inputType: 'slider', name: 'sea level', value: 0.55},
		{inputType: 'slider', name: 'flat', value: 0.2},
		{inputType: 'slider', name: 'shore', value: 0.2},
		{inputType: 'slider', name: 'shore slope', value: 0.5},
		{inputType: 'slider', name: 'city scale', value: 0.5},
		{inputType: 'slider', name: 'roads', value: 0.0},
	];


	for (var i = 0; i < controlsAndDefaults.length; i++) {
		var inputType = controlsAndDefaults[i].inputType;
		var name = controlsAndDefaults[i].name;
		var value = controlsAndDefaults[i].value;
		var controlElement = this[inputType](name, value);
		this.controlElements.push(controlElement);
	};
	
};

UserControls.prototype.createDefualtInput = function(name, value) {
	$(this.domElement).append($('<span>&nbsp;' + name + ':</span>'));
	var $inputElement = $('<input>');
	$inputElement.attr('tabIndex','-1');
	var propertyName = name.replace(/ /g, '_');
	$inputElement.attr('id', propertyName);

	$inputElement.change(function(/*event*/){
		rebuildScene();
	});

	$(this.domElement).append($inputElement);
	return $inputElement;
};

UserControls.prototype.slider = function(name, value) {
	$inputElement = this.createDefualtInput(name, value);
	$inputElement.attr('value', 100*value);
	$inputElement.attr('type', 'range');
	return $inputElement;
};

UserControls.prototype.number = function(name, value) {
	$inputElement = this.createDefualtInput(name, value);
	$inputElement.attr('value', value);
	$inputElement.attr('type', 'number');
	return $inputElement;
};

UserControls.prototype.checkbox = function(name, value) {
	$inputElement = this.createDefualtInput(name, value);
	$inputElement.attr('checked', value);
	$inputElement.attr('type', 'checkbox');
	return $inputElement;
};

UserControls.prototype.getControls = function() {
	var state = {};
	for (var i = 0; i < this.controlElements.length; i++) {
		var control = this.controlElements[i];
		if(control.attr('type') === 'range'){
			state[control.attr('id')] = 0.01*Number(control[0].value);
		}
		if(control.attr('type') === 'number'){
			state[control.attr('id')] = Number(control[0].value);
		}
		if(control.attr('type') === 'checkbox'){
			state[control.attr('id')] = control[0].checked;
		}
	};
	return state;
};