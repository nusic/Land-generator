function ProceduralRoadNetworkFactory (gridSize) {
	this.gridSize = gridSize;

	this.lineGeometry = new THREE.Geometry();
	this.lineGeometry.vertices.push(new THREE.Vector3(0, -100, 0));
	this.lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
	this.lineMaterial = new THREE.LineBasicMaterial({color: 0x5555ff});
	this.lineMaterial2 = new THREE.LineBasicMaterial({color: 0xff0000});

	this.sphereGeometry = new THREE.SphereGeometry(10, 4, 4);
	this.sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, shininess: 0} );
	this.sphereMaterial2 = new THREE.MeshPhongMaterial( { color: 0xff0000, shininess: 0} );
}

ProceduralRoadNetworkFactory.prototype.createSphereMesh = function() {
	var sphereMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
	return sphereMesh;
};

ProceduralRoadNetworkFactory.prototype.createLineMesh = function() {
	var lineMesh = new THREE.Line(this.lineGeometry, this.lineMaterial);
	return lineMesh;
};

ProceduralRoadNetworkFactory.prototype.createLineBetween = function(v1, v2, height) {
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push(new THREE.Vector3(v1.x, v1.z, -v1.y));
	lineGeometry.vertices.push(new THREE.Vector3(v2.x, v2.z, -v2.y));
	
	var lineMesh = new THREE.Line(lineGeometry, this.lineMaterial2);
	lineMesh.position.y = height;
	return lineMesh;
};

ProceduralRoadNetworkFactory.prototype.createNeedleMeshAt = function(x, y, height, scale, material) {
	var sphereMesh = this.createSphereMesh();
	sphereMesh.position.x = x;
	sphereMesh.position.y = height;
	sphereMesh.position.z = -y;
	sphereMesh.scale.divideScalar(scale);

	var lineMesh = this.createLineMesh();
	lineMesh.position.x = x;
	lineMesh.position.y = height;
	lineMesh.position.z = -y;
	lineMesh.scale.divideScalar(scale);

	var needleGroup = new THREE.Object3D();
	needleGroup.children.push(sphereMesh);
	needleGroup.children.push(lineMesh);

	if(material) {
		sphereMesh.material = material;
	}

	return needleGroup;
};

ProceduralRoadNetworkFactory.prototype.create = function(groundMesh, controls) {
	var self = this;
	var roadNetworkGroup = new THREE.Object3D();
	var scale = controls.modelScale;
	var height = 100 / scale;
	var flatMid = controls.flatStart + 0.5*(controls.flatEnd-controls.flatStart);
	var qualityFactor = (1.25-controls.quality)*(1.25-controls.quality);
	var distThres = 0.01*scale*qualityFactor;

	var bb = 15*scale;
	
	var data = [];
	for (var i = 0; i < groundMesh.geometry.vertices.length; i++) {
		var v = groundMesh.geometry.vertices[i];
		if(Math.abs(v.originalHeight - flatMid) < distThres){
			data.push(v);
			v.lineSelects = 0;
		}
	};

	function distance(a, b){
		return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
	}

	var tree = new kdTree(data, distance, ['x', 'y']);
	for (var i = 0; i < data.length; i++) {
		var v = data[i];

		var needleMesh = this.createNeedleMeshAt(v.x, v.y, height, scale);
		roadNetworkGroup.children.push(needleMesh);
	};


	/*for (var i = 1; i < 5; i++) {
		this.midPoints(data, i*3).forEach(function(p){
			var needleMesh = self.createNeedleMeshAt(p.x, p.y, height+50*i, scale, self.sphereMaterial2);
			roadNetworkGroup.children.push(needleMesh);
		});	
	};*/
	

	console.log(roadNetworkGroup.children.length);
	return roadNetworkGroup;
};

ProceduralRoadNetworkFactory.prototype.midPoints = function(data, numPoints, acceptDist) {
	function distance(a, b){ return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2); }
	var tree = new kdTree(data, distance, ['x', 'y']);

	var midPoints = [];
	var oneOverNumPoints = 1 / numPoints;
	for (var i = 0; i < data.length-numPoints; i++) {
		var cx = 0;
		var cy = 0;
		for (var j = 0; j < numPoints; j++) {
			cx += data[i+j].x;
			cy += data[i+j].y;
		};
		cx *= oneOverNumPoints;
		cy *= oneOverNumPoints;

		midPoints.push({
			x: cx,
			y: cy
		});
	};
	return midPoints;
};


ProceduralRoadNetworkFactory.prototype.create2 = function(groundMesh, controls) {
	var self = this;
	var roadNetworkGroup = new THREE.Object3D();
	var scale = controls.modelScale;
	var height = 100 / scale;
	var flatMid = controls.flatStart + 0.5*(controls.flatEnd-controls.flatStart);
	var qualityFactor = (1.25-controls.quality)*(1.25-controls.quality);
	var distThres = 0.01*scale*qualityFactor;

	var bb = 15*scale;
	
	var data = [];
	var minMaxX = new MinMax();
	for (var i = 0; i < groundMesh.geometry.vertices.length; i++) {
		var v = groundMesh.geometry.vertices[i];
		if(Math.abs(v.originalHeight - flatMid) < distThres){
			var needleMesh = this.createNeedleMeshAt(v.x, v.y, height, scale);
			roadNetworkGroup.children.push(needleMesh);
			data.push([v.x, v.y]);
			minMaxX.add(v.x);
		}
	};

	var result = regression('polynomial', data, 8);
	var minT = minMaxX.min / groundMesh.size.x + 0.5;
	var maxT = minMaxX.max / groundMesh.size.x + 0.5;
	for (var t = minT; t <= maxT; t+= 0.01) {
		var x = (t-0.5)*groundMesh.size.x;
		var y = 0;

		for (var i = 0; i < result.equation.length; i++) {
			y+= result.equation[i]*Math.pow(x, i);
		};

		var needleMesh = this.createNeedleMeshAt(x, y, 2*height, scale, this.sphereMaterial2);
		roadNetworkGroup.children.push(needleMesh);
	};

	for (var i = 0; i < roadNetworkGroup.children.length; i++) {

	};

	console.log(roadNetworkGroup.children.length);
	return roadNetworkGroup;
};

ProceduralRoadNetworkFactory.prototype.create3 = function(groundMesh, controls) {
	var self = this;
	var roadNetworkGroup = new THREE.Object3D();
	var scale = controls.modelScale;
	var height = 100 / scale;
	var flatMid = controls.flatStart + 0.5*(controls.flatEnd-controls.flatStart);
	var qualityFactor = (1.25-controls.quality)*(1.25-controls.quality);
	var distThres = 0.01*scale*qualityFactor;

	var bb = 15*scale;
	
	var data = [];
	for (var i = 0; i < groundMesh.geometry.vertices.length; i++) {
		var v = groundMesh.geometry.vertices[i];
		if(Math.abs(v.originalHeight - flatMid) < distThres){
			data.push(v);
			v.lineSelects = 0;
		}
	};

	function distance(a, b){
		return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
	}

	var tree = new kdTree(data, distance, ['x', 'y']);
	for (var i = 0; false && i < data.length; i++) {
		var v0 = data[i];
		var nearest = tree.nearest(v0, 2);
		var distance2 = nearest[1][1];
		if(distance2 < 2000*2000){
			tree.remove(nearest[1][0]);
			data.splice(data.indexOf(nearest[1][0]), 1);
		}
	};

	for (var i = 0; i < data.length; i++) {
		var v = data[i];

		var needleMesh = this.createNeedleMeshAt(v.x, v.y, height, scale);
		roadNetworkGroup.children.push(needleMesh);

		tree.remove(v);
		var nearest = tree.nearest(v, 2);



		if(nearest.length === 0) continue;
		var v1 = nearest[0][0];
		if (false && nearest[0][1] < 25000){
			roadNetworkGroup.children.push(this.createLineBetween(v, v1, 50));
			if(++v1.lineSelects > 1) tree.remove(v1);

		}

		if(nearest.length === 1) continue;
		var v2 = nearest[1][0];
		if (nearest[1][1] < 1000*1000){
			roadNetworkGroup.children.push(this.createLineBetween(v, v2, 50));
			if(++v2.lineSelects > 1) tree.remove(v2);
		}
	};

	console.log(roadNetworkGroup.children.length);
	return roadNetworkGroup;
};

