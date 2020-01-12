// copyright 2020 Theo Armour. MIT license.
// See pushme-pullyou.github.io/templates-013/threejs-hamburger/v-0-02/src/
// 2020-01-03
/* global THREE */
// jshint esversion: 6
// jshint loopfunc: true



const CVD = {};

CVD.url = "https://api.github.com/repos/dashdotdotdashdotdot/Lines/git/trees/master?recursive=1";
CVD.prefix = "https://rawcdn.githack.com/dashdotdotdashdotdot/Lines/master/";


CVD.init = function () {

	divBrowseModels.innerHTML += CVD.getMenu();

};




CVD.getMenu = function () {

	//const options =

	const htm = `
<details ontoggle=CVD.getFileNames(); >

	<summary>CSV dashdotdot files</summary>

	<p>A list of CSV files from <a href="https://github.com/dashdotdotdashdotdot/Lines" target="_blank">dashdotdotdashdotdot</a> on GitHub.</p>

	<select id=CVDselCsv onchange=CVD.setLocationHash(this.value) size=8 ></select>
<!--
	<p>
		<button onclick=getFilesObj(); >get files obj</button>
	</p>

	<p>
		Help for adding new files. See source code.
	</p>
-->

	<div id=CVDdivOnLoad ></div>

</details>
`;

	return htm;

};



CVD.getFileNames = function () {

	fetch( CVD.url )
		.then( response => response.json() )
		.then( json => {

			CVD.csvData = json.tree.filter( item => item.path.endsWith( ".csv" ) ).map( item => item.path );

			CVDselCsv.innerHTML = CVD.getOptions();

		} );

};


CVD.getOptions = function () {

	const options = CVD.csvData.map( ( item, index ) => `<option value=${ index }>${ item.split( "/" ).pop() }</option>` );

	CVDdivOnLoad.innerHTML = `<p>files found: ${ options.length }</p>`;

	return options;


};


CVD.setLocationHash = function ( index ) {

	location.hash = "url=" + CVD.prefix + CVD.csvData[ index ];

};


CVD.init();