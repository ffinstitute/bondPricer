var data = [];

var pricer = function () {

    function compute() {
        // inputs //
        var redeem = +$('#a').val();// C2 - 90 to 110%
        var maturity = +$('#b').val();// E2 - 1 to 20 years
        var coupon = +$('#c').val();// G2 - 0 to 20%
        var marketRate = +$('#d').val();// D4 - 5%
        var delta = +$('#e').val();// G4 - 0 to 0.3%

        //console.info(redeem, maturity, coupon, marketRate, delta);

        //controls
        if (maturity < 1) {
            console.warn('maturity<1');
            return;
        }

        var out = {
            flux: [],
            df: [],
            rate: [marketRate - delta, marketRate, marketRate + delta],
            price: [],
            duration: [],
            impliedPrice: [],
            deltaPrice: [],
            modifiedDuration: [],
            MDImpliedPrice: [],
            MDDeltaPrice: [],
            priceFull: {},
            line2: {},
            line3: {}
        };

        // Compute for graph
        var dfFull = {},
            priceFull = {};

        for (var year = 0; year < maturity; year++) {
            j = year + 1;
            out.flux[year] = coupon;
            var minus = 1 / Math.pow((1 + ((marketRate - delta) / 100)), j);//1/((1+((marketRate-delta)/100))*j);
            var nominal = 1 / Math.pow((1 + (marketRate / 100)), j);
            var plus = 1 / Math.pow((1 + ((marketRate + delta) / 100)), j);//1/((1+((marketRate+delta)/100))*j);
            out.df[year] = [minus, nominal, plus];
            dfFull[year] = computeFullDF(marketRate, 1.5, j);
        }


        out.flux[(maturity - 1)] = coupon + redeem;

        //compute prices//
        var price0 = 0, tmp,
            price1 = 0,
            price2 = 0;
        for (year = 0; year < maturity; year++) {
            price0 += (out.flux[year]) * out.df[year][0];
            price1 += (out.flux[year]) * out.df[year][1];
            price2 += (out.flux[year]) * out.df[year][2];

            for (var key in dfFull[year]) {
                tmp = out.flux[year] * dfFull[year][key];
                priceFull[key] = priceFull.hasOwnProperty(key) ? (tmp + priceFull[key]) : tmp;
            }
        }

        out.price = [price0, price1, price2];
        out.priceFull = dic2list(priceFull);

        //compute duration
        var d0 = 0,
            d1 = 0,
            d2 = 0;
        for (year = 0; year < maturity; year++) {
            j = year + 1;
            d0 += (out.flux[year]) * out.df[year][0] * j;
            d1 += (out.flux[year]) * out.df[year][1] * j;
            d2 += (out.flux[year]) * out.df[year][2] * j;
        }
        out.duration = [d0 / price0, d1 / price1, d2 / price2];
        out.modifiedDuration = [
            out.duration[0] / (1 + out.rate[0] / 100),
            out.duration[1] / (1 + out.rate[1] / 100),
            out.duration[2] / (1 + out.rate[2] / 100)
        ];

        //implied price
        out.impliedPrice = [price1 + d1 / price1 * delta, price1, price1 - d1 / price1 * delta];

        // modified duration implied price
        out.MDImpliedPrice = [price1 + out.modifiedDuration[1] * delta, price1, price1 - out.modifiedDuration[1] * delta];

        //delta price
        out.deltaPrice = [out.impliedPrice[0] - price0, out.impliedPrice[1] - price1, out.impliedPrice[2] - price2];
        out.MDDeltaPrice = [out.MDImpliedPrice[0] - price0, out.MDImpliedPrice[1] - price1, out.MDImpliedPrice[2] - price2];
        // compute line2 for graph
        out.line2 = $(out.priceFull).map(function () {
            return {
                'x': this.x,
                'y': (out.rate[1] - parseFloat(this.x)) * out.duration[1] + out.price[1]
            }
        }).toArray();

        // compute line3 for graph
        out.line3 = $(out.priceFull).map(function () {
            return {
                'x': this.x,
                'y': (out.rate[1] - parseFloat(this.x)) * out.modifiedDuration[1] + out.price[1]
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
    var zoom, out;

    $('#a,#b,#c,#d,#e').on('change', function () {

        console.log('#a,#b,#c,#d,#e');

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

    $('button#reset-zoom').click(function () {
        refresh(true);
    });

    var t;
    $(window).resize(function () {
        clearTimeout(t);
        t = setTimeout(function () {//less violence
            refresh(true);
        }, 300);

    });

    function refresh(skipCompute) {

        if (!skipCompute) {
            out = pricer.compute();
        }

        //console.log('change', out);

        drawGraph(out);

        /**
         * Round value with 2 digits precision
         * @param  {[type]} n [description]
         * @return {number}   [description]
         */
        var round2 = function (n) {
            return Math.round(n * 1e2) / 1e2;
        };

        /**
         * Round value with 4 digits precision
         * @param  {[type]} n [description]
         * @return {number}   [description]
         */
        var round4 = function (n) {
            return Math.round(n * 1e4) / 1e4;
        };

        // Taux actuariel
        $('#r1').find('td').eq(0).html(out.rate[0] + " %");
        $('#r1').find('td').eq(1).html(out.rate[1] + " %");
        $('#r1').find('td').eq(2).html(out.rate[2] + " %");
        // Price
        $('#r2').find('td').eq(0).html(round2(out.price[0]) + " %");
        $('#r2').find('td').eq(1).html(round2(out.price[1]) + " %");
        $('#r2').find('td').eq(2).html(round2(out.price[2]) + " %");
        // Duration
        $('#r3').find('td').eq(0).html(round4(out.duration[0]));
        $('#r3').find('td').eq(1).html(round4(out.duration[1]));
        $('#r3').find('td').eq(2).html(round4(out.duration[2]));
        // Prix induit par duration
        $('#r4').find('td').eq(0).html(round2(out.impliedPrice[0]) + " %");
        $('#r4').find('td').eq(1).html(round2(out.impliedPrice[1]) + " %");
        $('#r4').find('td').eq(2).html(round2(out.impliedPrice[2]) + " %");
        // Delta price
        $('#r5').find('td').eq(0).html(round4(out.deltaPrice[0]) + " %");
        $('#r5').find('td').eq(1).html(round4(out.deltaPrice[1]) + " %");
        $('#r5').find('td').eq(2).html(round4(out.deltaPrice[2]) + " %");
        // Duration
        $('#r6').find('td').eq(0).html(round4(out.modifiedDuration[0]));
        $('#r6').find('td').eq(1).html(round4(out.modifiedDuration[1]));
        $('#r6').find('td').eq(2).html(round4(out.modifiedDuration[2]));
        // Prix induit par duration
        $('#r7').find('td').eq(0).html(round2(out.MDImpliedPrice[0]) + " %");
        $('#r7').find('td').eq(1).html(round2(out.MDImpliedPrice[1]) + " %");
        $('#r7').find('td').eq(2).html(round2(out.MDImpliedPrice[2]) + " %");
        // Delta price
        $('#r8').find('td').eq(0).html(round4(out.MDDeltaPrice[0]) + " %");
        $('#r8').find('td').eq(1).html(round4(out.MDDeltaPrice[1]) + " %");
        $('#r8').find('td').eq(2).html(round4(out.MDDeltaPrice[2]) + " %");

    }

    refresh();

    function drawGraph(out) {

        var data0 = out.priceFull;
        var data1 = out.line2;
        var data2 = out.line3;
        // define dimensions of graph
        var margin = 0; //px
        var w = $('#graphDiv').width() - margin * 2; // width
        var h = 270 - margin * 2; // height
        var graph;

        var xScale, yScale, xAxis, yAxis, lineFunc;

        function calAxis() {
            // Fit scale with data
            xScale = d3.scale.linear()
                .domain([
                    (parseFloat(getMin(data0.concat(data1), 'x')) - 0.251).toFixed(2), (parseFloat(getMax(data0.concat(data1), 'x')) + 0.251).toFixed(2)
                ])
                .range([0, w - 50]);

            yScale = d3.scale.linear()
                .domain([
                    (parseFloat(getMin(data0.concat(data1), 'y')) - 1.1).toFixed(2), (parseFloat(getMax(data0.concat(data1), 'y')) + 1.1).toFixed(2)])
                .range([h - 40, 0]);

            // create/update axes
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

        calAxis();

        if ($("#graphDiv svg").length == 0) {// APPEND


            // Create zoom listener
            zoom = d3.behavior.zoom().x(xScale).y(yScale)
                .scaleExtent([1, 100]).on("zoom", reScale);

            // Add an SVG element with the desired dimensions and margin.
            graph = d3.select("#graphDiv").append("svg:svg")
                .attr("width", w)
                .attr("height", h)
                .append("svg:g")
                .attr("transform", "translate(40,10)")
                .attr('fill-rule', 'nonzero');

            // Add x, y axes
            graph.append("svg:g")
                .attr({
                    'class': 'x axis',
                    'transform': 'translate(0,' + (h - 40) + ')'
                })
                .style("font-size", "12px")
                .call(xAxis);

            graph.append("svg:g")
                .attr({
                    'class': 'y axis',
                    'transform': 'translate(0,0)'
                })
                .style("font-size", "12px")
                .call(yAxis);

            // Add axise labels
            graph.append("text")
                .attr("class", "x label")
                .attr("fill", "#999999")
                .attr("text-anchor", "end")
                .attr("x", w - 60)
                .attr("y", h - 45)
                .style("font-size", "14px")
                .text("Discount Rate %");

            graph.append("text")
                .attr("class", "y label")
                .attr("fill", "#999999")
                .attr("text-anchor", "end")
                .attr("y", 6)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .style("font-size", "14px")
                .text("Price %");

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
                .attr("height", h - 40);

            // Add drag mask
            graph.append("svg:rect")
                .attr("class", "pane")
                .attr("width", w)
                .attr("height", h)
                .attr("fill-opacity", 0)
                .call(zoom);


            // Add illustration
            var infoBox = graph.append("svg:g")
                .attr('class', 'infoBox')
                .attr("transform", "translate(" + (w - 240) + ",0)");

            infoBox.append('rect')
                .attr({
                    stroke: "black",
                    id: "e1_rectangle",
                    style: "stroke-width:0px;stroke:#aaa;fill:none;",
                    width: "200",
                    height: "70"
                });

            infoBox.append('rect').attr({
                x: "10",
                y: "10",
                style: "stroke:none",
                width: "10",
                height: "10",
                fill: "#0057A0",
                id: "color1"
            });
            infoBox.append('rect').attr({
                x: "10",
                y: "30",
                style: "stroke:none",
                width: "10",
                height: "10",
                fill: "#CC0000",
                id: "color2"
            });
            infoBox.append('rect').attr({
                x: "10",
                y: "50",
                style: "stroke:none",
                width: "10",
                height: "10",
                fill: "#40A500",
                id: "color3"
            });

            infoBox.append('text').attr({
                fill: "black", x: "25", y: "20", id: "color1-text", style: "font-size:12px;"
            })
                .text('Price');

            infoBox.append('text').attr({
                fill: "black", x: "25", y: "40", id: "color2-text", style: "font-size:12px;"
            })
                .text('Duration Implied Price');

            infoBox.append('text').attr({
                fill: "black", x: "25", y: "60", id: "color2-text", style: "font-size:12px;"
            })
                .text('Modified Duration Implied Price');

            // Add curve
            graph.select('g.lines').append("svg:path").attr("class", "line1 line").attr("d", lineFunc(data0)).attr('vector-effect', "non-scaling-stroke");
            graph.select('g.lines').append("svg:path").attr("class", "line2 line").attr("d", lineFunc(data1)).attr('vector-effect', "non-scaling-stroke");
            graph.select('g.lines').append("svg:path").attr("class", "line3 line").attr("d", lineFunc(data2)).attr('vector-effect', "non-scaling-stroke");

            // Add lines
            graph.select('g.lines').append("svg:line")
                .attr("y1", yScale(0)).attr("y2", yScale(out.price[1])).attr("x1", xScale(out.rate[1])).attr("x2", xScale(out.rate[1]))
                .attr("stroke", "#555").attr("stroke-width", "1").attr('class', 'x1 line').attr('stroke-dasharray', '10, 5')
                .attr('vector-effect', "non-scaling-stroke");

            graph.select('g.lines').append("svg:line")
                .attr("y1", yScale(out.price[1])).attr("y2", yScale(out.price[1])).attr("x1", xScale(-3)).attr("x2", xScale(out.rate[1]))
                .attr("stroke", "#555").attr("stroke-width", "1").attr('class', 'y1 line').attr('stroke-dasharray', '10, 5')
                .attr('vector-effect', "non-scaling-stroke");

        } else { // Update


            graph = d3.select("#graphDiv").transition().duration(1000);
            graph.attr("width", w)
                .select('svg').attr("width", w);

            graph.select('#clip rect').attr("width", w);
            graph.select('rect.pane').attr("width", w);


            zoom.scale(1).translate([0, 0]).on("zoom", function () {
                reScale(graph);
            });
            zoom.event($('rect.pane'));
            zoom.x(xScale).y(yScale);
            zoom.on("zoom", reScale);

            graph.select('path.line1').attr("d", lineFunc(data0));
            graph.select('path.line2').attr("d", lineFunc(data1));
            graph.select('path.line3').attr("d", lineFunc(data2));


            graph.select("line.x1").attr("y1", yScale(0)).attr("y2", yScale(out.price[1]))
                .attr("x1", xScale(out.rate[1])).attr("x2", xScale(out.rate[1]));

            graph.select("line.y1").attr("y1", yScale(out.price[1])).attr("y2", yScale(out.price[1]))
                .attr("x1", xScale(-3)).attr("x2", xScale(out.rate[1]));

            // reposition label texts and hint box
            graph.select(".x.label")
                .attr({
                    "x": w - 60,
                    "y": h - 45
                });

            graph.select('.infoBox').attr("transform", "translate(" + (w - 240) + ",0)");

        }


        function reScale(that_graph) {
            //console.log('reScale(that_graph)');
            if (typeof(that_graph) === "undefined") {
                that_graph = d3.select("#graphDiv");
            }

            var limitfiedPan = panLimited(d3.event.translate, d3.event.scale);
            zoom.translate(limitfiedPan);
            that_graph.selectAll('.line').attr("transform", "translate(" + limitfiedPan + ") scale(" + d3.event.scale + ")");
            that_graph.select(".x.axis").call(xAxis);
            that_graph.select(".y.axis").call(yAxis);

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
