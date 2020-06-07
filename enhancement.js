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

var width = 1060,
    height = 950;

// Scale Changes as we Zoom
// Call the function d3.behavior.zoom to Add zoom
// Reference: https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f/e59ab9526e02ec7827aa7420b0f02f9bcf960c7d - Pan & Zoom Axes by Mike Bostock
var zoom = d3.zoom()   
    .scaleExtent([0.5, 32]) // Set boundary of how much to zoom in and out.
    .on("zoom", zoomed); // Event listener for mouse movement. 

//Define SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    //.attr("viewBox", "-100 -100 960 850")
    .call(zoom);

svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "black");

var g = svg.append("g")
    .attr("transform", "translate(" + 1000 + "," + (height / 2 + 25) + ")");

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

// Define Tooltip here
// Reference: Interactive Data Visualization for the Web Ch.10
var tooltip = d3.select("#tooltip");

var node, link, filteredNode, filteredLink, whiteLink; // eslint-disable-line

d3.csv("radial_food_data.csv").then(function(data){
    //console.log(stratify(data)
    //.sort(function(a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); }));
    // Sort the tree. 1. Less maximum height/depth, the lower the index. 2. Children are alphabetically sorted.
    var root = tree(stratify(data)
        .sort(function(a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); }));
	
    console.log(root);
    console.log(root.descendants().slice(1));
	
    link = g.selectAll(".link") // eslint-disable-line
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

    node = g.selectAll(".node")
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
		//console.log(d.ancestors());
		filteredNode = node.filter(function(e) {
			return d.ancestors().indexOf(e) > -1
		});
		//console.log(filteredNode);
		
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
		//console.log(filteredLink);
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
            .style("opacity", 0.8);
		
		if(d.children == null){ // only show tooltip on leaf nodes
            var name = d.id.substring(d.id.lastIndexOf(".")+1);
			var type;
			
			if(d.data.value == 1){
				type = "Dairy";
			}
			else if(d.data.value == 2){
				type = "Fruit";
			}
			else if(d.data.value == 3){
				type = "Meat";
			}
			else if(d.data.value == 4){
				type = "Nut";
			}
			else if(d.data.value == 5){
				type = "Seafood";
			}
			else{
				type = "Vegetable";
			}
			
			tooltip.style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY + 25) + "px")
                .select("#name")
                .text(name);

			tooltip.select("#type")
                .text(type);
			
			tooltip.append("img")
                .attr("src", "images/" + name + ".jpg");
			
			// Make tooltip visible.
            d3.select("#tooltip").classed("hidden", false);
			console.log(tooltip);
			
		}
	});

	node.on("mousemove", function() { // tooltip follow the mouse
        tooltip.style("left", (d3.event.pageX + 25) + "px")
            .style("top", (d3.event.pageY + 25) + "px");   
    });
	
	node.on("mouseout", function(d) {
		//filteredNode.select("circle").removel;
		filteredNode.selectAll("circle").attr("r", 2.5).style("fill", d.data.value == 0? "rgb(255,255,255)":color(d.data.value));
		filteredNode.selectAll("text").style("font-size", "10px").style("fill", d.data.value == 0? "rgb(255,255,255)":color(d.data.value));
		
		//console.log(whiteLink);
		whiteLink.remove();
		
		// Make tooltip invisible when mouse is off. 
        d3.select("#tooltip").classed("hidden", true);
		
		tooltip.select("img").remove();

	});
	
	// Reference: https://stackoverflow.com/questions/39688256/force-layout-zoom-resets-on-first-tick-of-dragging-or-zomming
	var transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(0.9);
	
	svg.call(zoom.transform, transform);
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

// Function that 
// Reference: https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f/e59ab9526e02ec7827aa7420b0f02f9bcf960c7d - Pan & Zoom Axes by Mike Bostock
function zoomed() {
	//console.log(d3.event.transform.x)
	// Change the circle size and position 
	//link.attr("transform", d3.event.transform);
	// Change the text size and position 
	//node.attr("transform", d3.event.transform);
	// Rescale the x and y axis 
	//g.attr("transform", "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")");
	g.attr("transform", d3.event.transform);


}

















