function ProceduralShoreApplier(){

}

ProceduralShoreApplier.prototype.create = function(groundMesh, controls){
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

	var vertexIndex = 0;
	var segments = groundMesh.segments;
	var newShoreSize = shoreSize*shoreScale;
	var halfRestOfNewShoreSize = shoreSize*(1-shoreScale)/2;
	var shoreHeightRatio = newShoreSize / shoreSize;
	var flatHeight = flatStart - halfRestOfNewShoreSize;

	sampledFlatPositions = [];

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