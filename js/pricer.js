var tau = 2 * Math.PI; // http://tauday.com/tau-manifesto

//Progress colors (Ailadi scheme)
var colors = ['#CC0000', '#FF5F06', '#F39224', '#EDC82B', '#E5E131', '#E5E131', '#B9DB50', '#B9DB50', '#8DD685', '#30ad77'];

var scoreDomain = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

var colorDomain = d3.scale.linear().domain(scoreDomain).range(colors);
var greyScale = d3.scale.linear().domain([0, 100]).range(['#666', '#eee']);//video completion

//var pvis = d3.select("#graphDiv").append("svg").attr("width", 900).attr("height", 200);

//// Video
//pvis.append("text").attr("class", "txt").attr("x", 60).attr("y", 75).text("Text").attr("fill", "#999")
//    .style("font-size", "10px").style("text-anchor", "middle");
//
//// Problems
//pvis.append("text").attr("class", "txt").attr("x", 125).attr("y", 28).text("Text").attr("fill", "#999")
//    .style("font-size", "10px").style("text-anchor", "middle");


var data = [];


var pricer = function () {


    function compute() {

        // inputs //

        var redeem = +$('#a').val();// C2 - 90 to 110%
        var maturity = +$('#b').val();// E2 - 1 to 20 years
        var coupon = +$('#c').val();// G2 - 0 to 20%
        var marketRate = +$('#d').val();// D4 - 5%
        var delta = +$('#e').val();// G4 - 0 to 0.3%

        console.info(redeem, maturity, coupon, marketRate, delta);

        //controls
        if (maturity < 1) {
            console.warn('maturity<1');
            return;
        }

        var out = {
            flux: [],
            df: [],
            rate: [marketRate - delta, marketRate, marketRate + delta],
            price: [0, 0, 0],
            duration: [0, 0, 0],
            impliedPrice: [0, 0, 0],
            deltaPrice: [0, 0, 0],
            priceFull: {},
            line2: {}
        }

        // Compute for graph
        var dfFull = {},
            priceFull = {};

        for (var i = 0; i < maturity; i++) {
            var j = i + 1;
            out.flux[i] = coupon;
            var minus = 1 / Math.pow((1 + ((marketRate - delta) / 100)), j);//1/((1+((marketRate-delta)/100))*j);
            var nominal = 1 / Math.pow((1 + (marketRate / 100)), j);
            var plus = 1 / Math.pow((1 + ((marketRate + delta) / 100)), j);//1/((1+((marketRate+delta)/100))*j);
            out.df[i] = [minus, nominal, plus];
            dfFull[i] = computeFullDF(marketRate, 1.5, j);
        }


        out.flux[(maturity - 1)] = coupon + redeem;

        //compute prices//
        var price0 = 0, tmp;
        price1 = 0;
        price2 = 0;
        for (var i = 0; i < maturity; i++) {
            price0 += (out.flux[i]) * out.df[i][0];
            price1 += (out.flux[i]) * out.df[i][1];
            price2 += (out.flux[i]) * out.df[i][2];

            for (var key in dfFull[i]) {
                tmp = out.flux[i] * dfFull[i][key];
                priceFull[key] = priceFull.hasOwnProperty(key) ? (tmp + priceFull[key]) : tmp;
            }
        }

        out.price = [price0, price1, price2];
        out.priceFull = dic2list(priceFull);

        //compute duration
        var d0 = 0;
        d1 = 0;
        d2 = 0;
        for (var i = 0; i < maturity; i++) {
            var j = i + 1;
            d0 += (out.flux[i]) * out.df[i][0] * j;
            d1 += (out.flux[i]) * out.df[i][1] * j;
            d2 += (out.flux[i]) * out.df[i][2] * j;
        }
        out.duration = [d0 / price0, d1 / price1, d2 / price2];

        //implied price
        out.impliedPrice = [price1 + d1 / price1 * delta, price1, price1 - d1 / price1 * delta];
        //delta price
        out.deltaPrice = [out.impliedPrice[0] - price0, out.impliedPrice[1] - price1, out.impliedPrice[2] - price2];

        // compute line2 for graph
        out.line2 = $(out.priceFull).map(function () {
            return {
                'x': this.x,
                'y': (out.rate[1] - parseFloat(this.x)) * out.duration[1] + out.price[1]
            }
        }).toArray();

        //ktksbye
        return out;
    }

    function computeFullDF(marketRate, delta, year) {
        var marketRateB, result = {};
        var d = -delta;
        while (d <= delta) {
            d = (marketRate + d) < 0 ? -marketRate : d;
            marketRateB = marketRate + d;
            result[marketRateB] = Math.round((1 / Math.pow((1 + ((marketRateB) / 100)), year)) * 1e6) / 1e6;
            d = Math.round((d + 0.001) * 1e3) / 1e3;
        }
        return result
    }

    function dic2list(dic) {
        var list = [];
        for (var key in dic) {
            list.push({
                'x': key,
                'y': dic[key].toFixed(4)
            });
        }
        list.sort(function (a, b) {
            var delta = parseFloat(a.x) - parseFloat(b.x);
            if (delta < 0) return -1;
            else if (delta > 0) return 1;
            else return 0;
        });
        return list
    }


    return {
        compute: compute
    }
}();

$(function () {

    // Store zoom instance globally to limit one instance existing at max
    var zoom;

    $('#a,#b,#c,#d,#e').on('change', function () {

        $('#a').val(+$('#a').val());//force num
        if ($('#a').val() < 90)$('#a').val('90.00');
        if ($('#a').val() > 110)$('#a').val('110.00');

        $('#b').val(Math.round(+$('#b').val()));//forceint
        if ($('#b').val() < 1)$('#b').val(1);
        if ($('#b').val() > 99)$('#b').val(99);

        //Coupon : 0-20.00
        $('#c').val(+$('#c').val());
        if ($('#c').val() < 0)$('#c').val(0);
        if ($('#c').val() > 20)$('#c').val('20.00');

        //Market rate 0-10.00%
        $('#d').val(+$('#d').val());//force num
        if ($('#d').val() < 0)$('#d').val(0);
        if ($('#d').val() > 20)$('#d').val('20.00');

        //Delta : 0 to 0,30%
        $('#e').val(+$('#e').val());//force num
        if ($('#e').val() < 0) $('#e').val(0);
        if ($('#e').val() > 1.5) $('#e').val('1.50');
        if ($('#e').val() > parseFloat($('#d').val())) $('#e').val($('#d').val());
        refresh();
    });

    function refresh() {

        out = pricer.compute();
        console.log('change', out);

        drawGraph(out);

        /**
         * Round value with 2 digits precision
         * @param  {[type]} n [description]
         * @return {number}   [description]
         */
        var round2 = function (n) {
            return Math.round(n * 1e2) / 1e2;
        }

        /**
         * Round value with 4 digits precision
         * @param  {[type]} n [description]
         * @return {number}   [description]
         */
        var round4 = function (n) {
            return Math.round(n * 1e4) / 1e4;
        }

        //Show DF details

        var htm = [];
        htm.push("<table class='table table-condensed'>");
        htm.push("<thead>");
        htm.push("<th>Year</th>");
        htm.push("<th style='text-align:right'>Flux</th>");
        htm.push("<th style='text-align:right'>DF - delta</th>");
        htm.push("<th style='text-align:right'>DF nominal</th>");
        htm.push("<th style='text-align:right'>DF + delta</th>");
        htm.push("</thead>");

        htm.push("<tbody>")
        for (var i = 0; i < out.flux.length; i++) {
            htm.push("<tr>");
            htm.push("<td>" + (i + 1));
            htm.push("<td style='text-align:right'>" + out.flux[i] + " %");
            htm.push("<td style='text-align:right'>" + round2(out.df[i][0]));
            htm.push("<td style='text-align:right'>" + round2(out.df[i][1]));
            htm.push("<td style='text-align:right'>" + round2(out.df[i][2]));
        }
        htm.push("</tbody>");
        htm.push("</table>");

        //$('#details').html(htm.join(''));

        // Taux actuariel
        $('#r1').find('td').eq(1).html(out.rate[0] + " %");
        $('#r1').find('td').eq(2).html(out.rate[1] + " %");
        $('#r1').find('td').eq(3).html(out.rate[2] + " %");
        // Price
        $('#r2').find('td').eq(1).html(round2(out.price[0]) + " %");
        $('#r2').find('td').eq(2).html(round2(out.price[1]) + " %");
        $('#r2').find('td').eq(3).html(round2(out.price[2]) + " %");
        // Duration
        $('#r3').find('td').eq(1).html(round4(out.duration[0]));
        $('#r3').find('td').eq(2).html(round4(out.duration[1]));
        $('#r3').find('td').eq(3).html(round4(out.duration[2]));
        // Prix induit par duration
        $('#r4').find('td').eq(1).html(round2(out.impliedPrice[0]) + " %");
        $('#r4').find('td').eq(2).html(round2(out.impliedPrice[1]) + " %");
        $('#r4').find('td').eq(3).html(round2(out.impliedPrice[2]) + " %");
        // Delta price
        $('#r5').find('td').eq(1).html(round4(out.deltaPrice[0]) + " %");
        $('#r5').find('td').eq(2).html(round4(out.deltaPrice[1]) + " %");
        $('#r5').find('td').eq(3).html(round4(out.deltaPrice[2]) + " %");

    }

    refresh();

    function drawGraph(out) {
        var data0 = out.priceFull;
        var data1 = out.line2;
        // define dimensions of graph
        var margin = 50; //px
        var w = $('#graphDiv').width() - margin * 2; // width
        var h = 400 - margin * 2; // height
        var graph;

        var xScale, yScale, xAxis, yAxis, lineFunc;

        function calAxis() {
            // Fit scale with data
            xScale = d3.scale.linear()
                .domain([
                    (parseFloat(getMin(data0.concat(data1), 'x')) - 0.251).toFixed(2), (parseFloat(getMax(data0.concat(data1), 'x')) + 0.251).toFixed(2)
                ])
                .range([0, w]);
            yScale = d3.scale.linear()
                .domain([
                    (parseFloat(getMin(data0.concat(data1), 'y')) - 1.1).toFixed(2), (parseFloat(getMax(data0.concat(data1), 'y')) + 1.1).toFixed(2)])
                .range([h, 0]);

            // create/update axises
            xAxis = d3.svg.axis().scale(xScale).ticks(7).orient("bottom");
            yAxis = d3.svg.axis().scale(yScale).ticks(10).orient("left");

            // create a line function that can convert data[] into x and y points
            lineFunc = d3.svg.line()
                // assign the X function to plot our line as we wish
                .x(function (d) {
                    // return the X coordinate where we want to plot this datapoint
                    return xScale(d.x);
                })
                .y(function (d) {
                    // return the Y coordinate where we want to plot this datapoint
                    return yScale(d.y);
                })
                .interpolate("basis");
        }

        if ($("#graphDiv svg").length == 0) {
            calAxis();
            // Create zoom listener
            zoom = d3.behavior.zoom().x(xScale).y(yScale)
                .scaleExtent([1, 100]).on("zoom", reScale);

            // Add an SVG element with the desired dimensions and margin.
            graph = d3.select("#graphDiv").append("svg:svg")
                .attr("width", w + margin * 2)
                .attr("height", h + margin * 2)
                .append("svg:g")
                .attr("transform", "translate(50,50)")
                .attr('class', 'container')
                .attr('fill-rule', 'nonzero');

            // Add x, y axises
            graph.append("svg:g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + h + ")")
                .call(xAxis);
            graph.append("svg:g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(yAxis);

            graph.append("svg:g")
                .attr("class", "lines")
                .attr("transform", "translate(0,0)")
                .attr("width", w)
                .attr("height", h)
                .attr("pointer-events", "all")
                .attr("clip-path", "url(#clip)");

            graph.append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", w)
                .attr("height", h);


            graph.append("svg:rect")
                .attr("class", "pane")
                .attr("width", w)
                .attr("height", h)
                .attr("fill-opacity", 0)
                .call(zoom);

            // Add curve
            graph.select('g.lines').append("svg:path").attr("class", "line1 line").attr("d", lineFunc(data0)).attr('vector-effect', "non-scaling-stroke");
            graph.select('g.lines').append("svg:path").attr("class", "line2 line").attr("d", lineFunc(data1)).attr('vector-effect', "non-scaling-stroke");

            // Add lines
            graph.select('g.lines').append("svg:line")
                .attr("y1", yScale(0)).attr("y2", yScale(out.price[1])).attr("x1", xScale(out.rate[1])).attr("x2", xScale(out.rate[1]))
                .attr("stroke", "#555").attr("stroke-width", "1").attr('class', 'x1 line').attr('stroke-dasharray', '10, 5')
                .attr('vector-effect', "non-scaling-stroke");
            graph.select('g.lines').append("svg:line")
                .attr("y1", yScale(out.price[1])).attr("y2", yScale(out.price[1])).attr("x1", xScale(-3)).attr("x2", xScale(out.rate[1]))
                .attr("stroke", "#555").attr("stroke-width", "1").attr('class', 'y1 line').attr('stroke-dasharray', '10, 5')
                .attr('vector-effect', "non-scaling-stroke");
        } else {
            calAxis();
            graph = d3.select("#graphDiv").transition().duration(1000);

            zoom.scale(1).translate([0, 0]).on("zoom", function () {
                reScale(graph);
            });
            zoom.event($('rect.pane'));
            zoom.x(xScale).y(yScale);
            zoom.on("zoom", reScale);
            graph.select('path.line1').attr("d", lineFunc(data0));
            graph.select('path.line2').attr("d", lineFunc(data1));

            graph.select("line.x1").attr("y1", yScale(0)).attr("y2", yScale(out.price[1]))
                .attr("x1", xScale(out.rate[1])).attr("x2", xScale(out.rate[1]));
            graph.select("line.y1").attr("y1", yScale(out.price[1])).attr("y2", yScale(out.price[1]))
                .attr("x1", xScale(-3)).attr("x2", xScale(out.rate[1]));
        }

        function reScale(that_graph) {
            if (typeof(that_graph) === "undefined") {
                that_graph = d3.select("#graphDiv");
            }
            var limitfiedPan = panLimited(d3.event.translate, d3.event.scale);
            zoom.translate(limitfiedPan);
            that_graph.selectAll('.line').attr("transform", "translate(" + limitfiedPan + ") scale(" + d3.event.scale + ")");
            that_graph.select(".x.axis").call(xAxis);
            that_graph.select(".y.axis").call(yAxis);

            //console.log(d3.event.translate);
            //console.log(d3.event.scale);
        }

        // Add the line by appending an svg:path element with the data line we created above
        // do this AFTER the axes above so that the line is above the tick-lines
        function getMax(data, key) {
            var max = 0;
            $(data).each(function () {
                max = (parseFloat(this[key]) > parseFloat(max)) ? this[key] : max;
            });
            return max
        }

        function getMin(data, key) {
            var min = -1;
            $(data).each(function () {
                min = (parseFloat(this[key]) < parseFloat(min)) ? this[key] : (min > -1 ? min : this[key]);
            });
            return min
        }

        function panLimited(translate, scale) {
            var minX = Number(-w * scale).toFixed(2),
                maxX = Number(w).toFixed(2),
                minY = Number(-h * scale).toFixed(2),
                maxY = Number(h).toFixed(2);
            var x = (translate[0] < minX) ? minX :
                    (translate[0] > maxX) ? maxX : translate[0],
                y = (translate[1] < minY) ? minY :
                    (translate[1] > maxY) ? maxY : translate[1];
            return [x, y];
        }

    }

});



