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
                pour.push({ x: xDiff, y: yDiff, cell: neighbor });
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


