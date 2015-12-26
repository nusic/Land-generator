function ProceduralRoadNetworkFactory () {
	this.lineGeometry = new THREE.Geometry();
	this.lineGeometry.vertices.push(new THREE.Vector3(0, -100, 0));
	this.lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
	this.lineMaterial = new THREE.LineBasicMaterial({color: 0x5555ff});
	this.lineMaterial2 = new THREE.LineBasicMaterial({color: 0xff0000});

	this.sphereGeometry = new THREE.SphereGeometry(10, 4, 4);
	this.sphereMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, shininess: 0} );
	this.sphereMaterial2 = new THREE.MeshPhongMaterial( { color: 0xff0000, shininess: 0} );

	this.roadMaterial = new THREE.MeshPhongMaterial( { color: 0x555555, shininess: 0} );
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

ProceduralRoadNetworkFactory.prototype.createRoadSegmentBetween = function(v1, v2, width, height, dist2) {
	var length = Math.sqrt(dist2);

	// Road is aligned along the x axis and width along y axis in local coordinates.
	var roadSegmentGeometry = new THREE.PlaneGeometry(length + width, width, 1, 1);
	var roadSegmentMesh = new THREE.Mesh(roadSegmentGeometry, this.roadMaterial);

	roadSegmentMesh.position.x = 0.5 * (v1.x + v2.x);
	roadSegmentMesh.position.y = height;
	roadSegmentMesh.position.z = -0.5 * (v1.y + v2.y);

	roadSegmentMesh.rotation.z = -Math.atan2(v2.x-v1.x, v2.y-v1.y) + Math.PI / 2;
	roadSegmentMesh.rotation.x = -0.5 * Math.PI;

	return roadSegmentMesh;
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
	var roadNetworkGroup = new THREE.Object3D();
	var scale = controls.modelScale;
	var height = 100 / scale;
	var flatMid = controls.flatStart + 0.5*(controls.flatEnd-controls.flatStart);
	var qualityFactor = (1.25-controls.quality)*(1.25-controls.quality);
	var distThres = 0.05*scale*qualityFactor;

	function manhattan(a,b){
		return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
	}

	function norm2(a,b){
		var dx = a.x - b.x;
		var dy = a.y - b.y;
		return dx*dx + dy*dy
	}

	var distance = norm2;
	var integrity = 10*(5 + 5*controls.city_scale)/scale;
	var maxRoadLength = (1 + 1*controls.roads) * integrity;
	if(distance === norm2){
		integrity *= integrity;
		maxRoadLength *= maxRoadLength;
	}

	// Collect points that will connect road segments.
	// Use kd tree to make sure we don't get points too 
	// Close to each other
	var posTree = new kdTree([], distance, ['x', 'y']);
	var data = [];
	for (var i = 0; i < groundMesh.geometry.vertices.length; i++) {
		var v = groundMesh.geometry.vertices[i];
		if(Math.abs(v.originalHeight - flatMid) < distThres && v.z === groundMesh.flatHeight){
			var result = posTree.nearest(v, 1, integrity);
			if(!result.length){
				data.push(v);
				posTree.insert(v);
			}
		}
	};

	// Maps road center x and y position to boolean if such road has been created
	// Use this to make sure we dont create duplicate roads, 
	// eg from A to B, AND from B to A. One is enough!
	var roadSegmentsMap = {};

	for (var i = 0; i < data.length; i++) {
		var v = data[i];
		var needleMesh = this.createNeedleMeshAt(v.x, v.y, height, scale);
		roadNetworkGroup.children.push(needleMesh);
		
		var result = posTree.nearest(v, 3, maxRoadLength);
		for (var j = 0; j < result.length; j++) {
			var nv = result[j];
			if(nv[1] === 0) continue;

			
			var xMid = 0.5*(v.x+nv[0].x);
			var yMid = 0.5*(v.y+nv[0].y);
			
			if(roadSegmentsMap[xMid] === undefined) roadSegmentsMap[xMid] = {};
			else if (roadSegmentsMap[xMid][yMid] === 1){
				continue;
			}
			roadSegmentsMap[xMid][yMid] = 1;

			var width = 0.1*height;
			var lengthSquared = nv[1];
			var roadSegmentMesh = this.createRoadSegmentBetween(v, nv[0], width, groundMesh.flatHeight+1, lengthSquared);
			roadNetworkGroup.children.push(roadSegmentMesh);
		};
	};

	//console.log('roadNetworkGroup.children.length: ' + roadNetworkGroup.children.length);
	return roadNetworkGroup;
};
