//Jeff Kalar GEOG 575 Fall 2020 - Lab 2 Coordinated Viz javascript (D3) file

//Anonymous function - local scope
(function(){

//attributes from csv - pseudo-global variables
var attrArray = ["2018", "2016", "2014", "2012", "2010", "2008", "2006", "2004", "2002", "2000"]; 

//list of attributes
var expressed = attrArray[0]; //start
	
//chart frame dimensions  - Formerly under: FUNCTION - CREATE COORDINATED BAR CHART
var chartWidth = window.innerWidth * .38,
    chartHeight = 472,
    leftPadding = 30,
    rightPadding = 5,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
	
var yScale = d3.scaleLinear()
    .range([chartHeight - 10, 0])
    .domain([0, 80]);

//begin script when window loads
window.onload = setMap();
	
	
//FUNCTION SETMAP
//set up choropleth: FUNCTION SETMAP
function setMap(){
	
	//dimensions
	var width = window.innerWidth * 0.48;
		height = 600;

	//create new svg container for the map
	var map = d3.select("body")
		.append("svg")
		.attr("class", "map")
		.attr("width", width)
		.attr("height", height);

	//create AlbersUSA equal area conic to include Alaska and Hawaii
	var projection = d3.geoAlbersUsa()
		.scale(1000)
		.translate([width / 2, height / 2]);
	
	//create the path generator for the map projection
	var path = d3.geoPath()
		.projection(projection);

	//use Promise.all to parallelize asynchronous data loading
	var promises = [];
	//load attributes from csv
	promises.push(d3.csv("data/voterTurnout.csv"));
	
	//load choropleth spatial data
	promises.push(d3.json("data/us-states_topo.topojson")); 
	Promise.all(promises).then(callback);
	
	
	
	//FUNCTION CALLBACK
	function callback(data){ 

		csvData = data[0];		
		us_states = data[1];		
		
		//translate us_states TopoJSON		
		states_background = topojson.feature(us_states, us_states.objects.collection).features;
		
		// Redefine states_background variable
		states_background = joinData(states_background, csvData);
		
		//create the color-scale for the choropleth map
		var colorScale = makeColorScale(csvData);
		
		//add enumeration units to the map
		setEnumerationUnits(states_background, map, path, colorScale);
		
		//add coordinated visualization to the map
		setChart(csvData, colorScale);	
		
		//dropdown menu
		createDropdown(csvData);
		
	
	};
};   //end setMap()
	
	

//FUNCTION JOIN DATA
//loop through the csv to and join
function joinData(states_background, csvData){
	
	for (var i=0;i<csvData.length; i++){
		var csvRegion = csvData[i];
		var csvKey = csvRegion.name; //csv primary key
		
		//loop through geojson & find correct region
		for (var a=0; a<states_background.length; a++){
			
			var geojsonProps = states_background[a].properties;
			
			var geojsonKey = geojsonProps.name; //matched primary key
			
			//transfer data from csv to geojson if there's a match of the primary key
			
			if (geojsonKey == csvKey){
				
				//assign attributes if ==
				attrArray.forEach(function(attr){
					var val = parseFloat(csvRegion[attr]);
					
					//get csv attribute
					geojsonProps[attr] = val;
				});
			};
		};
	};
		
console.log(states_background);
	return states_background;
};	
	

	
//FUNCTION - NATURAL BREAKS COLOR SCALE
//Classify the data - Use Natural Breaks color scale

function makeColorScale(data){
	var colorClasses = [
		"#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043",
		"#380043"		
		
    ];
	
	//create the generator
	var colorScale = d3.scaleQuantile()
		.range(colorClasses);
	
	//build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };    

	//domainArray.shift();
    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
	console.log(domainArray);

    return colorScale;
};
	
	
	
	
// Choropleth function which will test for missing data values

function choropleth(props, colorScale){
	
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    
	//if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#fff";
    };
};
	
	
	
//FUNCTION SETENUMERATION UNITS	
function setEnumerationUnits(states_background, map, path, colorScale){
    
	//add US states
	var regions = map.selectAll(".regions")
		.data(states_background)
		.enter()
		.append("path")
		.attr("class", function(d){
			return "regions " + d.properties.name;
		})
		.attr("d", path)
        .attr("cursor", "pointer")
		.style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
		.on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);
    
    //below Example 2.2 line 16...add style descriptor to each path
    var desc = regions.append("desc")
    .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};	
	

	
//FUNCTION - CREATE COORDINATED BAR CHART
function setChart(csvData, colorScale){
    

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
     

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.props;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("cursor", "pointer")
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);

	var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
	
	//Code for labeling the bars directly would go here. Label Y axis instead.	
	
	var chartTitle = chart.append("text")
        .attr("x", 80)
        .attr("y", 25)
        .attr("class", "chartTitle")
        .text("Percent of eligible voters who voted in the selected year.");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
	//set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};

//FUNCTION CREATE DROPDOWN MENU - SELECT BY YEAR	
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Year");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};	
	
//FUNCTION CHANGE ATTRIBUTE IN DROPDOWN BOX
	
function changeAttribute(attribute, csvData){
	expressed = attribute;
	
	//Change the Y scale dynamically
	csvmax = d3.max(csvData, function(d) { return
	parseFloat(d[expressed]); });
	
	//Change the Y scale dynamically - compare or match with line 232
	yScale = d3.scaleLinear()
        .range([chartHeight - 10, 0])
        .domain([0, 80]);
	
	
	//update vertical axis 
    d3.select(".axis").remove();
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = d3.select(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor states
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(400);

    updateChart(bars, csvData.length, colorScale);
};
	
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 464 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    //add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text("Percent of eligible voters who voted in the selected year.");
};

//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.name)
        .style("stroke", "red")
        .style("stroke-width", "5");
    
    setLabel(props);
};

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.name)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    //below Example 2.4 line 21...remove info label
    d3.select(".infolabel")
        .remove();

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
};

//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.name + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};

//function to move info label with mouse
//Example 2.8 line 1...function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
  /*  var zoomSettings = {
        duration: 1000,
        ease: d3.easeCubicOut,
        zoomLevel: 5
    };
    
    function clicked(d) {
        var x;
        var y;
        var zoomLevel;
        
        if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            zoomlevel = zoomSettings.zoomLevel;
            centered = d;
        } else {
            x = width / 2;
            y =  height / 2;
            zoomLevel = 1;
            centered = null;
        }
    
        g.transition()
            .duration(zoomSettings.duration)
            .ease(zoomSettings.ease)
    }*/

    
    
})(); //last line of main.js
	
	
	

					