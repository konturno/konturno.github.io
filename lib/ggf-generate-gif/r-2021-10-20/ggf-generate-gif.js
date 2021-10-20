const GGF = {};


GGF.init = function () {

	if ( window.prgGenerateGIF) {

	} else {

		GGFdet.innerHTML = `
<p>
	<button id="butGenerateGIF" onclick=GGF.onClick();>Generate GIF</button>
	<progress id="prgGenerateGIF" value="0" max="1" style="display:none"></progress>
	<div id=divMessage></div>
</p>`;

		canvas = document.body.appendChild( document.createElement( "canvas" ) );

		canvas.style.cssText = "position: absolute; right: 0; top: 0;";

	}

};




GGF.onClick = async function () {

	controls.autoRotate = false;
	controls.enabled = false;

	camera.aspect = 1;
	camera.updateProjectionMatrix();
	// document.body.appendChild( renderer.domElement );

	renderer.clear( 0x000000 );
	renderer.dispose();

	renderer = new THREE.WebGLRenderer( { canvas: canvas } );
	renderer.setPixelRatio( 1 );
	renderer.setClearColor( 0xffffff, 1 );
	renderer.setSize( 512,512 );

	renderer.outputEncoding = THREE.sRGBEncoding;
	//renderer.shadowMap.enabled = true;
	//renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	renderer = renderer;

	chkRotate.checked = false;
	obj.rotation.x = 0;
	obj.rotation.y = 0;

	GGF.distance = camera.position.distanceTo( scene.position );



	render = function ( progress ) {

		console.log( "progress", progress );
		// progress goes from 0 to 1

		center = scene.position;

		camera.position.x = center.x + Math.cos( progress * Math.PI * 2 ) * GGF.distance;
		camera.position.y = center.y + Math.sin( progress * Math.PI * 2 ) * GGF.distance;
		camera.position.z = center.z + Math.sin( progress * Math.PI * 1 ) * GGF.distance;

		camera.lookAt( center );

		//mesh.rotation.y = - progress * Math.PI * 2;

		renderer.render( scene, camera );

	}



	animation = function animation ( time ) {

		requestAnimationFrame( animate );

	}

	// Generate

	const duration = 8
	const fps = 30;
	const buffer = await GGF.generateGIF( canvas, render, duration, fps );

	// Download

	const blob = new Blob( [ buffer ], { type: 'image/gif' } );

	const link = document.createElement( "a" );
	link.href = URL.createObjectURL( blob );
	link.download = `animation-${ new Date().toISOString().slice( 0, 10 ) }.gif`;
	link.click();

};



GGF.generateGIF = function ( element, renderFunction, duration = 1, fps = 30 ) {

	const frames = duration * fps;

	const canvas = document.createElement( 'canvas' );
	canvas.width = element.width;
	canvas.height = element.height;

	const context = canvas.getContext( '2d' );

	const buffer = new Uint8Array( canvas.width * canvas.height * frames * 5 );
	const pixels = new Uint8Array( canvas.width * canvas.height );
	const writer = new GifWriter( buffer, canvas.width, canvas.height, { loop: 0 } );

	let current = 0;

	return new Promise( async function addFrame ( resolve ) {

		renderFunction( current / frames );

		context.drawImage( element, 0, 0 );

		const data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
		const palette = [];

		for ( var j = 0, k = 0, jl = data.length; j < jl; j += 4, k++ ) {

			const r = Math.floor( data[ j + 0 ] * 0.1 ) * 10;
			const g = Math.floor( data[ j + 1 ] * 0.1 ) * 10;
			const b = Math.floor( data[ j + 2 ] * 0.1 ) * 10;
			const color = r << 16 | g << 8 | b << 0;

			const index = palette.indexOf( color );

			if ( index === -1 ) {

				pixels[ k ] = palette.length;
				palette.push( color );

			} else {

				pixels[ k ] = index;

			}

		}

		// Force palette to be power of 2

		//console.log( "frame", current, palette.length );

		let powof2 = 1;
		while ( powof2 < palette.length ) powof2 <<= 1;
		palette.length = powof2;

		palette.length = palette.length > 256 ? 256 : palette.length;

		//console.log( "palette", palette );

		const delay = 100 / fps; // Delay in hundredths of a sec (100 = 1s)
		const options = { palette: new Uint32Array( palette ), delay: delay };
		writer.addFrame( 0, 0, canvas.width, canvas.height, pixels, options );

		current++;

		prgGenerateGIF.value = current / frames;

		if ( current < frames ) {

			await setTimeout( addFrame, 0, resolve );

		} else {

			resolve( buffer.subarray( 0, writer.end() ) );

		}

	} );

};


GGF.init();