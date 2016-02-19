<?php
//read all the javascript files, and return one big javascript blob :)
$DEBUG=true;
$js=[];
$js[]='js/student_progress_overview.js';
$js[]='js/student_progress_detail.js';
$js[]='js/student_constancy.js';
$js[]='js/student_vidnprobs.js';
$js[]='js/student_class.js';
$js[]='js/tooltip.js';
$js[]='js/csvdata.js';
//$js[]='js/csvdatabits.js';
$js[]='js/init.js';


$script=[];
foreach($js as $file){
	$f=file($file);
	foreach($f as $line){
		$line=trim($line);
		if(preg_match("/^\/\//",$line))continue;
		if($line)$script[]=$line;
	}
}

$f=fopen("js/pack.js","w+");
fwrite($f,implode("\n",$script));
fclose($f);

if($DEBUG){
	foreach($js as $file){
		echo "<script src='$file'></script>\n";
	}
} else {
	echo "<script>";
	echo implode("\n",$script);
	echo "</script>";
}