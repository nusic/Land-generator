function ProceduralBuildingFactory (label) {
	this.label = label;

	this.cubeGeometry = new THREE.CubeGeometry( 1, 1, 1 );
	this.whiteMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, shininess: 0} );
	this.redMaterial = new THREE.MeshPhongMaterial( { color: 0xff0000, shininess: 0} );
}

ProceduralBuildingFactory.prototype.createBuilding = function(scale) {
	var buildingMesh = new THREE.Mesh(this.cubeGeometry, this.whiteMaterial);
	buildingMesh.scale.multiplyScalar(scale);
	return buildingMesh;
};

ProceduralBuildingFactory.prototype.create = function(controls) {
	var buildingMeshGroup = new THREE.Object3D();

	if(controls.dirtyBuild || !controls.roadsData) {
		return buildingMeshGroup;
	}


	var groundMesh = controls.groundData.groundMesh;
	var roads = controls.roadsData.roads;
	var buildingScale = 0.2 * controls.roadsData.integrity;


	function norm2(a,b){
		var dx = a.x - b.x;
		var dy = a.y - b.y;
		return dx*dx + dy*dy
	}


	var houseTree = new kdTree([], norm2, ['x', 'y']);
	for (var i = 0; i < roads.length; i++) {
		var roadSegment = roads[i];
		var v1 = roadSegment[0];
		var v2 = roadSegment[1];
		var xMid = 0.5*(v1.x + v2.x);
		var yMid = 0.5*(v1.y + v2.y);

		var results = houseTree.nearest({x: xMid, y: yMid}, 1, 30);
		

		var rotation = Math.atan2(v2.x-v1.x, v2.y-v1.y);

		var buildingMesh = this.createBuilding(buildingScale);
		buildingMesh.rotation.y = -rotation - Math.PI * 0.5;

		var x = xMid + 2*buildingScale*Math.cos(-rotation);
		var y = (yMid + 2*buildingScale*Math.sin(-rotation));
		try{
			if(groundMesh.geometry.vertexAtPosition(x, y).z !== groundMesh.flatHeight){
				continue;
			}
		}
		catch(e){ 
			//console.error(e);
			continue; 
		}

		buildingMesh.position.x = x;
		buildingMesh.position.y = groundMesh.flatHeight;
		buildingMesh.position.z = -y;
		

		buildingMeshGroup.children.push(buildingMesh);

		

		/*
		var buildingMesh = this.createBuilding(buildingScale);
		buildingMesh.position.x = xMid - 2*buildingScale*Math.cos(-rotation);
		buildingMesh.position.y = groundMesh.geometry.vertexAtPosition(xMid, yMid).z;
		buildingMesh.position.z = -(yMid - 2*buildingScale*Math.sin(-rotation));
		buildingMesh.rotation.y = -rotation - Math.PI * 0.5;
		buildingMeshGroup.children.push(buildingMesh);
		*/
	};

	return buildingMeshGroup;
};