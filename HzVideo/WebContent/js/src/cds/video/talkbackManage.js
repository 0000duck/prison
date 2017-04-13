define(function(require){
	var $ = require("jquery"); 
	var db = require('frm/hz.db');
	var ztree = require('ztree');
	var vue = require('vue');
	var select = require('frm/select');
	var treeSelect = require('frm/treeSelect');
	var message = require('frm/message');
	var treeUtil = require('frm/treeUtil');
	var login = require('frm/loginUser');
	var modelUtil = require('frm/model');

	 
	var orgContainer,treeContainer,tId;
	 
	 var vm = new vue({
		 el:'body',
		 data:{
			 searchTree:'',
			 treeData:[],
			 cusNumber:login.cusNumber,
			 talkback:{
				 id:''          ,
				 pid:''         ,
				 name:''        ,
				 type:''        ,
				 icon:''        ,
				 tbd_other_id:'',
				 tbd_brand:'1'  ,
				 tbd_type:'',
				 tbd_relation_service:'',
				 tbd_mian_id:'' ,
				 tbd_child_id:'',
				 tbd_ip:''      ,
				 tbd_port:''    ,
				 dep:'' ,
				 dep_name:'',
				 tbd_area_id:'' ,
				 tbd_area_name:'',
				 tbd_room_id:'' ,
				 tbd_dvc_addrs:'',
				 tbd_dvc_stts:'0' ,
				 tbd_use_stts:'0' ,
				 tbd_seq:''      ,
				 tbd_crte_user_id:login.userId,
				 tbd_updt_user_id:login.userId,
				 cus:login.cusNumber,
				 tId:''
			 }
		 }
	 });
	 
	 vm.$watch('searchTree',function(){
		 treeUtil.searchTree('name',vm.searchTree,'talkTree',vm.treeData,setting);
	 });
	//树形设置
	var setting={
			path:'../../../libs/ztree/css/zTreeStyle/img/',
			view: {dblClickExpand: false},
			data: {simpleData: {enable: true,pIdKey: "pid"}},
			callback:{
				onDblClick:function(e,id,node){
					if(node.type==1){
						modelUtil.modelData(vm.talkback,node);
						
					}
				},
				onClick:function(e,evnt,node){
					if(node.type==0){
						tId=node.tId; 
						vm.talkback['tbd_area_id']=node.id.replace('1-','');
						vm.talkback['tbd_area_name']=node.name;
						vm.talkback['pid']=node.id;
						vm.talkback['cus']=vm.talkback['cus']?vm.talkback['cus']:node.cus;
					}
				}
			}
		}
		//初始化左侧树，系统管理员，一般用户,省局用户
		db.query({
			request:{
				sqlId:'query_talkback_area_tree',
				params:[login.cusNumber],
			},success:function(data){
				vm.treeData = data;
				treeContainer=$.fn.zTree.init($("#talkTree"),setting,data);
			}
		});
		//增删改
		$("div.buttons").on("click","a",function(){
			if(this.textContent=="保存"){
				
				if(validate())return;
				
				if(vm.talkback['id']){//修改
					db.updateByParamKey({
						request:{
							sqlId:'update_talkback',
							params:[vm.talkback]
						},success:function(){
							var temp=treeContainer.getNodeByTId(vm.talkback["tId"]);
		 		 		
							modelUtil.modelData(temp,vm.talkback);
				 			treeContainer.updateNode(temp);
				 		
				 			var node = treeContainer.getNodesByParam('id',vm.talkback.id)[0];
							var pnode = treeContainer.getNodesByParam('id',vm.talkback.pid)[0];
							treeContainer.addNodes(pnode,vm.talkback);
							treeContainer.removeNode(node);
							 
				 			message.alert("更新成功");
				 			reset();
						},error:function(code,msg){
							message.alert(msg);
						}
					});
				}else{//新增
					db.updateByParamKey({
						request:{
							sqlId:'insert_talkback',
							params:vm.talkback
						},success:function(data){
							var pnode = treeContainer.getNodesByParam('id',vm.talkback.pid);
	 		 				var  temp=vm.talkback;
	 		 				
	 		 				temp.icon="talk.png";
	 		 				temp.type=1;
	 		 				temp.id=data.data[0]['seqList'][0];
	 		 			
	 		 				
	 		 				treeContainer.addNodes(pnode[0],temp);
	 		 				message.alert("新增成功");
	 		 				reset();
	 		 				
						},error:function(code,msg){
							message.alert(msg);
						}	
						
					});
				}
			}else if(this.textContent=='删除'){
				if(!vm.talkback['id'].length){
					message.alert("请双击选择要删除对讲机");
					return;
				}
				message.confirm("确认删除该对讲机？",function(){
					db.updateByParamKey({
						request:{
							sqlId:'delete_talkback_byid',
							params:{id:vm.talkback['id']}
						},success:function(data){
							treeContainer.removeNode(treeContainer.getNodeByTId(vm.talkback['tId']));
							modelUtil.clear(vm.talkback);
							reset();
							message.alert("删除成功");
						},error:function(code,msg){
							message.alert(msg);
						}
					});
				});
			}else if(this.textContent=='重置'){
				
				reset();
			}
		});
		
		function reset(){
			modelUtil.clear(vm.talkback, {
				 tbd_brand:'1',
				 tbd_dvc_stts:'0' ,
				 tbd_use_stts:'0' ,
				 tbd_crte_user_id:login.userId,
				 tbd_updt_user_id:login.userId,
				 cus:login.cusNumber
			 });
		}
		
		function validate(){
			return !vm.talkback['tbd_area_id']&&!message.alert('请选择所属区域')||
				   !vm.talkback['dep']&&!message.alert('请选择所属部门')||
				   !vm.talkback['tbd_dvc_addrs']&&!message.alert('请输入安装位置')||
				   !vm.talkback['name'] && !message.alert('请输入对讲机名称')||
				    vm.talkback['name'].length>20 && !message.alert('对讲机名称过长') ;
		}
});
