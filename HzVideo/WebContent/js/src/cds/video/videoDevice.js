define(function(require){
	var $ = require("jquery");
	var db = require('frm/hz.db');
	var ztree = require('ztree');
	var vue = require('vue');
	var select = require('frm/select');
	var message = require('frm/message');
	var treeUtil = require('frm/treeUtil');
	var loginUser = require('frm/loginUser');
	
	var areaTree,setting;
		
	/**
	 * 初始化部门树
	 * @returns
	 */
	function initDeptTree(){
		var s={
			data:{
				simpleData:{
					enable:true,
					pIdKey:'pid'
				}
			},
			callback:{
				onClick:function(event,treeId, treeNode){
					vm.video.vdd_dept_name = treeNode.name;
					vm.video.vdd_dept_id = treeNode.id;
					$("#deptCon").hide();
				}
			}
		}
		db.query({
			request: {
				sqlId: "select_org_dept",
				whereId: 0,
				orderId:0,
				params: [loginUser.cusNumber]
			},
			success: function (data) {
				var deptTree = $.fn.zTree.init($('#deptTree'),s,data);			
				deptTree.expandAll(true);
			},
			error: function (code, msg) {
				console.log('查询失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}
	
	var vm = new vue({
		el:'body',
		data:{
			videoData:[],
			searchTree:'',
			video:{
				id:'',
				name:'',
				vdd_other_id:'',
				vdd_device_type:'0',
				vdd_device_brand:'',
				vdd_device_mode:'',
				vdd_ip_addrs:'',
				vdd_port:'',
				vdd_ip_addrs2:'',
				vdd_port2:'',
				vdd_user_name:'',
				vdd_user_password:'',
				vdd_dept_id:'',
				vdd_area_id:'',
				vdd_dvc_addrs:'',
				vdd_stts_indc:'0',
				vdd_seq:'',
				vdd_crte_user_id:loginUser.userId,
				vdd_updt_user_id:loginUser.userId,
				vdd_cus_number:loginUser.cusNumber,
				
				vdd_dept_name:'',
				vdd_area_name:'',
			}
		},
		methods:{
			reset:function(){
				reset();
			},
			saveVideo:function(){
				var me = this;
				if(!this.video.name || !$.trim(this.video.name)){
					message.alert('请填写视频设备名称');
					return;
				}
				if(!this.video.vdd_device_type && this.video.vdd_device_type!=0){
					message.alert('请选择设备类型');
					return;
				}
				if(!this.video.vdd_dept_id){
					message.alert('请选择所属部门');
					return;
				}
				if(!this.video.vdd_area_id){
					message.alert('请在左侧树选择所在区域');
					return;
				}	
				if(this.video.name.length > 26){
					message.alert("设备名称过长，请输入26个以内字符");
					return;
				}
				if(this.video.vdd_other_id && this.video.vdd_other_id.length > 26){
					message.alert("厂商唯一编号过长，请输入26个以内字符");
					return;
				}
				var sqlId = !this.video.id ? 'insert_video_device' : 'update_video_device' ;
				db.updateByParamKey({
					request: [{
						sqlId:sqlId,
						params:this.video
					}],
					success: function (data) {
						var seqId = !me.video.id ? data.data[0].seqList[0] : me.video.id;
						if(sqlId == 'insert_video_device'){
							me.video.id = seqId;
							saveSuccess('保存成功','a');							
						}else if(sqlId == 'update_video_device'){
							saveSuccess('保存成功','u');	
						}
					},
					error: function (code, msg) {
						message.close();
					}
				});					
			},
			delVideo:function(){
				var me =this;
				if(!this.video.id){
					message.alert("请在左侧树选择视频设备");
					return;
				}
				message.confirm('确定删除该视频设备吗？',function(index){
					db.update({
						 request:[{
							 sqlId: 'del_video_device',
							 params: [me.video.id]
						 }],
						 success: function (data) {
							 saveSuccess('删除成功','d');
						 },
						 error: function (code, msg) {
							 message.close();
						 }
					 });
				});
			}
		}
	});
	
	/**
	  * 搜索tree监听函数
	  */
	 vm.$watch('searchTree',function(){
		 treeUtil.searchTree('name',vm.searchTree,'areaTree',vm.videoData,setting);
	 });
	
	 /**
	  * 保存成功执行回调
	  * @returns
	  */
	 function saveSuccess(m,t){
		 message.close();
		 message.alert(m);
		 
		 if(t=='u'){
			 var node = areaTree.getNodeByTId(vm.video.tId);
			 var pnode = areaTree.getNodesByParam('id',vm.video.pid);
			 node = vm.video;
			 areaTree.moveNode(pnode[0],node,'inner');
			 areaTree.updateNode(node);	
		 }else if(t=='a'){
			 var pnode = areaTree.getNodesByParam('id',vm.video.pid);
			 areaTree.addNodes(pnode[0],vm.video);
			 vm.videoData.push(vm.video);
		 }else if(t=='d'){
			 var node = areaTree.getNodeByTId(vm.video.tId);
			 areaTree.removeNode(node);
		 }
		 
		 reset();
	 }
	 
	 function reset(){
		 vm.video={
			id:'',
			name:'',
			vdd_other_id:'',
			vdd_device_type:'0',
			vdd_device_brand:'',
			vdd_device_mode:'',
			vdd_ip_addrs:'',
			vdd_port:'',
			vdd_ip_addrs2:'',
			vdd_port2:'',
			vdd_user_name:'',
			vdd_user_password:'',
			vdd_dept_id:'',
			vdd_area_id:'',
			vdd_dvc_addrs:'',
			vdd_stts_indc:'0',
			vdd_seq:'',
			vdd_crte_user_id:loginUser.userId,
			vdd_updt_user_id:loginUser.userId,
			vdd_cus_number:loginUser.cusNumber
		}
	 }
	 
	/**
	 * 初始化左侧区域摄像机树
	 * @returns
	 */
	function initAreaCameraTree(){
		vm.videoData = []; 
		setting={
			view:{dblClickExpand:false},	 
			data:{
				simpleData:{
					enable:true,
					pIdKey:'pid'
				}
			},
			callback:{
				onClick:function(event,treeId,treeNode){
					if(!treeNode || treeNode.vdd_area_id){
						return;
					}
					vm.$set('video.vdd_area_name',treeNode.name);
					vm.$set('video.vdd_area_id',treeNode.id);
					vm.$set('video.pid',treeNode.id);
				},
				onDblClick:function(event,treeId,treeNode){
					if(!treeNode || treeNode.isParent){
						return;
					}
					if(!treeNode.vdd_area_id){
						return;
					}
					selectParentNode = treeNode.getParentNode();
					vm.video = treeNode;
					vm.video.id = treeNode.id.replace('v_','');
				}
			}
		}
		db.query({
			request: {
				sqlId: 'select_video_area_tree',
				whereId: 0,
				orderId:0,
				params: [loginUser.cusNumber]
			},
			success: function (data) {
				for(var i=0,j=data.length;i<j;i++){
					data[i].isParent=true;
					vm.videoData.push(data[i]);
				}
				db.query({
					request: {
						sqlId: 'select_video_tree',
						whereId: 0,
						params: [loginUser.cusNumber]
					},
					success: function (data) {
						for(var i=0,j=data.length;i<j;i++){
							data[i].id = "v_"+data[i].id;
							vm.videoData.push(data[i]);
						}
						vm.videoData.push({
							id:loginUser.cusNumber,
							name:loginUser.cusNumberName,
							pid:0,
							isParent:true
						});
						areaTree = $.fn.zTree.init($('#areaTree'),setting,vm.videoData);
						areaTree.expandNode(areaTree.getNodes()[0],true);
					},
					error: function (code, msg) {}
				});
			},
			error: function (code, msg) {}
		});
	}
	
	initAreaCameraTree();
	initDeptTree();
});