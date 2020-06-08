/* --------------------------------------------------------------------------------------------------
File: enhancement.js
Name: Mingun Cho 
CruzID: mcho23@ucsc.edu
StudentID: 1654724
Enhancement project of radial cluster layout
Github Link: https://github.com/MangoShip/CSE163-Enhancement
Link to visulization: https://mangoship.github.io/CSE163-Enhancement/
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
    .call(zoom); // allowing the entire svg to be interactive with zoom feature.

// black background to make the colors more visible.
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

// Create a color scheme with specific rgb.
var color = d3.scaleOrdinal()
    .range(["rgb(255, 247, 0)", 'rgb(255, 51, 0)', 'rgb(153, 102, 0)', 'rgb(255, 212, 128)', 'rgb(51, 204, 255)', 'rgb(0, 255, 0)']);

// Define Tooltip here
// Reference: Interactive Data Visualization for the Web Ch.10
// Main canvas of tooltip
var tooltip = d3.select("#tooltip");

// Tooltip for images
var tooltip2 = d3.select("#tooltip2");

// Tooltip for nutrition facts
var tooltip3 = d3.select("#tooltip3");

// Drawing black lines inside the nutrition facts.
var line = d3.select("#line");
var line2 = d3.select("#line2");

// Declaring variables that will be used later.
var node, link, filteredNode, filteredLink, whiteLink; // eslint-disable-line

d3.csv("radial_food_data.csv").then(function(data){
    //console.log(stratify(data)
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
        .style("stroke", function(d) { return color(d.data.value)}) // style the line color with corresponding value
        .style("stroke-width", "1px")
        .style("opacity", 0.5);

    node = g.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); }) // Node is parent, "node--internal". Otherwise, "node--leaf" for css style.
        .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; }) // Place the nodes
	
    // Drawing circle for each node
	node.append("circle")
        .attr("r", 2.5) // Place circle for each node
        .style("fill", function(d) { return d.data.value == 0? "rgb(255,255,255)":color(d.data.value)}); // color the circles with corresponding value

	// Text for each node
    node.append("text")
        .attr("dy", ".31em")
        .attr("x", function(d) { return d.x < 180 === !d.children ? 6 : -6; })
        // If parent, place on the right of the circle. Otherwise, place on the left of the circle.
        .style("text-anchor", function(d) { return d.x < 180 === !d.children ? "start" : "end"; }) // Same as above, but with text-anchor.
        .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; }) // Rotate the texts 
        .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); }) // Get the text 
        .style("fill", function(d) { return d.data.value == 0? "rgb(255,255,255)":color(d.data.value)});
	
	// Apply mouse movement listener on the nodes.
	node.on("mouseover", function(d) {	
		//console.log(d.ancestors());
		// Reference: "https://bl.ocks.org/anonymous/bb5be85d509eb7824e95d193c4fb6d27/e87fb16f8058f85719647dde561bff12f998361a" Radial Tidy Tree by Gerardo Furtado
		// Get all the ancestor nodes of the selected node.
		filteredNode = node.filter(function(e) {
			return d.ancestors().indexOf(e) > -1
		});
		//console.log(filteredNode);
		
		// Highlight effect - Make the circle white and bigger.
		filteredNode.selectAll("circle")
			.style("fill", "white")
			.attr("r", 4);
		
		// Highlight effect - Make the labels white and bigger.
		filteredNode.selectAll("text")
			.style("fill", "white")
			.style("font-size", "20px");
		
		// Remove the root node.
		filteredLink = d.ancestors();
		filteredLink.pop();
		//console.log(filteredLink);
		
		// Highlight effect - Make the lines white and thicker.
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
			// Get the name
            var name = d.id.substring(d.id.lastIndexOf(".")+1);
			var type;
			
			// Get what type of food
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
			
			// Main canvas tooltip, position it based on the mouse's position.
			// Change the texts based on the selected node's name and type.
			tooltip.style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY + 25) + "px")
                .select("#name")
                .text(name);

			tooltip.select("#type")
                .text(type);
			
			// Image tooltip will be placed over the main tooltip.
			tooltip2.style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY + 80) + "px");
			
			tooltip2.append("img")
                .attr("src", "images/" + name + ".jpg");
			
			// Nutrition Fact tooltip will be placed over the main tooltip, under the image tooltip.
			tooltip3.style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY + 237) + "px");
			
            line.style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY + 276) + "px");
			
			line2.style("left", (d3.event.pageX + 25) + "px")
                .style("top", (d3.event.pageY + 323) + "px");
			
			console.log(d);
			// Change the nutrition values based on the data 
			tooltip3.select("#size").text(d.data.size); // just number
			tooltip3.select("#calories").text(d.data.calories); // just number
			tooltip3.select("#fat").text(" " + d.data.fat + "g"); // in g
			tooltip3.select("#cholesterol").text(" " + d.data.cholesterol + "mg"); // in mg
			tooltip3.select("#sodium").text(" " + d.data.sodium + "mg"); // in mg
			tooltip3.select("#carbohydrates").text(" " + d.data.carbohydrate + "g"); // in g
			tooltip3.select("#protein").text(" " + d.data.protein + "g"); // in g
			
			// Make tooltips and lines visible.
            d3.select("#tooltip").classed("hidden", false);
			d3.select("#tooltip2").classed("hidden", false);
			d3.select("#tooltip3").classed("hidden", false);
			d3.select("#line").classed("hidden", false);
			d3.select("#line2").classed("hidden", false);
			
			console.log(tooltip);
		}
	});

	node.on("mousemove", function() { // tooltip follow the mouse
        // Tooltips and lines follow the mouse 
		tooltip.style("left", (d3.event.pageX + 25) + "px")
            .style("top", (d3.event.pageY + 25) + "px");   
		
		tooltip2.style("left", (d3.event.pageX + 25) + "px")
            .style("top", (d3.event.pageY + 80) + "px");  
		
		tooltip3.style("left", (d3.event.pageX + 25) + "px")
            .style("top", (d3.event.pageY + 237) + "px");  
		
		line.style("left", (d3.event.pageX + 25) + "px")
            .style("top", (d3.event.pageY + 276) + "px");
		
		line2.style("left", (d3.event.pageX + 25) + "px")
            .style("top", (d3.event.pageY + 323) + "px");
    });
	
	node.on("mouseout", function(d) {
        // all the nodes come back to the original color and size
		filteredNode.selectAll("circle").attr("r", 2.5).style("fill", d.data.value == 0? "rgb(255,255,255)":color(d.data.value));
		filteredNode.selectAll("text").style("font-size", "10px").style("fill", d.data.value == 0? "rgb(255,255,255)":color(d.data.value));
		
		// delete the white link
		whiteLink.remove();
		
		// Make tooltips and lines invisible when mouse is off. 
        d3.select("#tooltip").classed("hidden", true);
		d3.select("#tooltip2").classed("hidden", true);
		d3.select("#tooltip3").classed("hidden", true);
		d3.select("#line").classed("hidden", true);
		d3.select("#line2").classed("hidden", true);
		
		// Remove picture 
		tooltip2.select("img").remove();

	});
	
	// Reference: https://stackoverflow.com/questions/39688256/force-layout-zoom-resets-on-first-tick-of-dragging-or-zomming
	// Initializing zoom point.
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

// Function that makes zoom feature visible to the user. 
// Reference: https://bl.ocks.org/mbostock/db6b4335bf1662b413e7968910104f0f/e59ab9526e02ec7827aa7420b0f02f9bcf960c7d - Pan & Zoom Axes by Mike Bostock
function zoomed() {
	// Change the size and position of all the elements in g
	g.attr("transform", d3.event.transform);
}

















