const TerrainType = {
  Island: "Island",
  Hill: "Hill"
};

// Add new terrain blob
function add(start, type) {
  // get options from inputs
  let height = heightInput.valueAsNumber;
  let radius = radiusInput.valueAsNumber;
  let sharpness = sharpnessInput.valueAsNumber;
  let queue = []; // polygons to check
  let used = []; // used polygons

  polygons[start].height += height;
  polygons[start].featureType = undefined;
  queue.push(start);
  used.push(start);

  for (let i = 0; i < queue.length && height > 0.01; i++) {
    if (type == TerrainType.Island) {
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
        }
        polygons[neighbor].featureType = undefined;
        queue.push(neighbor);
        used.push(neighbor);
      }
    }
  }
}
