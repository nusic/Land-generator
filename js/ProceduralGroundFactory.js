function ProceduralGroundFactory(){
	this.cachedGroundMesh = null;
}

ProceduralGroundFactory.prototype.create = function(size, controls) {
	var qualityLevel = 6 + 3*controls.quality;
	var numSegments = 2*Math.round(0.5*Math.pow(2, qualityLevel)); // even number

	var segments = {
		x: numSegments,
		y: numSegments
	};

	// Geometry
	tic()
	var groundGeometry
	if(this.cachedGroundMesh && this.cachedGroundMesh.quality === controls.quality){
		console.log('USING CACHE');
		groundGeometry = this.cachedGroundMesh.geometry;
	}
	else{
		console.log('NOT USING CACHE');
		groundGeometry = new THREE.PlaneGeometry(size.x, size.y, segments.x, segments.y);
		groundGeometry.segments = segments;
		groundGeometry.size = size;
	}
	toc(' - init groundGeometry');

	
	var vertexIndex = 0;
	var sumHeight = 0;
	var noiseLevels = 10;
	var scale = controls.modelScale;
	var heightLimit = 1+500*controls.terrain/scale;

	var minMaxHeight = new MinMax();

	var oneOverSize = {
		x: 1 / size.x,
		y: 1 / size.y,
	}

	tic();
	for (var i = 0; i < groundGeometry.vertices.length; i++) {
		var v = groundGeometry.vertices[i];
		var s = v.x * oneOverSize.x;
		var t = v.y * oneOverSize.y;

		var height = 0;

		for (var j = 0; j < noiseLevels; j++) {
			var twoPowI = Math.pow(2, j);
			height+= (0.7/(twoPowI)) * noise.simplex2(twoPowI*(scale*s + controls.x), twoPowI*(scale*t + controls.y));
		};
		v.originalHeight = height;

		height = controls.rivers ? Math.abs(height) : height;
		height*= heightLimit;
		v.z = height;

		sumHeight+= height;
		minMaxHeight.add(height);
	};

	toc(' - calculate heightmap');

	groundGeometry.computeFaceNormals();
	groundGeometry.computeVertexNormals();

	groundGeometry.verticesNeedUpdate = true;
	groundGeometry.normalsNeedUpdate = true;

	// Material
	var groundMaterial = new THREE.MeshPhongMaterial( { color: 0x99bb55, shininess: 0} );
	//groundMaterial = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors });
	groundMaterial.vertexColors = THREE.VertexColors;

	
	//var groundMaterial = new THREE.MeshBasicMaterial({wireframe: true});

	var newGroundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
	newGroundMesh.segments = segments;
	newGroundMesh.quality = controls.quality;
	newGroundMesh.size = size;
	newGroundMesh.size.heightLimit = heightLimit;
	newGroundMesh.size.avgHeight = sumHeight / groundGeometry.vertices.length;
	newGroundMesh.size.minHeight = minMaxHeight.min;
	newGroundMesh.size.maxHeight = minMaxHeight.max;

	newGroundMesh.rotation.x = -Math.PI/2;

	if(controls.quality !== 0){
		this.cachedGroundMesh = newGroundMesh;	
	}
	return newGroundMesh;
};

