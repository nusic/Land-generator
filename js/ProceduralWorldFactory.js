function ProceduralWorldFactory(size){
	this.lastQuality;

	this.size = size || {x: 2000, y: 2000};
	this.groundFactory = new ProceduralGroundFactory('ground');
	this.waterFactory = new ProceduralWaterFactory('water');
	this.shoreApplier = new ProceduralShoreApplier('shores');
	this.surroundingFactory = new ProceduralSurroundingFactory('surrounding');
	this.roadNetworkFactory = new ProceduralRoadNetworkFactory('roads');
	this.buildingFactory = new ProceduralBuildingFactory('buildings');

}

ProceduralWorldFactory.prototype.preprocessControls = function(controls) {
	// model scale
	controls.modelScale = Math.pow(2, 6*(controls.scale-0.5)-2);

	// seed x and y for positioning
	var step = 0.1;
	controls.seed = {
		x: step * controls.x,
		y: step * controls.y,
	};

	// nubmer of segments in mesh
	var qualityLevel = 6 + 3*controls.quality;
	var segments = 2*Math.round(0.5*Math.pow(2, qualityLevel)); // ensure even number
	controls.dim = {
		x: segments, 
		y: segments
	};

	// size of world in world coordinates
	controls.size = {
		x: 2000,
		y: 2000,
	};
};

ProceduralWorldFactory.prototype.createAndSetScene = function(controls) {
	

	var groundMesh;
	var roadMeshGroup;

	var self = this;
	var sceneCreationSteps = [
		{	label: 'ground', fun: function(){
				groundMesh = self.groundFactory.create(controls);
				scene.add(groundMesh);
			}
		},
		{
			label: 'shores', fun: function(){
				self.shoreApplier.create(controls);
			},	
		},
		{
			label: 'water', fun: function(){
				var waterMesh = self.waterFactory.create(controls);
				scene.add(waterMesh);
			}
		},
		{
			label: 'surrounding', fun: function(){
				var surroundingMesh = self.surroundingFactory.create(controls);
				scene.add(surroundingMesh);
			}
		},
		{
			label: 'roads', fun: function(){
				roadMeshGroup = self.roadNetworkFactory.create(controls);
				scene.add(roadMeshGroup);
			}
		},
		{
			label: 'buildings', fun: function(){
				var buildingMeshGroup = self.buildingFactory.create(controls);
				scene.add(buildingMeshGroup);
			}
		}
	];

	function executeCreationSteps(){
		self.preprocessControls(controls);

		// create a scene
		scene = new THREE.Scene();
		self.addLights(scene);
		self.addCamera(scene);
		self.addPersistentObjects(scene, controls);

		sceneCreationSteps.forEach(function (sceneCreationStep, i){
			if(buildStepDelay){
				setTimeout(function(){
					tic();
					sceneCreationStep.fun();
					toc(sceneCreationStep.label);
				}, i * buildStepDelay);
			}
			else{
				tic();
				sceneCreationStep.fun();
				toc(sceneCreationStep.label);
			}
		});
	}



	//var buildStepDelay = 1500;
	var buildStepDelay = 300*0;

	if(buildStepDelay === 0 && controls.quality !== 0){
		
		// Override quality and create lo fi scene
		console.log('\nDIRTY BUILD');
		var originalQuality = controls.quality;
		controls.quality = 0;
		controls.dirtyBuild = true;
		executeCreationSteps();
		controls.quality = originalQuality;
		controls.dirtyBuild = false;

		renderer.render( scene, camera );
		if(self.lastQuality !== controls.quality){
			$('#user-message').text('Initializing geometry ...');
		}
		setTimeout(function(){
			if(this.hiqCreationTimeouts === null) return;
			console.log('\nTRUE BUILD');
			executeCreationSteps();
			self.lastQuality = controls.quality;
			$('#user-message').text('');
			
		}, 30);
	}
	else{
		console.log('TRUE QUALITY CREATION');
		executeCreationSteps();
		self.lastQuality = controls.quality;
	}
}

ProceduralWorldFactory.prototype.addCamera = function(scene) {
	if(!camera){
		camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.set(0, 1500, 1500);
		camera.far = 1000000;	
	}
	scene.add(camera);
};

ProceduralWorldFactory.prototype.addLights = function(scene) {
	var lightGroup = new THREE.Object3D();

	// And there was light!
	var hemiLight = new THREE.HemisphereLight( 0x333333, 1 );
	lightGroup.children.push(hemiLight);

	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.7 );
	directionalLight.position.set( -1, 1, 0 );
	lightGroup.children.push(directionalLight);

	scene.add(lightGroup);
};

ProceduralWorldFactory.prototype.addPersistentObjects = function(scene, controls) {
	scene.add(persistentObjects);
};

