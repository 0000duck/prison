define(function(require) {
	var $ = require('jquery'),
		db = require('frm/hz.db'),
		echarts = require('echarts'),
		chinaMap = require('map/js/china'),
		shMap = require('map/js/province/shanghai');
	
	
	var curTheme = 'dark';
    var myChart = null;
    var cdata = [];
    
    myChart = echarts.init(document.getElementById('main'), curTheme);
    loadConsultReport();

    /**
     * 查询法律咨询报表数据
     */
    function loadConsultReport(){
    	db.query({
//    		async:false,
			request: {
				sqlId: "report_consult"
			},
			success: function (data) {
				resetData(data);
				initConsultAtion(data);
			},
			error: function (code, msg) {
				console.error('检测数据库查询(2)：' + msg);
			}
		});
    }
    
    function resetData(data){
    	for(var i=0,j=data.length;i<j;i++){
    		cdata.push(data[i].name);
    	}
    }
    
    /**
     * 法律咨询
     */
    function initConsultAtion(data) {
    	var option = {
		    title : {
		        text: '法律咨询',
		        subtext: '统计排名',
		        textStyle:{
		        	fontSize: 18,
		        	fontWeight: 'bolder',
		        	color: '#fff'		        	
		        },
		        x:'center'
		    },
		    tooltip : {
		        trigger: 'item',
		        formatter: "{a} <br/>{b} : {c} ({d}%)"
		    },
		    legend: {
		        orient: 'vertical',
		        x: 'left',
		        textStyle:{
		        	color:'#fff'
		        },
		        data:cdata
		    },
		    series : [
		        {
		            name: '统计总数',
		            type: 'pie',
		            radius : '55%',
		            center: ['50%', '60%'],
		            data:data,
		            itemStyle: {
		                emphasis: {
		                    shadowBlur: 10,
		                    shadowOffsetX: 0,
		                    shadowColor: 'rgba(0, 0, 0, 0.5)'
		                }
		            }
		        }
		    ]
		};

        // 使用刚指定的配置项和数据显示图表。
        myChart.setOption(option);
    }

//    refresh();
});
