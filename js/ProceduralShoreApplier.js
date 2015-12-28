function ProceduralShoreApplier(label){
	this.label = label;
}

function modifyByHeight(groundMesh, h0, h1, f, ref){
	// Height range input
	var hRange = h1 - h0;

	// Reference point. What should be fixed?
	var hRef = 	(ref === 'lower') ? h0 : 
				(ref === 'upper') ? h1 : 
				(ref === 'mid') ? (h0 + h1)/2 : 
				undefined;

	// Value range output
	var v0 = f(h0 - hRef) + hRef;
	var v1 = f(h1 - hRef) + hRef;
	var vRange = v1 - v0;

	//console.log('h', h0, h1, hRange);
	//console.log('v', v0, v1, vRange);
	//console.log('v-h', v0-h0, v1-h1, vRange-hRange);

	var diff0 = v0-h0;
	var diff1 = v1-h1;

	rangeDiff = vRange-hRange;

	var lowerOffset;
	var upperOffset;
	switch(ref){
		case 'upper': 
			upperOffset = 0 + diff1;
			lowerOffset = -rangeDiff + diff1; 
			break;
		case 'mid': 
			upperOffset = (rangeDiff + diff0 + diff1)/ 2;
			lowerOffset = (-rangeDiff + diff0 + diff1) / 2;
			break;
		case 'lower': 
			upperOffset = rangeDiff+diff0;
			lowerOffset = 0 + diff0;
			break;
	}


	for (var i = 0; i < groundMesh.geometry.vertices.length; i++) {
		var v = groundMesh.geometry.vertices[i];
		var h = v.z / groundMesh.size.heightLimit;
		h = (h < h0) ? 
				h + lowerOffset : (h < h1) ? 
					f(h - hRef) + hRef : h + upperOffset;
		v.z = h * groundMesh.size.heightLimit;
	}

	groundMesh.geometry.computeFaceNormals();
	groundMesh.geometry.computeVertexNormals();

	groundMesh.geometry.verticesNeedUpdate = true;
	groundMesh.geometry.normalsNeedUpdate = true;
}

ProceduralShoreApplier.prototype.create = function(controls){
	var groundMesh = controls.groundMesh;
	var scale = controls.modelScale;
	var seaLevel = (controls.sea_level-0.5);

	var shoreSize = 0.02+0.5*controls.shore;
	var shoreScale = controls.shore_slope;

	var shoreStart = seaLevel - shoreSize/2;
	var shoreEnd = seaLevel + shoreSize/2;

	var flatStart = shoreEnd;
	var flatSize = controls.flat;
	var flatEnd = flatStart + flatSize;

	controls.flatStart = flatStart;
	controls.flatEnd = flatEnd;


	/*
	// DEBUG COLORS
	for (var faceIndex = 0; faceIndex < groundMesh.geometry.faces.length; faceIndex++) {
		var face = groundMesh.geometry.faces[faceIndex];
		var abc = ['a', 'b', 'c'];
		for (var vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
			var faceVertexIndex = face[abc[vertexIndex]];
			var height = groundMesh.geometry.vertices[faceVertexIndex].z / groundMesh.size.heightLimit;

			if(height < shoreStart) face.vertexColors.push(new THREE.Color(0x605030));
			else if(height < flatStart) face.vertexColors.push(new THREE.Color(0xc2b280));
			else if(height < flatEnd) face.vertexColors.push(new THREE.Color(0x888888));
			else face.vertexColors.push(new THREE.Color(0x66cc66));
		};
	};
	*/

	var newShoreSize = shoreSize*shoreScale;
	var halfRestOfNewShoreSize = shoreSize*(1-shoreScale)/2;
	var shoreHeightRatio = newShoreSize / shoreSize;
	var flatHeight = flatStart - halfRestOfNewShoreSize;

	for (var i = 0; i < groundMesh.geometry.vertices.length; i++) {
		var v = groundMesh.geometry.vertices[i];
		var height = v.z / groundMesh.size.heightLimit;

		var seabedHeight = height + halfRestOfNewShoreSize;
		var shoreHeight = shoreStart + halfRestOfNewShoreSize + (height - shoreStart) * shoreHeightRatio;
		var mountainHeight = height - flatSize - halfRestOfNewShoreSize;

		height = (height < shoreStart) ? seabedHeight :
					(height < flatStart) ? shoreHeight :
						(height < flatEnd) ? flatHeight :
							mountainHeight;

		v.z = height * groundMesh.size.heightLimit;
	}

	groundMesh.flatHeight = flatHeight * groundMesh.size.heightLimit;

	groundMesh.geometry.computeFaceNormals();
	groundMesh.geometry.computeVertexNormals();

	groundMesh.geometry.verticesNeedUpdate = true;
	groundMesh.geometry.normalsNeedUpdate = true;
};