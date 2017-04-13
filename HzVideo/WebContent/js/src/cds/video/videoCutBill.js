define(function(require){
	var $ = require("jquery");
	var db = require('frm/hz.db');
	var ztree = require('ztree');
	var vue = require('vue');
	var select = require('frm/select');
	var treeSelect = require("frm/treeSelect");
	var message = require('frm/message');
	var datepicker = require("frm/datepicker");
	var treeUtil = require('frm/treeUtil');
	var loginUser = require('frm/loginUser');
	var dialog = require('frm/dialog');
	var videoClient = require('frm/hz.videoclient');
	var hzEvent = require('frm/hz.event');
	var table = require("frm/table");
	var model = require("frm/model");
	var videoCutTable;
	
	var vm = new vue({
		el:'body',
		data:{
			person:[],
			activeTab:1,
			selectIndex:[],
			search:{
				cusNumber:loginUser.cusNumber,
				status:'',
				fileType:'',
				createUser:'',
				pushUser:'',
				receiveUser:'',
				startTime:'',
				endTime:''
			}
		},
		methods:{
			setActiveTab:function(n){
				this.activeTab = n;
				if(!vm.contains(n)){ 
					vm.selectIndex.push(n);
					if(n == 1){
						initVideoCutTable();
					}else if(n == 2){
						initAlreadyCreateBillTable();
					}else if(n == 3){
						initAlreadySendBillTable();
					}else{
						initAlreadyReceiveBillTable();
					}
				}
			},
			contains:function(val){
				if(vm.selectIndex){
					for(var i = 0; i < vm.selectIndex.length;i++){
						if(vm.selectIndex[i] == val) return true;
					}
				}
				return false;
			},
			showTableSearch:function(i){		//弹出表格查询
				if(i == 1){
					 dialog.open({targetId:'searchTable1',title:'查询',h:"330",w:'500'});
				}else{
					 dialog.open({targetId:'searchTable'+i,title:'查询',h:"330",w:'500'});
				}
			},
			resetSearchTable:function(){	//重置查询
				//清空并保留cusNumber
				model.clear(vm.search,{cusNumber:loginUser.cusNumber});
			},
			searchTable:function(i){		//查询表格
				dialog.close();
				var whereId = '0';
				if(i == 1){
					whereId = '1';	//截图信息查询
				}else if(i == 2){
					whereId = '1';	//已建监督单查询
				}else if(i == 3){
					whereId = '4';	//已发监督单查询
				}else if(i == 4){
					whereId = '7';	//已收监督单查询
				}
				table.method("refresh",{
    			 	request:{
    			 		whereId:whereId,
    			 		params:vm.search
    			 	}
			 	}
			);
				
			},
			createBill:function(){	//创建监督单 
				var getSelections = videoCutTable.bootstrapTable('getSelections');
				if(getSelections.length > 0){
					dialog.top.open({
						id:10001,
						type:2,
						title:'视频截图',
						w:55,
						h:60,
						top:90,
						url:'page/cds/video/videoCut.html'
					});
				}else{
					message.alert('至少选择一行');
				}
				
			},
			updateBill:function(){
				
			},
			deleteBill:function(){
				
			}
		}
	}); 
	

	$(".personQuery").keyup(function(e){
		var personKey =  document.getElementByClassName("personKey");
		//获取条件id
		var whereId = personKey.getAttribute('data');
		var pos=e.target.getBoundingClientRect();
		personKey.style.left=pos.left;
		personKey.style.top=pos.top+e.target.clientHeight-4;
		personKey.style.width=e.target.clientWidth;
		personKey.style.display='block';
		db.query({
			request:{
				sqlId:'select_video_cut_bill_user',
				params:{'cusNumber':loginUser.cusNumber},
				whereId:whereId
			},
			success:function(data){
				vm.person = data;
			}
		})
	});
	
	
	//初始化视频截图表格
	function initVideoCutTable(){
		//table表
		videoCutTable = table.init("table1",{
			request:{
				sqlId:'select_video_cut_info',
				whereId:'0',
				params:{
					cusNumber:loginUser.cusNumber
				}
			},
			search:[
				{
					key:'vcd_title',
					whereId:'2'
				},
				{
					key:'vcd_detail',
					whereId:'2',
					name:'搜索标题'
				}
			],
			/*search:{
					key:'vcd_title',
					whereId:'2'
			},*/
			clickToSelect:true,
			columns: [[  
						{
						    field: 'state',
						    checkbox: true
						},
		                  {
		                    title: '证据标题',
		                    field: 'vcd_title',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '存在问题',
		                    field: 'vcd_problem_type',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '详细描述',
		                    field: 'vcd_detail',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '监控地点',
		                    field: 'vcd_place',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录时间',
		                    field: 'vcd_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录人',
		                    field: 'ubd_name',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '状态',
		                    field: 'vcd_use_status',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '文件类型',
		                    field: 'vcd_file_type',
		                    align: 'center',
		                    valign: 'middle'
		                }
		     ]]
		});
	}
	
	//初始化已建监督单表格
	function initAlreadyCreateBillTable(){
		//table表
		buildingBillTable = table.init("table2",{
			request:{
				sqlId:'select_video_cut_bill_list',
				whereId:'0',
				params:{
					cusNumber:loginUser.cusNumber
				}
			},
			search:[{
					key:'vcd_title',
					whereId:'2'
				},
				{
					key:'vcb_name',
					whereId:'2'
				}
			],
			columns: [[  
						{
						    field: 'state',
						    checkbox: true
						},
		                  {
		                    title: '监督单名称',
		                    field: 'vcb_name',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录时间',
		                    field: 'vcd_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录地点',
		                    field: 'vcd_place',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '存在问题',
		                    field: 'vcd_problem_type',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '创建时间',
		                    field: 'vcb_create_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '创建人',
		                    field: 'ubd_name',
		                    align: 'center',
		                    valign: 'middle'
		                }
		     ]]
		});
	}
	
	//初始化已发监督单表格
	function initAlreadySendBillTable(){
		//table表
		buildingBillTable = table.init("table3",{
			request:{
				sqlId:'select_video_cut_bill_list',
				whereId:'3',
				params:{
					cusNumber:loginUser.cusNumber
				}
			},
			search:{
				key:'vcd_title',
				whereId:'5'
			},
			columns: [[  
						{
						    field: 'state',
						    checkbox: true
						},
		                  {
		                    title: '监督单名称',
		                    field: 'vcb_name',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录时间',
		                    field: 'vcd_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录地点',
		                    field: 'vcd_place',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '存在问题',
		                    field: 'vcd_problem_type',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '推送时间',
		                    field: 'vcb_push_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '推送人',
		                    field: 'ubd_name',
		                    align: 'center',
		                    valign: 'middle'
		                }
		     ]]
		});
	}
	
	//初始化已收监督单表格
	function initAlreadyReceiveBillTable(){
		//table表
		buildingBillTable = table.init("table4",{
			request:{
				sqlId:'select_video_cut_bill_list',
				whereId:'6',
				params:{
					cusNumber:loginUser.cusNumber
				}
			},
			search:{
				key:'vcd_title',
				whereId:'8'
			},
			columns: [[  
						{
						    field: 'state',
						    checkbox: true
						},
		                  {
		                    title: '监督单名称',
		                    field: 'vcb_name',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录时间',
		                    field: 'vcd_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '记录地点',
		                    field: 'vcd_place',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '存在问题',
		                    field: 'vcd_problem_type',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '接收时间',
		                    field: 'vcb_receive_time',
		                    align: 'center',
		                    valign: 'middle'
		                },
		                {
		                    title: '接收人',
		                    field: 'ubd_name',
		                    align: 'center',
		                    valign: 'middle'
		                }
		     ]]
		});
	}
	
	initVideoCutTable();
	
	
});