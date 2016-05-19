var tau = 2 * Math.PI; // http://tauday.com/tau-manifesto

//Progress colors (Ailadi scheme)
var colors = ['#CC0000', '#FF5F06', '#F39224', '#EDC82B', '#E5E131', '#E5E131', '#B9DB50', '#B9DB50', '#8DD685', '#30ad77'];

var scoreDomain = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

var colorDomain = d3.scale.linear().domain(scoreDomain).range(colors);
var greyScale = d3.scale.linear().domain([0, 100]).range(['#666', '#eee']);//video completion

var pvis = d3.select("#graphDiv").append("svg").attr("width", 900).attr("height", 200);

// Video
pvis.append("text").attr("class", "txt").attr("x", 60).attr("y", 75).text("Text").attr("fill", "#999")
    .style("font-size", "10px").style("text-anchor", "middle");

// Problems
pvis.append("text").attr("class", "txt").attr("x", 125).attr("y", 28).text("Text").attr("fill", "#999")
    .style("font-size", "10px").style("text-anchor", "middle");


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
            deltaPrice: [0, 0, 0]
        }


        for (var i = 0; i < maturity; i++) {
            var j = i + 1;
            out.flux[i] = coupon;
            var minus = 1 / Math.pow((1 + ((marketRate - delta) / 100)), j);//1/((1+((marketRate-delta)/100))*j);
            var nominal = 1 / Math.pow((1 + (marketRate / 100)), j);
            var plus = 1 / Math.pow((1 + ((marketRate + delta) / 100)), j);//1/((1+((marketRate+delta)/100))*j);
            out.df[i] = [minus, nominal, plus];
        }
        out.flux[(maturity - 1)] = coupon + redeem;

        //compute prices//
        var price0 = 0;
        price1 = 0;
        price2 = 0;
        for (var i = 0; i < maturity; i++) {
            price0 += (out.flux[i]) * out.df[i][0];
            price1 += (out.flux[i]) * out.df[i][1];
            price2 += (out.flux[i]) * out.df[i][2];
        }

        out.price = [price0, price1, price2];

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

        //ktksbye
        return out;
    }


    return {
        compute: compute
    }
}();

$(function () {

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
        if ($('#e').val() < 0)$('#e').val(0);
        if ($('#e').val() > 0.3)$('#e').val('0.30');

        refresh();
    });

    function refresh() {

        out = pricer.compute();
        console.log('change', out);

        /**
         * Round value with 2 digits precision
         * @param  {[type]} n [description]
         * @return {[type]}   [description]
         */
        var round2 = function (n) {
            n *= 100;
            return Math.round(n) / 100;
        }

        /**
         * Round value with 4 digits precision
         * @param  {[type]} n [description]
         * @return {[type]}   [description]
         */
        var round4 = function (n) {
            n *= 10000;
            return Math.round(n) / 10000;
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

});
