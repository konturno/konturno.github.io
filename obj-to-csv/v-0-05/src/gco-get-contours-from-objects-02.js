// copyright Theo Armour. MIT license.
/* global THREE, zoomObjectBoundingSphere, divMessage, eventResetAll, scene, mesh, meshPlane, controls */
// jshint esversion: 6
// jshint loopfunc: true

const GCO = {};

GCO.contoursLength = 12;
GCO.constant = 0;
GCO.tolerance = 0.01;

xxx = 0;

THREE.Vector3.prototype.equals = function(v, tolerance) {
	if (tolerance === undefined) {
		return v.x === this.x && v.y === this.y && v.z === this.z;
	} else {
		return (
			Math.abs(v.x - this.x) < tolerance &&
			Math.abs(v.y - this.y) < tolerance &&
			Math.abs(v.z - this.z) < tolerance
		);
	}
};

GCO.getMenu = function () {

	window.addEventListener("onresetall", GCO.reset, false);

	const htm = `
<details open>

	<summary>Get contour points</summary>

	<p>Adjust contour line parameters. Generate vertices. Draw points and lines.</p>

	<div id=GCOdivToggles >
		<p>
			Toggles
		</p>

		<div>
			<input type=checkbox onchange="GCO.contoursSegments.visible=!GCO.contoursSegments.visible" checked >
			contour segments
		</div>
		<div>
			<input type=checkbox onchange="GCO.contourLines.visible=!GCO.contourLines.visible" checked >
			contour lines
		</div>

		<div>
			<input type=checkbox onchange="GCO.contourPoints.visible=!GCO.contourPoints.visible" checked >
			contour points
		</div>

		<div>
			<input type=checkbox onchange="mesh.visible=!mesh.visible" checked >
			model
		</div>
	</div>


	<p>
		number of contours <output id=GCOoutContourCount >${GCO.contoursLength}</output><br>
		<input type="range" id="GCOrngContoursCount" min=1 max=256 step=1 value=${GCO.contoursLength}
		oninput="GCO.reset();GCO.contoursLength=this.value;GCOoutContourCount.innerHTML=this.value;" >
	</p>

	<p>
		<button title="pressMe" onclick=GCO.getContourPoints(); ><b>get multiple contours</b></button>
	</p>

	<hr>

	<p>
		contour position <output id=GCOoutContourPosition >${GCO.constant + 50}%</output><br>
		<input type="range" id="GCOrngContourPosition" min=0 max=100 step=1 value=${GCO.constant + 50}
		oninput="GCO.setContourPosition();" >
	</p>

	<p>
		<button title="pressMe" onclick=GCO.getContourSingle(); ><b>get single contour</b></button>
	</p>

	<div id=GCOdivMessage ></div>


</details>
`;

	return htm;
};

GCO.reset = function () {

	scene.remove(GCO.contourPoints, GCO.contoursSegments, GCO.contourLines);

	GCO.contourPoints = new THREE.Group();
	GCO.contoursSegments = new THREE.Group();
	GCO.contourLines = new THREE.Group();
	GCO.contoursVertices = [];
	GCO.countFaces = 0;
	GCO.smallSegments = 0;

	// GCO.vertexFound = 0;
	// GCO.vertexNext = 0;
	// GCO.verticesFound = 0;
	// GCO.notFound = 0;

	//scene.add(GCO.contourPoints);
	scene.add(GCO.contoursSegments);
	scene.add(GCO.contourLines);

	//meshPlane.position.z = -50;

	mesh.updateMatrix();

	GCOdivMessage.innerHTML = "";

	const checkBoxes = GCOdivToggles.querySelectorAll("input");

	checkBoxes.forEach( box => box.checked = true );

};

GCO.getMessage = function () {

	const pts = GCO.contourPoints.children.reduce((acc, child) => {

		acc += child.geometry.vertices.length;

		return acc;
	}, 0);

	const segs = GCO.contoursSegments.children.reduce((acc, child) => {

		acc += child.children.length;

		return acc;
	}, 0);

	const lins = GCO.contourLines.children.length;


	const htm =
`
GCO.constant: ${ GCO.constant}<br>
GCO.pointsOfIntersection: ${GCO.pointsOfIntersection.vertices.length}<br>
GCO.countFaces: ${ GCO.countFaces}<br>
GCO.smallSegments: ${ GCO.smallSegments}<br>

GCO.contourPoints: ${ pts }</br>
GCO.contoursSegments: ${ segs }</br>

GCO.contourLines: ${ lins }</br>
<!--
<br>
GCO.vertexFound: ${ GCO.vertexFound}<br>
GCO.vertexNext: ${ GCO.vertexNext}<br>
GCO.verticesFound: ${ GCO.verticesFound}<br>
GCO.notFound: ${ GCO.notFound }<br>
-->
`;

	return htm;

};


GCO.setContourPosition = function () {

	mesh.geometry.computeBoundingBox();

	const size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());

	//console.log('size', size);

	meshPlane.position.z = (size.z * GCOrngContourPosition.value) / 100 - 0.5 * size.z;

	GCOoutContourPosition.innerHTML = (100 * GCOrngContourPosition.value) / 100;

};

GCO.getContourPoints = function () {

	GCO.reset();

	const box3 = new THREE.Box3().setFromObject(mesh);
	const size = box3.getSize(new THREE.Vector3());
	const delta = size.z / ( GCO.contoursLength - 1 );

	for (let i = 0; i < GCO.contoursLength; i++) {

		GCO.constant = i * delta + box3.min.z;

		if (GCO.constant - box3.min.z < 0.001) {
			GCO.constant += 0.01;
		} else if (GCO.constant - box3.max.z < 0.001) {
			GCO.constant -= 0.01;
		}

		meshPlane.position.z = GCO.constant;

		GCO.getPointsOfIntersection(); //add requestAnimationFrame

		// GCOdivMessage.innerHTML = `<p>${i} height: ${GCO.constant.toFixed(2)} points: ${
		// 	GCO.contourPoints.children[i].geometry.vertices.length
		// 	}</p>`;

		GCO.joinSegments();
	}

	GCOdivMessage.innerHTML = GCO.getMessage();

};




GCO.getContourSingle = function () {

	GCO.reset();

	GCO.constant = meshPlane.position.z;

	const box3 = new THREE.Box3().setFromObject(mesh);

	if (GCO.constant - box3.min.z < 0.001) {
		GCO.constant += 0.01;
	} else if (GCO.constant - box3.max.z < 0.001) {
		GCO.constant -= 0.01;
	}

	GCO.getPointsOfIntersection();

	GCO.joinSegments();

	GCOdivMessage.innerHTML = GCO.getMessage();

	GCO.contoursSegments.visible = false;
	mesh.visible = false;

};



GCO.joinSegments = function () {

	const segments = GCO.contourSegment.children;
	//console.log('segments', segments);

	GCO.segmentPairs = segments.map( seg => [ seg.geometry.vertices[0], seg.geometry.vertices[1] ] )
	//console.log('GCO.segmentPairs', GCO.segmentPairs);

	segmentStart = GCO.segmentPairs[0];

	GCO.polygons = [];
	GCO.polygon = [...segmentStart];
	//console.log('polygon', polygon);
	GCO.indexUsed = [0];

	GCO.findMatch(segmentStart);

}


GCO.findMatch = function (segment) {
	//console.log('segment', segment);

	let polygonLast = GCO.polygon[GCO.polygon.length - 1];

	let nextSegment;

	// const pairs0 = GCO.segmentPairs.filter(pair => { // finds current segment and two adjoining segments
	// 	const match1 = segment[0].equals( pair[0], GCO.tolerance );
	// 	const match2 = segment[0].equals( pair[1], GCO.tolerance );
	// 	const match3 = segment[1].equals( pair[0], GCO.tolerance );
	// 	const match4 = segment[1].equals( pair[1], GCO.tolerance );
	// 	return match1 || match2 || match3 || match4;
	// });

	const seg0 = segment[0];
	const seg1 = segment[1];

	const pairs0 = [];

	for (let i = 0; i < GCO.segmentPairs.length; i++) {

		const pair = GCO.segmentPairs[i]

		if (seg0.equals(pair[0], GCO.tolerance) ||
		seg0.equals(pair[1], GCO.tolerance) ||
		seg1.equals(pair[0], GCO.tolerance) ||
		seg1.equals(pair[1], GCO.tolerance) )
		{ pairs0.push(pair); }

	}
	//console.log('pairs0', pairs0);

	const segmentNext = pairs0.filter(pair => { // drop current segment - leaves two adjoining
		const match1 = segment[0].equals( pair[0], GCO.tolerance );
		const match4 = segment[1].equals( pair[1], GCO.tolerance );
		//console.log('p1', match1, match4);
		return ( match1 && match4 ) === false;
	})
	// //console.log('segmentsAdjoin', segmentsAdjoin);

	// const segmentsAdjoin = [];

	// for (let i = 0; i < pairs0.length; i++) {

	// 	pair = pairs0[i];

	// 	if ((seg0.equals(pair[0], GCO.tolerance) && seg1.equals(pair[1], GCO.tolerance)) === false ) {

	// 		segmentsAdjoin.push(pair);
	// 	}


	// }

	// const segmentNext = segmentsAdjoin.find(pair => {
	.find(pair => {

		const match1 = pair[0].equals( polygonLast, GCO.tolerance );
		const match2 = pair[1].equals( polygonLast, GCO.tolerance );

		//console.log('snext', match1, match2);
		return match1 || match2;

	});


	if (segmentNext) {

		//console.log('segmentNext', segmentNext );

		const index = GCO.segmentPairs.indexOf(segmentNext);

		if (!GCO.indexUsed.includes(index) ) {

			GCO.indexUsed.push(index);

		}

		const vertexNext = GCO.getVertexMatch( polygonLast, segmentNext[ 0 ] ) ? segmentNext[ 1 ] : segmentNext[ 0 ];

		GCO.polygon.push(vertexNext);

		const backToStart = GCO.getVertexMatch( vertexNext, GCO.polygon[ 0 ]);

		//xxx++;

		//if (xxx > 500 ) return;

		if (!backToStart) {

				//GCO.findMatch(segmentNext);

			nextSegment = segmentNext;

		} else {

			//console.log('polygon', GCO.polygon);

			const line = GCO.addLine( GCO.polygon );

			line.material = new THREE.LineBasicMaterial({color: 0xff00ff });

			GCO.contourLines.add(line);

			let indexNew = 0;

			for (let i = 0; i < GCO.segmentPairs.length; i++) {

				if (!GCO.indexUsed.includes(i)) {
					indexNew = i;
					break;
				}
			}

			//console.log('indexNew', indexNew);


			if (indexNew != 0 && GCO.indexUsed.length < GCO.segmentPairs.length ) {

				GCO.indexUsed.push(indexNew);

				segmentGo = GCO.segmentPairs[indexNew];

				GCO.polygons.push(GCO.polygon);

				GCO.polygon = [...segmentGo];

				nextSegment = segmentGo;

			}

		}

	}

	if (nextSegment) {

		GCO.findMatch(nextSegment);

	} else {

		return;
		
	}
}


GCO.getVertexMatch = function (vertex1, vertex2) {

	const tolerance = 0.001;

	const match =
	Math.abs(vertex1.x - vertex2.x) < tolerance &&
	Math.abs(vertex1.y - vertex2.y) < tolerance &&
	Math.abs(vertex1.z - vertex2.z) < tolerance ?
	true : false;

	//console.log('match', match);

	return match;

};



GCO.getPointsOfIntersection = function () {

	GCO.pointsOfIntersection = new THREE.Geometry();
	GCO.contourSegment = new THREE.Group();
	GCO.contoursSegments.add(GCO.contourSegment);

	const normal = new THREE.Vector3(0, 0, -1);

	const plane = new THREE.Plane(normal, GCO.constant);

	const a = new THREE.Vector3();
	const b = new THREE.Vector3();
	const c = new THREE.Vector3();

	const meshes = mesh.geometry ? [mesh] : mesh.children;

	let count;

	for (let child of meshes) {
		//console.log('child', child);

		child.geometry =
			child.geometry.type === "BufferGeometry"
				? new THREE.Geometry().fromBufferGeometry(child.geometry)
				: child.geometry;


		child.geometry.faces.forEach(function (face, idx) {

			child.localToWorld(a.copy(child.geometry.vertices[face.a]));
			child.localToWorld(b.copy(child.geometry.vertices[face.b]));
			child.localToWorld(c.copy(child.geometry.vertices[face.c]));

			const lineAB = new THREE.Line3(a, b);
			//console.log('lineAB', lineAB);
			const lineBC = new THREE.Line3(b, c);
			const lineCA = new THREE.Line3(c, a);

			GCO.vertices = [];

			GCO.setPointOfIntersection(lineAB, plane, idx);
			GCO.setPointOfIntersection(lineBC, plane, idx);
			GCO.setPointOfIntersection(lineCA, plane, idx);

			if (GCO.vertices.length) {
				//console.log('vertices', GCO.vertices.length);

				const segment = GCO.addLine(GCO.vertices);

				segment.geometry.computeBoundingSphere();
				radius = segment.geometry.boundingSphere.radius;
				if ( 2 * radius < GCO.tolerance) { GCO.smallSegments++ }

				GCO.contourSegment.add(segment);

			}

			GCO.countFaces++;

		} );
	}

	const pointsMaterial = new THREE.PointsMaterial({ size: 2, color: 0xffffff * Math.random() });
	const points = new THREE.Points(GCO.pointsOfIntersection, pointsMaterial);
	GCO.contourPoints.add(points);

	//console.log('GCO.contourPoints', GCO.contourPoints.children[ 0 ].geometry.vertices.length );

	//line = GCO.addLine( points.geometry.vertices )

	//scene.add( line )

};


// to be simplified

GCO.setPointOfIntersection = function(line, plane, index) {
	//console.log('plane', plane);

	const pointOfIntersection = plane.intersectLine(line, new THREE.Vector3());

	if (pointOfIntersection) {
		GCO.pointsOfIntersection.vertices.push(pointOfIntersection.clone());
		GCO.vertices.push(pointOfIntersection.clone());
	}


};



GCO.addLine = function (vertices) {

	// const v = function (x, y, z) { return new THREE.Vector3(x, y, z); };

	const geometry = new THREE.Geometry();
	geometry.vertices = vertices;
	const material = new THREE.LineBasicMaterial({color: 0x000000});
	const line = new THREE.Line(geometry, material);

	// v1 = vertices[0];
	// v2 = vertices[vertices.length - 1];

	// dir = v2.clone().sub(v1.clone()).normalize();
	// length = v1.distanceTo(v2);

	// const arrowHelper = new THREE.ArrowHelper( dir, v1, length, 0xffffff * Math.random() );
	// line.add(  arrowHelper );

	return line;

};
