// Dimensions of sunburst.
var width = 1000;
var height = 800;
var radius = Math.min(width, height) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
  w: 200, h: 30, s: 3, t: 10
};

// Mapping of step names to colors.

var colors = {
  "Empty": "#ffffff",
  "Wages": "#8da0cb",
  "COGS": "#e78ac3",
  "Fixed Costs": "#a6d854",
  "Selling Costs": "#66c2a5",
  "Prototyping Costs": "#fc8d62",
};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0; 

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

// Use d3.text and d3.csv.parseRows so that we do not need to have a header
// row, and can receive the csv as an array of arrays.
d3.text("costs.csv", function(text) {
  var csv = d3.csv.parseRows(text);
  var json = buildHierarchy(csv);
  // console.log(json);
  createVisualization(json);
});

// Main function to draw and set up the visualization, once we have the data.
function createVisualization(json) {
  console.log(json);
  // Basic setup of page elements.
  initializeBreadcrumbTrail();
  drawLegend();
  d3.select("#togglelegend").on("click", toggleLegend);

  // Bounding circle underneath the sunburst, to make it easier to detect
  // when the mouse leaves the parent g.
  vis.append("svg:circle")
      .attr("r", radius+50)
      .style("opacity", 0);

  // For efficiency, filter nodes to keep only those large enough to see.
  var nodes = partition.nodes(json)
      .filter(function(d) {
      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
      });

  var path = vis.data([json]).selectAll("path")
      .data(nodes)
      .enter().append("svg:path")
      .attr("display", function(d) { return d.depth ? null : "none"; })
      .attr("d", arc)
      .attr("fill-rule", "evenodd")
      .style("fill", function(d) { 
        if (d.name!="Empty"){
          while (d.parent){
            if (d.parent.name == "root"){break;}
            d = d.parent
          };
        }
        return colors[d.name]; })
      .style("opacity", function(d){
        return 1- (5-d.depth)*.1;
      })
      .on("mouseover", mouseover);

  // Add the mouseleave handler to the bounding circle.
  d3.select("#container").on("mouseleave", mouseleave);

  // Get total size of the tree = value of root node from partition.
  totalSize = path.node().__data__.value;
 };

// Fade all but the current sequence, and show it in the breadcrumb trail.
function mouseover(d) {
  if (d.name!="Empty"){
    console.log(d.description);

  var percentage = (100 * d.value / totalSize).toPrecision(3);
  var total = (d.value/1000).toPrecision(4);
  var totalString = "$" + total + "k"
  if (total < 1) {
    totalString = "< $1k";
  }

  d3.select("#total")
    .text(totalString);

  d3.select("#description")
    .text(d.description)
    .style("visibility", "");

  d3.select("#explanation")
      .style("visibility", "");

  if (d.name != "Empty"){
    d3.select("#node")
      .text(d.name)}
  // console.log(d.description)
  var ancestorArray = getAncestors(d);
  var descendantArray = getDescendants(d);

  updateBreadcrumbs(ancestorArray, totalString);

  // Fade all the segments.
  d3.selectAll("path")
      .style("opacity", 0.3);

  // Then highlight only those that are an ancestor of the current segment.
  vis.selectAll("path")
      .filter(function(node) {

                return (descendantArray.indexOf(node) >=0);
              })
      .style("opacity", 1);
}}

// Restore everything to full opacity when moving off the visualization.
function mouseleave(d) {
  if (d.name != "Empty"){

  // Hide the breadcrumb trail
  d3.select("#trail")
      .style("visibility", "hidden");
  d3.select("#description")
      .style("visibility", "hidden");

  // Deactivate all segments during transition.
  d3.selectAll("path").on("mouseover", null);

  // Transition each segment to full opacity and then reactivate it.
  d3.selectAll("path")
      .transition()
      .duration(500)
      // .style("opacity", 1)
      .style("opacity", function(d){
        return 1- (5-d.depth)*.1;
      })


      .each("end", function() {
              d3.select(this).on("mouseover", mouseover);
            });

  d3.select("#explanation")
      .style("visibility", "hidden");
}}

// Given a node in a partition layout, return an array of all of its ancestor
// nodes, highest first, but excluding the root.
function getAncestors(node) {
  var path = [];
  var current = node;
  while (current.parent) {
    if (current.name!="Empty"){
    path.unshift(current);}
    current = current.parent;
  }
  return path;
}


function getDescendants(root) {    
  var nodes = [], i = 0;

  function recurse(node) {
      if (node.children){ 
          node.size = node.children.reduce(function(p, v) { return p + recurse(v); }, 0);}
      if (!node.id){ 
          node.id = ++i;}
      nodes.push(node);
      return node.size;}

root.size = recurse(root);
return nodes;}


function initializeBreadcrumbTrail() {
  // Add the svg area.
  var trail = d3.select("#sequence").append("svg:svg")
      .attr("width", width)
      .attr("height", 50)
      .attr("id", "trail");
  // Add the label at the end, for the percentage.
  trail.append("svg:text")
    .attr("id", "endlabel")
    .style("fill", "#000");
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
  var points = [];
  points.push("0,0");
  points.push(b.w + ",0");
  points.push(b.w + b.t + "," + (b.h / 2));
  points.push(b.w + "," + b.h);
  points.push("0," + b.h);
  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
    points.push(b.t + "," + (b.h / 2));
  }
  return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray, totalString) {

  // Data join; key function combines name and depth (= position in sequence).
  var g = d3.select("#trail")
      .selectAll("g")
      .data(nodeArray, function(d) { return d.name + d.depth; });


  // Add breadcrumb and label for entering nodes.
  var entering = g.enter().append("svg:g");

  entering.append("svg:polygon")
      .attr("points", breadcrumbPoints)
      // .style("fill", function(d) { return colors[d.name]; });
      .style("fill", function(d) { 
        if (d.name!="Empty"){
          while (d.parent){
            if (d.parent.name == "root"){break;}
            d = d.parent
          };
        }
        return colors[d.name]; })

  entering.append("svg:text")
      .attr("x", (b.w + b.t) / 2)
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.name; });

  // Set position for entering and updating nodes.
  g.attr("transform", function(d, i) {
    return "translate(" + i * (b.w + b.s) + ", 0)";
  });

  // Remove exiting nodes.
  g.exit().remove();

  // Now move and update the percentage at the end.
  d3.select("#trail").select("#endlabel")
      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
      .attr("y", b.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(totalString);

  // Make the breadcrumb trail visible, if it's hidden.
  d3.select("#trail")
      .style("visibility", "");

}

function drawLegend() {

  // Dimensions of legend item: width, height, spacing, radius of rounded rect.
  var li = {
    w: 150, h: 30, s: 3, r: 3
  };

  var legend = d3.select("#legend").append("svg:svg")
      .attr("width", li.w)
      .attr("height", d3.keys(colors).length * (li.h + li.s));

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
      .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + i * (li.h + li.s) + ")";
           });

  g.append("svg:rect")
      .attr("rx", li.r)
      .attr("ry", li.r)
      .attr("width", li.w)
      .attr("height", li.h)
      .style("fill", function(d) { return d.value; });

  g.append("svg:text")
      .attr("x", li.w / 2)
      .attr("y", li.h / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.key; });
}

function toggleLegend() {
  var legend = d3.select("#legend");
  if (legend.style("visibility") == "hidden") {
    legend.style("visibility", "");
  } else {
    legend.style("visibility", "hidden");
  }
}

// Take a 2-column CSV and transform it into a hierarchical structure suitable
// for a partition layout. The first column is a sequence of step names, from
// root to leaf, separated by hyphens. The second column is a count of how 
// often that sequence occurred.
function buildHierarchy(csv) {
  var root = {"name": "root", "children": [],"description": "none"};
  for (var i = 0; i < csv.length; i++) {
    var sequence = csv[i][0];
    var size = +csv[i][1];
    var description = csv[i].slice(2)
    // console.log(typeof description)
    if (typeof description == "array"){
      description = description.slice(0).join(',');
    }
    // console.log(description);
    if (isNaN(size)) { // e.g. if this is a header row
      continue;
    }
    var parts = sequence.split("-");
    // console.log(parts.length);
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) {
      var children = currentNode["children"];
      // console.log(children)
      var nodeName = parts[j];
      // console.log(nodeName);
      var childNode;
      // console.log(j+1,parts.length)
      if (j + 1 < parts.length) {
   // Not yet at the end of the sequence; move down the tree.
 	    var foundChild = false;
     	for (var k = 0; k < children.length; k++) {
     	  if (children[k]["name"] == nodeName) {
     	    childNode = children[k];
     	    foundChild = true;
     	    break;
 	      }  
 	    }
  // If we don't already have a child node for this branch, create it.
     	if (!foundChild) {
        // console.log(nodeName,size,description)
     	  childNode = {"name": nodeName, "children": [],"description":description};
     	  children.push(childNode);
     	}
     	currentNode = childNode;
          } else {
     	// Reached the end of the sequence; create a leaf node.
      // console.log(nodeName,size,description)
     	childNode = {"name": nodeName, "size": size,"description":description};
     	children.push(childNode);
      }
    }
  }
  return root;
};