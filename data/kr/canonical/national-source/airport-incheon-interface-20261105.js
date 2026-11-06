$(document).ready(function() {		
	
	
	
}); /* End of ready */









function getBusInfoDetail(val) {
	
	
	var siteId = $("#siteId").val();
	var jsonData = {};
	jsonData.routeId = val;
	
	$("#busDetail").load("/bus/"+siteId+"/busInfoDetail.do", jsonData, function(response, result, status) {
	});
	
}


function fncRefresh(routeArea){
	$("#routeArea").val(routeArea);
	$("#searchform").submit();
}