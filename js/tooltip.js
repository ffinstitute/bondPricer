var ttdiv = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 1e-6);

function ttover(html){
    if(html)ttdiv.html(html);
    ttdiv.transition().duration(100).style("opacity", 1);
}

function ttmove(){
  ttdiv.style("left", ttleft ).style("top", tttop);
}

function ttleft(){
  var max = $("body").width()-$("div.tooltip").width() - 20;
    return  Math.min( max , d3.event.pageX + 10 ) + "px";
}

function tttop(){
	var max = $("body").height()-$("div.tooltip").height() - 20;
    return  Math.min( max , d3.event.pageY + 10 ) + "px";	
}

function ttout(){
    ttdiv.transition().duration(200).style("opacity", 1e-6);
}