function ProceduralGroundColorApplier(label){
	this.label = label;
	this.colorControlPoints = [
		{height: -10, hexcolor: 0x856501},
		{height: 20, hexcolor: 0xaaaaaa},
		{height: 130, hexcolor: 0xaaaaaa},
		{height: 150, hexcolor: 0xffffff},
	];
}

var low = 0;
var mid = 0;
var high = 0;

ProceduralGroundColorApplier.prototype.getColor = function(height) {
	var next = this.colorControlPoints[0];
	if(height <= next.height) {
		low++;
		return new THREE.Color(next.hexcolor);
	}
	var prev = next;
	for(var i=1; i<this.colorControlPoints.length; ++i){
		next = this.colorControlPoints[i];
		if(prev.height <= height && height < next.height){
			var alpha = (height - prev.height) / (next.height - prev.height);
			var c0 = new THREE.Color(prev.hexcolor);
			var c1 = new THREE.Color(next.hexcolor);
			mid++;
			return c0.lerp(c1, alpha);
		}
		prev = next;
	}
	high++;
	return new THREE.Color(next.hexcolor);
};

ProceduralGroundColorApplier.prototype.create = function(controls) {
	var minmax = new MinMax();
	low = 0;
	mid = 0;
	high = 0;


	var groundMesh = controls.groundData.groundMesh;
	// Set groundMesh material to use vertex colors
	groundMesh.material = new THREE.MeshPhongMaterial( { 
	    color: 0xffffff, ambient: 0xffffff, specular: 0,
	    shading: THREE.FlatShading,
	    //shading: THREE.SmoothShading,
	    vertexColors: THREE.FaceColors 
	});
	console.log(groundMesh.material);

	// Clear any previous vertex colors
	for (var faceIndex = 0; faceIndex < groundMesh.geometry.faces.length; faceIndex++) {
		var vc = groundMesh.geometry.faces[faceIndex].vertexColors = [];
	}

	// Set a color to each faces' vertices
	for (var faceIndex = 0; faceIndex < groundMesh.geometry.faces.length; faceIndex++) {
		var face = groundMesh.geometry.faces[faceIndex];
		var height = groundMesh.geometry.vertices[face.a].z * controls.modelScale;

		face.color.copy(this.getColor(height));
		minmax.add(height);
	};

	groundMesh.geometry.colorsNeedUpdate = true;
	
	console.log(minmax, low, mid, high);
};