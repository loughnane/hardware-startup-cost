var stringify = function (x) {
  if (typeof(x) === 'number' || x === undefined) {
    return String(x);
    // otherwise it won't work for:
    // NaN, Infinity, undefined
  } else {
    return JSON.stringify(x);
  }
};


var indexify = function(mat){
// converts a matrix into a sparse-like entries
// maybe 'expensive' for large matrices, but helps keeping code clean
    var res = [];
    for(var i = 0; i < mat.length; i++){
        for(var j = 0; j < mat[0].length; j++){
            res.push({i:i, j:j, val:mat[i][j]});
        }
    }
    return res;
};



window.onload=function(){


  var load_all = function(){
    //This function loads the data from CSV, configures it, and
    //then passes it to another funcftion for visualization creation
    d3.json("static/data.json", function(data){

      phases = data.phases;
      disciplines = data.disciplines;
      blocks = data.blocks;
      
      main(phases,disciplines,blocks)
    });
  };

  var main = function(phases,disciplines,blocks){

    //Set some sizing parameters
    var width = 1700;
    var height = 1000;
    var margin = 25;
    console.log(blocks)

    //breaking down data
    phase_keys = Object.keys(phases)
    phase_count = phase_keys.length

    discipline_keys = Object.keys(disciplines)
    discipline_count = discipline_keys.length



    var discipline_names = [];
    for (var p_key in disciplines) {
        if (disciplines.hasOwnProperty(p_key)) {
          discipline_names.push(disciplines[p_key]);
        };

      };
    //compute index per node
    var matrix = []
    discipline_names.forEach(function(phase,i){
      phase.index = i;
      phase.count = 0
      matrix[i] = d3.range(phase_count).map(function(j) { return {x:j,y:i,z:0};});
    });

    console.log(matrix)
    //setting scales
    var x = d3.scale.linear()
      .domain([0,phase_count])
      .range([0,width*0.9]);
    var y = d3.scale.linear()
      .domain([0,phase_count])
      .range([0,height*0.9]);


    //selections
    var body = d3.select('body');
    
    var svg = body.append('svg')
    .attr('width', width)
    .attr('height', height);

    //bindings

    var chris = body.append('chris')


 var row = svg.selectAll(".row")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "row")
      .attr("id",function(d,i){
        // console.log(disciplines)
        return discipline_keys[i]
      })
      .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; })
      .each(row);

function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row)
        .enter()
        .append("rect")
        .attr("class", "cell")    
        .attr("x", function(d,i) { 
          // console.log(d)
          return (x(d.x)); })
        .attr("width", x(0.8))
        .attr("height", y(0.9))
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

 function mouseover(p) {
    phase_array = blocks.filter(function(d){return d.phase===phase_keys[p.x]})
    cell = phase_array.filter(function(d){return d.discipline===discipline_keys[p.y]})[0]
    console.log(p)
    d3.selectAll(".cell")
    .classed("active", function(d, i) { 
      return d.x == p.x && d.y == p.y; })
    // .classed("inactive", function(d, i) { 
    //   return d.x !== p.x || d.y!== p.y; });
    
  }

  function mouseout() {
    d3.selectAll(".cell")
    .classed("active", false)
    .classed("inactive", false);
  }
  }    

  };
  
  load_all();  // not to start with nothing
};