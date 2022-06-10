d3.select("#export_button").on("click", exportPNG);

function exportPNG() {
  const zip = new JSZip();
  downloadPNG(getMapURL("Heightmap"), "Heightmap", function (blob) {
    zip.file("heightmap.png", blob);
  });
  biomesArray.forEach((value, index) => {
    downloadPNG(getMapURL(value.name), value.name, function (blob) {
      zip.file(value.name.toLowerCase().replaceAll(" ", "_") + ".png", blob);
      if (index == biomesArray.length - 1) {
        zip.generateAsync({ type: "blob" }).then((content) => {
          saveAs(content, "export.zip");
        });
      }
    });
  });
}

function getMapURL(biome_name) {
  let svg_map = document.getElementById("svg").cloneNode(true);
  svg_map.id = "export_map";
  document.body.appendChild(svg_map);
  const clone = d3.select(svg_map);
  let svg_map_vb = clone.append("g").attr("class", "viewbox");
  let svg_map_grid = svg_map_vb.append("g").attr("class", "grid");
  if (biome_name === "Heightmap") {
    polygons.map((polygon) => {
      svg_map_grid
        .append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("stroke", mapGrayscaleColor(1 - polygon.height))
        .attr("fill", mapGrayscaleColor(1 - polygon.height));
    });
  } else {
    polygons.map((polygon) => {
      let color = undefined;
      if (polygon.biome.name === biome_name) {
        color = mapGrayscaleColor(0);
      } else {
        color = mapGrayscaleColor(1);
      }
      svg_map_grid
        .append("path")
        .attr("d", "M" + polygon.join("L") + "Z")
        .attr("stroke", color)
        .attr("fill", color);
    });
  }

  const serialized =
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>` +
    new XMLSerializer().serializeToString(svg_map);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  svg_map.remove();
  return url;
}

function downloadPNG(url, name, callback) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const img = new Image();
  img.src = url;
  img.onload = function () {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function (blob) {
      callback(blob);
    });
  };
}
