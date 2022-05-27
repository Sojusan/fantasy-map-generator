// Calculate map position on globe
function calculateMapCoordinates() {
  const size = +document.getElementById("mapSizeOutput").value;
  const latitudeShift = +document.getElementById("latitudeOutput").value;

  const latitudeT = roundNumber((size / 100) * 180, 1);
  const latitudeN = roundNumber(90 - ((180 - latitudeT) * latitudeShift) / 100, 1);
  const latitudeS = roundNumber(latitudeN - latitudeT, 1);

  const longitude = roundNumber(Math.min(((mapWidth / mapHeight) * latitudeT) / 2, 180), 1);
  mapCoordinates = {
    latitudeT,
    latitudeN,
    latitudeS,
    longitudeT: longitude * 2,
    longitudeW: -longitude,
    longitudeE: longitude,
  };
}

// Temperature calculations
function calculateTemperature() {
  console.time("calculateTemperatures");
  const temperatureEquator = +temperatureEquatorInput.value;
  const temperaturePole = +temperaturePoleInput.value;
  const temperatureDelta = temperatureEquator - temperaturePole;
  const interpolation = d3.easePolyInOut.exponent(0.5); // interpolation function

  polygons.forEach((polygon) => {
    const y = polygon.point.y;
    const latitude = Math.abs(
      mapCoordinates.latitudeN - (y / mapHeight) * mapCoordinates.latitudeT
    ); // [0; 90]
    const initialTemperature = temperatureEquator - interpolation(latitude / 90) * temperatureDelta;
    polygon.temperature = Math.min(
      Math.max(initialTemperature - convertToFriendly(polygon.height), -128),
      127
    );
  });

  // temperature decreases by 6.5 degree C per 1km
  function convertToFriendly(h) {
    if (h < 0.2) return 0;
    const exponent = +heightExponentInput.value;
    const height = Math.pow(h - 0.18, exponent);
    return roundNumber(height * 10 * 6.5, 1);
  }

  console.timeEnd("calculateTemperatures");
}

// Draw the map base shape
function drawMapBase() {
  console.time("drawMapBase");
  // Remove map base elements to redraw
  mapCells.selectAll("path").remove();
  shallow.selectAll("path").remove();
  // Set background color for islands
  if (mapStyle.value === "flat") {
    d3.selectAll(".islandBack").attr("fill", "#f9f9eb");
  } else {
    d3.selectAll(".islandBack").attr("fill", mapColor(0.78));
  }
  // "polygonal" map style
  if (mapStyle.value === "polygonal") {
    polygons.map((polygon) => {
      mapCells
        .append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("fill", mapColor(1 - polygon.height))
        .attr("shape-rendering", "optimizeSpeed");
      mapCells
        .append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("fill", "none")
        .attr("stroke", mapColor(1 - polygon.height));
    });
  }
  // Hatching for shallow water
  polygons.map((polygon) => {
    if (polygon.type === "shallow") {
      shallow.append("path").attr("d", "M" + polygon.join("L") + "Z");
    }
  });
  console.timeEnd("drawMapBase");
}

// Mark GeoFeatures (ocean, lakes, isles)
function markFeatures() {
  console.time("markFeatures");
  // Reset the values on re-generation
  polygons.forEach((polygon) => {
    polygon.featureType = undefined;
    polygon.featureNumber = undefined;
  });
  let queue = []; // Polygons to check
  let used = []; // Checked polygons
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
  }
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
      }
    }
  }
  // Define islands and lakes
  let island = 0;
  let lake = 0;
  let number = 0;
  let greater = 0;
  let less = 0;
  let unmarked = polygons.filter((polygon) => !polygon.featureType);
  while (unmarked.length > 0) {
    if (unmarked[0].height >= 0.2) {
      type = "Island";
      number = island;
      island += 1;
      greater = 0.2;
      less = 100; // just to omit exclusion
    } else {
      type = "Lake";
      number = lake;
      lake += 1;
      greater = -100; // just to omit exclusion
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
      let polygon_to_check_neighbors = queue.shift();
      for (let neighbor of voronoi.neighbors(polygon_to_check_neighbors)) {
        if (
          used.indexOf(neighbor) < 0 &&
          polygons[neighbor].height >= greater &&
          polygons[neighbor].height < less
        ) {
          polygons[neighbor].featureType = type;
          polygons[neighbor].featureName = name;
          polygons[neighbor].featureNumber = number;
          queue.push(neighbor);
          used.push(neighbor);
        }
      }
    }
    unmarked = polygons.filter((polygon) => !polygon.featureType);
  }
  console.timeEnd("markFeatures");
}

// Draw the coastline
function drawCoastline() {
  console.time("drawCoastline");
  viewbox.selectAll("g.coastline > path").remove();
  viewbox.selectAll("g.shallow > path").remove();
  viewbox.selectAll("g.lakecoast > path").remove();
  viewbox.selectAll("g.oceanLayer > rect").remove();
  viewbox.selectAll("g.islandBack > path").remove();
  polygons.forEach((polygon) => {
    polygon.type = undefined;
  });
  // d3.selectAll(".coastlines").remove();
  let line = []; // Array to store coastline edges
  let borderPoints = []; // Help array to fix the island on the image border
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
          }
          line.push({ start, end, type, number });

          if (
            edgePoints[0][0] === 0 ||
            edgePoints[0][0] === mapWidth ||
            edgePoints[0][1] === 0 ||
            edgePoints[0][1] === mapHeight
          ) {
            let name = polygons[index].featureName;
            let point = start;
            borderPoints.push({ point, name, type, number });
          }
          if (
            edgePoints[1][0] === 0 ||
            edgePoints[1][0] === mapWidth ||
            edgePoints[1][1] === 0 ||
            edgePoints[1][1] === mapHeight
          ) {
            let name = polygons[index].featureName;
            let point = end;
            borderPoints.push({ point, name, type, number });
          }
        }
      }
    }
  }

  // Fix the border points
  while (borderPoints.length) {
    let firstPoint = borderPoints[0];
    let workPoints = borderPoints.filter((point) => point.name === firstPoint.name);

    workPoints.sort((a, b) => {
      const [a1, a2] = a.point.split(" ").map(Number);
      const [b1, b2] = b.point.split(" ").map(Number);

      return a1 - b1 || a2 - b2;
    });
    if (workPoints.length) {
      let start = workPoints[0].point;
      let end = workPoints.at(-1).point;
      let type = workPoints[0].type;
      let number = workPoints[0].number;

      let [start_y, start_x] = start.split(" ").map(Number);
      let [end_y, end_x] = end.split(" ").map(Number);
      // Corners fix
      if (start_y === 0 && end_x === mapHeight) {
        // Left down
        corner_point = `0 ${mapHeight}`;
        line.push({ start, end: corner_point, type, number });
        line.push({ start: corner_point, end, type, number });
      } else if (start_x === mapHeight && end_y === mapWidth) {
        // Right down
        corner_point = `${mapWidth} ${mapHeight}`;
        line.push({ start, end: corner_point, type, number });
        line.push({ start: corner_point, end, type, number });
      } else if (start_x === 0 && end_y === mapWidth) {
        // Right up
        corner_point = `${mapWidth} 0`;
        line.push({ start, end: corner_point, type, number });
        line.push({ start: corner_point, end, type, number });
      } else {
        line.push({ start, end, type, number });
      }
    }
    borderPoints = borderPoints.filter((point) => point.name !== firstPoint.name);
  }

  // Scales and line for paths drawing
  let x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
  let y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
  let path = d3
    .line()
    .x((point) => x(point.x))
    .y((point) => y(point.y))
    .curve(d3.curveBasisClosed);
  // Find and draw continuous coastline (island/ocean)
  let number = 0;
  let type = "Island";
  let edgesOfFeature = line.filter((edge) => edge.type == type && edge.number === number);
  while (edgesOfFeature.length > 0) {
    let coast = []; // Array to store coastline for feature
    let { start, end } = edgesOfFeature.shift();
    let spl = start.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1],
    });
    spl = end.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1],
    });
    for (let i = 0; end !== start && i < 2000; i++) {
      let next = edgesOfFeature.filter((edge) => edge.start == end || edge.end == end);
      if (next.length > 0) {
        if (next[0].start == end) {
          end = next[0].end;
        } else if (next[0].end == end) {
          end = next[0].start;
        }
        spl = end.split(" ");
        coast.push({
          x: spl[0],
          y: spl[1],
        });
        let rem = edgesOfFeature.indexOf(next[0]);
        edgesOfFeature.splice(rem, 1);
      }
    }
    svg.select("#shape").append("path").attr("d", path(coast)).attr("fill", "black");
    islandBack.append("path").attr("d", path(coast));
    coastline.append("path").attr("d", path(coast));
    number += 1;
    edgesOfFeature = line.filter((edge) => edge.type == type && edge.number === number);
  }
  // Find and draw continuous coastline (lake/island)
  number = 0;
  type = "Lake";
  edgesOfFeature = line.filter((edge) => edge.type == type && edge.number === number);

  while (edgesOfFeature.length > 0) {
    let coast = []; // Array to store coastline for feature
    number += 1;
    let { start, end } = edgesOfFeature.shift();
    let spl = start.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1],
    });
    spl = end.split(" ");
    coast.push({
      x: spl[0],
      y: spl[1],
    });
    for (let i = 0; end !== start && i < 2000; i++) {
      let next = edgesOfFeature.filter((edge) => edge.start == end || edge.end == end);
      if (next.length > 0) {
        if (next[0].start == end) {
          end = next[0].end;
        } else if (next[0].end == end) {
          end = next[0].start;
        }
        spl = end.split(" ");
        coast.push({
          x: spl[0],
          y: spl[1],
        });
      }
      let rem = edgesOfFeature.indexOf(next[0]);
      edgesOfFeature.splice(rem, 1);
    }
    edgesOfFeature = line.filter((edge) => edge.type == type && edge.number === number);
    lakecoast.append("path").attr("d", path(coast)).attr("class", "lakeShade");
    lakecoast.append("path").attr("d", path(coast));
  }
  oceanLayer
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", mapWidth)
    .attr("height", mapHeight);
  console.timeEnd("drawCoastline");
}

// Create random map
function randomMap(count) {
  console.time("randomMap");
  let rnd;
  for (let counter = 0; counter < count; counter++) {
    // Big blob first
    if (counter == 0) {
      let x = (Math.random() * mapWidth) / 4 + mapWidth / 2;
      let y = (Math.random() * mapHeight) / 6 + mapHeight / 2;
      rnd = delaunay.find(x, y);
      circles
        .append("circle")
        .attr("r", 3)
        .attr("cx", x)
        .attr("cy", y)
        .attr("fill", mapColor(1 - heightInput.valueAsNumber))
        .attr("class", "circle");
      add(rnd, "island");
      radiusInput.value = 0.99;
      radiusOutput.value = 0.99;
    } else {
      // Then small blobs
      let limit = 0; // Limit while iterations
      do {
        rnd = Math.floor(Math.random() * polygons.length);
        limit++;
      } while (
        (polygons[rnd].height > 0.25 ||
          polygons[rnd].point.x < mapWidth * 0.25 ||
          polygons[rnd].point.x > mapWidth * 0.75 ||
          polygons[rnd].point.y < mapHeight * 0.2 ||
          polygons[rnd].point.y > mapHeight * 0.75) &&
        limit < 50
      );
      heightInput.value = Math.random() * 0.4 + 0.1;
      circles
        .append("circle")
        .attr("r", 3)
        .attr("cx", polygons[rnd].point.x)
        .attr("cy", polygons[rnd].point.y)
        .attr("fill", mapColor(1 - heightInput.valueAsNumber))
        .attr("class", "circle");
      add(rnd, "hill");
    }
  }
  heightInput.value = Math.random() * 0.4 + 0.1;
  heightOutput.value = heightInput.valueAsNumber;
  // Process the calculations
  downCutCoastline();
  calculateMapCoordinates();
  calculateTemperature();
  calculatePrecipitation();
  loadDefaultBiomeSettings();
  createBiomesColorsTable();
  createBiomesMatrixTable();
  assignBiomes();
  resolveDepressions();
  downCutRivers();
  markFeatures();
  drawCoastline();
  drawMapBase();
  $(".circles").hide();
  console.timeEnd("randomMap");
}

// Draw river lines
function drawRiverLines(riversCount) {
  console.time("drawRiverLines");
  let dataRiver = undefined;
  let x = d3.scaleLinear().domain([0, mapWidth]).range([0, mapWidth]);
  let y = d3.scaleLinear().domain([0, mapHeight]).range([0, mapHeight]);
  let line = d3
    .line()
    .x((point) => x(point.x))
    .y((point) => y(point.y))
    .curve(d3.curveCatmullRom.alpha(1));
  for (let counter = 0; counter < riversCount; counter++) {
    let flux = 0;
    dataRiver = riversData.filter((river) => river.river == counter);
    if (dataRiver.length > 1) {
      let riverAmended = [];
      if (dataRiver.length > 2) {
        // Add more river points on 1/3 and 2/3 of length
        dataRiver.forEach((river, index) => {
          riverAmended.push({ x: river.x, y: river.y });
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
            }
            riverAmended.push({ x: stX, y: stY });
            riverAmended.push({ x: enX, y: enY });
            // if (counter == 1) {
            //   grid.append("circle").attr("r", 2).attr("fill", "blue")
            //     .attr("cx", dX).attr("cy", dY);
            //   grid.append("circle").attr("r", 2).attr("fill", "red")
            //     .attr("cx", stX).attr("cy", stY);
            //   grid.append("circle").attr("r", 2).attr("fill", "yellow")
            //     .attr("cx", enX).attr("cy", enY);
            // };
          }
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
          }
          segment +=
            sX +
            "," +
            sY +
            " C" +
            path[segmentCounter].values[0] +
            "," +
            path[segmentCounter].values[1] +
            "," +
            path[segmentCounter].values[2] +
            "," +
            path[segmentCounter].values[3] +
            "," +
            path[segmentCounter].values[4] +
            "," +
            path[segmentCounter].values[5];
          // grid.append("circle").attr("r", 0.1).attr("fill", "red")
          //   .attr("cx", sX).attr("cy", sY);
          let from = findClosestWithRadius(sX, sY, 0.1);
          if (from) {
            flux = polygons[from].flux / 30;
          }
          let riverWidth = segmentCounter / 100 + flux;
          if (riverWidth > 0.5) {
            riverWidth *= 0.9;
          }
          let shadowWidth = riverWidth / 3;
          if (shadowWidth < 0.1) {
            shadowWidth = 0.1;
          }
          riversShade
            .append("path")
            .attr("d", "M" + segment)
            .attr("stroke-width", shadowWidth);
          rivers
            .append("path")
            .attr("d", "M" + segment)
            .attr("stroke-width", riverWidth);
        }
      } else if (dataRiver[1].type == "delta") {
        riverAmended.push({ x: dataRiver[0].x, y: dataRiver[0].y });
        let middleX = (dataRiver[0].x + dataRiver[1].x) / 2 + (0.2 + Math.random() * 0.1);
        let middleY = (dataRiver[0].y + dataRiver[1].y) / 2 + (0.2 + Math.random() * 0.1);
        riverAmended.push({ x: middleX, y: middleY });
        riverAmended.push({ x: dataRiver[1].x, y: dataRiver[1].y });
        riversShade.append("path").attr("d", line(riverAmended)).attr("stroke-width", 0.3);
        rivers.append("path").attr("d", line(riverAmended)).attr("stroke-width", 0.6);
      }
    }
  }
  console.timeEnd("drawRiverLines");
}
