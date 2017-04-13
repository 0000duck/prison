
define(function(require){
	var $ = require("jquery");
	var tpl = require('vue');
	var db = require('frm/hz.db');
	var login =  require('frm/loginUser');
	var modelUtil = require('frm/model');	
	var tip = require('frm/message');
	var chart =   require('echarts');
	
	var tables=  chart.init(document.getElementById("tableshow"));
	//部门名称,部门警员数量
	var departmentName  = [],departmentCount = [];
        model=new tpl({
			el:'#form',
			data:{
				count:{
					'inPrison':'0', //在监人数
					'other':'0',//不在监
					'total':'0'//总数	
				},
				policeinfo:[],
				viewtext:'监内警员信息'
			},
			methods:{
				reset:function(){
					this.policeinfo = [];
					this.viewtext = '无';
				}
			}
			
	});
       //加载警员在监情况 
        db.query({
    		request:{
    			sqlId:'select_police_inout_count',
    			params:[login.cusNumber]
    		},
    		async:false,
    		success:function(data){
    			if(!data) return;
    			for(var i=0;i<data.length;i++){
    				if(data[i].flag == 0){//在监
    					model.count.inPrison = data[i].count;
    				}else{
    					model.count.other = data[i].count;
    				}
    			}
    			model.count.total = Number(model.count.inPrison) + Number(model.count.other);
    		},
    		error:function(errorCode, errorMsg){
				tip.alert(errorCode + ":" + errorMsg);
			}
    	});
        //加载饼状图
        
        option = {
        		title : {
    		        text: '警员数量统计',
    		        textStyle:{
    		        	fontSize: 12,
    		        	color: '#fff'		        	
    		        },
    		        x:'center'
        		},
        	    tooltip : {
        	        trigger: 'item',
        	        formatter: "{b}  {c}人({d}%)"
        	    },
        	    legend: {
        	        orient : 'vertical',
        	        x : 'left',
        	        data:['监外','监内'],
        	        textStyle:{
        	        	color: 'auto'
        	        }
        	    },
        	    color:['#c23531','#32cd32'],
        	    calculable : true,
        	    series : [
        	        {
        	            name:'人数',
        	            type:'pie',
        	            radius : ['50%', '70%'],
        	            itemStyle : {
        	                normal : {
        	                    label : {
        	                        show : false
        	                    },
        	                    labelLine : {
        	                        show : false
        	                    }
        	                },
        	                emphasis : {
        	                    label : {
        	                        show : false,
        	                        position : 'center',
        	                        textStyle : {
        	                            fontSize : '30',
        	                            baseline:'middle',
        	                            fontWeight : 'bold'
        	                        }
        	                    }
        	                }
        	            },
        	            data:[
								{value:model.count.other,name:'监外'},
								{value:model.count.inPrison,name:'监内'}
        	                ]
        	        }
        	    ]
        	};      
    tables.setOption(option);   
    /**
     * 注册点击事件
     */
    tables.on('click',function(param){
    	loadPoliceInfo(param.name);
    });
    
    //====================== 各部门警员分布情况 柱状图 ============================//
    //查询警员分布情况
    db.query({
		request:{
			sqlId:'select_police_drptmnt_count',
			whereId:'0',
			params:[login.cusNumber]
		},
		async:false,
		success:function(data){
			if(!data) return;
			for(var i=0;i<data.length;i++){
				departmentName.push(data[i].odd_name);
				departmentCount.push({value:data[i].count,name:data[i].pbd_drptmnt_id});
			}
		},
		error:function(errorCode, errorMsg){
			tip.alert(errorCode + ":" + errorMsg);
		}
	});
    /** 柱状图对象 */
    var tableBar=  chart.init(document.getElementById("tableBar"));
    //设定柱状图属性
    option = {
    	    title : {
    	        text: '各部门警员数量统计',
    	        textStyle:{
		        	fontSize: 12,
		        	color: '#fff'		        	
		        },
		        x:'center'
    	    },
    	    legend: {
    	        orient : 'vertical',
    	        x : 'left',
    	        data:['人数'],
    	        textStyle:{
    	        	color: 'auto'
    	        }
    	    },
    	    color:['#1f699e'],
    	    tooltip : {
    	        trigger: 'axis',
    	    },
    	    calculable : true,
    	    xAxis : [
    	        {
    	            type : 'category',
    	            data : departmentName,
    	            axisLine:{lineStyle:{color:'white'}}
    	        }
    	    ],
    	    yAxis : [
    	        {
    	            type : 'value',
    	            axisLine:{lineStyle:{color:'white'}}
    	        }
    	    ],
    	    series : [
    	        {
    	            name:'人数',
    	            type:'bar',
    	            textStyle:{color:'#fff'},	
    		        data:departmentCount,
    	            markPoint : {data : [{type : 'max', name: '最多'},{type : 'min', name: '最少'}]},
    	            markLine : {data : [{type : 'average', name: '平均值'}]},
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
    //加载柱状图
    tableBar.setOption(option);  
    /**
     * 注册点击事件
     */
    tableBar.on('click',function(param){loadPoliceInfo(param.data.name,param.name);});
    /**
     * 加载警员数据
     */
    function loadPoliceInfo(value,name){
    	var info = '',wid='0',param=[];
    	switch(value){
    	case '监内':
    		param = [login.cusNumber,0];
    		model.viewtext='监内警员信息';
    		break; 
    	case '监外':
    		param = [login.cusNumber,1];
    		model.viewtext='监外警员信息';
    		break;
    	case '全部':
    		wid = 1;
    		param = [login.cusNumber];
    		model.viewtext='全部警员信息';
    		break;
    	default://按部门编号查询
    		if(isNaN(value)) return;//传入的数值不为部门编号(通常为一串数字)时,不做处理直接返回
    		wid = 2;
    	    param = [login.cusNumber,value];
    	    model.viewtext=name+'警员信息';
    	    break;
    	}
    	db.query({
    		request:{
    			sqlId:'select_police_base_info',
    			whereId:wid,
    			orderId:'0',
    			params:param
    		},
    		success:function(data){
    			model.policeinfo = [];
    			if(!data) return;
    			model.policeinfo = model.policeinfo.concat(data);
    			$('#infoUl').show();
    		},
    		error:function(errorCode, errorMsg){
				tip.alert(errorCode + ":" + errorMsg);
			}
    	});
    }
    console.log(window.top.webmessage);
    window.top.webmessage.on('POLICE001','police',policeCountMsg);
    
    function policeCountMsg(msg){
    	console.log('民警数量消息处理 msg='+msg);
    }
    //默认加载在监警员数据
    loadPoliceInfo('监内');
});