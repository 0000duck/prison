define(function(require){
	var vue = require('vue'),
		db = require('frm/hz.db'),
		select = require('frm/select'),
		user = require('frm/loginUser'),
		ztree = require('ztree'),
		datepicker = require('frm/datepicker'),
		treeUtil = require('frm/treeUtil'),
		message = require('frm/message');
	
	var cameraTree,doorTree,alarmTree,powerTree;
	var alarmLevels=[];
	var setting = {
		data:{simpleData:{enable:true,pIdKey:'pid',idKey:'rid'}},
		check:{enable:true},
		callback:{
			onCheck:function(event,treeId,treeNode){
				if(treeNode.checked){
					loadLevelsByDeciceId(treeNode.id,'push');					
				}else{
					for(var i=0;i<alarmLevels.length;i++){
						if(treeNode.id == alarmLevels[i].lhs_alertor_id){
							alarmLevels.splice(i,1);
						}
					}
				}
			},
			onDblClick:function(event,treeId,treeNode){
				if(!treeNode || treeNode.isParent){
					return;
				}
				$.fn.zTree.getZTreeObj(treeId).checkAllNodes(false);
				$.fn.zTree.getZTreeObj(treeId).checkNode(treeNode,true,false,true);
				loadLevelsByDeciceId(treeNode.id,'query');
			}
		}
	};
	
	var vm = new vue({
		el:'body',
		data:{
			expandSearchMenu:false,
			isExpand:false,
			
			searchTree:'',
			deviceTypes:[],
			checkdTypes:[],//选中的设备类型
			ztreeDataMap:{},//存放所有tree对应的 data key 为报警设备id
			
			isset:[],
			sqlIds:{
				'1':'select_camera_alarm',
				'2':'select_power_alarm',
				'6':'select_network_alarm',
				'4':'select_door_alarm'
			},
			
			checkedAlarmDevices:[],//左侧树 所有选中的报警设备
			levels:[{
				lhs_cus_number:user.cusNumber,
				lhs_start_time:'',
				lhs_end_time:'',
				lhs_level:'',
				lhs_receive_dept_id:'',
				notice_dept_ids:[]
			}]
		},
		watch:{
			'isset':function(){
				filterBySet();
			},
			'searchTree':function(){
				searchTree();
			}
		},
		methods:{
			expand:function(){this.isExpand=!this.isExpand},
			expandMenu:function(){this.expandSearchMenu=!this.expandSearchMenu},
			setSearchType:function(d){this.searchType = d.id;this.searchTypeName = d.name;this.expandSearchMenu = false;},
			reset:function(){resetData()},
			isCheck:function(type){return isExist(type)},
			addLevel:function(){addLevel()},
			removeLevel:function(l){this.levels.$remove(l)},
			saveAlarmLevel:function(){
				saveAlarmLevels();
			}
		}
	});
	
	function saveAlarmLevels(){
		getCheckedAlarmDevices();
		var delAlarmLevelParams=[];
		var delAlarmLevelNoticeDeptParams=[];
		var insertAlarmLevelNoticeDeptParams=[];
		var realSubmitLevels= [];//真正提交到后台的 新增报警分级参数数组
		
		if(vm.checkedAlarmDevices.length == 0){
			message.alert('请勾选左侧树上的报警设备');
			return;
		}
		
		for(var j =0,k=vm.checkedAlarmDevices.length;j<k;j++){
			var deviceId = vm.checkedAlarmDevices[j].deviceId;
			var deviceType = vm.checkedAlarmDevices[j].deviceType;
			
			delAlarmLevelParams.push({
				cusNumber:user.cusNumber,
				lhs_alertor_id:deviceId
			});
			for(i=0;i<vm.levels.length;i++){
				realSubmitLevels.push({
					lhs_cus_number:user.cusNumber,
					lhs_alertor_id:deviceId,//报警器编号
					lhs_start_time:vm.levels[i].lhs_start_time,
					lhs_end_time:vm.levels[i].lhs_end_time,
					lhs_level:vm.levels[i].lhs_level,
					lhs_dvc_type:deviceType,//报警器类别对应 tree上的 type字段
					lhs_receive_dept_id:vm.levels[i].lhs_receive_dept_id,
					lhs_seq:0,
					lhs_crte_user_id:user.userId,
					lhs_updt_user_id:user.userId,
					notice_dept_ids:vm.levels[i].notice_dept_ids
				});				
			}
		}
		
		for(var h=0;h<alarmLevels.length;h++){
			delAlarmLevelNoticeDeptParams.push({
				cusNumber:user.cusNumber,
				lhs_id:alarmLevels[h].lhs_id
			});
		}
		var msg;
		for(var i=0;i<realSubmitLevels.length;i++){
			if(!realSubmitLevels[i].lhs_start_time){
				msg = "开始时间不能为空";
				break;
			}
			if(!realSubmitLevels[i].lhs_end_time){
				msg = "结束时间不能为空";
				break;
			}
			if(!realSubmitLevels[i].lhs_receive_dept_id){
				msg = "请选择接警部门";
				break;
			}
			if(!realSubmitLevels[i].lhs_level){
				msg = "请选择报警等级";
				break;
			}
			if(realSubmitLevels[i].lhs_end_time <= realSubmitLevels[i].lhs_start_time){
				msg = "第"+(i+1)+"个的报警等级开始时间小于结束时间";
				break;
			}
		}
		if(msg){
			message.alert(msg);
			return;
		}
		
		if(delAlarmLevelParams.length>0){
			db.updateByParamKey({
				request:[{
					sqlId:'delete_alarm_level',
					params:delAlarmLevelParams
				}],
				success:function(data){}
			});
		}
		
		db.updateByParamKey({
			request:[{
				sqlId:'insert_alarm_level',
				params:realSubmitLevels
			}],
			success:function(data){
				var seqList = data.data[0].seqList;
				for(var i=0;i<realSubmitLevels.length;i++){
					var noticeDept = realSubmitLevels[i].notice_dept_ids; 
					for(var j=0;j<noticeDept.length;j++){
						insertAlarmLevelNoticeDeptParams.push({
							anr_cus_number:user.cusNumber,
							anr_handle_id:seqList[i],
							anr_notice_dept_id:noticeDept[j],
							anr_seq:0
						});				
					}
				}
				if(delAlarmLevelNoticeDeptParams.length>0){
					db.updateByParamKey({
						request:[{
							sqlId:'delete_alarm_level_notice_dept',
							params:delAlarmLevelNoticeDeptParams
						}],
						success:function(data){}
					});
				}
				db.updateByParamKey({
					request:[{
						sqlId:'insert_alarm_level_notice_dept',
						params:insertAlarmLevelNoticeDeptParams
					}],
					success:function(){}
				});
				reset();
			}
		});
	}
	
	function reset(){
		message.alert('保存成功');
		resetData();
	}
	
	function resetData(){
		resetLevels();
		vm.checkedAlarmDevices=[];
		alarmLevels=[];
		clearTreeChecked();
	}
	function resetLevels(){
		vm.levels=[{
			lhs_cus_number:user.cusNumber,
			lhs_start_time:'',
			lhs_end_time:'',
			lhs_level:'',
			lhs_receive_dept_id:'',
			notice_dept_ids:[]
		}]
	}
	
	function clearTreeChecked(){
		for(var i=0;i<vm.deviceTypes.length;i++){
			var tree = getZtreeById(vm.deviceTypes[i].id);
			if(tree){
				tree.checkAllNodes(false);				
			}
		}
	}
	
	/**
	 * 获取左侧树所有勾选的 报警设备
	 */
	function getCheckedAlarmDevices(){
		vm.checkedAlarmDevices = [];
		for(var i=0;i<vm.deviceTypes.length;i++){
			var tree = getZtreeById(vm.deviceTypes[i].id);
			if(tree){
				var checkeds = tree.getCheckedNodes(true);
				for(var j=0;j<checkeds.length;j++){
					vm.checkedAlarmDevices.push({
						deviceId:checkeds[i].id,
						deviceType:checkeds[i].type
					});
				}				
			}
		}
	}
	
	/**
	 * 根据设备id 查询报警分级列表
	 * @returns
	 */
	function loadLevelsByDeciceId(deviceId,option){
		db.query({
			request: {
				sqlId:'select_alarm_level_ids',
				whereId:0,
				params:{cusNumber:user.cusNumber,lhs_alertor_id:deviceId}
			},
			success: function (data) {
				if(option == 'push'){
					for(var i=0;i<data.length;i++){
						alarmLevels.push(data[i]);					
					}					
				}else if(option == 'query'){
					vm.levels =[];
					var deptIds = [];
					if(data.length == 0){
						resetLevels();
					}else{
						for(var i=0;i<data.length;i++){
							if(data[i].dept_ids){
								deptIds = data[i].dept_ids.split(',');
							}
							data[i].notice_dept_ids = deptIds;
							vm.levels.push(data[i]);
						}
					}
				}
			}
		});
	}
	
	/**
	 * 初始化所有树
	 * @returns
	 */
	function initTrees(){
		for(var i=0;i<vm.deviceTypes.length;i++){
			var deviceType = vm.deviceTypes[i].id;
			var sqlId = vm.sqlIds[deviceType];
			if(sqlId){
				var ztreeData = [{
					id:user.cusNumber,
					rid:user.cusNumber,
					name:vm.deviceTypes[i].name,
					pid:0,
					isParent:true,
					nocheck:'true',
					open:true
				}];
				db.query({
					async:false,
					request: {
						sqlId:sqlId,
						orderId:0,
						params:{cusNumber:user.cusNumber,deviceType:deviceType}
					},
					success: function (data) {
						for(var k=0,j=data.length;k<j;k++){
							ztreeData.push(data[k]);
						}
						vm.ztreeDataMap[''+deviceType] = ztreeData;
						$.fn.zTree.init($('#alarm_'+deviceType),setting,ztreeData);
					}
				});
			}
		}
	}
	
	/**
	 * 加载报警设备类型
	 * @returns
	 */
	function loadDeviceTypes(){
		db.query({
			request: {
				sqlId:'select_constant_bycode',
				whereId:0,
				params:['ALARM_DEVICE_TYPE']
			},
			success: function (data) {
				vm.deviceTypes = data;
				vm.checkdTypes.push(data[0]);
				vue.nextTick(function(){
					initTrees();					
				});
			}
		});
	}
	
	function addLevel(){
		vm.levels.push({
			lhs_cus_number:user.cusNumber,
			lhs_start_time:'',
			lhs_end_time:'',
			lhs_level:'',
			lhs_receive_dept_id:'',
			notice_dept_ids:[]
		});
	}
	
	function searchTree(){
		for(var z in vm.ztreeDataMap){
			var tree = getZtreeById(z);
			if(tree){
				treeUtil.searchTree('name',vm.searchTree,'alarm_'+z,vm.ztreeDataMap[z],setting);								
			}
		}
	}
	
	/**
	 * 已设置，未设置
	 * @returns
	 */
	function filterBySet(){
		for(var z in vm.ztreeDataMap){
			var tree = getZtreeById(z);
			if(tree){
				var datas =vm.ztreeDataMap[z];
				var filterDatas = [];
				if(vm.isset.length==1 && vm.isset[0] == '1'){
					for(var j=0,k=datas.length;j<k;j++){
						if(datas[j].nocheck == 'true' || (datas[j].nocheck == 'false' && datas[j].levelids)){
							filterDatas.push(datas[j]);					
						}
					}	
				}else if(vm.isset.length==1 && vm.isset[0] == '2'){
					for(var j=0,k=datas.length;j<k;j++){
						if(datas[j].nocheck == 'true' || (datas[j].nocheck == 'false' && !datas[j].levelids)){
							filterDatas.push(datas[j]);			
						}
					}
				}else{
					filterDatas = datas;
				}
				$.fn.zTree.init($('#alarm_'+z),setting,filterDatas);
			}
		}
	}
	
	/**
	 * 判断是否存在
	 * @returns
	 */
	function isExist(id){
		for(var i=0,j=vm.checkdTypes.length;i<j;i++){
			if(vm.checkdTypes[i].id == id){
				return true;
			}
		}
		return false;
	}
	
	function getZtreeById(id){
		return $.fn.zTree.getZTreeObj("alarm_"+id);
	}
	
	function init(){
		loadDeviceTypes();
	}
	
	init();
});
