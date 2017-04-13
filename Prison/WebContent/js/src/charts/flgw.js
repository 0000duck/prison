define(function(require) {
	var $ = require('jquery'),
		db = require('frm/hz.db'),
		echarts = require('echarts'),
		chinaMap = require('map/js/china'),
		shMap = require('map/js/province/shanghai');
	
	
	var curTheme = 'dark';
    var mapChart = null;
    var legendData=[],
    	totalData=[],
    	servicesData=[];

    $(function(){
    	$('#zz').on('click',function(){
    		loadPolitic();
    	});
    	$('#edu').on('click',function(){
    		loadEdu();
    	})
    })
    
    function refresh() {
        mapChart = echarts.init(document.getElementById('map'), curTheme);
        loadPolitic();
    }
    
    /**
     * 按政治面貌
     */
    function loadPolitic(){
//    	mapChart.showLoading();
    	db.query({
    		async:false,
			request: {
				sqlId: "report_jos_politic"
			},
			success: function (data) {
				covertToJosData(data,'政治面貌');
				initJos();
				mapChart.hideLoading();
			},
			error: function (code, msg) {
				
			}
		});
    }
    /**
     * 按学历
     */
    function loadEdu(){
    	mapChart.showLoading();
    	db.query({
			request: {
				sqlId: "report_jos_edu"
			},
			success: function (data) {
				covertToJosData(data,'学历');
				initJos();
				mapChart.hideLoading();
			},
			error: function (code, msg) {
				
			}
		});
    }
    
    /**
     * 构建环型图所需数据
     */
    function covertToJosData(data,typeName){
    	if(data.length==0){
    		return;
    	}
    	legendData = [];totalData=[];servicesData=[];
    	var total = 0;
    	for(var i=0,j=data.length;i<j;i++){
    		legendData.push(data[i].name);
    		servicesData.push({
    			value:data[i].value,
    			name:data[i].name
    		});
    		total+=data[i].value;
    	}
    	totalData.push({
    		value:total,
    		name:typeName
    	});
    }
    
    /**
     * 法律顾问分布
     */
    function initJos() {
    	var option = {
    		title:{
    			text: '执业律师',
//		        subtext: '数据统计分析',
		        x:'center',
		        textStyle:{
		        	fontSize: 18,
		        	fontWeight: 'bolder',
		        	color: '#fff'		        	
		        }
    		},
		    tooltip: {
		        trigger: 'item',
		        formatter: "{a} <br/>{b}: {c} ({d}%)"
		    },
		    legend: {
		        orient: 'vertical',
		        x: 'left',
		        textStyle:{
		        	color:'auto'
		        },
		        data:legendData
		    },
		    series: [
		        {
		            name:'统计分析',
		            type:'pie',
		            selectedMode: 'single',
		            radius: [0, '30%'],

		            label: {
		                normal: {
		                    position: 'inner'
		                }
		            },
		            labelLine: {
		                normal: {
		                    show: false
		                }
		            },
		            data:totalData
		        },
		        {
		            name:'统计分析',
		            type:'pie',
		            radius: ['40%', '55%'],

		            data:servicesData
		        }
		    ]
		};
        mapChart.setOption(option);
        $('#type').show();
    }
    refresh();
});
