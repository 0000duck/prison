define(function(require) {
	var $ = require('jquery'),
		db = require('frm/hz.db'),
		echarts = require('echarts'),
		chinaMap = require('map/js/china'),
		shMap = require('map/js/province/shanghai'),
		curTheme = require('echarts_theme/shine');
	
	var supervisorChart = null,orgSpreadChart=null;
	 $.ajaxSetup({  
	    async : false  
	 });
	
	/**
	 *初始化
	 */
	function refresh() {
		supervisorChart = echarts.init(document.getElementById('supervisor'), curTheme);
		orgSpreadChart = echarts.init(document.getElementById('org_spread'), curTheme);
		initMap();
		loadData();
    }
	
	function initMap(){
		$.get('../../libs/echarts/map/json/province/shanghai.json',function(geoJson){
			 echarts.registerMap('shanghai', geoJson);
		});
	}
	
	function loadData(){
		db.query({
			async:false,
			request: {
				sqlId: "report_lawflrm_map"
			},
			success: function (data) {
				initOrgSpread(data);
				initSupervisor(data);
			},
			error: function (code, msg) {
				
			}
		});
	}
	
	function initOrgSpread(data){
		var newData = [];
		for(var i =0,j=data.length;i<j;i++){
			newData.push({
				name:data[i].name.replace(/司法局/g,''),
				value:data[i].value
			});
		}
		 var option = {
		    tooltip: {
		        trigger: 'item'
		    },
		    legend: {
		        orient: 'vertical',
		        left: 'left',
		        textStyle:{
		        	color:'#fff'
		        },
		        data:['律师事务所']
		    },
		    visualMap: {
		        min: 0,
		        max: 25000,
		        left: 'right',
		        top: 'bottom',
		        text: ['高','低'],           // 文本，默认为数值文本
		        calculable: true,
		        target: {
		            inRange: {
		                color: ['#00aaff', 'rgba(3,4,5,0.4)', 'yellow'],
		                symbolSize: [60, 200]
		            }
		        },
		        // 表示 visualMap-continuous 本身的视觉样式。
		        controller: {
		            inRange: {
		                symbolSize: [30, 100]
		            }
		        }
		    },
		    series: [
		        {
		            name: '律师事务所',
		            type: 'map',
		            mapType: 'shanghai',
		            selectedMode : 'multiple',
		            showLegendSymbol:true,
		            zoom:1.1,
		            roam: true,
		            label: {
                        emphasis: {
                        	show:true,
                            textStyle: {
                                color: '#fff'
                            }
                        },
                        normal: {
                        	show: true
                        }
                    },
		            data:newData
		        }
		    ]
		 };
		 orgSpreadChart.setOption(option);
	}
	
	function initSupervisor(data){
		 var shGeoMap = {
			    '上海司法局': [121.451461,31.207472],
			    '普陀区司法局': [121.403524,31.255594],
			    '宝山区司法局': [121.492491,31.414156],
			    '浦东新区司法局': [121.778785,31.038218],
			    '静安区司法局': [121.470656,31.250405],
			    '长宁区司法局': [121.431151,31.226805],
			    '徐汇区司法局': [121.458932,31.168417],
			    '青浦区司法局': [121.122997,31.149568],
			    '松江区司法局': [121.234117,31.038521],
			    '奉贤区司法局': [121.651529,30.884462],
			    '闵行区司法局': [121.342225,31.047958],
			    '金山区司法局': [121.339565,30.722459],
			    '虹口区司法局': [121.511735,31.270156],
			    '闸北区司法局': [121.470586,31.250463],
			    '嘉定区司法局': [121.262472,31.35204],
			    '崇明县司法局':[121.407513,31.628107],
			    '黄浦区司法局':[121.477406,31.223867]
		 };
		 var SHData = [];
		 for(var i=0,j=data.length;i<j;i++){
			 SHData.push([{
				 name:'上海司法局'
			 },{
				 name:data[i].name,
				 value:data[i].value
			 }]);
		 }
		 var convertData = function (data) {
		    var res = [];
		    for (var i = 0; i < data.length; i++) {
		        var dataItem = data[i];
		        var fromCoord = shGeoMap[dataItem[0].name];
		        var toCoord = shGeoMap[dataItem[1].name];
		        if (fromCoord && toCoord) {
		            res.push({
		                fromName: dataItem[0].name,
		                toName: dataItem[1].name,
		                coords: [fromCoord, toCoord]
		            });
		        }
		    }
		    return res;
		};
		
		var color = ['#a6c84c', '#ffa022', '#46bee9','#11cd6e','#f4c600','#eb4f38'];
		var eachData = [['律师事务所', SHData]];
		var series = [];
		eachData.forEach(function (item, i) {
			series.push({
		        name: item[0],
		        type: 'lines',
		        zlevel: 1,
		        effect: {
		            show: true,
		            period: 6,
		            trailLength: 0.7,
		            color: '#fff',
		            symbolSize: 3
		        },
		        lineStyle: {
		            normal: {
		                color: color[i],
		                width: 0,
		                curveness: 0.2
		            }
		        },
		        data: convertData(item[1])
		    },
		    {
		        name: item[0],
		        type: 'lines',
		        zlevel: 2,
		        effect: {
		            show: true,
		            period: 6,
		            trailLength: 0,
		            symbol:'circle',
		            symbolSize: 2
		        },
		        lineStyle: {
		            normal: {
		                color: color[i],
		                width: 1,
		                opacity: 0.4,
		                curveness: 0.2
		            }
		        },
		        data: convertData(item[1])
		    },
		    {
		        name: item[0],
		        type: 'effectScatter',
		        coordinateSystem: 'geo',
		        zlevel: 2,
		        rippleEffect: {
		            brushType: 'stroke'
		        },
		        label: {
		            normal: {
		                show: true,
		                position: 'right',
		                formatter: '{b}'
		            }
		        },
		        symbolSize: function (val) {
		            return val[2] / 8;
		        },
		        itemStyle: {
		            normal: {
		                color: color[i]
		            }
		        },
		        data: item[1].map(function (dataItem) {
		            return {
		                name: dataItem[1].name,
		                value: shGeoMap[dataItem[1].name].concat([dataItem[1].value])
		            };
		        })
		    });
		});
		 var option={
		    tooltip : {
		        trigger: 'item'
		    },
		    legend: {
		        orient: 'vertical',
		        top: 'top',
		        left: 'left',
		        data:['律师事务所'],
		        textStyle: {
		            color: '#fff'
		        },
		        selectedMode: 'single'
		    },
		    geo: {
		        map: 'shanghai',
		        zoom:1.1,
		        label: {
		        	normal:{
		        		show:false,
		        		textStyle:{
		        			color:'#fff'
		        		}
		        	},
		            emphasis: {
		                show:true,
		                textStyle:{
		                	color:'#fff'
		                }
		            }
		        },
		        roam: true,
		        itemStyle: {
		            normal: {
		                areaColor: '#323c48',
		                borderColor: '#404a59'
		            },
		            emphasis: {
		                areaColor: '#2a333d'
		            }
		        }
		    },
		    series:series
		 }
		 supervisorChart.setOption(option);
	}
	
	refresh();
});