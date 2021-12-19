// This array contains all the biomes
const biomesArray = [
    {name: "Water", color: "#2559a8"},
    {name: "Tundra", color: "#45c2f7"},
    {name: "Cold desert", color: "#69533e"},
    {name: "Grassland", color: "#81fc62"},
    {name: "Subtropical desert", color: "#593c1e"},
    {name: "Boreal forest", color: "#6bb591"},
    {name: "Woodland", color: "#d64633"},
    {name: "Temperate seasonal forest", color: "#4954b3"},
    {name: "Savanna", color: "#c3ed95"},
    {name: "Temperate rainforest", color: "#23295e"},
    {name: "Tropical rainforest", color: "#526e35"},
    {name: "Glacier", color: "#636363"}
];

// Biomes matrix created based on temperature and precipitation parameters
// Contains the ID of the arrays from `biomesArray`
const biomesMatrix = [
    // in column - coldest to hottest
    // in row - dryest to wettest
    [11, 1, 2, 2, 4, 4],
    [11, 1, 3, 3, 4, 4],
    [11, 1, 6, 6, 8, 8],
    [11, 1, 5, 6, 8, 8],
    [11, 1, 5, 7, 10, 10],
    [11, 1, 5, 9, 10, 10]
];

/**
 * Get the ID of the `biomeMatrix` row based on `precipitation`.
 * @param {number} precipitation
 * @returns {number} ID of the row in the `biomeMatrix`.
 */
function getPrecipitationBiomeMatrixRow(precipitation) {
    if (precipitation < 0.16) {
        return 0;
    } else if (precipitation < 0.33) {
        return 1;
    } else if (precipitation < 0.5) {
        return 2;
    } else if (precipitation < 0.66) {
        return 3;
    } else if (precipitation < 0.83) {
        return 4;
    } else {
        return 5;
    };
};

/**
 * Get the ID of the `biomeMatrix` column based on `temperature`.
 * @param {number} temperature
 * @returns {number} ID of the column in the `biomeMatrix`.
 */
function getTemperatureBiomeMatrixColumn(temperature) {
    if (temperature < -10) {
        return 0;
    } else if (temperature < 0) {
        return 1;
    } else if (temperature < 10) {
        return 2;
    } else if (temperature < 20) {
        return 3;
    } else if (temperature < 30) {
        return 4;
    } else {
        return 5;
    };
};

// Assign biomes
function assignBiomes() {
    console.time("assignBiomes");
    polygons.forEach(polygon => {
        if (polygon.height >= 0.2) {
            const biomeColumn = getTemperatureBiomeMatrixColumn(polygon.temperature);
            const biomeRow = getPrecipitationBiomeMatrixRow(polygon.precipitation);
            polygon.biome = biomesArray[biomesMatrix[biomeRow][biomeColumn]];
        } else {
            polygon.biome = biomesArray[0];
        };
    });
    console.timeEnd("assignBiomes");
};
