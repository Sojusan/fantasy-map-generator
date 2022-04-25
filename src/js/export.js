d3.select("#export_button").on("click", exportPNG);

console.log("test");

let zip = new JSZip();

function exportPNG() {
  downloadPNG(getMapURL("Heightmap"), "Heightmap");
  biomesArray.forEach((value) => {
    downloadPNG(getMapURL(value.name), value.name);
  });


  // console.log("test");
  // getPNG(getMapURL("Heightmap"), "Heightmap", zip);

  // // files.push({"name": "Heightmap", "blob": test});

  // // console.log(test);
  // // const zip = new JSZip();
  // // zip.file("test.txt", "test");
  // // zip.file("test2.png", );
  // // test = getPNG(getMapURL("Heightmap"), "Heightmap");
  // // getPNG(getMapURL("Heightmap"), "Heightmap", (blob) => files.push({"name": "Heightmap", "blob": blob}));
  // // biomesArray.forEach((value) => {
  // //   getPNG(getMapURL(value.name), value.name, (blob) => files.push({"name": value.name, "blob": blob}));
  // // });

  // // console.log(zip);
  // // console.log(test);
  // // zip.file("testsa.png", test);
  // // zip.generateAsync({type: "blob"}).then((content) => {
  // //   console.log("test 2 2 2 2");
  // //   console.log(content);
  // //   saveAs(content, "export.zip");
  // // });
  // // console.log(files);
  // console.log(zip);
  // zip.generateAsync({type: "blob"}).then((content) => {
  //   saveAs(content, "export.zip");
  // });
};

function getMapURL(biome_name) {
  let svg_map = document.getElementById("svg").cloneNode(true);
  svg_map.id = "export_map";
  document.body.appendChild(svg_map);
  const clone = d3.select(svg_map);
  let svg_map_vb = clone.append("g").attr("class", "viewbox");
  let svg_map_grid = svg_map_vb.append("g").attr("class", "grid");
  if (biome_name === "Heightmap") {
    polygons.map(polygon => {
        svg_map_grid.append("path")
                .attr("d", "M" + polygon.join("L") + "Z")
                .attr("stroke", mapGrayscaleColor(1 - polygon.height))
                .attr("fill", mapGrayscaleColor(1 - polygon.height));
    });
  } else {
    polygons.map(polygon => {
      let color = undefined;
      if (polygon.biome.name === biome_name) {
        color = mapGrayscaleColor(0);
      } else {
        color = mapGrayscaleColor(1);
      }
      svg_map_grid.append("path")
              .attr("d", "M" + polygon.join("L") + "Z")
              .attr("stroke", color)
              .attr("fill", color);
    });
  };

  const serialized = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>` + new XMLSerializer().serializeToString(svg_map);
  const blob = new Blob([serialized], {type: "image/svg+xml;charset=utf-8"});
  const url = window.URL.createObjectURL(blob);
  svg_map.remove();
  return url;
};


function downloadPNG(url, name) {
    const link = document.createElement("a");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    const img = new Image();
    img.src = url;
    img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        link.download = name + ".png";
        canvas.toBlob(function (blob) {
          link.href = window.URL.createObjectURL(blob);
          link.click();
        });
      };
};

function exportPNG2() {
    let svg_map = document.getElementById("svg").cloneNode(true);
    svg_map.id = "test";
    document.body.appendChild(svg_map);
    const clone = d3.select(svg_map);
    let svg_map_vb = clone.append("g").attr("class", "viewbox");
    let svg_map_grid = svg_map_vb.append("g").attr("class", "grid");
    polygons.map(polygon => {
        svg_map_grid.append("path")
                .attr("d", "M" + polygon.join("L") + "Z")
                .attr("stroke", mapGrayscaleColor(1 - polygon.height))
                .attr("fill", mapGrayscaleColor(1 - polygon.height));
    });

    // saveSvg(clone, "test.svg");
    // console.log(svg_map);
    // console.log(svg_map[0]);
    // document.body.removeChild(svg_map[0]);
    const serialized = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>` + new XMLSerializer().serializeToString(svg_map);
    const blob = new Blob([serialized], {type: "image/svg+xml;charset=utf-8"});
    const url = window.URL.createObjectURL(blob);

    let a = document.createElement('a');
    a.download = 'my.svg';
    a.href = url;
    // document.body.appendChild(a);
    a.click();
    // document.body.removeChild(a);
}
