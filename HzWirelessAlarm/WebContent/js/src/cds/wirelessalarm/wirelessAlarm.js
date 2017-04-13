define(['jquery','vue','frm/hz.db',"frm/loginUser","frm/treeUtil","frm/model","frm/treeSelect","frm/message","frm/select"],
		function($,vue,db,user,util,modelUtil,treeSelect,message,select){
	
	var treeContainer ,orgContainer,tId;
	var vm=new vue({
		el:"#panel",
		data:{
			alarm:{
				wam_cus_number:user.cusNumber,
				wam_id:'',
				wam_other_id:'',
				wam_name:'',
				wam_brand:'',
				wam_ip:'',
				wam_port:'',
				wam_dept_id:'',
				wam_dept_name:'',
				wam_area_id:'',
				wam_area_name:'',
				wam_room_id:'',
				wam_dvc_addrs:'',
				wam_stts:'',
				wam_seq:'',
				wam_crte_time:'',
				wam_crte_user_id:user.userId,
				wam_updt_time:'',
				wam_updt_user_id:user.userId,
				tid:''
			}
		},
		methods:{
			saveAlarm:function(){
				saveWirelessAlarm();
			},
			delAlarm:function(){
				delWirelessAlarm();
			},
			resestAlarm:function(){
				
			}
		}
	});
	//树形设置
	var setting={
			path:'../../../libs/ztree/css/zTreeStyle/img/',
			edit: {enable: true,showRenameBtn:false,showRemoveBtn: false},
			view: {dblClickExpand: false},
			data: {simpleData: {enable: true,pIdKey: "pid"}},
			callback:{
				onDblClick:function(e,id,node){
					if(node.type==0){
						var p=node.getParentNode();
						node.wam_area_name=p&&p.name;
						modelUtil.modelData(vm.alarm,node);
						vm.alarm.wam_name = node.name;
						vm.alarm.wam_id = node.id;
						vm.alarm.wam_area_id = node.pid;
						var dep=orgContainer.getNodeByParam('id',node['wam_dept_id'],null);
						vm.alarm['wam_dept_name']=dep&&dep.name;
						vm.alarm.tid = node.tId;
					}
					
				},
				onClick:function(e,evnt,node){
					if(node.type==1){
						tId=node.tId;
						vm.alarm['wam_area_name']=node.name;
						vm.alarm['wam_area_id']=node.id;
					}
					
				}
			}
	}
	//初始化左侧树，系统管理员，一般用户,省局用户
	db.query({
		request:{
			sqlId:'query_wireless_alarm_area_tree',
			params:{org:user.cusNumber},
			orderId:'0',
			whereId:'0'
		},success:function(data){
			treeContainer=$.fn.zTree.init($("#tree"),setting,data);
			treeContainer.expandNode(treeContainer.getNodes()[0],true, false, false);
			$("#input").keyup(function(){
				util.searchTree("name",this.value,"tree",data,setting);
			});
		}
	});
	
	//初始化部门树，系统管理员，一般用户
	db.query({
		request:{
			sqlId:'query_org_dep_alarm',
			params:{org:user.sysAdmin||user.dataAuth==2?user.cusNumber:user.deptId}
		},success:function(data){
			var set={
					path:setting.path,
					edit:setting.edit,
					view:setting.view,
					data:setting.data,
					callback:{
						onClick:function(id,e,node){
							vm.alarm['wam_dept_name']=node.name;
							vm.alarm['wam_dept_id']=node.id;
						}
					}
			}
			orgContainer=treeSelect.init("dep", set,data);
			orgContainer.expandNode(orgContainer.getNodes()[0]);
		}
	});
	
	/**
	 * 保存无线报警器信息
	 */
	function saveWirelessAlarm(){
		if(vm.alarm.wam_id){
			if(validate())return;
			message.saving();
			db.updateByParamKey({
				request:{
					sqlId:'update_wireless_alarm_info',
					whereId:'0',
					params:vm.alarm
				},success:function(){
					var temp=treeContainer.getNodeByTId(vm.alarm["tid"]);
 		 			modelUtil.modelData(temp,vm.alarm);
		 			//移动
		 			if(tId&&tId!=vm.alarm['tid']){ 
		 				treeContainer.moveNode(treeContainer.getNodeByTId(tId),temp,"inner");
		 			}
		 			temp.name = vm.alarm.wam_name;
		 			treeContainer.updateNode(temp);
		 			
		 			modelUtil.clear(vm.alarm,{
		 				'wam_cus_number':'',
		 				'wam_crte_user_id':'',
		 				'wam_updt_user_id':''
 					});
		 			
		 			message.alert("更新成功");
				}
			});
		}else{
			db.updateByParamKey({
				request:{
					sqlId:'insert_wireless_alarm_info',
					params:vm.alarm
				},success:function(data){
					var  pnode=treeContainer.getNodeByTId(tId);
	 				var  temp=vm.alarm;
	 				temp.icon="alarm.png";
	 				temp.id=data.data[0]['seqList'][0];
	 				temp.type=0;
	 				temp.name = temp.wam_name;
	 				treeContainer.addNodes(pnode,-1,temp);
	 				modelUtil.clear(vm.alarm,{
		 				'wam_cus_number':'',
		 				'wam_crte_user_id':'',
		 				'wam_updt_user_id':''
 					});
	 				message.alert("新增成功");
	 				tId=null;
				}
			});
		}
	}
	
	/**
	 * 删除无线报警器信息
	 */
	function delWirelessAlarm(){
		message.confirm("确认删除该报警器？",function(){
			db.updateByParamKey({
				request:{
					sqlId:'delete_wireless_alarm_info',
					params:[{wam_id:vm.alarm['wam_id']}]
				},success:function(){
					treeContainer.removeNode(treeContainer.getNodeByTId(vm.alarm['tid']));
					modelUtil.clear(vm.alarm);
					message.alert("删除成功");
				}
			});
		});
	}
	
	/**
	 * 重置
	 */
	function resetWirelessAlarm(){
		
	}
	
	
	function validate(){
		return !vm.alarm['wam_area_id']&&!message.alert('请选择所属区域')||
			   !vm.alarm['wam_dept_id']&&!message.alert('请选择所属部门')||
			   !vm.alarm['wam_dvc_addrs']&&!message.alert('请输入安装位置')||
			   !vm.alarm['wam_name']&&!message.alert('请输入设备名称');
	}
});