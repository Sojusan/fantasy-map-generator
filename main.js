document.getElementById("lock_button").addEventListener("click", function () {
    if (this.getAttribute("status") == 0) {
        this.setAttribute("status", 1);
        d3.select(".cursor").attr("opacity", 0);
    } else {
        this.setAttribute("status", 0);
        d3.select(".cursor").attr("opacity", 1);
    };
});

document.getElementById("clear_button").addEventListener("click", function () {
    undraw();
    generate();
});

document.getElementById("random_map_button").addEventListener("click", function () {
    undraw();
    generate(11);
});

document.getElementById("worldControls").addEventListener("input", e => {
    // Synchronize `range` with `numeric` input
    if (e.target) {
        document.getElementById(e.target.dataset.stored + "Input").value = e.target.value;
        document.getElementById(e.target.dataset.stored + "Output").value = e.target.value;
    };
    calculateMapCoordinates();
    calculateTemperature();
    assignBiomes();
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

let mapCoordinates = {}; // map coordinates on globe

// Poisson-disc sampling from https://bl.ocks.org/mbostock/99049112373e12709381
let sampler = poissonDiscSampler(mapWidth, mapHeight, sizeInput.valueAsNumber);
let samples = [];
let sample;
while (sample = sampler()) {
    samples.push(sample);
};

// Voronoi D3
let delaunay = d3.Delaunay.from(samples, sample => sample[0], sample => sample[1]);
let voronoi = delaunay.voronoi([0, 0, mapWidth, mapHeight]);
let polygons = Array.from(voronoi.cellPolygons());
// Colors D3 interpolation
let mapColor = d3.scaleSequential(d3.interpolateSpectral);
let fluxColor = d3.scaleSequential(d3.interpolateBlues);
let temperatureColor = d3.scaleSequential(d3.interpolateReds);
// Queue array
let queue = [];

// Add D3 drag and zoom behavior
let zoom = d3.zoom()
    .scaleExtent([1, 40])
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

// Set initial values for polygons
polygons.forEach((polygon, index) => {
    // polygon.index = index;
    polygon.point = { x: delaunay.points[index * 2], y: delaunay.points[index * 2 + 1] };
    polygon.height = 0;
    polygon.flux = 0.02;
    polygon.precipitation = 0.02;
    polygon.temperature = 0;
    polygon.biome = null;
});

// General function
function generate(count) {
    if (count != undefined) {
      randomMap(count);
    };
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
    if (polygons[nearest].temperature) {
        $("#temperature").text(polygons[nearest].temperature);
      } else {
        $("#temperature").text("no!");
      };
    if (polygons[nearest].biome) {
        $("#biome").text(polygons[nearest].biome.name);
      } else {
        $("#biome").text("no!");
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


  // Initial generation
let timeStart = Date.now();
console.clear();
generate(11);
let timeEnd = Date.now();
console.log("Total Time: "+(timeEnd-timeStart)+"ms");
