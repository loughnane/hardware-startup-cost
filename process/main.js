
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
    var width = 1400;
    var height = 800;
    var margin = 25;

    //scales
    var x = d3.scale.linear()
      .domain([0,phase_count])
      .range([0,width*0.9]);

    var y = d3.scale.linear()
      .domain([0,phase_count])
      .range([0,height*0.9]);


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
    .attr("transform",function(d,i){return "translate(" + x(i*.9+1.3) + "," + y(0.5)+")"})
    .append('text')
    .text(function(d){return phases[d]})



    //map the rows to the top level objects in the array
    var row = svg.selectAll(".row")
      .data(matrix)
      .enter()
      .append("g")
      .attr("class", "row")
      .attr("id",function(d,i){ return discipline_keys[i]})
      .attr("transform", function(d, i) { return "translate(0," + y(i+0.6) + ")"; })
      .each(row);

    //for each row above, iterate through it's objects and draw rectangles
    function row(row) {

        //create and store the selection
        var cell = d3.select(this).selectAll(".cell")
            .data(row)
            .enter()
            .append("g")
            .attr("transform",function(d,i){return "translate(" + x(d.x*.9+1) +",0)"});

            //append the rectange to the selection
            cell.append("rect")
            .attr("class", "cell")    
            .attr("width", x(0.8))
            .attr("height", y(0.9))

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