'use strict'; //treat silly mistakes as run-time errors

//set width,height and colors
var width = 500;
var height = 960;
var active = d3.select(null);

var highColor = '#2c7fb8'
var lowColor = '#edf8b1'

// D3 Projection
var projection = d3.geoAlbersUsa()
    .translate([width / 1.1, height / 3.6]) // translate to center of screen
    .scale([1000]); // scale things down so see entire US

// Define path generator
var path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
    .projection(projection); // tell path generator to use albersUsa projection

//the SVG element to add visual content to
var svg = d3.select('#visContainer')
    .append('svg')
    .attr('height', width) //can adjust size as desired
    .attr('width', height);

var g = svg.append("g")
    .style("stroke-width", "1.5px");

var div = d3.select("#visContainer")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

//the main visualization function that enables loading
//different data column of the data set
function choosedata(datacol) {
    d3.csv("energy.csv", function(data) {
        var minVal = d3.min(data, function(d) { return parseFloat(d[datacol]) })
        var maxVal = d3.max(data, function(d) { return parseFloat(d[datacol]) })
        var ramp = d3.scaleLinear().domain([minVal, maxVal]).range([lowColor, highColor])
            // Load GeoJSON data and merge with states data
            //d3.json("https://raw.githubusercontent.com/alignedleft/d3-book/master/chapter_12/us-states.json", function(json) {
        d3.json("us-states.json", function(json) {

            // Loop through each state data value in the .csv file
            for (var i = 0; i < data.length; i++) {

                // Grab State Name
                var dataState = data[i].state;

                // Grab data value 
                var dataValue = data[i][datacol];

                // Find the corresponding state inside the GeoJSON
                for (var j = 0; j < json.features.length; j++) {
                    var jsonState = json.features[j].properties.name;

                    if (dataState == jsonState) {

                        // Copy the data value into the JSON
                        json.features[j].properties.value = dataValue;

                        // Stop looking through the JSON
                        break;
                    }
                }
            }

            //create tooltip when user hover on the map to show specific data
            var tooltip = d3.select("#tooltip")
                .append("div")
                .style("visibility", "hidden")


            //remove the old map before draw the new map
            svg.selectAll("path").remove();

            // Bind the data to the SVG and create one path per GeoJSON feature
            svg.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "feature")
                .style("stroke", "#fff")
                .style("stroke-width", "1")
                .style("fill", function(d) { return ramp(d.properties.value) })
                .on("mouseover", function(d) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    div.text(d.properties.name + ": " + Math.round(d.properties.value * 100) + "% of total users")
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", clicked);

            svg.append("path")
                // needs to modify
                .datum(topojson.mesh(json, json.features, function(a, b) { return a !== b; }))
                .attr("class", "mesh")
                .attr("d", path);


            // add a legend
            //set legend width and height
            var w = 165,
                h = 450;

            //create an area in the visualization for legend
            var key = d3.select("#visContainer")
                .append("svg")
                .attr("width", w)
                .attr("height", h)
                .attr("class", "legend");

            var legend = key.append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "100%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad")

            //set begin and end color for legend
            legend.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", highColor)
                .attr("stop-opacity", 1);

            legend.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", lowColor)
                .attr("stop-opacity", 1);

            //draw a bar to show color and corresponding data
            key.append("rect")
                .attr("width", w - 110)
                .attr("height", h - 5)
                .style("fill", "url(#gradient)")
                .attr("transform", "translate(0,10)");

            //Create a linear scale for the y values. 
            var y = d3.scaleLinear()
                .range([h, 10])
                .domain([minVal, maxVal]);

            //Define a right axis for the y-scale
            var yAxis = d3.axisRight(y);

            //Append a <g> element to the key to contain the yAxis.
            key.append("g")
                .attr("class", "y axis")
                .call(yAxis);
        });

    })
};

function clicked(d) {
    if (active.node() === this) return reset();
    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = .3 / Math.max(dx / height, dy / width),
        translate = [height / 2 - scale * x, width / 2 - scale * y];

    svg.transition()
        .duration(750)
        .style("stroke-width", 1.5 / scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
}

function reset() {
    active.classed("active", false);
    active = d3.select(null);

    g.transition()
        .duration(750)
        .style("stroke-width", "1.5px")
        .attr("transform", "");
}

//set the default visualization
choosedata('desktopUser')

//An example of handling multiple buttons!
d3.selectAll('button').on('click', function() {
    //get the id of which element caused the event
    var whichButton = d3.select(d3.event.target).attr('id');

    //determine what to do based on that id
    if (whichButton == 'TotalConsumption') {
        choosedata('laptopUser');
    } else if (whichButton == 'BiomassConsumption') {
        choosedata('mobilePhoneUser');
    } else if (whichButton == 'HydroConsumption') {
        choosedata('tvBoxUser');
    } else if (whichButton == 'CoalConsumption') {
        choosedata('tabletUser');
    } else if (whichButton == 'NatGasConsumption') {
        choosedata('wearableUser');
    } else if (whichButton == 'FossFuelConsumption') {
        choosedata('internetUser');
    }
});