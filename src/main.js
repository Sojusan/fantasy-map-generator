// import {Delaunay} from "d3-delaunay";

// var svg = d3.selectAll("svg").filter(function (d, i) { return i === 0}),
//     width = +svg.attr("width"),
//     height = +svg.attr("height"),
//     sites = d3.range(1000).map(function(d) {
//       return [Math.random() * width, Math.random() * height];}),
//     voronoi = d3.voronoi().extent([[0, 0],[width, height]]),
//     diagram = voronoi(sites),
//     polygons = diagram.polygons(),
//     color = d3.scaleSequential(d3.interpolateSpectral);
// polygons.map(function(i, d) {
//   svg.append("path").attr("d", "M" + i.join("L") + "Z").attr("fill", color(d/1000));
// });

// function relax() {
//   // relaxation itself
//   iteration.value = +iteration.value + 1;
//   svg.selectAll("path").remove();
//   sites = voronoi(sites).polygons().map(d3.polygonCentroid);
//   diagram = voronoi(sites);
//   polygons = diagram.polygons();

//   // push neighbors indexes to each polygons element
//   polygons.map(function(i, d) {
//     i.index = d; // index of this element
//     var neighbors = [];
//     diagram.cells[d].halfedges.forEach(function(e) {
//       var edge = diagram.edges[e], ea;
//       if (edge.left && edge.right) {
//         ea = edge.left.index;
//         if (ea === d) {
//           ea = edge.right.index;
//         }
//         neighbors.push(ea);
//       }
//     })
//     i.neighbors = neighbors;
//     svg.append("path").attr("d", "M" + i.join("L") + "Z").attr("fill", color(d/1000));
//   });
//   // show 1st array element in console
//   console.log(polygons[10]);
// }

// console.table(diagram.polygons()[0]);
// console.table(diagram.cells[0]);
// console.table(diagram.edges[diagram.cells[0].halfedges[0]]);

// generate();

// function generate() {
// 	d3.select(".mapCells").remove();
//   var svg = d3.selectAll("svg").filter(function (d, i) { return i === 1}),
//       mapCells = svg.append("g").attr("class", "mapCells")
//         .on("touchmove mousemove", (event) => {
//           // draw circle based on options on mousemove
//           var point = d3.pointer(event),
//           nearest = diagram.find(point[0], point[1]).index,
//           radius = (radiusInput.valueAsNumber)*50;
//           console.log(point);
//           $("#cell").text(nearest);
//           $("#high").text((polygons[nearest].high).toFixed(2));
//           svg.select(".radius").remove();
//           svg.append("circle")
//             .attr("r", radius)
//             .attr("cx", point[0])
//             .attr("cy", point[1])
//             .attr("class", "radius");
//         })
//         .on("click", clicked),
//       width = +svg.attr("width"),
//       height = +svg.attr("height"),
//       sites = d3.range(sizeInput.valueAsNumber).map(function(d) {
//         return [Math.random() * width,
//           Math.random() * height];}),
//       voronoi = d3.voronoi().extent([[0, 0],[width, height]]),
//       sites = voronoi(sites).polygons().map(d3.polygonCentroid),
//       diagram = voronoi(sites),
//       polygons = diagram.polygons(),
//       color = d3.scaleSequential(d3.interpolateSpectral),
//       queue = [];

//   detectNeighbors();

//   function detectNeighbors() {
//     // push neighbors indexes to each polygons element
//     polygons.map(function(i, d) {
//       i.index = d; // index of this element
//       i.high = 0;
//       var neighbors = [];
//       diagram.cells[d].halfedges.forEach(function(e) {
//         var edge = diagram.edges[e], ea;
//         if (edge.left && edge.right) {
//           ea = edge.left.index;
//           if (ea === d) {
//             ea = edge.right.index;
//           }
//           neighbors.push(ea);
//         }
//       })
//       i.neighbors = neighbors;
//       mapCells.append("path")
//         .attr("d", "M" + i.join("L") + "Z")
//         .attr("id", d)
//         .attr("class", "mapCell")
//         .attr("fill", color(1-i.high));
//     });
//   }

//   function add(start, type) {
//     // get options
//     var high = highInput.valueAsNumber,
//         radius = radiusInput.valueAsNumber,
//         sharpness = sharpnessInput.valueAsNumber,
//         queue = []; // new queue
//     polygons[start].high += high;
//     polygons[start].used = 1;
//     queue.push(start);
//     for (i = 0; i < queue.length && high > 0.01; i++) {
//       if (type == "island") {
//       	 high = polygons[queue[i]].high * radius;
//       } else {
//       	high = high * radius;
//       }
//       polygons[queue[i]].neighbors.forEach(function(e) {
//         if (!polygons[e].used) {
//           var mod = Math.random() * sharpness + 1.1-sharpness;
//           if (sharpness == 0) {mod = 1;}
//           polygons[e].high += high * mod;
//           if (polygons[e].high > 1) {polygons[e].high = 1;}
//           polygons[e].used = 1;
//           queue.push(e);
//         }
//       });
//     }
//     // re-color the polygons based on new highs
//     polygons.map(function(i) {
//       $("#" + i.index).attr("fill", color(1-i.high));
//       i.used = undefined; // remove used attribute
//     });
//   }

// 	function clicked(e) {
//     // draw circle based on options on mousemove
//     var point = d3.pointer(this),
//         nearest = diagram.find(point[0], point[1]).index;
// 		mapCells.append("circle")
//       .attr("r", 3)
//       .attr("cx", point[0])
//       .attr("cy", point[1])
//       .attr("fill", color(1 - highInput.valueAsNumber))
//       .attr("class", "circle");
//     if ($(".circle").length == 1) {
// 			add(nearest, "island");
// 			// change options to defaults for hills
// 			highInput.value = 0.2;
//       highOutput.value = 0.2;
//       radiusInput.value = 0.99;
//       radiusOutput.value = 0.99;
//     } else {
//     	add(nearest, "hill");
//       // let's make high random for hills
//       var height = Math.random() * 0.4 + 0.1;
//       highInput.value = height;
//       highInput.value = height;
//     }
//   }
// }











// var svg = d3.select("svg"),
//   width = +svg.attr("width"),
//   height = +svg.attr("height"),
//   sites = d3.range(1000).map(function(d) {
//     return [Math.random() * width, Math.random() * height];
//   }),
//   voronoi = d3.voronoi().extent([[0, 0],[width, height]]),
//   diagram = voronoi(sites), polygons = diagram.polygons(),
//   // Add spectral color range[0,1] using d3-scale-chromatic
//  color = d3.scaleSequential(d3.interpolateSpectral);



// // Draw the colored polygons
// polygons.map(function(i, d) {
//   svg.append("path")
// .attr("d", "M" + i.join("L") + "Z")
// .attr("fill", color(d/1000));
// });


// console.log(polygons);
// Adding relax function
// function relax() {
//   // relaxation itself
//   iteration.value = +iteration.value + 1;
//   svg.selectAll("path").remove();
//   sites = voronoi(sites).polygons().map(d3.polygonCentroid);
//   diagram = voronoi(sites);
//   polygons = diagram.polygons();

//   // push neighbors indexes to each polygons element
//   polygons.map(function(i, d) {
//     i.index = d; // index of this element
//     var neighbors = [];
//     diagram.cells[d].halfedges.forEach(function(e) {
//       var edge = diagram.edges[e], ea;
//       if (edge.left && edge.right) {
//         ea = edge.left.index;
//         if (ea === d) {
//           ea = edge.right.index;
//         }
//         neighbors.push(ea);
//       }
//   })
//   i.neighbors = neighbors;
//   svg.append("path")
//     .attr("d", "M" + i.join("L") + "Z")
//     .attr("fill", color(d/1000));
//   });
//   // show 1st array element in console
//   console.log(polygons[0]);
// }






let svg = d3.select('svg');
let width = +svg.attr('width');
let height = +svg.attr('height');
let sites = d3.range(1000).map(function() {
    return {
      x: Math.random() * width,
      y: Math.random() * height
    };
  });
// Generate the delaunay triangulation of our data
// takes data, x accessor and y accessor as arguments
let delaunay = d3.Delaunay.from( sites, d => d.x, d => d.y );
// Generate the voronoi diagram from our delaunay triangulation
// Takes the bounds of our diagram area as arguments [x0,y0,x1,y1]
let voronoi = delaunay.voronoi([0, 0, width, height]);

function voronoi_vertex(circumcenters) {
  let vertex_coords = [];
  for (let i = 0; i < circumcenters.length; i += 2) {
    vertex_coords.push({
      x: circumcenters[i],
      y: circumcenters[i + 1]
    });
  };

  return vertex_coords;
};

svg.selectAll('path')
  // Construct a data object from each cell of our voronoi diagram
  .data( sites.map((_, i) => voronoi.renderCell(i)) )
  .enter()
  .append('path')
        .attr('d', d => d)
        .style('fill', (_,i) => 'grey')
        .style('opacity', 1)
        .style('stroke', 'white')
        .style('stroke-opacity', 1);

svg.selectAll('path')
  // Construct a data object from each cell of our voronoi diagram
  .enter()
  .data( voronoi_vertex(voronoi.circumcenters).map( (_, i) => delaunay.renderTriangle(i) ) )
  .enter()
  .append('path')
        .attr('d', d => d)
        .style('fill', (_,i) => 'rgba(255, 255, 255, 0)')
        .style('opacity', 1)
        .style('stroke', 'black')
        .style('stroke-opacity', 1);

console.log( sites[1] );
console.log( d3.polygonCentroid(voronoi.cellPolygon(1)) );
console.log(voronoi)
// console.log( sites );
// console.log( voronoi.renderCell(1) );
// console.log( voronoi.circumcenters );
// console.log( voronoi_vertex(voronoi.circumcenters) )
// console.log( voronoi.cellPolygon(1) );
// console.log( delaunay.triangles );


svg.selectAll('circle')
  .data( sites )
  .enter()
  .append('circle')
  .attr('cx', d => d.x)
  .attr('cy', d => d.y)
  .attr('r', 3)
  .style('fill', 'red');

svg.selectAll('circle')
  .enter()
  .data( voronoi_vertex(voronoi.circumcenters) )
  .enter()
  .append('circle')
  .attr('cx', d => d.x)
  .attr('cy', d => d.y)
  .attr('r', 3)
  .style('fill', 'blue');


d3.select('#relax-button').on('click', relax);


// Adding relax function
function relax() {
  // relaxation itself
  iteration.value = +iteration.value + 1;
  // sites = voronoi(sites).polygons().map(d3.polygonCentroid);
  // for (let i = 0; i < sites.length; i++) {
  //   const cell = voronoi.cellPolygon(i)
  //   const
  // };
  sites.forEach((item, index) => {
    const cell = voronoi.cellPolygon(index);
    const [new_x, new_y] = d3.polygonCentroid(cell);
    item.x = new_x;
    item.y = new_y;
    // console.log(item, new_x, new_y);
    // console.log(cell);
  });

  console.log(sites[1]);

  // delaunay = delaunay.update();
  // voronoi.update();
  delaunay = d3.Delaunay.from( sites, d => d.x, d => d.y );
  voronoi = delaunay.voronoi([0, 0, width, height]);
  // console.log(voronoi)
  draw_all();
}

function draw_all() {
  svg.selectAll('path').remove();
  svg.selectAll('circle').remove();

  svg.selectAll('path')
  // Construct a data object from each cell of our voronoi diagram
    .data( sites.map((_, i) => voronoi.renderCell(i)) )
    .enter()
    .append('path')
      .attr('d', d => d)
      .style('fill', (_,i) => 'grey')
      .style('opacity', 1)
      .style('stroke', 'white')
      .style('stroke-opacity', 1);

  svg.selectAll('path')
  // Construct a data object from each cell of our voronoi diagram
    .enter()
    .data( voronoi_vertex(voronoi.circumcenters).map( (_, i) => delaunay.renderTriangle(i) ) )
    .enter()
    .append('path')
      .attr('d', d => d)
      .style('fill', (_,i) => 'rgba(255, 255, 255, 0)')
      .style('opacity', 1)
      .style('stroke', 'black')
      .style('stroke-opacity', 1);

  svg.selectAll('circle')
    .data( sites )
    .enter()
    .append('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 3)
    .style('fill', 'red');

  svg.selectAll('circle')
    .enter()
    .data( voronoi_vertex(voronoi.circumcenters) )
    .enter()
    .append('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 3)
    .style('fill', 'blue');
};
