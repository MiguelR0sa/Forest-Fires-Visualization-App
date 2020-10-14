/*Description: Initializa all global variables including svgs*/
function setupVis(data, str) {
  let height = barheight;
  let width = barWidth;

  // scatterplot setup
  let svgBars = d3.select(str)
    .append("svg")
      .attr("class", str)
      .attr("width", width)
      .attr("height", height);
  let xBars = computeXScale(data);

  let yBars = computeYScale(data);


  barScales = {"x": xBars, "y": yBars};

  let x_axis = d3.axisBottom(xBars);
  svgBars.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - 20) + ")")
    .call(x_axis);
  //y axis
  let y_axis = d3.axisLeft(yBars);
  svgBars.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin + " ,-20)")
    .call(y_axis);

  if (str == "#div2") {
    svgBars1 = svgBars;
    title1 = title;
  } else if (str == "#div3") {
    svgBars2 = svgBars;
    title1 = title;
  }
  drawBars(svgBars, barScales, data);


  ret = {"svg": svgBars, "scales": barScales}
  return ret;


}

/*Description: Save and update state variables need for the rollback button*/
function updateMemory(data) {
  if (currentDiv == "#div2") {
    previousState1 = tmpState1;
    tmpState1 = data;

  } else if (currentDiv == "#div3") {
    previousState2 = tmpState2;
    tmpState2 = data;

  }
}

/*Description: Draw bar chart from scratch*/
function drawBars(svgBars, scales, data) {
  let height = barheight;
  let width = barWidth;
  let xBars = computeXScale(data);
  let yBars = computeYScale(data);
  updateFlag();
  updateMemory(data);

  let brush = d3.brush().on("end", brushed);


  //Clear previous
  svgBars.selectAll("*").remove();


  //Redraw axis
  let x_axis = d3.axisBottom(xBars)
    .tickSizeOuter(0);
  svgBars.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - 20) + ")")
    .call(x_axis)
    .selectAll("text")
      .attr("transform", "rotate(65)");
  //y axis
  let y_axis = d3.axisLeft(yBars);
  svgBars.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + margin + " ,-20)")
    .call(y_axis);


  //Draw empty bar chart
  barsRect = svgBars.selectAll("rect")
    .data(data)
    .join("rect")
      .attr("x", function (d, i) {
        return xBars(i)
      })
      .attr("y", height - 20)
      .attr("width", (width - margin) / data.length)
      .attr("height", 0)
      .style("fill", "#fed976")
      .style("stroke", "black")
      .on("mouseover", function (d) {
        console.log(d.Ano, d.Mês, d.Periodo);
      });


  //Transition to real values
  barsRect = svgBars.selectAll("rect")
    .data(data)
    .transition()
    .duration(400)
    .ease(d3.easeLinear)
    .attr("y", function (d) {
      return yBars(d.Número) - 20;
    })
    .attr("height", d => height - yBars(d.Número));

  //Draw axis skeleton
  y_axis = d3.axisLeft(yBars);
  svgBars.selectAll("g.y.axis")
    .transition()
    .call(y_axis);


  xTime = computeTimeScale_G(data);

  x_axis = d3.axisBottom(xTime)

  //flag correponds to the dropdown menu position, the x axis
  if (flag == 1)
    x_axis.tickFormat(d3.timeFormat("%Y"));
  else if (flag == 2)
    x_axis.tickFormat(d3.timeFormat("%Y-%b"));
  else if (flag == 3)
    x_axis.tickFormat(d3.timeFormat("%B"));

  svgBars.selectAll("g.x.axis")
    .call(x_axis);


  //Initialize brush
  brushGroup = svgBars.join("g")
    .attr("class", "brush")
    .call(brush);
  if (svgBars == svgBars1) {
    brushGroup1 = brushGroup;

  } else if (svgBars == svgBars2) {
    brushGroup2 = brushGroup;
  }


  //Brush function
  function brushed() {
    if (!d3.event.sourceEvent) return;

    if (svgBars == svgBars1)
      setCurrentDiv2();
    else
      setCurrentDiv3();

    sel = d3.event.selection;
    if (sel != null) {
      selX = [Math.floor(xBars.invert(sel[0][0])), Math.floor(xBars.invert(sel[1][0]))];

      //convert position to date and the to order "YYYYMM"
      selT = [xTime.invert(sel[0][0]).getFullYear() * 100 + xTime.invert(sel[0][0]).getMonth(), xTime.invert(sel[1][0]).getFullYear() * 100 + xTime.invert(sel[1][0]).getMonth()];
      let selY = [yBars.invert(sel[0][1]), yBars.invert(sel[1][1])];

      //filter data
      zoomed = data.filter((d, i) => i >= selX[0] && i <= selX[1]);
      let filteredMapData = rawData.filter((d, i) => d.Order >= selT[0] && d.Order <= selT[1]);
      let period = [];
      period.push(filteredMapData[0]["Periodo"]);
      period.push(filteredMapData[filteredMapData.length - 1]["Periodo"]);
      console.log(period);

      //destroy the brush
      svgBars.selectAll("g.brush").remove();
      brushGroup.call(brush.move, null);


      //Perform the action corresponding to the mode selected: zoom/brush2map
      if (brushFlag == 1) {
        //nesting is needed due to imcompatibilite with the map lib
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
          .entries(filteredMapData);

        //
        fillStates(nested, period);
      } else if (zoomFlag == 1) {
        saveName();
        drawBars(svgBars, [], zoomed)
      }
    }
  }


}


/*Description: Update the bar chart without redrawing it, may return the drawBars function, if a redraw is requested */
function updateBars(svgBars, scales, data) {
  let height = barheight;
  let width = barWidth;
  let yBars = computeYScale(data);
  let xBars = computeXScale(data);


  if (barState == 1)
    return drawBars(svgBars, scales, data);

  updateMemory(data);


  y_axis = d3.axisLeft(yBars);

  y_axis.scale(yBars);
  svgBars.selectAll("g.y.axis")
    .transition()
    .call(y_axis);

  barsRect = svgBars.selectAll("rect")
    .data(data)
    .transition()
    // .delay(400)
    .duration(400)
    .ease(d3.easeLinear)
    .attr("y", function (d) {
      return yBars(d.Número) - 20;
    })
    .attr("height", d => height - yBars(d.Número));

}

/*Description:Compute x scale related to array length */
function computeXScale(data) {
  let width = barWidth - margin;
  let xBars = d3.scaleLinear()
    .rangeRound([margin, width])
    .domain([0, d3.max(data, function (data, i) {
      return i;
    })]);
  return xBars;

}

/*Description:Compute fixed year scale */
function computeTimeScale(data) {
  let width = barWidth - margin;
  let xTime = d3.scaleLinear()
    .rangeRound([margin, width])
    //.domain([d3.min(data,function(d,i){return d.Ano;}),d3.max(data,function(d,i){return d.Ano;})]);
    .domain([1998, 2017]);
  return xTime;

}

/*Description:COmpute fixed month scale */
function computeMonthScale(data) {
  let width = barWidth - margin;
  let sms = width / 24;
  let xTime = d3.scalePoint()
    .domain(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"])
    .range([margin + sms, width + sms]);
  return xTime;

}

/*Description:Compute dynamic scale by first searcing for its bounds*/
function computeTimeScale_G(data) {

  let width = barWidth - margin;
  let sms = width / (data.length * 2);
  let domain;
  if (data[0].Periodo != undefined) {
    let yearMin = d3.min(data, d => d.Periodo % 10000);
    let yearMax = d3.max(data, d => d.Periodo % 10000);
    let monthMin = d3.min(data, d => Math.floor(d.Periodo / 10000));
    let monthMax = d3.max(data, d => Math.floor(d.Periodo / 10000));
    console.log(yearMin, yearMax, monthMin, monthMax);
    domain = [+new Date(yearMin, monthMin - 1, 1), +new Date(yearMax, monthMax - 1, 1)];
  } else {
    let yearMin = d3.min(data, d => d.Ano);
    let yearMax = d3.max(data, d => d.Ano);
    console.log(yearMin, yearMax);
    domain = [+new Date(yearMin, 0, 0), +new Date(yearMax, 0, 12)];
  }
  let xTime = d3.scaleTime()
    .rangeRound([margin + sms, width + sms])

    .domain(domain);

  return xTime;
}

/*Description:Compute dynamic  y scale by first searcing for its bounds*/
function computeYScale(data) {
  let width = barWidth;
  let height = barheight;
  let Ydomain;

  Ydomain = [d3.max(data, d => +d.Número), 0];

  yBars = d3.scaleLinear()
    .range([margin, height])
    .domain(Ydomain);
  return yBars;
}