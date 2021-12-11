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
    };

    function sample(x, y) {
        let s = [x, y];
        queue.push(s);
        grid[gridWidth * (y / cellSize | 0) + (x / cellSize | 0)] = s;
        ++sampleSize;
        ++queueSize;
        return s;
    };
};


/**
 * Find closest delaunay point for given x, y coordinates within given radius.
 * @param {number} x - x coordinate
 * @param {number} y - y coordinate
 * @param {number} radius - radius
 *
 * @returns {(number|null)} `Polygon ID` if found in given radius or `null` otherwise.
 */
function findClosestWithRadius(x, y, radius) {
    let polygonId = delaunay.find(x, y);
    if (polygonId !== null && Math.sqrt((x - delaunay.points[polygonId]) ** 2 + (y - delaunay.points[polygonId + 1]) ** 2) < radius) {
      return polygonId;
    }
    return null;
  };

/**
 * Get the edge points between polygon and his neighbor.
 * @param {Object} polygon - cell to start searching
 * @param {Object} neighbor - cell for which the common edge points should be found
 * @returns {number[]} Array with two edge points coordinates.
 */
function getEdgePoints(polygon, neighbor) {
    let edgePoints = [];
    for (let point of polygon) {
      if (neighbor.some(neighbor_points => point.every((value, index) => value === neighbor_points[index]))) {
        edgePoints.push(point);
      };
    };
    return edgePoints;
  };

/**
 * Round `number` to `places` decimals.
 * @param {number} number - the float number to be rounded
 * @param {number} places - the number of expected decimals
 * @returns {number} Rounded number.
 */
function roundNumber(number, places) {
    return +(Math.round(number + "e+" + places)  + "e-" + places);
}
