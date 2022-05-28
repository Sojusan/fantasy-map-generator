// Redraw all polygons on options change
$("#mapStyle").change(() => drawMapBase());

// Draw or remove blur polygons on input change
$("#blurInput").change(() => {
  if (blurInput.checked == true) {
    d3.selectAll(".mapCells").attr("filter", "url(#blurFilter)");
  } else {
    d3.selectAll(".mapCells").attr("filter", "");
  }
});

// Toggle polygons strokes on input change
$("#strokesInput").change(() => {
  if (strokesInput.checked == true) {
    polygons.forEach((polygon) => {
      grid
        .append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("class", "cells");
    });
  } else {
    d3.selectAll(".cells").remove();
  }
});

// Toggle precipitation map
$("#fluxInput").change(() => {
  if (fluxInput.checked == true) {
    polygons.forEach((polygon) => {
      if (polygon.height >= 0.2) {
        grid
          .append("path")
          .attr("d", "M" + polygon.join("L") + "Z")
          .attr("stroke", fluxColor(polygon.precipitation))
          .attr("fill", fluxColor(polygon.precipitation))
          .attr("class", "flux");
      }
    });
  } else {
    d3.selectAll(".flux").remove();
  }
});

// Toggle temperature map
$("#temperatureInput").change(() => {
  if (temperatureInput.checked == true) {
    polygons.forEach((polygon) => {
      if (polygon.height >= 0.2) {
        grid
          .append("path")
          .attr("d", "M" + polygon.join("L") + "Z")
          .attr("stroke", temperatureColor((polygon.temperature / 50 + 1) / 2))
          .attr("fill", temperatureColor((polygon.temperature / 50 + 1) / 2))
          .attr("class", "temperature");
      }
    });
  } else {
    d3.selectAll(".temperature").remove();
  }
});

// Toggle biome map
$("#biomeInput").change(() => {
  if (biomeInput.checked == true) {
    polygons.forEach((polygon) => {
      if (polygon.height >= 0.2) {
        grid
          .append("path")
          .attr("d", "M" + polygon.join("L") + "Z")
          .attr("stroke", polygon.biome.color)
          .attr("fill", polygon.biome.color)
          .attr("class", "biome");
      }
    });
  } else {
    d3.selectAll(".biome").remove();
  }
});

// Toggle grayscale map
$("#grayscaleInput").change(() => {
  if (grayscaleInput.checked == true) {
    polygons.forEach((polygon) => {
      grid
        .append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("stroke", mapGrayscaleColor(1 - polygon.height))
        .attr("fill", mapGrayscaleColor(1 - polygon.height))
        .attr("class", "grayscale");
    });
  } else {
    d3.selectAll(".grayscale").remove();
  }
});
