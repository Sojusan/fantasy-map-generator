// 2. Basic island generator
d3.select('#generate-button').on('click', basicIslandGenerator);

function basicIslandGenerator() {
  d3.select('.mapCells').remove();

  let svg = d3.select('#svg');
  let mapCells = svg.append('g').attr('class', 'mapCells')
    .on('click', clicked)
    .on("touchmove mousemove", moved);
  let width = +svg.attr('width');
  let height = +svg.attr('height');
  let sites = d3.range(sizeInput.valueAsNumber).map(function() {
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

  d3.select('#toggle-circles-button').on('click', toggleCircles);

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
    let height = heightInput.valueAsNumber;
    let radius = radiusInput.valueAsNumber;
    let sharpness = sharpnessInput.valueAsNumber;
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
      .attr("fill", color(1 - heightInput.valueAsNumber))
      .attr('opacity', 0)
      .attr("class", "circle");

    if (mapCells.selectAll('.circle').size() == 1) {
      add(nearest, "island");
        // change options to defaults for hills
        heightInput.value = 0.2;
      heightOutput.value = 0.2;
      radiusInput.value = 0.99;
      radiusOutput.value = 0.99;
    } else {
      add(nearest, "hill");
      // let's make high random for hills
      let height = Math.random() * 0.4 + 0.1;
      heightInput.value = height.toFixed(2);
      heightOutput.value = height.toFixed(2);
    }
  };

  function moved(e) {
    // draw circle based on options on mousemove
    let point = d3.pointer(e);
    let nearest = voronoi.delaunay.find(point[0], point[1]);
    let radius = (radiusInput.valueAsNumber - 0.94) * 500;
    d3.select('#cell').text(nearest);
    d3.select('#height').text(polygons[nearest].height.toFixed(2));
    svg.select('.radius').remove();
    svg.append('circle')
      .attr('r', radius)
      .attr('cx', point[0])
      .attr('cy', point[1])
      .attr('class', 'radius')
  };
};
