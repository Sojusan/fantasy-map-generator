// Delaunay and Voronoi diagrams
let svg = d3.select("#svg");
let width = +svg.attr("width");
let height = +svg.attr("height");
let sites = d3.range(100).map(function () {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
  };
});
// Generate the delaunay triangulation of our data
// takes data, x accessor and y accessor as arguments
let delaunay = d3.Delaunay.from(
  sites,
  (d) => d.x,
  (d) => d.y
);
// Generate the voronoi diagram from our delaunay triangulation
// Takes the bounds of our diagram area as arguments [x0,y0,x1,y1]
let voronoi = delaunay.voronoi([0, 0, width, height]);

function circumcenters_coords() {
  let circumcenters = voronoi.circumcenters;
  let vertex_coords = [];
  for (let i = 0; i < circumcenters.length; i += 2) {
    vertex_coords.push({
      x: circumcenters[i],
      y: circumcenters[i + 1],
    });
  }
  return vertex_coords;
}

function voronoi_vertex() {
  let vertex_coords = [];
  for (let i = 0; i < sites.length; i++) {
    let polygon = voronoi.cellPolygon(i);
    polygon.forEach((item) => {
      let is_unique = true;
      for (let j = 0; j < vertex_coords.length; j++) {
        if (item[0] === vertex_coords[j].x && item[1] === vertex_coords[j].y) {
          is_unique = false;
          break;
        }
      }
      if (is_unique) {
        vertex_coords.push({
          x: item[0],
          y: item[1],
        });
      }
    });
  }
  return vertex_coords;
}

draw_all();

d3.select("#relax-button").on("click", relax);

// Adding relax function
function relax() {
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
  delaunay = d3.Delaunay.from(
    sites,
    (d) => d.x,
    (d) => d.y
  );
  voronoi = delaunay.voronoi([0, 0, width, height]);

  // draw updated diagrams
  draw_all();
}

function draw_all() {
  // clear svg data
  svg.selectAll("path").remove();
  svg.selectAll("circle").remove();

  // added voronoi edges
  svg
    .selectAll("path")
    // Construct a data object from each cell of our voronoi diagram
    .data(sites.map((_, i) => voronoi.renderCell(i)))
    .enter()
    .append("path")
    .attr("d", (d) => d)
    .style("fill", (_) => "grey")
    .style("opacity", 1)
    .style("stroke", "white")
    .style("stroke-opacity", 1);

  // added delaunay edges
  svg
    .selectAll("path")
    // Construct a data object from each cell of our voronoi diagram
    .enter()
    .data(circumcenters_coords().map((_, i) => delaunay.renderTriangle(i)))
    .enter()
    .append("path")
    .attr("d", (d) => d)
    .style("fill", (_) => "rgba(255, 255, 255, 0)")
    .style("opacity", 1)
    .style("stroke", "black")
    .style("stroke-opacity", 1);

  // added delaunay vertex
  svg
    .selectAll("circle")
    .data(sites)
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 3)
    .style("fill", "red");

  // added voronoi vertex
  svg
    .selectAll("circle")
    .enter()
    .data(voronoi_vertex())
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 3)
    .style("fill", "blue");
}
