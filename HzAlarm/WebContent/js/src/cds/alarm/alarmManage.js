define(['jquery','vue','frm/hz.db',"frm/loginUser","frm/treeUtil","frm/model","frm/treeSelect","frm/message","frm/select"],function($,tpl,db,login,util,modelUtil,treeSelect,tip){
	
	var treeContainer ,orgContainer,tId;
	var model=new tpl({
		el:"#form",
		data:{
			alarm:{
				id:  ''  ,
				gid: ''  ,
				name:''  ,
				icon:''  ,
				seq:''   ,
				nbd_other_id:''   ,
				nbd_brand:   ''   ,
				nbd_ip:      ''   ,
				nbd_port:    ''   ,
				nbd_dept_id: ''   ,
				nbd_dvc_addrs:''  ,
				nbd_stts:     ''  ,
				dep:'',
				tid:'',
				area:'',
				cus:'',
				userid:login.userId?login.userId:''
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
					if(node.type==1){
						var p=node.getParentNode();
						
						node.area=p&&p.name;
						
						modelUtil.modelData(model.alarm,node);
						
						var dep=orgContainer.getNodeByParam('id',node['nbd_dept_id'],null);
						
						model.alarm['dep']=dep&&dep.name;
						
						model.alarm['tid']=node.tId;
						
					}
					
				},
				onClick:function(e,evnt,node){
					if(node.type==0){
						tId=node.tId;
						model.alarm['area']=node.name;
						model.alarm['gid']=node.gid;
						model.alarm['cus']=model.alarm['cus']?model.alarm['cus']:node.cus;
					}
					
				}
			}
	}
	//初始化左侧树，系统管理员，一般用户,省局用户
	db.query({
		request:{
			sqlId:'query_alarm_area_tree',
			params:{org:login.sysAdmin||login.dataAuth==2?login.cusNumber:login.deptId,type:(!login.cusNumber||login.dataAuth==2)?'3':'2'},
			orderId:'0',
			whereId:(!login.cusNumber||login.dataAuth==2)?'':'0'
		},success:function(data){
			treeContainer=$.fn.zTree.init($("#tree"),setting,data);
			$("#input").keyup(function(){
				util.searchTree("name",this.value,"tree",data,setting);
			});
		}
	});
	
	//初始化部门树，系统管理员，一般用户
	db.query({
		request:{
			sqlId:'query_org_dep_alarm',
			params:{org:login.sysAdmin||login.dataAuth==2?login.cusNumber:login.deptId}
		},success:function(data){
			var set={
					path:setting.path,
					edit:setting.edit,
					view:setting.view,
					data:setting.data,
					callback:{
						onClick:function(id,e,node){
							model.alarm['dep']=node.name;
							model.alarm['nbd_dept_id']=node.id;
						}
					}
			}
			orgContainer=treeSelect.init("dep", set,data);
			orgContainer.expandNode(orgContainer.getNodes()[0]);
		}
	});
	//增删改
	$("div.buttons").on("click","a",function(){
		if(this.textContent=="保存"){
			if(validate())return;
			
			tip.saving();
			
			if((model.alarm['id']+'').length){//修改
				db.updateByParamKey({
					request:{
						sqlId:'update_alarm',
						params:[model.alarm]
					},success:function(){
						
						var temp=treeContainer.getNodeByTId(model.alarm["tid"]);
						
	 		 			modelUtil.modelData(temp,model.alarm);
			 			//移动
			 			if(tId&&tId!=model.alarm['tid']){ 
			 				treeContainer.moveNode(treeContainer.getNodeByTId(tId),temp,"inner");
			 			}
			 			treeContainer.updateNode(temp);
			 			
			 			modelUtil.clear(model.door,{'cusnumber':'','user_id':''});
			 			
			 			tip.alert("更新成功");
			 			modelUtil.clear(model.alarm,{userid:''});
					}
				});
			}else{//新增
				db.updateByParamKey({
					request:{
						sqlId:'insert_alarm',
						params:[model.alarm]
					},success:function(data){
						
						var  pnode=treeContainer.getNodeByTId(tId);
						
 		 				var  temp=model.alarm;
 		 				
 		 				temp.icon="alarm.png";
 		 				
 		 				temp.id=data.data[0]['seqList'][0];
 		 				
 		 				temp.type=1;
 		 				
 		 				treeContainer.addNodes(pnode,-1,temp);
 		 				
 		 				modelUtil.clear(model.alarm,{'userId':''});
 		 				
 		 				tip.alert("新增成功");
 		 				
 		 				tId=null;
					}
					
				});
			}
		}else if(this.textContent=='删除'){
			if(!model.alarm['id'].length){
				tip.alert("请双击选择要删除报警器");
				return;
			}
			tip.confirm("确认删除该报警器？",function(){
				db.updateByParamKey({
					request:{
						sqlId:'delete_alarm_byid',
						params:[{id:model.alarm['id']}]
					},success:function(){
						treeContainer.removeNode(treeContainer.getNodeByTId(model.alarm['tid']));
						modelUtil.clear(model.alarm);
						tip.alert("删除成功");
					}
				});
			});
		}else{
			modelUtil.clear(model.alarm,{'userId':''});
		}
	});
	
	function validate(){
		return !model.alarm['area'].length&&!tip.alert('请选择所属区域')||
			   !model.alarm['dep']&&!tip.alert('请选择所属部门')||
			   !model.alarm['nbd_dvc_addrs'].length&&!tip.alert('请输入安装位置')||
			   !model.alarm['name'].length&&!tip.alert('请输入设备名称');
	}
});