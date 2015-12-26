function ProceduralWorldFactory(size){
	this.lastQuality;

	this.size = size || {x: 2000, y: 2000};
	this.groundFactory = new ProceduralGroundFactory();
	this.waterFactory = new ProceduralWaterFactory();

	this.shoreApplier = new ProceduralShoreApplier();

	this.surroundingFactory = new ProceduralSurroundingFactory();
	this.roadNetworkFactory = new ProceduralRoadNetworkFactory({x: 10, y: 10});

	this.roadNetworkFactory = new ProceduralRoadNetworkFactory({x: 10, y: 10});

}

ProceduralWorldFactory.prototype.preprocessControls = function(controls) {
	controls.modelScale = Math.pow(2, 6*(controls.scale-0.5)-2);

	var step = 0.1;
	controls.seed = {
		x: step * controls.x,
		y: step * controls.y,
	};

	var qualityLevel = 6 + 3*controls.quality;
	var segments = 2*Math.round(0.5*Math.pow(2, qualityLevel)); // ensure even number
	controls.dim = {x: segments, y: segments};
};

ProceduralWorldFactory.prototype.createAndSetScene = function(controls) {
	

	var groundMesh;

	var self = this;
	var sceneCreationSteps = [
		{	label: 'ground',
			fun: function(){
				groundMesh = self.groundFactory.create(self.size, controls);
				scene.add(groundMesh);
			}
		},
		{
			label: 'shores',
			fun: function(){
				self.shoreApplier.create(groundMesh, controls);
			},	
		},
		{
			label: 'water',
			fun: function(){
				var waterMesh = self.waterFactory.create(groundMesh, controls);
				scene.add(waterMesh);
			}
		},
		{
			label: 'surrounding',
			fun: function(){
				var surroundingMesh = self.surroundingFactory.create(groundMesh, controls);
				scene.add(surroundingMesh);
			}
		},
		{
			label: 'roads',
			fun: function(){
				var roadNetworkMesh = self.roadNetworkFactory.create(groundMesh, controls);
				scene.add(roadNetworkMesh);
			}
		},
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
		console.log('\nLOW QUALITY CREATION');
		var originalQuality = controls.quality;
		controls.quality = 0;
		executeCreationSteps();
		controls.quality = originalQuality;

		renderer.render( scene, camera );
		if(self.lastQuality !== controls.quality){
			$('#user-message').text('Initializing geometry ...');
		}
		setTimeout(function(){
			if(this.hiqCreationTimeouts === null) return;
			console.log('\nTRUE QUALITY CREATION');
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

