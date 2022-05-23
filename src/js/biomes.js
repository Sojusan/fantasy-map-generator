document.getElementById("biome_matrix_chart_button").addEventListener("click", function () {
    createBiomesMatrixChart();
});

document.getElementById("biome_polygons_chart_button").addEventListener("click", function () {
    createBiomesPolygonsChart();
});

/**
 * Load default settings for biomes.
 */
function loadDefaultBiomeSettings() {
    // This array contains all the biomes
    biomesArray = [
        { name: "None", color: "#ffffff" },
        { name: "Water", color: "#2559a8" },
        { name: "Tundra", color: "#45c2f7" },
        { name: "Cold desert", color: "#69533e" },
        { name: "Grassland", color: "#81fc62" },
        { name: "Subtropical desert", color: "#593c1e" },
        { name: "Boreal forest", color: "#6bb591" },
        { name: "Woodland", color: "#d64633" },
        { name: "Temperate seasonal forest", color: "#4954b3" },
        { name: "Savanna", color: "#c3ed95" },
        { name: "Temperate rainforest", color: "#23295e" },
        { name: "Tropical rainforest", color: "#526e35" },
        { name: "Glacier", color: "#636363" }
    ];

    // Biomes matrix created based on temperature and precipitation parameters
    // Contains the ID of the arrays from `biomesArray`
    biomesMatrix = [
        // in column - coldest to hottest
        // in row - dryest to wettest
        [12, 2, 3, 3, 5, 5],
        [12, 2, 4, 4, 5, 5],
        [12, 2, 7, 7, 9, 9],
        [12, 2, 6, 7, 9, 9],
        [12, 2, 6, 8, 11, 11],
        [12, 2, 6, 10, 11, 11]
    ];

    // Limits used to calculate the row in `biomesMatrix`
    precipitationLimitsArray = [0.16, 0.33, 0.5, 0.66, 0.83];
    // Limits used to calculate the column in `biomesMatrix`
    temperatureLimitsArray = [-10, 0, 10, 20, 30];
};

/**
 * Creates a table header based on given data.
 * @param {string[]} headerDataArray - array of header columns names.
 * @returns {HTMLTableSectionElement} `thead` element of the table filled with the given data`.
 */
function createTableHeader(headerDataArray) {
    let thead = document.createElement("thead");
    let trHead = document.createElement("tr");
    headerDataArray.forEach((value) => {
        let th = document.createElement("th");
        th.appendChild(document.createTextNode(value));
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    return thead;
};

/**
 * Create a table in the HTML document, based on the values in `biomesArray`.
 */
function createBiomesColorsTable() {
    let biomesColorsTable = document.querySelector("#biomes_colors_table");
    let table = document.createElement("table");
    let headerValuesArray = Object.keys(biomesArray[0]);
    let thead = createTableHeader(headerValuesArray);
    table.appendChild(thead);
    let tbody = document.createElement("tbody");

    biomesArray.forEach((value) => {
        let tr = document.createElement("tr");
        let tdFirst = document.createElement("td");
        let nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = value.name;
        tdFirst.appendChild(nameInput);
        let tdSecond = document.createElement("td");
        let colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = value.color;
        tdSecond.appendChild(colorPicker);
        tr.appendChild(tdFirst);
        tr.appendChild(tdSecond);
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    biomesColorsTable.appendChild(table);
};

/**
 * Get the values for the horizontal header. This values are the ranges of the temperatures.
 * @param {string[]} valuesArray - The array where the values will be stored.
 */
function getHorizontalHeaderValuesArray(valuesArray){
    for (let index = 0; index < temperatureLimitsArray.length + 1; index++) {
        if (index === 0) {
            valuesArray.push(`[-50, ${temperatureLimitsArray[index]})`);
        } else if (index === temperatureLimitsArray.length) {
            valuesArray.push(`[${temperatureLimitsArray[index - 1]}, 50]`);
        } else {
            valuesArray.push(`[${temperatureLimitsArray[index - 1]}, ${temperatureLimitsArray[index]})`);
        };
    };
};

/**
 * Get the values for the vertical header. This values are the ranges of the precipitation.
 * @param {string[]} valuesArray - The array where the values will be stored.
 */
 function getVerticalHeaderValuesArray(valuesArray){
    for (let index = 0; index < precipitationLimitsArray.length + 1; index++) {
        if (index === 0) {
            valuesArray.push(`[0.02, ${precipitationLimitsArray[index]})`);
        } else if (index === precipitationLimitsArray.length) {
            valuesArray.push(`[${precipitationLimitsArray[index - 1]}, 1.00]`);
        } else {
            valuesArray.push(`[${precipitationLimitsArray[index - 1]}, ${precipitationLimitsArray[index]})`);
        };
    };
};

/**
 * Create a table in the HTML document, based on the values in `biomesMatrix`.
 */
function createBiomesMatrixTable() {
    let biomesMatrixTable = document.querySelector("#biomes_matrix_table");
    if (biomesMatrixTable.hasChildNodes()) {
        biomesMatrixTable.removeChild(biomesMatrixTable.lastChild);
    };
    let table = document.createElement("table");
    let horizontalHeaderValuesArray = ["",];
    let verticalHeaderValuesArray = [];

    getHorizontalHeaderValuesArray(horizontalHeaderValuesArray);
    getVerticalHeaderValuesArray(verticalHeaderValuesArray);

    let thead = createTableHeader(horizontalHeaderValuesArray);
    let tbody = document.createElement("tbody");
    biomesMatrix.forEach((row, index) => {
        let tr = document.createElement("tr");
        let th = document.createElement("th");
        th.appendChild(document.createTextNode(verticalHeaderValuesArray[index]));
        tr.appendChild(th);
        row.forEach((biomeId) => {
            let td = document.createElement("td");
            let select = document.createElement("select");
            biomesArray.forEach((biome, biomeIndex) => {
                let option = document.createElement("option");
                option.text = biome.name;
                option.value = biomeIndex;
                select.add(option);
            });
            select.value = biomeId
            select.style.backgroundColor = biomesArray[biomeId].color;
            td.appendChild(select);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    biomesMatrixTable.appendChild(table);
};

/**
 * Get the ID of the `biomeMatrix` row based on `precipitation`.
 * @param {number} precipitation
 * @returns {number} ID of the row in the `biomeMatrix`.
 */
function getPrecipitationBiomeMatrixRow(precipitation) {
    let foundIndex = precipitationLimitsArray.findIndex((value) => {
        return precipitation < value;
    });

    if (foundIndex === -1) {
        return precipitationLimitsArray.length;
    } else {
        return foundIndex;
    };
};

/**
 * Get the ID of the `biomeMatrix` column based on `temperature`.
 * @param {number} temperature
 * @returns {number} ID of the column in the `biomeMatrix`.
 */
function getTemperatureBiomeMatrixColumn(temperature) {
    let foundIndex = temperatureLimitsArray.findIndex((value) => {
        return temperature < value;
    });

    if (foundIndex === -1) {
        return temperatureLimitsArray.length;
    } else {
        return foundIndex;
    };
};

/**
 * Assign biomes for each polygon based on temperature and precipitation.
 */
function assignBiomes() {
    console.time("assignBiomes");
    polygons.forEach(polygon => {
        if (polygon.height >= 0.2) {
            const biomeColumn = getTemperatureBiomeMatrixColumn(polygon.temperature);
            const biomeRow = getPrecipitationBiomeMatrixRow(polygon.precipitation);
            polygon.biome = biomesArray[biomesMatrix[biomeRow][biomeColumn]];
        } else {
            polygon.biome = biomesArray[1];
        };
    });
    console.timeEnd("assignBiomes");
};

// Updates `localStorage` on `whittakerBiomes` input change
$("#whittakerBiomes").change(() => {
    if (whittakerBiomes.checked == true) {
        localStorage.setItem("whittakerBiomes", true);
        whittakerPrecipitationNormalization();
    } else {
        localStorage.setItem("whittakerBiomes", false);
        // reset temperature and precipitation to default values
        polygons.forEach(polygon => {
            polygon.temperature = 0;
            polygon.precipitation = 0.02;
        });
        calculateTemperature();
        calculatePrecipitation();
        loadDefaultBiomeSettings();
        createBiomesMatrixTable();
        assignBiomes();
    };
});

/**
 * Normalize the `precipitation` and `temperature` to fit in Whittaker biomes schema.
 */
function whittakerPrecipitationNormalization() {
    console.time("whittakerPrecipitationNormalization");
    if (localStorage.getItem("whittakerBiomes")) {
        biomesMatrix = [
            // in column - coldest to hottest
            // in row - dryest to wettest
            [0, 2, 3, 3, 5, 0],
            [0, 0, 7, 4, 5, 0],
            [0, 0, 6, 7, 9, 0],
            [0, 0, 6, 8, 9, 0],
            [0, 0, 0, 10, 11, 0],
            [0, 0, 0, 0, 11, 0]
        ];
        polygons.forEach(polygon => {
            if (polygon.height >= 0.2) {
                if (polygon.temperature < -10) {
                    polygon.temperature = -9.9;
                    polygon.precipitation = 0.02;
                } else if (polygon.temperature < 0) {
                    if (polygon.precipitation > 0.16) {
                        polygon.precipitation = 0.15;
                    };
                } else if (polygon.temperature < 10) {
                    if (polygon.precipitation > 0.66) {
                        polygon.precipitation = 0.65;
                    };
                } else if (polygon.temperature < 20) {
                    if (polygon.precipitation > 0.83) {
                        polygon.precipitation = 0.82;
                    };
                } else if (polygon.temperature > 30) {
                    polygon.temperature = 29;
                };
            };
        });
        createBiomesMatrixTable();
        assignBiomes();
    };
    console.timeEnd("whittakerPrecipitationNormalization");
};

/**
 * Creates the chart presenting the biome matrix values (bar plot).
 * @link https://www.d3-graph-gallery.com - The tutorial for charts on which this method is based.
 */
function createBiomesMatrixChart() {
    // Set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 20, left: 50 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const chartSvg = d3.select("#biome_matrix_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "#ffffff")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // The X axis
    let horizontalHeaderValuesArray = [];
    getHorizontalHeaderValuesArray(horizontalHeaderValuesArray);

    // The Y axis
    let verticalHeaderValuesArray = [];
    getVerticalHeaderValuesArray(verticalHeaderValuesArray);
    verticalHeaderValuesArray.reverse();

    // Add X axis
    const xAxis = d3.scaleBand()
        .domain(horizontalHeaderValuesArray)
        .range([0, width]);
    chartSvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xAxis).tickSizeOuter(0));

    // Add Y axis
    const yAxis = d3.scaleBand()
        .domain(verticalHeaderValuesArray)
        .range([0, height]);
    chartSvg.append("g")
        .call(d3.axisLeft(yAxis).tickSizeOuter(0));

    // Show the bars
    biomesMatrix.slice().reverse().forEach((value, prec_index) => {
        value.forEach((biome_index, temp_index) => {
            chartSvg.append("rect")
                .attr("x", xAxis(horizontalHeaderValuesArray[temp_index]))
                .attr("y", yAxis(verticalHeaderValuesArray[prec_index]))
                .attr("fill", biomesArray[biome_index].color)
                .attr("height", yAxis.bandwidth())
                .attr("width", xAxis.bandwidth());
        });
    });
};

/**
 * Creates the chart presenting the biome values for each polygon (dot plot).
 * @link https://www.d3-graph-gallery.com - The tutorial for charts on which this method is based.
 */
function createBiomesPolygonsChart() {
    // Set the dimensions and margins of the graph
    const margin = { top: 10, right: 30, bottom: 20, left: 50 };
    const width = 460 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const chartSvg = d3.select("#biome_polygons_chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "#ffffff")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add X axis
    const xAxis = d3.scaleLinear()
        .domain([-50, 50])
        .range([0, width]);
    chartSvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xAxis).tickSizeOuter(0));

    // Add Y axis
    const yAxis = d3.scaleLinear()
        .domain([0.0, 1.0])
        .range([height, 0]);
    chartSvg.append("g")
        .call(d3.axisLeft(yAxis).ticks(6, "f"));

    // Add dots
    chartSvg.append('g')
        .selectAll("dot")
        .data(polygons.filter((polygon) => polygon.height >= 0.2))
        .join("circle")
            .attr("cx", function (polygon) { return xAxis(polygon.temperature); })
            .attr("cy", function (polygon) { return yAxis(polygon.precipitation); })
            .attr("r", 5)
            .style("fill", function (polygon) { return polygon.biome.color });
};
