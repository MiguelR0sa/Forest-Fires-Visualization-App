// many variables are initialized here and prepared to be globally utilized

let loadAggregateData = 1;
let firesPerState = d3.map();

let margin = 75,
  width = 1500 - margin,
  height = 600 - margin;

let jsonFile;
let svg;
let color;
let numero_extent_sum;
let numero_extent_fixed;

let projection = d3.geoMercator()
  .center([-20, -12])
  .scale(600)
  .translate([width / 2, height / 2]);

let path = d3.geoPath().projection(projection);

let states;
let states_contour;

// This is the main function to draw the map and initialize everything. Information about states, and the mesh, use
// the topojson library for obtaining information for the svg drawing of the map. Information about drawing a country
// with coordinates from a JSON file come from: https://bl.ocks.org/ruliana/1ccaaab05ea113b0dff3b22be3b4d637
function draw(brazilstates) {
  firesPerState = d3.map();
  if (loadAggregateData != 1) {
    d3.selectAll("svg").remove();
  }
  loadAggregateData = 1;
  svg = d3.select("#divMap")
    .classed("svg-container", true)
    .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 600 600")
      .classed("svg-content-responsive", true)
      .append('g')
        .attr('class', 'map');

  jsonFile = brazilstates;
  states = topojson.feature(jsonFile, jsonFile.objects.foo);
  states_contour = topojson.mesh(jsonFile, jsonFile.objects.foo.geometries);

  d3.csv("new_csv.csv")
    .then((data) => {
      let newData = data.map(d => {
        d["Número"] = +d["Número"];
        d["Estado"] = d["Estado"];
        d["Periodo"] = +d["Periodo"];
        d["Ano"] = +d["Ano"];
        return d;
      });
      //Save initial dataset sorted by chronologica order
      rawData = newData;
      rawData.forEach(function (d) {
        d.Order = (((d.Periodo) % 10000) * 100) + Math.floor((d.Periodo) / 10000)
      });
      rawData.sort(function (x, y) {
        return d3.ascending(x.Order, y.Order);
      });


      let fixed = [];
      d3.nest()
        .key(function (d) {
          return d["Estado"];
        })
        .key(function (d) {
          return d["Ano"];
        })
        .rollup(function (leaves) {
          fixed.push(d3.sum(leaves, function (d) {
            return +d["Número"];
          }))
        })
        .entries(newData);

      numero_extent_fixed = d3.extent(fixed, function (d) {
        return d*2/3;
      });

      let nested = d3.nest()
        .key(function (d) {
          return d["Estado"];
        })
        .rollup(function (leaves) {
          let total = d3.sum(leaves, function (d) {
            return d["Número"];
          });

          return +total;
        })

        .entries(newData);

      numero_extent_sum = d3.extent(nested, function (d) {
        return d.value;
      });

      console.log(numero_extent_sum);

      fillStates(nested, null);


      countryYearSum = getYearSum(newData);
      countryMonthSum = getMonthSum(newData);
      previousState1 = countryYearSum;
      previousState2 = countryMonthSum;


      let ret = setupVis(countryYearSum, "#div2");//funçoes

      flag = 2;
      let ret2 = setupVis(countryMonthSum, "#div3");
      tmpState1 = previousState1;
      tmpState2 = previousState2;

      svgBars = ret.svg;
      barScales = ret.scales;

      svgBars1 = ret.svg;
      svgBars2 = ret2.svg;

      filteredState = newData;
      filteredState1 = filteredState;
      filteredState2 = countryMonthSum;


      document.getElementById("t1").firstChild.data = "Brazil";
      document.getElementById("t2").firstChild.data = "Brazil";
    })
    .catch(err => {
      console.log(err)
    });

  svg.append("g")
    .append("path")
      .datum(states_contour)
      .attr("d", path)
      .attr("class", "state_contour");

  svg.append('text')
    .attr('font-size', 30)
    .attr('font-weight', 'bold')
    .attr('x', 1.5 * margin)
    .attr('y', 30)
    .text("Brazil's Forest Fires Analyser")

}

// Function responsible for filling all states with a color matching the range of their respective number of fires.
// Data must be nested, and there are differences when it's supposed to load information from a certain period, a single
// year, or all data aggregated. The usage of color for a choropleth map was obtained from: https://github.com/luimucar/choropleth_br_counties/blob/master/index.html
function fillStates(nested, period) {
  if(period != null) {
    
  }
  let dataNested;
  nested.forEach(function (d) {
    if (d.key != "undefined") {
      if (d.values) {
        dataNested = d.values;
      }
    }
  });
  if (dataNested)
    nested = dataNested;

  let numero_extent;
  if(loadAggregateData == 1) {
    numero_extent = numero_extent_sum;
  } else {
    numero_extent = numero_extent_fixed;
  }
  let color = d3.scaleQuantize()
        .domain(numero_extent)
        .range(d3.schemeReds[9]);

  let total = 0;

  // fills each state in the map with a color related to the number of fires of said state. MouseOver, MouseOut and Click functions added.
  svg.selectAll("path")
    .data(states.features)
    .join("path")
      .attr("class", "state")
      .attr("stroke", "gray")
      .attr("fill", function (d) {
        nested.forEach(function (n) {
          firesPerState.set(n.key, n.value);
          if (n.key == d.properties.codarea) {
            total = n.value;
          }
        });
        return color(total);
      })
      .attr("d", path)
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", function (d) {
        getSingleStateData(d.properties.codarea);
      });

  // function to show the tooltip when the mouse is over a state in the map. Shows information about state and number
  // of fires. Tip code from: https://stackoverflow.com/questions/33063374/display-tooltip-close-to-the-mouse-pointer-using-d3-js-in-a-scatter-plot
  function handleMouseOver(d) {
    let format = d3.format(",");
    let label = "State: " + d.properties.codarea + "<br>" + "Forest Fires: "
      + format(firesPerState.get(d.properties.codarea));
    tip.transition()
      .duration(200)
      .style("opacity", 1);
    tip.html(label)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY) + "px");
    d3.select(this).attr("stroke", "black");
    d3.select(this).attr("stroke-width", 3);
  }

  // function to remove the tooltip when the mouse is not over a state on the map.
  // Tip code from:  https://stackoverflow.com/questions/33063374/display-tooltip-close-to-the-mouse-pointer-using-d3-js-in-a-scatter-plot
  function handleMouseOut() {
    tip.transition()
      .duration(400)
      .style("opacity", 0);
    d3.select(this).attr("stroke", "gray");
    d3.select(this).attr("stroke-width", 1);
  }

  createLegends(numero_extent, color, period);

  slider("#filter_slider", "#label");
  slider("#filter_slider2", "#label2");
  updateMapSlider("#filter_slider_map", "#label_map");
}

// Function responsible for legends creation. Here, the colors and values of the map are shown in different ranges.
// This function was inspired by: https://github.com/luimucar/choropleth_br_counties/blob/master/index.html
function createLegends(numero_extent, color, period) {

  if (loadAggregateData != 1) {
    d3.selectAll('g.legendEntry').remove();
  }
  let legend = svg.selectAll('g.legendEntry')
    .data(color.range())
    .enter()
    .append('g')
      .attr('class', 'legendEntry');

  legend
    .append('rect')
      .attr("x", 20)
      .attr("y", function (d, i) {
        return height - margin  - i * 12.5;
      })
      .attr("width", 10)
      .attr("height", 10)
      .style("stroke", "black")
      .style("stroke-width", 0.5)
      .style("fill", function (d) {
        return d;
      });

  legend
    .append('text')
      .attr('font-size', 12)
      .attr("x", 35)
      .attr("y", function (d, i) {
        return height - margin  - i * 12.5;
      })
      .attr("dy", "0.8em")
      .text(function (d, i) {
        let extent = color.invertExtent(d);
        let format = d3.format(".2s");
        if (i == 0) {
          return 0.0 + " < " + format(+extent[1]);
        }
        if (i == d.length + 1) {
          return "> " + format(+extent[0]);
        }
        return format(+extent[0]) + " - " + format(+extent[1]);
      });

  if (loadAggregateData == 1) {
    let year = "From 1998 to 2017";
    loadAggregateData = 0;
    let label = d3.select("#label_map");
    label.text(year);
    label = d3.select("#legend_map");
    label.text("NUMBER OF FIRES");
  }

  if (period != null) {
    loadAggregateData = 0;
    let label = d3.select("#label_map");
    let from = String(period[0]);
    let to = String(period[1]);

    if (from.length < 6) {
      from = "0" + from[0] + "/" + from.substr(1, 4);
    } else {
      from = from.substr(0, 2) + "/" + from.substr(2, 4);
    }
    if (to.length < 6) {
      to = "0" + to[0] + "/" + to.substr(1, 4);
    } else {
      to = to.substr(0, 2) + "/" + to.substr(2, 4);
    }
    label.text("From " + from + " to " + to);
  }
}

// function to update the map from a slider
function updateMapSlider(str, str1) {
  let slider = d3.select(str);
  let label = d3.select(str1);
  let min = 1998;
  let max = 2017;
  slider
    .attr("min", min)
    .attr("max", max)
    .attr("value", 1)
    .attr("step", 1)
    .on("input", function input() {
      getMapByYear(rawData, label, this.value)
    });
}

// function to get information by year, for each state, and also enable the usage of the reset button
function getMapByYear(data, label, year) {
  document.getElementById("reset").disabled = false;
  firesPerState = d3.map();
  label.text("In " + year);
  let nested = d3.nest()
    .key(function (d) {
      if (d["Ano"] == year)
        return d["Ano"];
    })
    .key(function (d) {
      return d["Estado"];
    })
    .rollup(function (leaves) {
      let total = d3.sum(leaves, function (d) {
        return d["Número"];
      });

      return +total;
    })
    .entries(data);
  fillStates(nested, null);
}

// function to obtain information about a single state, called when a state is clicked
function getSingleStateData(key) {


  updateName(key);
  countryState = updateCountryState(0);
  filteredState = rawData.filter(d => d.Estado == key);

  let flag = updateFlag();
  console.log(flag)
  if (flag == 1) {
    dados = getYearSum(filteredState);
  } else if (flag == 2) {
    dados = filteredState;

  } else if (flag == 3) {

    dados = getFilteredStatePerYearInit();
  }


  updateStates(filteredState);

  barState = 1;
  updateBars(svgBars, barScales, dados);

  barState = 0;

}

// function to update the states that are being filtered in the bar charts
function updateStates(state) {
  if (currentDiv == "#div2") {

    filteredState1 = state;
  } else if (currentDiv == "#div3") {
    filteredState2 = state;
  }
}

// function to update the flags that are used to identify the divs of the bar charts
function updateFlag() {
  if (currentDiv == "#div2") {

    flag = flag2;
  } else if (currentDiv == "#div3") {

    flag = flag3;
  }
  return flag;
}

// function to update the name that is presented in the bar chart (like the name of a state)
function updateName(name) {

  if (currentDiv == "#div2") {
    previousName1 = document.getElementById("t1").firstChild.data;
    document.getElementById("t1").firstChild.data = name;
  } else if (currentDiv == "#div3") {
    previousName2 = document.getElementById("t2").firstChild.data;
    document.getElementById("t2").firstChild.data = name;
  }
}

// function to save the name previously used so the user can "undo" a mistaked and go back to it
function saveName() {

  if (currentDiv == "#div2") {
    previousName1 = document.getElementById("t1").firstChild.data;

  } else if (currentDiv == "#div3") {
    previousName2 = document.getElementById("t2").firstChild.data;

  }


}