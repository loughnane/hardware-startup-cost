
window.onload=function(){


  var load_all = function(){

    d3.json("static/data.json", function(data){

      //pull data from json file
      phases = data.phases;
      disciplines = data.disciplines;
      blocks = data.blocks;
      
      //call main function
      main(phases,disciplines,blocks)
    });
  };

  var main = function(phases,disciplines,blocks){

    ////////////SLICE UP DATA////////////
    phase_keys = Object.keys(phases)
    phase_count = phase_keys.length

    discipline_keys = Object.keys(disciplines)
    discipline_count = discipline_keys.length


    //compute index per node
    var matrix = []
    discipline_keys.forEach(function(discipline,i){
      discipline.index = i;
      discipline.count = 0
      matrix[i] = d3.range(phase_count).map(function(j) { return {x:j,y:i,z:0};});
    });


    ////////////SIZING////////

    //overall parameters
    var width = 1200;
    var height = 500;
    var margin = 25;

    var cell_width = 0.7
    var cell_height = 0.9

    var matrix_offset_y = 0.5
    var matrix_offset_x = 1

    var general_clearance = 0.05
    var heading_size = 0.1

    var num_gates =3
    var gate_width = (1-cell_width-general_clearance*2)/num_gates

    //scales
    var x = d3.scale.linear()
      .domain([0,phase_count+matrix_offset_x])
      .range([0,width]);

    var y = d3.scale.linear()
      .domain([0,discipline_count+matrix_offset_y])
      .range([0,height-(num_gates+1)*x(gate_width)]);


    ///////////////SELECTIONS
    var body = d3.select('body');
    
    var svg = body.append('svg')
    .attr('width', width)
    .attr('height', height);

    // var chris = body.append('chris')


    //////////////BINDING
  var headings = svg.selectAll(".heading")
    .data(phase_keys)
    .enter()
    .append("g")
    .attr("class","heading")
    .attr("transform",function(d,i){
      return "translate(" + x(i+matrix_offset_x+general_clearance) + "," + y(matrix_offset_y-general_clearance)+")"})
    .append('text')
    .attr('font-size',x(heading_size))
    .text(function(d){return phases[d].title});

    //rows
    var row = svg.selectAll(".row")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "row")
      .attr("id",function(d,i){ return discipline_keys[i]})
      .attr("transform", function(d, i) { return "translate(0," + y(i+matrix_offset_y) + ")"; })
      .each(row);


    //for each row above, iterate through it's objects and draw rectangles
    function row(row) {

        //create and store the selection
        var cell = d3.select(this).selectAll(".cell")
            .data(row)
            .enter()
            .append("g")
            .attr("transform",function(d,i){return "translate(" + x(d.x+matrix_offset_x) +",0)"});

            //append the rectange to the selection
            cell.append("rect")
            .attr("class", "cell")    
            .attr("width", x(cell_width))
            .attr("height", y(cell_height))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

            //for each cell, run a new function
            cell.each(tasks)

      }

    //iterate through tasks for each cel
    function tasks(tasks){
      task_list= blocks.filter(function(d){
        return d.phase===phase_keys[tasks.x] && d.discipline===discipline_keys[tasks.y]})[0].tasks
      d3.select(this).selectAll(".text")
        .data(task_list)
        .enter()
        .append('text')
        .attr("x",x(0.05))
        .attr("y",function(d,i){return y(0.07)*i+y(0.1)})
        .attr("font-size",y(0.05))
        .text(function(d){return "- " + d});

    }
    //gates

    var gates = svg.selectAll(".gate")
      .data(phase_keys)
      .enter()
      .append("g")
      .attr("class","gate")
      .attr("transform",function(d,i){
        console.log(phases[d].gates,i)
        return "translate(" + x(i+matrix_offset_x) +",0)"})
      .each(gates)

    function gates(gates){
      gates_list = phases[gates].gates
      gate_count = gates_list.length
      console.log(gates_list)
      d3.select(this).selectAll("gate")
      .data(gates_list)
      .enter()
      .append("rect")
      .attr("class","gate")
      .attr("width",x(gate_width))
      .attr("height",function(d,i){
        
        return height-y(matrix_offset_y)-x((gate_count-i)*(gate_width+general_clearance));})
      .attr("x",function(d,i){return x(cell_width + general_clearance) + x(i*(gate_width+general_clearance))})
      .attr("y",y(matrix_offset_y));


    }

    //////////INTERACTIVITY

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

  };
  
  load_all();  // not to start with nothing
};