// 3. Coastline feature

document.getElementById("new_map_button").addEventListener("click", function() {
  // console.log("New map generation begin.");
  undraw();
  generate();
});
document.getElementById("random_map_button").addEventListener("click", function() {
  // console.log("Random map clicked.");
  undraw();
  generate(11);
});

// general function; run onload of to start from scratch
function generate(count) {
  // Add general elements
  let svg = d3.select("svg")
    .on("touchmove mousemove", moved),
    mapWidth = +svg.attr("width"),
    mapHeight = +svg.attr("height"),
    defs = svg.select("defs"),
    viewbox = svg.append("g").attr("class", "viewbox"),
    islandBack = viewbox.append("g").attr("class", "islandBack"),
    mapCells = viewbox.append("g").attr("class", "mapCells"),
    oceanLayer = viewbox.append("g").attr("class", "oceanLayer"),
    circles = viewbox.append("g").attr("class", "circles"),
    coastline = viewbox.append("g").attr("class", "coastline"),
    shallow = viewbox.append("g").attr("class", "shallow"),
    lakecoast = viewbox.append("g").attr("class", "lakecoast");

  // Poisson-disc sampling from https://bl.ocks.org/mbostock/99049112373e12709381
  let sampler = poissonDiscSampler(mapWidth, mapHeight, sizeInput.valueAsNumber),
    samples = [],
    sample;
  while (sample = sampler()) {
    samples.push(sample);
  }

  // console.log("samples: ", samples);

  // Voronoi D3
  let delaunay = d3.Delaunay.from( samples, d => d[0], d => d[1] ),
    voronoi = delaunay.voronoi( [ 0, 0, mapWidth, mapHeight ] ),
    polygons = Array.from( voronoi.cellPolygons() ),
    // Colors D3 interpolation
    color = d3.scaleSequential( d3.interpolateSpectral ),
    // Queue array
    queue = [];

  // console.log("delaunay: ", delaunay);
  // console.log("voronoi: ", voronoi);
  // console.log("polygons: ", polygons);

  let cursor = svg.append("g").append("circle")
    .attr("r", 1)
    .attr("class", "cursor");

  // Add D3 drag and zoom behavior
  let zoom = d3.zoom()
    .scaleExtent( [1, 50] )
    .translateExtent([
      [-100, -100],
      [mapWidth + 100, mapHeight + 100]
    ])
    .on("zoom", zoomed);

  svg.call(zoom);

  function zoomed(event) {
    viewbox.attr("transform", event.transform);
  }

  $("#resetZoom").click(function() {
    svg.transition().duration(1000)
      .call(zoom.transform, d3.zoomIdentity);
  });

  // array to use as names
  let adjectives = [
    "Ablaze", "Ablazing", "Accented", "Ashen", "Ashy", "Beaming", "Bi-Color", "Blazing", "Bleached",
    "Bleak", "Blended", "Blotchy", "Bold", "Brash", "Bright", "Brilliant", "Burnt", "Checkered",
    "Chromatic", "Classic", "Clean", "Colored", "Colorful", "Colorless", "Complementing", "Contrasting",
    "Cool", "Coordinating", "Crisp", "Dappled", "Dark", "Dayglo", "Deep", "Delicate", "Digital", "Dim",
    "Dirty", "Discolored", "Dotted", "Drab", "Dreary", "Dull", "Dusty", "Earth", "Electric", "Eye-Catching",
    "Faded", "Faint", "Festive", "Fiery", "Flashy", "Flattering", "Flecked", "Florescent", "Frosty",
    "Full-Toned", "Glistening", "Glittering", "Glowing", "Harsh", "Hazy", "Hot", "Hued", "Icy", "Illuminated",
    "Incandescent", "Intense", "Interwoven", "Iridescent", "Kaleidoscopic", "Lambent", "Light", "Loud",
    "Luminous", "Lusterless", "Lustrous", "Majestic", "Marbled", "Matte", "Medium", "Mellow", "Milky", "Mingled",
    "Mixed", "Monochromatic", "Motley", "Mottled", "Muddy", "Multicolored", "Multihued", "Murky", "Natural",
    "Neutral", "Opalescent", "Opaque", "Pale", "Pastel", "Patchwork", "Patchy", "Patterned", "Perfect",
    "Picturesque", "Plain", "Primary", "Prismatic", "Psychedelic", "Pure", "Radiant", "Reflective", "Rich", "Royal",
    "Ruddy", "Rustic", "Satiny", "Saturated", "Secondary", "Shaded", "Sheer", "Shining", "Shiny", "Shocking", "Showy",
    "Smoky", "Soft", "Solid", "Somber", "Soothing", "Sooty", "Sparkling", "Speckled", "Stained", "Streaked", "Streaky",
    "Striking", "Strong Neutral", "Subtle", "Sunny", "Swirling", "Tinged", "Tinted", "Tonal", "Toned", "Translucent",
    "Transparent", "Two-Tone", "Undiluted", "Uneven", "Uniform", "Vibrant", "Vivid", "Wan", "Warm", "Washed-Out",
    "Waxen", "Wild"
  ];

  for (let value of polygons) {
    value.height = 0;
    // mapCells.append('path')
    //   .attr('d', 'M' + value.join('L') + 'Z')
    //   .attr('id', 'c' + value.index)
    //   .attr('class', 'mapCell')
    //   .attr('fill', color(1 - value.height));
  };

  function add(start, type) {
    // get options from inputs
    let height = heightInput.valueAsNumber,
      radius = radiusInput.valueAsNumber,
      sharpness = sharpnessInput.valueAsNumber,
      queue = [],  // polygons to check
      used = [];  // used polygons

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

  function drawPolygons() {
    // delete all polygons
    svg.select(".mapCell").remove();
    // redraw the polygons based on new heights
    let grads = [],
      limit = 0.2;
    if (seaInput.checked == true) {
      limit = 0;
    }
    polygons.map(function(i) {
      if (i.height >= limit) {
        mapCells.append("path")
          .attr("d", "M" + i.join("L") + "Z")
          .attr("class", "mapCell")
          .attr("fill", color(1 - i.height));
        mapCells.append("path")
          .attr("d", "M" + i.join("L") + "Z")
          .attr("class", "mapStroke")
          .attr("stroke", color(1 - i.height));
      }
      if (i.type === "shallow") {
        shallow.append("path")
          .attr("d", "M" + i.join("L") + "Z");
      }

      // console.log("i: ", i);
      // console.log("i.height: ", i.height);
    });
    if (blurInput.valueAsNumber > 0) {
      toggleBlur();
    }
  }

  // Mark GeoFeatures (ocean, lakes, isles)
  function markFeatures() {
    let queue = [],  // polygons to check
      used = [];  // checked polygons
    // define ocean cells
    let start = delaunay.find(0, 0);
    queue.push(start);
    used.push(start);
    let type = "Ocean",
      name;
    if (polygons[start].featureType) {
      name = polygons[start].featureName;
    } else {
      name = adjectives[Math.floor(Math.random() * adjectives.length)];
    }
    polygons[start].featureType = type;
    polygons[start].featureName = name;
    while (queue.length > 0) {
      let i = queue[0];
      queue.shift();
      for (let neighbor of voronoi.neighbors(i)) {
        if (used.indexOf(neighbor) < 0 && polygons[neighbor].height < 0.2) {
          polygons[neighbor].featureType = type;
          polygons[neighbor].featureName = name;
          queue.push(neighbor);
          used.push(neighbor);
        }
      }
    }
    // define islands and lakes
    let island = 0,
      lake = 0,
      number = 0,
      greater = 0,
      less = 0,
      unmarked = $.grep(polygons, function(e) {
        return (!e.featureType);
      });
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
      }
      name = adjectives[Math.floor(Math.random() * adjectives.length)];
      start = unmarked[0].index;
      polygons[start].featureType = type;
      polygons[start].featureName = name;
      polygons[start].featureNumber = number;
      queue.push(start);
      used.push(start);
      while (queue.length > 0) {
        let i = queue[0];
        queue.shift();
        for (let neighbor of voronoi.neighbors(i)) {
          if (used.indexOf(neighbor) < 0 && polygons[neighbor].height >= greater && polygons[neighbor].height < less) {
            polygons[neighbor].featureType = type;
            polygons[neighbor].featureName = name;
            polygons[neighbor].featureNumber = number;
            queue.push(neighbor);
            used.push(neighbor);
          }
        }
      }
      unmarked = $.grep(polygons, function(e) {
        return (!e.featureType);
      });
    }
  }

  function getEdgePoints(polygon, neighbor) {
    let edge_points = [];
    for (let point of polygon) {
      // console.log("point: ", point);
      // console.log("if in nb: ", neighbor.some(a => point.every((v, i) => v === a[i])))
      if (neighbor.some(a => point.every((v, i) => v === a[i]))) {
        edge_points.push(point);
      };
    };
    // console.log("edge_points: ", edge_points);
    return edge_points;
  };

  function drawCoastline() {
    // console.log("delaunay.halfedges: ", delaunay.halfedges);
    // console.log("delaunay.inedges: ", delaunay.inedges);
    // d3.selectAll(".coastlines").remove();
    let line = [];  // array to store coastline edges
    for (let i = 0; i < polygons.length; i++) {
      if (polygons[i].height >= 0.2) {
        for (let neighbor of voronoi.neighbors(i)) {
          if (polygons[neighbor].height < 0.2) {
            let edge_points = getEdgePoints(polygons[i], polygons[neighbor]);

            // console.log("polygons[i]: ", polygons[i]);
            // console.log("polygons[neighbor]: ", polygons[neighbor]);
            let start = edge_points[0].join(" ");
            let end = edge_points[1].join(" ");
            let type, number;
            if (polygons[neighbor].featureType === "Ocean") {
              polygons[neighbor].type = "shallow";
              type = "Island";
              number = polygons[i].featureNumber;
            } else {
              type = "Lake";
              number = polygons[neighbor].featureNumber;
            }
            line.push({start, end, type, number});
          }
        };

      }
    }
    // console.log("line: ", line);
    // scales and line for paths drawing
    let x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
    let y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
    let path = d3.line()
      .x(function(d) {
        return x(d.x);
      })
      .y(function(d) {
        return y(d.y);
      })
      .curve(d3.curveBasisClosed);
    // find and draw continuous coastline (island/ocean)
    let number = 0;
    let type = "Island";
    let edgesOfFeature = $.grep(line, function(e) {
      return (e.type == type && e.number === number);
    });

    // console.log("edgeOfFeature: ", edgesOfFeature);

    while (edgesOfFeature.length > 0) {
      let coast = [];  // array to store coastline for feature
      let start = edgesOfFeature[0].start;
      let end = edgesOfFeature[0].end;
      edgesOfFeature.shift();
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
        let next = $.grep(edgesOfFeature, function(e) {
          return (e.start == end || e.end == end);
        })
        if (next.length > 0) {
          if (next[0].start == end) {
            end = next[0].end;
          } else if (next[0].end == end) {
            end = next[0].start;
          }
          spl = end.split(" ");
          coast.push({
            x: spl[0],
            y: spl[1]
          });
          let rem = edgesOfFeature.indexOf(next[0]);
          edgesOfFeature.splice(rem, 1);
        }
      }
      svg.select("#shape").append("path").attr("d", path(coast))
        .attr("fill", "black");
      islandBack.append("path").attr("d", path(coast));
      coastline.append("path").attr("d", path(coast));
      number += 1;
      edgesOfFeature = $.grep(line, function(e) {
        return (e.type == type && e.number === number);
      });
    }
    // find and draw continuous coastline (lake/island)
    number = 0;
    type = "Lake";
    edgesOfFeature = $.grep(line, function(e) {
      return (e.type == type && e.number === number);
    });
    while (edgesOfFeature.length > 0) {
      let coast = [];  // array to store coastline for feature
      number += 1;
      let start = edgesOfFeature[0].start;
      let end = edgesOfFeature[0].end;
      edgesOfFeature.shift();
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
        let next = $.grep(edgesOfFeature, function(e) {
          return (e.start == end || e.end == end);
        });
        if (next.length > 0) {
          if (next[0].start == end) {
            end = next[0].end;
          } else if (next[0].end == end) {
            end = next[0].start;
          }
          spl = end.split(" ");
          coast.push({
            x: spl[0],
            y: spl[1]
          });
        }
        let rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      };
      edgesOfFeature = $.grep(line, function(e) {
        return (e.type == type && e.number === number);
      });
      lakecoast.append("path").attr("d", path(coast));
    }
    oceanLayer.append("rect")
      .attr("x", 0).attr("y", 0)
      .attr("width", mapWidth).attr("height", mapHeight);
  }

  // Add a blob on mouse click
  svg.on("click", function(e) {
    // draw a circle in center in clicked point
    let point = d3.pointer(e),
      nearest = delaunay.find(point[0], point[1]);
    circles.append("circle")
      .attr("r", 3)
      .attr("cx", point[0])
      .attr("cy", point[1])
      .attr("fill", color(1 - heightInput.valueAsNumber))
      .attr("class", "circle");
    if ($(".circle").length == 1) {
      add(nearest, "island");
      // change options to defaults for hills
      heightInput.value = 0.2;
      heightOutput.value = 0.2;
      radiusInput.value = 0.99;
      radiusOutput.value = 0.99;
    } else {
      add(nearest, "hill");
      // let's make height random for hills
      let height = (Math.random() * 0.4 + 0.1).toFixed(2);
      heightInput.value = height;
      heightOutput.value = height;
    }
    // process with calculations
		$("path").remove();
		drawPolygons();
		markFeatures();
		drawCoastline();
  });

  function moved(e) {
    // update cursor and debug div on mousemove
    let point = d3.pointer(e),
      nearest = voronoi.delaunay.find(point[0], point[1]),
      radius = heightInput.value * radiusInput.value * 100;

    // console.log("point", point);
    // console.log("nearest = ", nearest);
    // console.log("polygons[nearest] = ", polygons[nearest]);

    cursor.attr("r", radius)
      .attr("cx", point[0])
      .attr("cy", point[1])
      .attr("stroke", color(1 - heightInput.value));
    $("#cell").text(nearest);
    $("#height").text((polygons[nearest].height).toFixed(2));
    if (polygons[nearest].featureType) {
      $("#feature").text(polygons[nearest].featureName + " " + polygons[nearest].featureType);
    } else {
      $("#feature").text("no!");
    }
  };
  if (count != undefined) {
    randomMap(count);
  }

   // Create random map
   function randomMap(count) {
    let rnd;
    for (let c = 0; c < count; c++) {
      // Big blob first
      if (c == 0) {
        let x = Math.random() * mapWidth / 4 + mapWidth / 2;
        let y = Math.random() * mapHeight / 4 + mapHeight / 2;
        rnd = delaunay.find(x, y);
        // console.log("rnd: ", rnd);
        circles.append("circle")
          .attr("r", 3)
          .attr("cx", x)
          .attr("cy", y)
          .attr("fill", color(1 - heightInput.valueAsNumber))
          .attr("class", "circle");
        add(rnd, "island");
        radiusInput.value = 0.99;
        radiusOutput.value = 0.99;
      } else { // Then small blobs
        let limit = 0; // limit while iterations
        do {
          rnd = Math.floor(Math.random() * polygons.length);
          limit++;
        } while ((polygons[rnd].height > 0.25 || delaunay.points[rnd] < mapWidth * 0.25 || delaunay.points[rnd] > mapWidth * 0.75 || delaunay.points[rnd + 1] < mapHeight * 0.2 || delaunay.points[rnd + 1] > mapHeight * 0.75) &&
          limit < 50)
        heightInput.value = Math.random() * 0.4 + 0.1;
        // console.log("polygons[rnd]: ", polygons[rnd]);
        // console.log("cx: ", delaunay.points[rnd]);
        // console.log("cy: ", delaunay.points[rnd + 1]);
        circles.append("circle")
          .attr("r", 3)
          .attr("cx", delaunay.points[rnd])
          .attr("cy", delaunay.points[rnd + 1])
          .attr("fill", color(1 - heightInput.valueAsNumber))
          .attr("class", "circle");
        add(rnd, "hill");
      }
    }
    heightInput.value = Math.random() * 0.4 + 0.1;
    heightOutput.value = heightInput.valueAsNumber;
    // process the calculations
    markFeatures();
    drawCoastline();
    drawPolygons();
    $('.circles').hide();
    // console.log("END MAP RANDOM");
  }

  // redraw all polygons on SeaInput change
  $("#seaInput").change(function() {
    // console.log("seaInput: ", seaInput.checked)
    drawPolygons();
  });

  // Draw of remove blur polygons on input change
  $("#blurInput").change(function() {
    toggleBlur();
  });

  // Change blur, in case of 0 will not be drawn
  function toggleBlur() {
    d3.selectAll(".blur").remove();
    if (blurInput.valueAsNumber > 0) {
      var limit = 0.2;
      if (seaInput.checked == true) {
        limit = 0;
      }
      polygons.map(function(i) {
        if (i.height >= limit) {
          mapCells.append("path")
            .attr("d", "M" + i.join("L") + "Z")
            .attr("class", "blur")
            .attr("stroke-width", blurInput.valueAsNumber)
            .attr("stroke", color(1 - i.height));
        }
      });
    }
  }

  // Draw of remove blur polygons on input change
  $("#strokesInput").change(function() {
    toggleStrokes();
  });

  // Change polygons stroke-width,
  // in case of low width svg background will be shined through
  function toggleStrokes() {
    if (strokesInput.checked == true) {
      let limit = 0.2;
      if (seaInput.checked == true) {
        limit = 0;
      }
      polygons.map(function(i) {
        if (i.height >= limit) {
          mapCells.append("path")
            .attr("d", "M" + i.join("L") + "Z")
            .attr("class", "mapStroke")
            .attr("stroke", "grey");
        }
      });
    } else {
      d3.selectAll(".mapStroke").remove();
    }
  }
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
