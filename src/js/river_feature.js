document.getElementById("lock_button").addEventListener("click", function() {
  if (this.getAttribute("status") == 0) {
    this.setAttribute("status", 1);
    d3.select(".cursor").attr("opacity", 0);
  } else {
    this.setAttribute("status", 0);
    d3.select(".cursor").attr("opacity", 1);
  };
});

document.getElementById("clear_button").addEventListener("click", function() {
  undraw();
  generate();
});

document.getElementById("random_map_button").addEventListener("click", function() {
  undraw();
  generate(11);
});

// Add general elements
let svg = d3.select("svg");
let mapWidth = +svg.attr("width");
let mapHeight = +svg.attr("height");
let defs = svg.select("defs");
let viewbox = svg.append("g").attr("class", "viewbox").on("touchmove mousemove", moved);
let islandBack = viewbox.append("g").attr("class", "islandBack");
let mapCells = viewbox.append("g").attr("class", "mapCells");
let hatching = viewbox.append("g").attr("class", "hatching");
let riversShade = viewbox.append("g").attr("class", "riversShade");
let rivers = viewbox.append("g").attr("class", "rivers");
let oceanLayer = viewbox.append("g").attr("class", "oceanLayer");
let circles = viewbox.append("g").attr("class", "circles");
let coastline = viewbox.append("g").attr("class", "coastline");
let shallow = viewbox.append("g").attr("class", "shallow");
let lakecoast = viewbox.append("g").attr("class", "lakecoast");
let grid = viewbox.append("g").attr("class", "grid");
let cursor = viewbox.append("g").append("circle").attr("r", 1).attr("class", "cursor");
let land = undefined;
let riversData = [];

// Poisson-disc sampling from https://bl.ocks.org/mbostock/99049112373e12709381
let sampler = poissonDiscSampler(mapWidth, mapHeight, sizeInput.valueAsNumber);
let samples = [];
let sample;
while (sample = sampler()) {
  samples.push(sample);
};

// Voronoi D3
let delaunay = d3.Delaunay.from( samples, sample => sample[0], sample => sample[1] );
let voronoi = delaunay.voronoi( [ 0, 0, mapWidth, mapHeight ] );
let polygons = Array.from( voronoi.cellPolygons() );
// Colors D3 interpolation
let mapColor = d3.scaleSequential( d3.interpolateSpectral );
let fluxColor = d3.scaleSequential( d3.interpolateBlues );
// Queue array
let queue = [];

// Add D3 drag and zoom behavior
let zoom = d3.zoom()
  .scaleExtent( [1, 40] )
  .translateExtent([
    [-100, -100],
    [mapWidth + 100, mapHeight + 100]
  ])
  .on("zoom", zoomed);

svg.call(zoom);
svg.transition().duration(2000).call(zoom.transform, d3.zoomIdentity);

function zoomed(event) {
  viewbox.attr("transform", event.transform);
};

$("#resetZoom").click(() => {
  svg.transition().duration(1000).call(zoom.transform, d3.zoomIdentity);
});

// Array to use as names
let adjectives = [
    "Ablaze", "Ablazing", "Accented", "Ashen", "Ashy", "Beaming", "Bi-Color", "Blazing", "Bleached", "Bleak",
    "Blended", "Blotchy", "Bold", "Brash", "Bright", "Brilliant", "Burnt", "Checkered", "Chromatic", "Classic",
    "Clean", "Colored", "Colorful", "Colorless", "Complementing", "Contrasting", "Cool", "Coordinating", "Crisp",
    "Dappled", "Dark", "Dayglo", "Deep", "Delicate", "Digital", "Dim", "Dirty", "Discolored", "Dotted", "Drab",
    "Dreary", "Dull", "Dusty", "Earth", "Electric", "Eye-Catching", "Faded", "Faint", "Festive", "Fiery", "Flashy",
    "Flattering", "Flecked", "Florescent", "Frosty", "Full-Toned", "Glistening", "Glittering", "Glowing", "Harsh",
    "Hazy", "Hot", "Hued", "Icy", "Illuminated", "Incandescent", "Intense", "Interwoven", "Iridescent", "Kaleidoscopic",
    "Lambent", "Light", "Loud", "Luminous", "Lusterless", "Lustrous", "Majestic", "Marbled", "Matte", "Medium", "Mellow",
    "Milky", "Mingled", "Mixed", "Monochromatic", "Motley", "Mottled", "Muddy", "Multicolored", "Multihued", "Murky",
    "Natural", "Neutral", "Opalescent", "Opaque", "Pale", "Pastel", "Patchwork", "Patchy", "Patterned", "Perfect",
    "Picturesque", "Plain", "Primary", "Prismatic", "Psychedelic", "Pure", "Radiant", "Reflective", "Rich", "Royal",
    "Ruddy", "Rustic", "Satiny", "Saturated", "Secondary", "Shaded", "Sheer", "Shining", "Shiny", "Shocking", "Showy",
    "Smoky", "Soft", "Solid", "Somber", "Soothing", "Sooty", "Sparkling", "Speckled", "Stained", "Streaked", "Streaky",
    "Striking", "Strong Neutral", "Subtle", "Sunny", "Swirling", "Tinged", "Tinted", "Tonal", "Toned", "Translucent",
    "Transparent", "Two-Tone", "Undiluted", "Uneven", "Uniform", "Vibrant", "Vivid", "Wan", "Warm", "Washed-Out", "Waxen", "Wild"
];

// Set initial values for polygons
polygons.forEach((polygon, index) => {
  // polygon.index = index;
  polygon.point = {x: delaunay.points[index * 2], y: delaunay.points[index * 2 + 1]};
  polygon.height = 0;
  polygon.flux = 0.02;
  polygon.precipitation = 0.02;
});

// Add a blob on mouse click
svg.on("click", event => {
  // Draw a circle in center in clicked point
  let point = d3.pointer(event);
  let nearest = delaunay.find(point[0], point[1]);
  circles.append("circle")
    .attr("r", 3)
    .attr("cx", point[0])
    .attr("cy", point[1])
    .attr("fill", mapColor(1 - heightInput.valueAsNumber))
    .attr("class", "circle");
  if ($(".circle").length == 1) {
    add(nearest, "island");
    // Change options to defaults for hills
    heightInput.value = 0.2;
    heightOutput.value = 0.2;
    radiusInput.value = 0.99;
    radiusOutput.value = 0.99;
  } else {
    add(nearest, "hill");
    // Let's make height random for hills
    let height = (Math.random() * 0.4 + 0.1).toFixed(2);
    heightInput.value = height;
    heightOutput.value = height;
  };
  // Process with calculations
  viewbox.selectAll("path").remove();
  viewbox.selectAll("rect").remove();
  markFeatures();
  drawCoastline();
  drawMapBase();
});

// General function
function generate(count) {
  if (count != undefined) {
    randomMap(count);
  };


};

// Add new terrain blob
function add(start, type) {
  // get options from inputs
  let height = heightInput.valueAsNumber;
  let radius = radiusInput.valueAsNumber;
  let sharpness = sharpnessInput.valueAsNumber;
  let queue = [];  // polygons to check
  let used = [];  // used polygons

  // console.log("start: ", start);
  // console.log("type: ", type);

  polygons[start].height += height;
  polygons[start].featureType = undefined;
  queue.push(start);
  used.push(start);

  for (let i = 0; i < queue.length && height > 0.01; i++) {
    if (type == 'island') {
      height = polygons[queue[i]].height * radius;
    } else {
      height *= radius;
    }

    for (let neighbor of voronoi.neighbors(queue[i])) {
      if (used.indexOf(neighbor) < 0) {
        // calculate the modifier
        let mod = Math.random() * sharpness + 1.1 - sharpness;
        // if sharpness is 0 modifier should be ignored (=1)
        if (sharpness == 0) {
          mod = 1;
        }
        polygons[neighbor].height += height * mod;
        // max height is 1
        if (polygons[neighbor].height > 1) {
          polygons[neighbor].height = 1;
        };
        polygons[neighbor].featureType = undefined;
        queue.push(neighbor);
        used.push(neighbor);
      };
    };
  };
};

// Draw the map base shape
function drawMapBase() {
  console.time("drawMapBase");
  // Remove map base elements to redraw
  mapCells.selectAll("path").remove();
  shallow.selectAll("path").remove();
  hatching.selectAll("path").remove();
  // Set background color for islands
  if (mapStyle.value === "flat") {
      d3.selectAll(".islandBack").attr("fill", "#f9f9eb");
  } else {
      d3.selectAll(".islandBack").attr("fill", mapColor(0.78));
  };
  // "polygonal" map style
  if (mapStyle.value === "polygonal") {
      polygons.map(polygon => {
        mapCells.append("path")
          .attr("d", "M" + polygon.join("L") + "Z")
          .attr("fill", mapColor(1 - polygon.height))
          .attr("shape-rendering", "optimizeSpeed");
        mapCells.append("path")
          .attr("d", "M" + polygon.join("L") + "Z")
          .attr("fill", "none")
          .attr("stroke", mapColor(1 - polygon.height));
      });
  };
  // Hatching for shallow water
  polygons.map(polygon => {
    if (polygon.type === "shallow") {
      shallow.append("path")
        .attr("d", "M" + polygon.join("L") + "Z");
    };
  });
  console.timeEnd("drawMapBase");
};


// Mark GeoFeatures (ocean, lakes, isles)
function markFeatures() {
  console.time("markFeatures");
  let queue = [];  // Polygons to check
  let used = [];  // Checked polygons
  // Define ocean cells
  let start = delaunay.find(0, 0);
  queue.push(start);
  used.push(start);
  let type = "Ocean";
  let name = undefined;
  if (polygons[start].featureType) {
    name = polygons[start].featureName;
  } else {
    name = adjectives[Math.floor(Math.random() * adjectives.length)];
  };
  polygons[start].featureType = type;
  polygons[start].featureName = name;
  while (queue.length > 0) {
    let polygon_to_mark_neighbors = queue.shift();
    for (let neighbor of voronoi.neighbors(polygon_to_mark_neighbors)) {
      if (used.indexOf(neighbor) < 0 && polygons[neighbor].height < 0.2) {
        polygons[neighbor].featureType = type;
        polygons[neighbor].featureName = name;
        queue.push(neighbor);
        used.push(neighbor);
      };
    };
  };
  // Define islands and lakes
  let island = 0;
  let lake = 0;
  let number = 0;
  let greater = 0;
  let less = 0;
  let unmarked = polygons.filter(polygon => !polygon.featureType);
  while (unmarked.length > 0) {
    if (unmarked[0].height >= 0.2) {
      type = "Island";
      number = island;
      island += 1;
      greater = 0.2;
      less = 100;  // just to omit exclusion
    } else {
      type = "Lake";
      number = lake;
      lake += 1;
      greater = -100;  // just to omit exclusion
      less = 0.2;
    };
    name = adjectives[Math.floor(Math.random() * adjectives.length)];
    start = unmarked[0].index;
    polygons[start].featureType = type;
    polygons[start].featureName = name;
    polygons[start].featureNumber = number;
    queue.push(start);
    used.push(start);
    while (queue.length > 0) {
      let polygon_to_check_neighbors = queue.shift();
      for (let neighbor of voronoi.neighbors(polygon_to_check_neighbors)) {
        if (used.indexOf(neighbor) < 0 && polygons[neighbor].height >= greater && polygons[neighbor].height < less) {
          polygons[neighbor].featureType = type;
          polygons[neighbor].featureName = name;
          polygons[neighbor].featureNumber = number;
          queue.push(neighbor);
          used.push(neighbor);
        };
      };
    };
    unmarked = polygons.filter(polygon => !polygon.featureType);
  };
  console.timeEnd("markFeatures");
};

// Get the edge points between polygon and his neighbor
function getEdgePoints(polygon, neighbor) {
  let edgePoints = [];
  for (let point of polygon) {
    if (neighbor.some(neighbor_points => point.every((value, index) => value === neighbor_points[index]))) {
      edgePoints.push(point);
    };
  };
  return edgePoints;
};

// Draw the coastline
function drawCoastline() {
  console.time("drawCoastline");
  d3.selectAll(".coastlines").remove();
  let line = [];  // Array to store coastline edges
  for (let index = 0; index < polygons.length; index++) {
    if (polygons[index].height >= 0.2) {
      for (let neighbor of voronoi.neighbors(index)) {
        if (polygons[neighbor].height < 0.2) {
          let edgePoints = getEdgePoints(polygons[index], polygons[neighbor]);
          let start = edgePoints[0].join(" ");
          let end = edgePoints[1].join(" ");
          let type, number;
          if (polygons[neighbor].featureType === "Ocean") {
            polygons[neighbor].type = "shallow";
            type = "Island";
            number = polygons[index].featureNumber;
          } else {
            type = "Lake";
            number = polygons[neighbor].featureNumber;
          };
          line.push({start, end, type, number});
        };
      };
    };
  };
  // Scales and line for paths drawing
  let x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
  let y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
  let path = d3.line()
    .x(point => x(point.x))
    .y(point => y(point.y))
    .curve(d3.curveBasisClosed);
  // Find and draw continuous coastline (island/ocean)
  let number = 0;
  let type = "Island";
  let edgesOfFeature = line.filter(edge => (edge.type == type && edge.number === number));

  while (edgesOfFeature.length > 0) {
    let coast = [];  // Array to store coastline for feature
    let {start, end} = edgesOfFeature.shift();
    let spl = start.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1]
    });
    spl = end.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1]
    });
    for (let i = 0; end !== start && i < 2000; i++) {
      let next = edgesOfFeature.filter(edge => (edge.start == end || edge.end == end));
      if (next.length > 0) {
        if (next[0].start == end) {
          end = next[0].end;
        } else if (next[0].end == end) {
          end = next[0].start;
        };
        spl = end.split(" ");
        coast.push({
          x: spl[0],
          y: spl[1]
        });
        let rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      };
    };
    svg.select("#shape").append("path").attr("d", path(coast)).attr("fill", "black");
    islandBack.append("path").attr("d", path(coast));
    coastline.append("path").attr("d", path(coast));
    number += 1;
    edgesOfFeature = line.filter(edge => (edge.type == type && edge.number === number));
  };
  // Find and draw continuous coastline (lake/island)
  number = 0;
  type = "Lake";
  edgesOfFeature = line.filter(edge => (edge.type == type && edge.number === number));

  while (edgesOfFeature.length > 0) {
    let coast = [];  // Array to store coastline for feature
    number += 1;
    let {start, end} = edgesOfFeature.shift();
    let spl = start.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1]
    });
    spl = end.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1]
    });
    for (let i = 0; end !== start && i <2000; i++) {
      let next = edgesOfFeature.filter(edge => (edge.start == end || edge.end == end));
      if (next.length > 0) {
        if (next[0].start == end) {
          end = next[0].end;
        } else if (next[0].end == end) {
          end = next[0].start;
        };
        spl = end.split(" ");
        coast.push({
          x: spl[0],
          y: spl[1]
        });
      };
      let rem = edgesOfFeature.indexOf(next[0]);
      edgesOfFeature.splice(rem, 1);
    };
    edgesOfFeature = line.filter(edge => (edge.type == type && edge.number === number));
    lakecoast.append("path").attr("d", path(coast)).attr("class", "lakeShade");
    lakecoast.append("path").attr("d", path(coast));
  }
  oceanLayer.append("rect")
    .attr("x", 0).attr("y", 0)
    .attr("width", mapWidth).attr("height", mapHeight);
  console.timeEnd("drawCoastline");
};

// Mouse movement
function moved(event) {
  // Update cursor and debug div on mousemove
  let point = d3.pointer(event);
  let nearest = voronoi.delaunay.find(point[0], point[1]);

  $("#cell").text(nearest);
  $("#height").text((polygons[nearest].height).toFixed(2));
  if (polygons[nearest].featureType) {
    $("#feature").text(polygons[nearest].featureName + " " + polygons[nearest].featureType);
  } else {
    $("#feature").text("no!");
  };
  if (polygons[nearest].flux) {
    $("#flux").text((polygons[nearest].flux).toFixed(2));
  } else {
    $("#flux").text("no!");
  };
  if (polygons[nearest].precipitation) {
    $("#precipitation").text((polygons[nearest].precipitation).toFixed(2));
  } else {
    $("#precipitation").text("no!");
  };
  if (polygons[nearest].river) {
    $("#river").text(polygons[nearest].river);
  } else {
    $("#river").text("no!");
  };

  if (lock_button.getAttribute("status") == 0) {
    let radius = heightInput.value * radiusInput.value * 100;
    cursor.attr("r", radius)
      .attr("cx", point[0])
      .attr("cy", point[1])
      .attr("stroke", mapColor(1 - heightInput.value));
  } else {
    cursor.attr("opacity", 0);
  };
};

// Create random map
function randomMap(count) {
  console.time("randomMap");
  let rnd;
  for (let counter = 0; counter < count; counter++) {
    // Big blob first
    if (counter == 0) {
      let x = Math.random() * mapWidth / 4 + mapWidth / 2;
      let y = Math.random() * mapHeight / 6 + mapHeight / 2;
      rnd = delaunay.find(x, y);
      circles.append("circle")
        .attr("r", 3)
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", mapColor(1 - heightInput.valueAsNumber))
        .attr("class", "circle");
      add(rnd, "island");
      radiusInput.value = 0.99;
      radiusOutput.value = 0.99;
    } else { // Then small blobs
      let limit = 0;  // Limit while iterations
      do {
        rnd = Math.floor(Math.random() * polygons.length);
        limit++;
      } while (
        (
          polygons[rnd].height > 0.25 ||
          delaunay.points[rnd] < mapWidth * 0.25 ||
          delaunay.points[rnd] > mapWidth * 0.75 ||
          delaunay.points[rnd + 1] < mapHeight * 0.2 ||
          delaunay.points[rnd + 1] > mapHeight * 0.75
        ) && limit < 50
      );
      heightInput.value = Math.random() * 0.4 + 0.1;
      circles.append("circle")
        .attr("r", 3)
        .attr("cx", delaunay.points[rnd])
        .attr("cy", delaunay.points[rnd + 1])
        .attr("fill", mapColor(1 - heightInput.valueAsNumber))
        .attr("class", "circle");
      add(rnd, "hill");
    };
  };
  heightInput.value = Math.random() * 0.4 + 0.1;
  heightOutput.value = heightInput.valueAsNumber;
  // Process the calculations
  downCutCoastline();
  calculatePrecipitation();
  resolveDepressions();
  downCutRivers();
  markFeatures();
  drawCoastline();
  drawMapBase();
  $('.circles').hide();
  console.timeEnd("randomMap");
};

// Redraw all polygons on options change
$("#mapStyle, #hatchingInput").change(() => drawMapBase());

// Draw of remove blur polygons on input change
$("#blurInput").change(() => {
  if (blurInput.checked == true) {
    d3.selectAll(".mapCells")
      .attr("filter", "url(#blurFilter)");
  } else {
    d3.selectAll(".mapCells")
      .attr("filter", "");
  };
});

// Toggle polygons strokes on input change
$("#strokesInput").change(() => {
  if (strokesInput.checked == true) {
    polygons.map((polygon) => {
      grid.append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("class", "cells");
    });
  } else {
    d3.selectAll(".cells").remove();
  };
});

// Toggle precipitation map
$("#fluxInput").change(() => {
  if (fluxInput.checked == true) {
    polygons.map((polygon) => {
      if (polygon.height >= 0.2) {
        grid.append("path")
          .attr("d", "M" + polygon.join("L") + "Z")
          .attr("stroke", fluxColor(polygon.precipitation))
          .attr("fill", fluxColor(polygon.precipitation))
          .attr("class", "flux");
      };
    });
  } else {
    d3.selectAll(".flux").remove();
  };
});

// Decrease land
function downCutCoastline() {
  console.time("downCutCoastline");
  let downCut = downCuttingInput.valueAsNumber;
  polygons.map(polygon => {
    if (polygon.height >= 0.2) {
      polygon.height -= downCut;
    };
  });
  console.timeEnd("downCutCoastline");
};

// Down cut river
function downCutRivers() {
  console.time("downCutRivers");
  var downCut = downCuttingInput.valueAsNumber;
  polygons.map(polygon => {
    if (polygon.flux >= 0.03 && polygon.height >= 0.21) {
      polygon.height -= downCut / 10;
    };
  });
  console.timeEnd("downCutRivers");
};

// Calculate precipitation
function calculatePrecipitation() {
  console.time("calculatePrecipitation");
  // Randomize winds if option is checked
  if (randomWinds.checked) {
    north.checked = Math.random() >= 0.75;
    east.checked = Math.random() >= 0.75;
    south.checked = Math.random() >= 0.75;
    west.checked = Math.random() >= 0.75;
  };
  let sides = north.checked + east.checked + south.checked + west.checked;
  // Select random wind if none are selected
  if (sides == 0) {
    sides = 1;
    let side = Math.random();
    if (side >= 0.25 && side < 0.5) {
      north.checked = true;
    } else if (side >= 0.5 && side < 0.75) {
      east.checked = true;
    } else if (side >= 0.75) {
      south.checked = true;
    } else {
      west.checked = true;
    };
  };
  let precipitationInit = precipitationInput.value / Math.sqrt(sides);
  let selection = 10 / sides;
  if (north.checked) {
    let frontier = polygons.filter(polygon => (
        polygon.point.y < selection &&
        polygon.point.x > mapWidth * 0.1 &&
        polygon.point.x < mapWidth * 0.9
    ));
    frontier.map(polygon => {
      let x = polygon.point.x;
      let y = polygon.point.y;
      let precipitation = precipitationInit;
      while (y < mapHeight && precipitation > 0) {
        y += 5;
        x += Math.random() * 10 - 5;
        let nearest = delaunay.find(x, y);
        let height = polygons[nearest].height;
        if (height >= 0.2) {
          if (height < 0.6) {
            let rain = Math.random() * height;
            precipitation -= rain;
            polygons[nearest].precipitation += rain;
          } else {
            precipitation = 0;
            polygons[nearest].precipitation += precipitation;
          };
        };
      };
    });
  };
  if (east.checked) {
    let frontier = polygons.filter(polygon => (
      polygon.point.x > mapWidth - selection &&
      polygon.point.y > mapHeight * 0.1 &&
      polygon.point.y < mapHeight * 0.9
    ));
    frontier.map(polygon => {
      let x = polygon.point.x;
      let y = polygon.point.y;
      let precipitation = precipitationInit;
      while (x > 0 && precipitation > 0) {
        x -= 5;
        y += Math.random() * 10 - 5;
        let nearest = delaunay.find(x, y);
        let height = polygons[nearest].height;
        if (height >= 0.2) {
          if (height < 0.6) {
            let rain = Math.random() * height;
            precipitation -= rain;
            polygons[nearest].precipitation += rain;
          } else {
            precipitation = 0;
            polygons[nearest].precipitation += precipitation;
          };
        };
      };
    });
  };
  if (south.checked) {
    let frontier = polygons.filter(polygon => (
      polygon.point.y > mapHeight - selection &&
      polygon.point.x > mapWidth * 0.1 &&
      polygon.point.x < mapWidth * 0.9
    ));
    frontier.map(polygon => {
      let x = polygon.point.x;
      let y = polygon.point.y;
      let precipitation = precipitationInit;
      while (y > 0 && precipitation > 0) {
        y -= 5;
        x += Math.random() * 10 - 5;
        let nearest = delaunay.find(x, y);
        let height = polygons[nearest].height;
        if (height >= 0.2) {
          if (height < 0.6) {
            let rain = Math.random() * height;
            precipitation -= rain;
            polygons[nearest].precipitation += rain;
          } else {
            precipitation = 0;
            polygons[nearest].precipitation += precipitation;
          };
        };
      };
    });
  };
  if (west.checked) {
    let frontier = polygons.filter(polygon => (
      polygon.point.x < selection &&
      polygon.point.y > mapHeight * 0.1 &&
      polygon.point.y < mapHeight * 0.9
    ));
    frontier.map(polygon => {
      let x = polygon.point.x;
      let y = polygon.point.y;
      let precipitation = precipitationInit;
      while (x < mapWidth && precipitation > 0) {
        x += 5;
        y += Math.random() * 20 - 10;
        let nearest = delaunay.find(x, y);
        let height = polygons[nearest].height;
        if (height >= 0.2) {
          if (height < 0.6) {
            let rain = Math.random() * height;
            precipitation -= rain;
            polygons[nearest].precipitation += rain;
          } else {
            precipitation = 0;
            polygons[nearest].precipitation += precipitation;
          };
        };
      };
    });
  };
  // Smooth precipitation by taking average values of all neighbors
  polygons.map(polygon => {
    if (polygon.height >= 0.2) {
      let nearbyPrecipitation = [polygon.precipitation];
      for (let neighbor of voronoi.neighbors(polygon.index)) {
        nearbyPrecipitation.push(polygons[neighbor].precipitation);
      };
      let mean = d3.mean(nearbyPrecipitation);
      polygon.precipitation = mean;
      polygon.flux = mean;
    };
  });
  console.timeEnd("calculatePrecipitation");
};

// Fix the depressions
function resolveDepressions() {
  console.time('resolveDepressions');
  land = polygons.filter(polygon => polygon.height >= 0.2);
  let depression = 1;
  let minCell = undefined;
  let minHigh = undefined;
  while (depression > 0) {
    depression = 0;
    land.forEach(polygon => {
      minHigh = 10;
      for (let neighbor of voronoi.neighbors(polygon.index)) {
        if (polygons[neighbor].height < minHigh) {
          minHigh = polygons[neighbor].height;
          minCell = neighbor;
        };
      };
      if (polygon.height <= polygons[minCell].height) {
        depression += 1;
        polygon.height = polygons[minCell].height + 0.01;
      };
    });
  };
  land.sort((a, b) => {
    if (a.height < b.height) {
      return 1;
    };
    if (a.height > b.height) {
      return -1;
    };
    return 0;
  });
  console.timeEnd('resolveDepressions');
  flux();
};

// Flux
function flux() {
  console.time("flux");
  riversData = [];
  let xDiff = undefined;
  let yDiff = undefined;
  let riverNext = 0;
  land.forEach(polygon => {
    let index = [];
    let peak = [];
    let pour = [];
    for (let neighbor of voronoi.neighbors(polygon.index)) {
      let edgePoints = getEdgePoints(polygons[polygon.index], polygons[neighbor]);
      index.push(neighbor);
      peak.push(polygons[neighbor].height);
      // Define neighbors ocean cells for deltas
      if (polygons[neighbor].height < 0.2) {
        xDiff = (edgePoints[0][0] + edgePoints[1][0]) / 2;
        yDiff = (edgePoints[0][1] + edgePoints[1][1]) / 2;
        pour.push({x: xDiff, y: yDiff, cell: neighbor});
      };
    };
    let min = index[peak.indexOf(Math.min(...peak))];
    // Define river number
    if (polygon.flux > 0.6) {
      if (!polygon.river) {
        // State new river
        polygon.river = riverNext;
        riverNext += 1;
        riversData.push({
          river: polygon.river,
          cell: polygon.index,
          x: polygon.point.x,
          y: polygon.point.y,
          type: "source"
        });
        // Sources marked as red blobs
        // grid.append("circle").attr("r", 5).attr("fill", "red")
        //   .attr("cx", polygon.point.x).attr("cy", polygon.point.y);
      };
      // Assign existing river to the downhill cell
      if (!polygons[min].river) {
        polygons[min].river = polygon.river;
      } else {
        let iRiver = riversData.filter(river => river.river == polygon.river);
        let minRiver = riversData.filter(river => river.river == polygons[min].river);
        if (iRiver.length >= minRiver.length) {
          polygons[min].river = polygon.river;
        };
      };
    };
    polygons[min].flux += polygon.flux;
    if (polygon.precipitation * 0.9 > polygons[min].precipitation) {
      polygons[min].precipitation = polygon.precipitation * 0.9;
    };
    if (polygons[min].height < 0.2 && polygon.river) {
      // Pour water to the Ocean
      if (polygon.flux > 15 && pour.length > 1) {
        // River delta
        pour.forEach((value, index) => {
          if (index == 0) {
            riversData.push({
              river: polygon.river,
              cell: polygon.index,
              x: value.x,
              y: value.y,
              type: "delta",
              pour: pour[0].cell
            });
          } else {
            riversData.push({
              river: riverNext,
              cell: polygon.index,
              x: polygon.point.x,
              y: polygon.point.y,
              type: "course"
            });
            riversData.push({
              river: riverNext,
              cell: polygon.index,
              x: value.x,
              y: value.y,
              type: "delta",
              pour: pour[0].cell
            });
          };
          riverNext += 1;
        });
      } else {
        // River estuary
        riversData.push({
          river: polygon.river,
          cell: polygon.index,
          x: pour[0].x + ((pour[0].x - polygon.point.x) / 10),
          y: pour[0].y + ((pour[0].y - polygon.point.y) / 10),
          type: "estuary",
          pour: pour[0].cell
        });
      };
    } else {
      // Add next river segment
      riversData.push({
        river: polygon.river,
        cell: min,
        x: polygons[min].point.x,
        y: polygons[min].point.y,
        type: "course"
      });
    };
  });
  console.timeEnd("flux");
  drawRiverLines(riverNext);
};

// Draw river lines
function drawRiverLines(riversCount) {
  console.time("drawRiverLines");
  let dataRiver = undefined;
  let x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
  let y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
  let line = d3.line()
    .x((point) => x(point.x))
    .y((point) => y(point.y))
    .curve(d3.curveCatmullRom.alpha(1));
  for (let counter = 0; counter < riversCount; counter++) {
    let flux = 0;
    dataRiver = riversData.filter(river => river.river == counter);
    if (dataRiver.length > 1) {
      let riverAmended = [];
      if (dataRiver.length > 2) {
        // Add more river points on 1/3 and 2/3 of length
        dataRiver.forEach((river, index) => {
          riverAmended.push({x: river.x, y: river.y});
          if (index + 2 < dataRiver.length) {
            let dX = river.x;
            let dY = river.y;
            let meander = 0.4 + Math.random() * 0.3;
            let stX = (dX * 2 + dataRiver[index + 1].x) / 3;
            let stY = (dY * 2 + dataRiver[index + 1].y) / 3;
            let enX = (dX + dataRiver[index + 1].x * 2) / 3;
            let enY = (dY + dataRiver[index + 1].y * 2) / 3;
            if (Math.random() > 0.5) {
              stX += meander;
              enX -= meander;
            } else {
              stY += meander;
              enY -= meander;
            };
            riverAmended.push({x: stX, y: stY});
            riverAmended.push({x: enX, y: enY});
            // if (counter == 1) {
            //   grid.append("circle").attr("r", 2).attr("fill", "blue")
            //     .attr("cx", dX).attr("cy", dY);
            //   grid.append("circle").attr("r", 2).attr("fill", "red")
            //     .attr("cx", stX).attr("cy", stY);
            //   grid.append("circle").attr("r", 2).attr("fill", "yellow")
            //     .attr("cx", enX).attr("cy", enY);
            // };
          };
        });
        let river = defs.append("path").attr("d", line(riverAmended));
        let path = river.node().getPathData();
        for (let segmentCounter = 1; segmentCounter < path.length; segmentCounter++) {
          let segment = "";
          let sX = undefined;
          let sY = undefined;
          if (segmentCounter == 1) {
            sX = path[0].values[0];
            sY = path[0].values[1];
          } else {
            sX = path[segmentCounter - 1].values[4];
            sY = path[segmentCounter - 1].values[5];
          };
          segment += sX + "," + sY + " C" + path[segmentCounter].values[0] + "," + path[segmentCounter].values[1] + "," + path[segmentCounter].values[2] + "," + path[segmentCounter].values[3] + "," + path[segmentCounter].values[4] + "," + path[segmentCounter].values[5];
          // grid.append("circle").attr("r", 0.1).attr("fill", "red")
          //   .attr("cx", sX).attr("cy", sY);
          let from = findClosestWithRadius(sX, sY, 0.1);
          if (from) {
            flux = polygons[from].flux / 30;
          };
          let riverWidth = (segmentCounter / 100 + flux);
          if (riverWidth > 0.5) {
            riverWidth *= 0.9;
          };
          let shadowWidth = riverWidth / 3;
          if (shadowWidth < 0.1) {
            shadowWidth = 0.1;
          };
          riversShade.append("path").attr("d", "M" + segment).attr("stroke-width", shadowWidth);
          rivers.append("path").attr("d", "M" + segment).attr("stroke-width", riverWidth);
        };
      } else if (dataRiver[1].type == "delta") {
        riverAmended.push({x: dataRiver[0].x, y: dataRiver[0].y});
        let middleX = (dataRiver[0].x + dataRiver[1].x) / 2 + (0.2 + Math.random() * 0.1);
        let middleY = (dataRiver[0].y + dataRiver[1].y) / 2 + (0.2 + Math.random() * 0.1);
        riverAmended.push({x: middleX, y: middleY});
        riverAmended.push({x: dataRiver[1].x, y: dataRiver[1].y});
        riversShade.append("path").attr("d", line(riverAmended)).attr("stroke-width", 0.3);
        rivers.append("path").attr("d", line(riverAmended)).attr("stroke-width", 0.6);
      };
    };
  };
  console.timeEnd("drawRiverLines");
};

// Find closest delaunay point for given x, y coordinates within given radius
function findClosestWithRadius(x, y, radius) {
  let polygonId = delaunay.find(x, y);
  if (polygonId !== null && Math.sqrt((x - delaunay.points[polygonId]) ** 2 + (y - delaunay.points[polygonId + 1]) ** 2) < radius) {
    return polygonId;
  }
  return null;
};

// Based on https://www.jasondavies.com/poisson-disc/
function poissonDiscSampler(width, height, radius) {
  let k = 30, // maximum number of samples before rejection
    radius2 = radius * radius,
    R = 3 * radius2,
    cellSize = radius * Math.SQRT1_2,
    gridWidth = Math.ceil(width / cellSize),
    gridHeight = Math.ceil(height / cellSize),
    grid = new Array(gridWidth * gridHeight),
    queue = [],
    queueSize = 0,
    sampleSize = 0;

  return function() {
    if (!sampleSize) return sample(Math.random() * width, Math.random() * height);

    // Pick a random existing sample and remove it from the queue.
    while (queueSize) {
      let i = Math.random() * queueSize | 0,
        s = queue[i];

      // Make a new candidate between [radius, 2 * radius] from the existing sample.
      for (let j = 0; j < k; ++j) {
        let a = 2 * Math.PI * Math.random(),
          r = Math.sqrt(Math.random() * R + radius2),
          x = s[0] + r * Math.cos(a),
          y = s[1] + r * Math.sin(a);

        // Reject candidates that are outside the allowed extent,
        // or closer than 2 * radius to any existing sample.
        if (0 <= x && x < width && 0 <= y && y < height && far(x, y)) return sample(x, y);
      }

      queue[i] = queue[--queueSize];
      queue.length = queueSize;
    }
  };

  function far(x, y) {
    let i = x / cellSize | 0,
      j = y / cellSize | 0,
      i0 = Math.max(i - 2, 0),
      j0 = Math.max(j - 2, 0),
      i1 = Math.min(i + 3, gridWidth),
      j1 = Math.min(j + 3, gridHeight);

    for (j = j0; j < j1; ++j) {
      let o = j * gridWidth;
      for (i = i0; i < i1; ++i) {
        let s = grid[o + i]
        if (s !== undefined) {
          let dx = s[0] - x,
            dy = s[1] - y;
          if (dx * dx + dy * dy < radius2) return false;
        }
      }
    }
    return true;
  }

  function sample(x, y) {
    let s = [x, y];
    queue.push(s);
    grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
    ++sampleSize;
    ++queueSize;
    return s;
  }
}

// Clear the map on re-generation
function undraw() {
  // Remove all on re-generate
  $("g").remove();
  $("path").remove();
  // Set some options to defaults
  heightInput.value = 0.9;
  heightOutput.value = 0.9;
  radiusInput.value = 0.9;
  radiusOutput.value = 0.9;
}

// // Lock/unlock map
// $("#lock").click(() => {
//   if (this.getAttribute("status") == 0) {
//     lock.innerHTML = "&#128274;";
//     this.setAttribute("status", 1);
//     d3.select(".cursor").attr("opacity", 0);
//   } else {
//     lock.innerHTML = "&#128275;";
//     this.setAttribute("status", 0);
//     d3.select(".cursor").attr("opacity", 1);
//   };
// });

// Initial generation
let timeStart = Date.now();
console.clear();
generate(11);
let timeEnd = Date.now();
console.log("Total Time: "+(timeEnd-timeStart)+"ms");
