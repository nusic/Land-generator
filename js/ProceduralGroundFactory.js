function ProceduralGroundFactory(){
	this.cachedGroundMesh = null;
}

ProceduralGroundFactory.prototype.getGeometry = function(size, controls) {
	tic()
	var groundGeometry
	if(this.cachedGroundMesh && this.cachedGroundMesh.quality === controls.quality){
		console.log('USING CACHE');
		groundGeometry = this.cachedGroundMesh.geometry;
	}
	else{
		console.log('CREATING NEW GEOMETRY - ' + controls.dim.x +'x'+controls.dim.y);
		groundGeometry = new THREE.PlaneGeometry(size.x, size.y, controls.dim.x, controls.dim.x);
		groundGeometry.size = size;
	}
	return groundGeometry
	toc(' - init groundGeometry');
};

ProceduralGroundFactory.prototype.create = function(size, controls) {
	var groundGeometry = this.getGeometry(size, controls);

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
			height+= (0.7/(twoPowI)) * noise.simplex2(twoPowI*(scale*s + controls.seed.x), twoPowI*(scale*t + controls.seed.y));
		};
		height = controls.rivers ? Math.abs(height) : height;

		v.originalHeight = height;

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
	var groundMaterial = new THREE.MeshPhongMaterial( { color: 0x99bb55, shininess: 0, wireframe: false} );
	//groundMaterial = new THREE.MeshPhongMaterial({ vertexColors: THREE.VertexColors });

	var newGroundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
	newGroundMesh.segments = controls.dim;
	newGroundMesh.geometry.segments = controls.dim;	
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

