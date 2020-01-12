// copyright 2019 Theo Armour. MIT license.
// 2019-11-27 v0.00.00


const DLM = {};


DLM.getMenu = function () {

	const htm =
		`
<details>

	<summary class="sumMenuTitle" >Draw mesh lines</summary>

	<p>Draw the data with on lines that have height and other features</p>

	<p>
		<button onclick=DLM.renderLines(CFR.contours) >render lines as mesh</button>
	</p>

	<p title="line width: 1 to 20" >
		line width <output id=DLMoutLineWidth class=floatRight >10</output><br>
		<input type="range" id="DLMrngLineWidth" min=1 max=20 step=1 value=10 oninput=DLM.renderLines(CFR.contours); >
	</p>

	<p>
		<select id=DLMselSides oninput=DLM.renderLines(CFR.contours); size=3>
			<option >back side</option>
			<option>front side</option>
			<option selected>both sides</option>
		</select>
	</p>
	<p>
		<button onclick=DLM.applyMaterialNormal() >apply material normal</button>
	</p>

	<p>
		<button onclick=DLM.applyMaterialRandom() >apply material random</button>
	</p>

	<p>
		<button onclick=DLM.applyMaterialTexture() >apply material texture</button>
	</p>

	<div>
		<input type=checkbox id=DLMchkWireframe onchange=DLM.toggleWireframe(); > wireframe
	</div>

	<p title="opacity: 0 to 100%" >
		opacity <output id=outOpacity class=floatRight >85%</output><br>
		<input type="range" id="rngOpacity" min=0 max=100 step=1 value=85 oninput="group.material.opacity= 0.01 * this.value";" >
	</p>


</details>

	`;

	return htm;

};




DLM.renderLines = function (contours) {

	const v = (x, y, z) => new THREE.Vector3(x, y, z);

	if (!contours) { alert("First please load a file"); }

	scene.remove(group);

	group = new THREE.Group();

	DLMoutLineWidth.value = DLMrngLineWidth.value
	const material = new THREE.MeshNormalMaterial( { side: DLMselSides.selectedIndex } );

	for (let contour of contours) {

		//console.log('contour', contour);
		width = 0.3 * parseFloat( DLMrngLineWidth.value );

		vertices = contour.map( vertex => new THREE.Vector3().fromArray( vertex.map( coord => parseFloat( coord) ) ) );
		//console.log('vertices', vertices);
		//console.log('', box3);

		if (vertices.length > 2) {

			// box3 = new THREE.Box3().setFromPoints(vertices);
			// center = box3.getCenter( new THREE.Vector3() )
			// plane = new THREE.Plane().setFromCoplanarPoints(vertices[0], center, vertices[vertices.length - 2 ])

			// if (plane.normal.z > 0) {

			// 	console.log('plane', plane);
			// 	vertices.reverse();
			// }

			const cw = THREE.ShapeUtils.isClockWise(vertices);
			//console.log('cw', cw);

			if ( cw === false ) { vertices.reverse() }

			const cw2 = THREE.ShapeUtils.isClockWise(vertices);
			console.log('cw', cw, cw2 );

		}

		const geometry = new THREE.PlaneGeometry( 10, 10, 1, vertices.length - 1 );
		const mesh = new THREE.Mesh(geometry, material);
		//console.log('mesh', mesh);
		group.add(mesh);

		let j = 0;

		for ( let i = 0; i < vertices.length; i++ ) {

			const vt = vertices[ i ];
			mesh.geometry.vertices[ j++ ] = vt;
			mesh.geometry.vertices[ j++ ] = v( vt.x, vt.y, vt.z + width);

		}


		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

	}

	scene.add(group);

	zoomObjectBoundingSphere();

}


DLM.applyMaterialNormal = function () {

	group.traverse(child => {

		if (child.geometry) {

			// var geometry = child.geometry;
			// //console.log('', child, geometry);
			// geometry.verticesNeedUpdate = true;
			// geometry.elementsNeedUpdate = true;
			// geometry.morphTargetsNeedUpdate = true;
			// geometry.uvsNeedUpdate = true;
			// geometry.normalsNeedUpdate = true;
			// geometry.colorsNeedUpdate = true;
			// geometry.tangentsNeedUpdate = true;

		}


		if (child.type === "Mesh") {

			child.material = new THREE.MeshNormalMaterial( { side: DLMselSides.selectedIndex });
			child.material.needsUpdate = true;

		}

	})

}


DLM.applyMaterialRandom = function () {

	group.traverse(child => {

		if (child.type === "Mesh") {

			child.material = new THREE.MeshBasicMaterial({ color: 0xffffff * Math.random(), opacity: 0.85, side: DLMselSides.selectedIndex, transparent: true })
		}

	} )

}



DLM.applyMaterialTexture = function () {

	url = "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg";

	texture = new THREE.TextureLoader().load(url);


	group.traverse(child => {
		if (child.type === "Mesh") {
			child.material = new THREE.MeshBasicMaterial({ color: 0xdddddd, map: texture, opacity: 0.85, side: DLMselSides.selectedIndex, transparent: true })

		}
	});

}


DLM.toggleWireframe = function () {

	if (!DLM.wireframe) {

		DLM.wireframe = false;

	}

	DLM.wireframe = !DLM.wireframe;

	const groups = group.geometry ? [group] : group.children;

	for (let group of groups) {

		group.material.wireframe = DLM.wireframe

	}

};






DLM.reset = function () {

	scene.remove(edges, boxHelper);

	axesHelper.visible = true;

	DLMchkWireframe.checked = false;
	DLMchkBoxHelper.checked = false;
	DLMchkEdges.checked = false;
	edges = null;
	boxHelper = null;

};
