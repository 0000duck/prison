define(['jquery','vue','frm/hz.db',"frm/table","frm/dialog","frm/datepicker","frm/message","frm/model","frm/loginUser","echarts"],function($,tpl,db,table,dialog,date,tip,modelData,login,chart){
	
	
	var constGroup=$("#constlist");
	var flag=false,type=false,first=true;
	//创建模型
	var model=new tpl({
		el:'#constlist',
		data:{
			constgroup:{ 
				'odd_name':'',
				'pcr_cus_number':login.cusNumber,
				'pcr_record_id':'',
				'pcr_addr':'',
       			'pcr_begin_time':'',
       			'pcr_end_time':'',
       			'pcr_worker_num':'',
       			'pcr_worker_names':'',
       			'pcr_create_uid':login.userId,
       			'pcr_create_us':'',
			    'pcr_create_datetime':'',
			    'pcr_update_uid':login.userId,
			    'pcr_update_us':'',
			    'pcr_update_datetime':'',
			    'pcr_remark':''
					}
		}
	});
	
	//table表
	table.init("table",{
		request:{
			sqlId:'query_const_construct',
			orderId:'0'
		},
		search:{
			key:'pcr_addr',
			whereId:'1'
		},
		columns: [[  
					{
					    field: 'state',
					    checkbox: true
					},
	                  {
	                    title: '机构名称',
	                    field: 'odd_name',
	                    align: 'center',
	                    valign: 'middle',
	                    visible: false
	                    	
	                },
	                {
	                    title: '施工时间',
	                    field: "begin_time",
	                    align: 'center',
	                    valign: 'middle'
	                },
	                {
	                    title: '完成时间',
	                    field: "end_time",
	                    align: 'center',
	                    valign: 'middle'
	                },
	                {
	                    title: '施工地点',
	                    field: 'pcr_addr',
	                    align: 'center',
	                    valign: 'middle'
	                },
	                {
	                    title: '施工人数',
	                    field: 'pcr_worker_num',
	                    align: 'center',
	                    valign: 'middle',
	                    visible: false
	                },
	                {
	                    title: '施工人员',
	                    field: 'pcr_worker_names',
	                    align: 'center',
	                    valign: 'middle'
	                },
	                {
	                    title: '施工情况',
	                    field: 'pcr_remark',
	                    align: 'center',
	                    valign: 'middle',
	                    visible: false
	                },
	                {
	                    title: '创建人',
	                    field: 'pcr_create_us',
	                    align: 'center',
	                    valign: 'middle'
	                },
	                {
	                    title: '创建时间',
	                    field: "create_datetime",
	                    align: 'center',
	                    valign: 'middle'
	                },
	                {
	                    title: '更新人',
	                    field: 'pcr_update_us',
	                    align: 'center',
	                    valign: 'middle',
	                    visible: false
	                },
	                {
	                    title: '更新时间',
	                    field: "update_datetime",
	                    align: 'center',
	                    valign: 'middle',
	                    visible: false
	                }
	              ]],
         onClickRow:function(row){
        	 type=true;
        	 modelData.modelData(model.constgroup,row);
        	 model.constgroup['pcr_begin_time']=row.begin_time;
        	 model.constgroup['pcr_end_time']=row.end_time;
        	 model.constgroup['pcr_create_datetime']=row.create_datetime;
        	 model.constgroup['pcr_update_uid']=login.userId;
        	 model.constgroup['pcr_update_datetime']=row.update_datetime;
        	 dialog.open({targetId:'constd',title:'修改',h:"350"});
         }
	});
	$("input.input-sm").attr("placeholder","请输入施工地点");
	//监内施工新增删除
	$("#oprbutton").on("click","a",function(){
		if(this.textContent=='添加'){
			type=false;
			model.constgroup['pcr_begin_time']=model.constgroup['pcr_end_time']=model.constgroup['pcr_worker_num']=model.constgroup['pcr_addr']=
				model.constgroup['pcr_worker_names']=model.constgroup['pcr_remark']=model.constgroup['pcr_create_us']=model.constgroup['pcr_update_us']='';
			db.query({
				request:{
					sqlId:'query_odd_name',
					params:[login.cusNumber]
				},
				success:function(data){
					data=JSON.parse(JSON.stringify(data));
					model.constgroup['odd_name']=data[0].odd_name;
				}
			});
			dialog.open({targetId:'constd',title:'添加',h:"350"});
		}else{//常量删除
			
			var list=table.method("getSelections").map(function(row){
 	 			return {'pcr_cus_number':row['pcr_cus_number'],'pcr_record_id':row['pcr_record_id'],'begin_time':row['begin_time']};
 	 		});
			if(!list.length){
				tip.alert("请先选择要删除的项目");
				return;
			}
			//删除
			tip.confirm("是否删除已勾选的"+list.length+"条记录？",function(index){
				db.updateByParamKey({ 
					request:{
						sqlId:'delete_const_construct',
						whereId:'0',
						params:list
					},
					success:function(){
						tip.alert("删除成功");
						if(model.constgroup['pcr_record_id'].length){
							table.method("refresh",{request:{whereId:'0',params:{'pcr_record_id':model.constgroup['pcr_record_id']}}});
							refreshBar();
							queryMonth(list[0].begin_time.slice(0,4));
						}else{
							table.method("refresh");
							refreshBar();
							queryMonth(list[0].begin_time.slice(0,4));
						}
					},
					error:function(data,respMsg){
						tip.alert(respMsg);
					}
				});
			});
		}
	});
	
	//施工记录添加修改
	$("#constd").on("click","a",function(){
		if(validate(true))return;
		var sql;
		if(type){//修改
			sql="update_const_construct"
		}
		else{//新增
			sql="insert_const_construct"
		}
		
		tip.saving();
		db.updateByParamKey({
			request:{
				sqlId:sql,
				params:[model.constgroup]
			},
			success:function(data){
				!data.success&&tip.alert(data.respMsg);
				dialog.close();
				tip.alert("保存成功");
				refreshBar();
				queryMonth(String(model.constgroup['pcr_begin_time']).slice(0,4));
				table.method("refresh",{request:{whereId:'2',params:{'chartData':String(model.constgroup['pcr_begin_time']).slice(0,7)}}});
				
			},
			error:function(data,respMsg){
				tip.alert(respMsg);
			}
		});
	});
	//取消按钮
	$("#quit").click(function(){
		dialog.close();
	});
	//图表
	function refreshBar() {
		var myChart = chart.init($("#barshow")[0]);
		var option = {
			    title : {
			        text: '施工年份统计',
			        textStyle:{
			        	fontSize: 11,
			        	color: '#fff'		        	
			        },
			        x:'left'
			    },
//			    grid : {
//			    	x : 10,
//			    },
			    tooltip : {
			    	  trigger: 'item',
			    	  formatter:'{a}<br/>{b}:共施工{c}次'
			    },
			    dataZoom : {
			    	show : true,
			    	realtime : true,
			    	fillerColor : '#009694',
			    	height : 20,
			    	end : 100
			    },
			    xAxis : {
			            type : 'category',
			            axisLabel : {
			            	show : true,
//			            	rotate : '-90',
			            	interval : '0',
			            	textStyle : {color:'#fff'}
			            },
			            data : []
			        },
			    yAxis :  {
			            type : 'value',
			            minInterval : '1',
			            axisLabel : {
			            	show : 'true',
			            	textStyle : {color:'#fff'}
			            }
			        },
			    series : 
			        {	name : '施工年份',
			            type : 'bar',
			            data : []
		        }
			};
		
		db.query({
			request:{
				sqlId:'query_construct_years',
				orderId:'0'
			},
			success:function(data){
				data=JSON.parse(JSON.stringify(data));
				for(var k in data){
					option.dataZoom.start = 100*(1-4/data.length);
					option.xAxis.data.push(data[k].pcr_begin_years);
					option.series.data.push(data[k].pcr_begin_count);
					myChart.setOption(option);
				}
			}
		});
		myChart.on('click',function(param) {
				queryMonth(param.name);
				table.method("refresh",{request:{whereId:'4',params:{'yearData':param.name}}});
			});
	}
	refreshBar();
	//刷新饼图
	function refreshPie(legend,series) {
		var myChart = chart.init($("#pieshow")[0]);
		var option = {
			    title : {
			        text: '施工月份统计',
			        textStyle:{
			        	fontSize: 11,
			        	color: '#fff'		        	
			        },
			        x:'left'
			    },
//			    legend: {
//			    	x : 'left',
//		            y : 'bottom',
//		            textStyle:{
//		            	color:'#fff'
//		            },
//		            data:legend
//		        },
			    tooltip:{
			    	  trigger: 'item',
			    	  formatter:'{a}<br/>{b}:施工{c}次'
			    },
			    series : 
			        {	name:'施工年月',
			            type : 'pie',
			            radius : '55%',
			            center : ['50%', '50%'],
			            data : series
		        }
			};
		myChart.setOption(option);
		//饼图点击事件
		myChart.on('click',function(param) {
			table.method("refresh",{request:{whereId:'2',params:{'chartData':param.name}}});
		});
	}
	//查询月份函数
	function queryMonth(year){
		db.query({
			request:{
				sqlId:'query_construct_months',
				params:[year],
				orderId:'0'
			},
			success:function(data){
				data=JSON.parse(JSON.stringify(data));
				var legendData = [];
				var seriesData = [];
				for(var k in data){
					//legendData.push(data[k].begin_months);
					seriesData.push({name:data[k].begin_months,value:data[k].begin_count});
					refreshPie(legendData,seriesData);
				}
			}
		});
	}
	//默认显示当前年份的饼图数据
	var date = new Date();
	var currentYear = date.getFullYear();
	var mm=date.getMonth();
	mm=(mm+1)<10?('0'+(mm+1)):mm+1;
	var currentMonth = currentYear + '-' + mm;
	queryMonth(currentYear);
	
	//默认显示当前月份的表格数据
	table.method("refresh",{request:{whereId:'2',params:{'chartData':currentMonth}}});
	//点击查看所有数据按钮
	$("#back").on("click",function() {
		table.method("refresh",{request:{whereId:'3',params:{'pcr_cus_number':login.cusNumber}}});
	});
	function validate(flag){
		if(flag){
			var reg=/^[1-9]*[1-9][0-9]*$/;
			var date=new Date();
			var yyyy=date.getFullYear();
			var mm=date.getMonth();
			var dd=date.getDate();
			mm=(mm+1)<10?('0'+(mm+1)):mm+1;
			dd=dd<10?('0'+dd):dd;
			var current = yyyy+'-'+mm+'-'+dd;
			return !model.constgroup['pcr_begin_time'].length&&!tip.alert("请输入开始时间")||
			!model.constgroup['pcr_end_time'].length&&!tip.alert("请输入结束时间")||
			(model.constgroup['pcr_begin_time']>model.constgroup['pcr_end_time'])&&!tip.alert("结束时间必须大于等于开始时间")||
			model.constgroup['pcr_end_time']>current&&!tip.alert("结束时间必须小于等于当前时间")||
			!String(model.constgroup['pcr_worker_num']).length&&!tip.alert("请输入施工人数")||
			reg.test(model.constgroup['pcr_worker_num'])==false&&!tip.alert("施工人数为正整数")||
			!model.constgroup['pcr_addr'].length&&!tip.alert("请输入施工地点")||
			!model.constgroup['pcr_worker_names'].length&&!tip.alert("请输入施工人员")||
			!model.constgroup['pcr_remark'].length&&!tip.alert("请输入施工情况");
		}
 	}
});