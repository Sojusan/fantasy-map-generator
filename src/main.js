// on click buttons functions added
d3.select('#delaunay-voronoi-diagram-showcase-button').on('click', function () {showHide("#delaunay-voronoi-diagram-showcase-div")});
d3.select('#basic-island-generator-button').on('click', function () {showHide("#basic-island-generator-div")});

function showHide(elementId) {
  let x = d3.select(elementId);

  if (x.style('display') === 'none') {
    x.style('display', 'block');
  } else {
    x.style('display', 'none');
  }
};

// 1. Delaunay and Voronoi diagrams
let svg = d3.select('#delaunay-voronoi-diagram-showcase-svg');
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

function circumcenters_coords() {
  let circumcenters = voronoi.circumcenters;
  let vertex_coords = [];
  for (let i = 0; i < circumcenters.length; i += 2) {
    vertex_coords.push({
      x: circumcenters[i],
      y: circumcenters[i + 1]
    });
  };

  return vertex_coords;
};

function voronoi_vertex() {
  let vertex_coords = [];
  for (let i = 0; i < sites.length; i++) {

    let polygon = voronoi.cellPolygon(i);
    polygon.forEach((item) => {
      // console.log(item)
      let is_unique = true;
      for (let j = 0; j < vertex_coords.length; j++) {
        if (item[0] === vertex_coords[j].x && item[1] === vertex_coords[j].y) {
          is_unique = false;
          break;
        };
      };
      if (is_unique) {
        vertex_coords.push({
            x: item[0],
            y: item[1]
          });
      };
    });
  };

  return vertex_coords;
};

// console.log( sites[0] );
// console.log( d3.polygonCentroid(voronoi.cellPolygon(0)) );
// console.log( voronoi.cellPolygon(0) );
// console.log( voronoi );
// console.log( circumcenters_coords() );
// console.log( voronoi_vertex() );

draw_all();

d3.select('#relax-button').on('click', relax);


// Adding relax function
function relax() {
  // relaxation itself
  // iterator increment
  iteration.value = +iteration.value + 1;
  // adjust every point
  sites.forEach((item, index) => {
    // get the voronoi cell for point
    const cell = voronoi.cellPolygon(index);
    // get the coordinates of centroid of the cell
    const [new_x, new_y] = d3.polygonCentroid(cell);
    // set new point coordinates
    item.x = new_x;
    item.y = new_y;
  });

  // update delaunay and voronoi
  delaunay = d3.Delaunay.from( sites, d => d.x, d => d.y );
  voronoi = delaunay.voronoi([0, 0, width, height]);

  // draw updated diagrams
  draw_all();
}

function draw_all() {
  // clear svg data
  svg.selectAll('path').remove();
  svg.selectAll('circle').remove();

  // added voronoi edges
  svg.selectAll('path')
  // Construct a data object from each cell of our voronoi diagram
    .data( sites.map((_, i) => voronoi.renderCell(i)) )
    .enter()
    .append('path')
      .attr('d', d => d)
      .style('fill', (_) => 'grey')
      .style('opacity', 1)
      .style('stroke', 'white')
      .style('stroke-opacity', 1);

  // added delaunay edges
  svg.selectAll('path')
  // Construct a data object from each cell of our voronoi diagram
    .enter()
    .data( circumcenters_coords().map( (_, i) => delaunay.renderTriangle(i) ) )
    .enter()
    .append('path')
      .attr('d', d => d)
      .style('fill', (_) => 'rgba(255, 255, 255, 0)')
      .style('opacity', 1)
      .style('stroke', 'black')
      .style('stroke-opacity', 1);

  // added delaunay vertex
  svg.selectAll('circle')
    .data( sites )
    .enter()
    .append('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 3)
    .style('fill', 'red');

  // added voronoi vertex
  svg.selectAll('circle')
    .enter()
    .data( voronoi_vertex() )
    .enter()
    .append('circle')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 3)
    .style('fill', 'blue');
};




// 2. Basic island generator
d3.select('#basic-island-generator-generate-button').on('click', basicIslandGenerator);

function basicIslandGenerator() {
  d3.select('#basic-island-generator-div').select('.mapCells').remove();

  let svg = d3.select('#basic-island-generator-svg');
  let mapCells = svg.append('g').attr('class', 'mapCells')
    .on('click', clicked)
    .on("touchmove mousemove", moved);
  let width = +svg.attr('width');
  let height = +svg.attr('height');
  let sites = d3.range(basicIslandGeneratorSizeInput.valueAsNumber).map(function() {
    return {
      x: Math.random() * width,
      y: Math.random() * height
    };
  });
  let delaunay = d3.Delaunay.from( sites, d => d.x, d => d.y );
  let voronoi = delaunay.voronoi([0, 0, width, height]);
  let polygons = Array.from(voronoi.cellPolygons());
  let color = d3.scaleSequential(d3.interpolateSpectral);
  let queue = [];

  d3.select('#basic-island-generator-toggle-circles-button').on('click', toggleCircles);

  function toggleCircles() {
    if (mapCells.selectAll('.circle').style('opacity') == 0) {
      mapCells.selectAll('.circle').style('opacity', 1);
    } else {
      mapCells.selectAll('.circle').style('opacity', 0);
    }
  };

  for (let value of polygons) {
    value.height = 0;
    mapCells.append('path')
      .attr('d', 'M' + value.join('L') + 'Z')
      .attr('id', 'c' + value.index)
      .attr('class', 'mapCell')
      .attr('fill', color(1 - value.height));
  };

  function add(start, type) {
    // get options from inputs
    let height = basicIslandGeneratorHeightInput.valueAsNumber;
    let radius = basicIslandGeneratorRadiusInput.valueAsNumber;
    let sharpness = basicIslandGeneratorSharpnessInput.valueAsNumber;
    queue = []; // new queue
    polygons[start].height += height;
    polygons[start].used = 1;
    queue.push(start);

    for (let i = 0; i < queue.length && height > 0.01; i++) {
      if (type == 'island') {
        height = polygons[queue[i]].height * radius;
      } else {
        height *= radius;
      }

      for (let neighbor of voronoi.neighbors(queue[i])) {
        if (!polygons[neighbor].used) {
          // calculate the modifier
          let mod = Math.random() * sharpness + 1.1 - sharpness;

          // if sharpness is 0 modifier should be ignored (=1)
          if (sharpness == 0) {mod = 1;}

          polygons[neighbor].height += height * mod;

          // max height is 1
          if (polygons[neighbor].height > 1) {
            polygons[neighbor].height = 1;
          };

          polygons[neighbor].used = 1;
          queue.push(neighbor);
        };
      };
    };
    // re-color the polygons based on new heights
    for (let value of polygons) {
      mapCells.select('#c' + value.index).attr('fill', color(1 - value.height));
      value.used = undefined; // remove used attribute
    };
  };

  function clicked(e) {
    // draw circle based on options on mousemove
    let point = d3.pointer(e);
    let nearest = voronoi.delaunay.find(point[0], point[1]);
    mapCells.append("circle")
      .attr("r", 3)
      .attr("cx", point[0])
      .attr("cy", point[1])
      .attr("fill", color(1 - basicIslandGeneratorHeightInput.valueAsNumber))
      .attr('opacity', 0)
      .attr("class", "circle");

    if (mapCells.selectAll('.circle').size() == 1) {
      add(nearest, "island");
			// change options to defaults for hills
			basicIslandGeneratorHeightInput.value = 0.2;
      basicIslandGeneratorHeightOutput.value = 0.2;
      basicIslandGeneratorRadiusInput.value = 0.99;
      basicIslandGeneratorRadiusOutput.value = 0.99;
    } else {
      add(nearest, "hill");
      // let's make high random for hills
      let height = Math.random() * 0.4 + 0.1;
      basicIslandGeneratorHeightInput.value = height.toFixed(2);
      basicIslandGeneratorHeightOutput.value = height.toFixed(2);
    }
  };

  function moved(e) {
    // draw circle based on options on mousemove
    let point = d3.pointer(e);
    let nearest = voronoi.delaunay.find(point[0], point[1]);
    let radius = (basicIslandGeneratorRadiusInput.valueAsNumber - 0.94) * 500;
    d3.select('#basic-island-generator-cell').text(nearest);
    d3.select('#basic-island-generator-height').text(polygons[nearest].height.toFixed(2));
    svg.select('.radius').remove();
    svg.append('circle')
      .attr('r', radius)
      .attr('cx', point[0])
      .attr('cy', point[1])
      .attr('class', 'radius')
  };
};
