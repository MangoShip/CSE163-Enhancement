/* --------------------------------------------------------------------------------------------------
File: enhancement.js
Name: Mingun Cho 
CruzID: mcho23@ucsc.edu
StudentID: 1654724
Enhancement project of radial cluster layout
-----------------------------------------------------------------------------------------------------*/ 

/*eslint-env es6*/
/*eslint-env browser*/
/*eslint no-console: 0*/
/*global d3 */    

var width = 1260,
    height = 1150;

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g")
    .attr("transform", "translate(" + (width / 2 + 50) + "," + (height / 2 + 25) + ")");

// When reading data file, assign parent to each node. (Substring from index 0 to the last '.')
var stratify = d3.stratify()
    .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

    //console.log(stratify);

var tree = d3.cluster()
    .size([360, 390]) // Size of the layout
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; }); // make the children from same parent to stay closer. If not, make a bigger space.

    //console.log(tree);

var color = d3.scaleOrdinal()
    .range(["rgb(255, 247, 0)", 'rgb(255, 51, 0)', 'rgb(153, 102, 0)', 'rgb(255, 212, 128)', 'rgb(51, 204, 255)', 'rgb(0, 255, 0)']);

var filteredNode, filteredLink, whiteLink;

d3.csv("radial_food_data.csv").then(function(data){
    //console.log(stratify(data)
    //.sort(function(a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); }));
    // Sort the tree. 1. Less maximum height/depth, the lower the index. 2. Children are alphabetically sorted.
    var root = tree(stratify(data)
        .sort(function(a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); }));
	
    console.log(root);
    console.log(root.descendants().slice(1));
	
    var link = g.selectAll(".link") // eslint-disable-line
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", function(d) { // "M" = Move the pen to certain location. "C" = Draw a cubic curve.
            return "M" + project(d.x, d.y) // Initial x and y coordinates of the line. (Set pen's new current location)
                + "C" + project(d.x, (d.y + d.parent.y) / 2) // Control point at the beginning of the curve
                + " " + project(d.parent.x, (d.y + d.parent.y) / 2) // Control point at the end of the curve
                + " " + project(d.parent.x, d.parent.y); // Draw curve to here. (Endpoint)
        })
        .style("stroke", function(d) { return color(d.data.value)})
        .style("stroke-width", "1px")
        .style("opacity", 0.5);
	
	/*link.on("mouseover", function(d) {	
		var filteredLink = link.filter(function(e) {
			return d.ancestors().indexOf(e) > -1
		});
		filteredLink.selectAll("path").style("stroke", "white").style("stroke-width", "2px");
	});*/

    var node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); }) // Node is parent, "node--internal". Otherwise, "node--leaf" for css style.
        .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; }) // Place the nodes
	
    node.append("circle")
        .attr("r", 2.5) // Place circle for each node
        .style("fill", function(d) { return d.data.value == 0? "rgb(255,255,255)":color(d.data.value)});

	// Text for each node
    node.append("text")
        .attr("dy", ".31em")
        .attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
        // If parent, place on the right of the circle. Otherwise, place on the left of the circle.
        .style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; }) // Same as above, but with text-anchor.
        .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; }) // Rotate the texts 
        .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); }) // Get the text 
        .style("fill", function(d) { return d.data.value == 0? "rgb(255,255,255)":color(d.data.value)});
	
	// Reference: "https://bl.ocks.org/anonymous/bb5be85d509eb7824e95d193c4fb6d27/e87fb16f8058f85719647dde561bff12f998361a" Radial Tidy Tree by Gerardo Furtado
	node.on("mouseover", function(d) {	
		console.log(d.ancestors());
		filteredNode = node.filter(function(e) {
			return d.ancestors().indexOf(e) > -1
		});
		console.log(filteredNode);
		
		filteredNode.selectAll("circle")
			.style("fill", "white")
			.attr("r", 4);
		
		filteredNode.selectAll("text")
			.style("fill", "white")
			.style("font-size", "20px");
            /*.clone(true).lower() // black-out the line behind the text, making the text easier to read. 
			.attr("stroke", "black")
            .attr("stroke-width", "6px");*/
		
		filteredLink = d.ancestors();
		filteredLink.pop();
		console.log(filteredLink);
		whiteLink = g.selectAll(".whiteLink")
            .data(filteredLink)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", function(d) { // "M" = Move the pen to certain location. "C" = Draw a cubic curve.
                return "M" + project(d.x, d.y) // Initial x and y coordinates of the line. (Set pen's new current location)
                    + "C" + project(d.x, (d.y + d.parent.y) / 2) // Control point at the beginning of the curve
                    + " " + project(d.parent.x, (d.y + d.parent.y) / 2) // Control point at the end of the curve
                    + " " + project(d.parent.x, d.parent.y); // Draw curve to here. (Endpoint)
            })
            .style("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.5);
		
		//d3.selectAll(".link").style("stroke", "white").style("stroke-width", "2px");
	});
	
	node.on("mouseout", function(d) {
		//filteredNode.select("circle").removel;
		filteredNode.selectAll("circle").attr("r", 2.5).style("fill", d.data.value == 0? "rgb(255,255,255)":color(d.data.value));
		filteredNode.selectAll("text").style("font-size", "10px").style("fill", d.data.value == 0? "rgb(255,255,255)":color(d.data.value));
		
		console.log(whiteLink);
		whiteLink.style("stroke", function(d) { return color(d.data.value)}).style("stroke-width", "1px");
	});
});

// Function that creates a radial shape for the layout.
function project(x, y) { // Starting from the "display" (first in the array) move in clock-wise until the "vis" (last children of flare).
	// X coordinates of the nodes are 1-360. (Based on the cluster size) 
	// Nodes that have x values of 1-90 will be in the first quadrant.
	// Nodes that have x values of 91-180 will be in the fourth quadrant.
	// Nodes that have x values of 181-270 will be in the third quadrant.
	// Nodes that have x values of 271-360 will be in the second quadrant.
    var angle = (x - 90) / 180 * Math.PI, radius = y;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
}



















