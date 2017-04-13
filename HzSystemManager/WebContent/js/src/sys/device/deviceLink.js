define(["vue","frm/message","frm/loginUser",'frm/hz.db',"frm/treeUtil","frm/model","frm/select"],function(tpl,tip,login,db,tree,modelData){
	//设备缓存
	var deviceList={};
	//树形缓存
	var deviceTree={};
	//数据缓存
	var treeData={};
	//已关联，未关联
	var linkedList={},linkingList={};
	//
	var linkList;
	var deviceTypeHtml=$("#deviceTypeList"),mapDevice=document.getElementById("mapDevice");
	//
	var tempDevice;
	var model=new tpl({
		el:"#container",
		data:{
			deviceActions:[],
			deviceTypes:[],
			deviceType:[],
			deviceSelect:[],
			isExpand:false,
			searchTree:'',
			mark:'',
			checkedStatus:{
				link:'',
				linked:''
			}
		},
		watch:{
			searchTree:function(val){
				var flag=!this.checkedStatus.link&&!this.checkedStatus.linked;
				for(var type in this.zTreeShows) {
					this.zTreeShows[type]&&tree.searchTree('name',val, 'ztree'+type,flag?treeData['ztree'+type]:(this.checkedStatus.link?linkingList[type]:linkedList[type]), setting);
				}
			},
			'checkedStatus.link':function(val,old){
				if(typeof val=='number')return;
				model.mark='';
				this.deviceSelect=[];
				this.deviceType=[];
				if(val){//未关联
					this.checkedStatus['linked']=0;
					for(var type in this.zTreeShows) {
						var temp=this.zTreeShows[type]&&$.fn.zTree.init($('#ztree'+type),setting,linkingList[type]);
						temp&&temp.expandAll(true);
					}
				}else{
					for(var type in this.zTreeShows) {
						this.zTreeShows[type]&&$.fn.zTree.init($('#ztree'+type),setting,treeData['ztree'+type]);
					}
				}
			},
			'checkedStatus.linked':function(val){
				if(typeof val=='number')return;
				model.mark='';
				this.deviceSelect=[];
				this.deviceType=[];
				if(val){
					this.checkedStatus['link']=0;
					for(var type in linkedList){
						if(this.zTreeShows[type]){
							var temp=this.zTreeShows[type]&&$.fn.zTree.init($('#ztree'+type),setting,linkedList[type]);
							temp&&temp.expandAll(true);
						}
					}
				}else{
					for(var type in this.zTreeShows) {
						this.zTreeShows[type]&&$.fn.zTree.init($('#ztree'+type),setting,treeData['ztree'+type]);
					}
				}
			}
		},
		methods:{
			expand:function(){
				this.isExpand=!this.isExpand
			},
			remove:function(flag,tid,e){
				var pos=e.target.getBoundingClientRect();
				if(flag==1){
					if(e.x<pos.left+e.target.clientWidth+7&&e.x>pos.left+e.target.clientWidth-7&&e.y<pos.top+7&&e.y>pos.top-7){
						var tempTree=deviceList[tid.substr(0,tid.indexOf('_'))];
						var tempNode=tempTree.getNodeByTId(tid);
						if(tempNode.linkid){
							tip.confirm('确认删除所有关联设备？',function(){
								tempTree.checkNode(tempNode,false,true);
								model.deviceSelect.splice(model.deviceSelect.indexOf(tempNode),1);
								model.deviceSelect.length==0&&(model.deviceType=[]);
								remove(tempNode);
							});
						}else{
							tempTree.checkNode(tempNode,false,true);
							
							model.deviceSelect.splice(model.deviceSelect.indexOf(tempNode),1);
							
							model.deviceSelect.length==0&&(model.deviceType=[]);
						}
					}
				}else{
					
				}
			},
			addDevice:function(type,item,e){
				if(type==1){
					if(e.layerX<e.target.clientWidth*0.15&&Math.abs(e.layerY-e.target.clientHeight*0.5)<15){
						model.deviceType.push({typeName:'设备类型',tip:'1',deviceLink:[{name:'请选择设备',act:'动作',tip:'1','tipd':'1'}]})
					}
				}else{
					item.deviceLink.push({name:'请选择设备',act:'动作',tip:'1'});
				}
			},
			deviceType:function(e){
				
			},
			slideDown:function(item,e,device,flag){
				var pos=e.target.getBoundingClientRect();
				if(flag){
					if(flag==2){
						//删除设备
						if(e.x<pos.left+e.target.clientWidth+7&&e.x>pos.left+e.target.clientWidth-7&&e.y<pos.top+7&&e.y>pos.top-7){
							
							var pos=item.deviceLink.indexOf(device);
							
							pos>-1&&item.deviceLink.splice(pos,1);
							
							item.deviceLink.length==0&&model.deviceType.splice(model.deviceType.indexOf(item),1);
							
							model.deviceType.length==0&&(model.deviceType.push({typeName:'设备类型',tip:'1',deviceLink:[{name:'请选择设备',act:'动作',tip:'1','tipd':'1'}]}));
							return;
						}
						if(!item.id){tip.alert("请先选择设备类型");return;}
						$("#devicet"+item.id).css({top:pos.top+e.target.clientHeight-3,left:pos.left,width:e.target.clientWidth}).slideDown();
						linkList=item;
					}else{
						if(!item.id){tip.alert("请先选择设备类型");return;}
						$("#deviceAction").css({top:pos.top+e.target.clientHeight-3,left:pos.left,width:e.target.clientWidth}).slideDown();
					}
					tempDevice=device;
				}else{
					deviceTypeHtml.css({top:pos.top+e.target.clientHeight-3,left:pos.left,width:e.target.clientWidth}).slideDown();
					tempDevice=item;
					
				}
			},
			select:function(type,e,flag){
				if(flag&&flag==1){//设备类型
					var index=search(type.id);
					if(index>-1){
						model.deviceType[index].deviceLink.push({name:'请选择设备',act:'动作',tip:'1','tipd':'1'});
						return;
					}else{
						if(type.id!=tempDevice.id){
							tempDevice.deviceLink=[{name:'请选择设备',act:'动作',tip:'1','tipd':'1'}];
						}
						tempDevice.typeName=type.name;
						tempDevice.id=type.id;
					}
				}else{//动作
					tempDevice.act=type.name;
					tempDevice.actid=type.id;
				}
				tempDevice.tip='';
			},
			save:function(){
				if(this.deviceSelect.length==0){
					tip.alert("请先选择设备");
					return;
				}
				var list=mapDevice.querySelectorAll("p[data-tip='1']");
				if(list&&list.length>0){
					tip.alert("数据不完整,请补全数据!");
					return;
				}
				saveDeviceLink();
			}
		}
	});
	//在扩谱图中搜索类型
	function search(id){
		for(var i=0,len=model.deviceType.length;i<len;i++){
			if(model.deviceType[i].id==id){
				return i;
			}
		}
		return -2;
	}
	//保存更新
	function saveDeviceLink(){
		var linkIDList=[];
		var mainDevice=model.deviceSelect.map(function(row){
			if(row.linkid){
				linkIDList.push(row.linkid);//需要修改的从表
			   return 	{'sqlId':"update_deviceLink_base",'whereId':'0',params:{'linkid':row.linkid,'seq':row.linkid,'actid':row.actid,'mark':model.mark,'device':row.id,'cus':login.cusNumber,'type':row.tId.substring(5,row.tId.indexOf("_")),'name':row.name,'user':login.userId,'actid':row.actid}};
			}else{
			   return   {'sqlId':"insert_deviceLink_base",params:{'mark':model.mark,'device':row.id,'cus':login.cusNumber,'type':row.tId.substring(5,row.tId.indexOf("_")),'name':row.name,'user':login.userId,'actid':row.actid}};
			}
		});
		db.updateByParamKey({
			request:mainDevice,
			success:function(data){
				var linkList=[],temp;
				data=data.data;
				data.forEach(function(row){
					row.seqList&&linkIDList.push(row.seqList[0]);
				});
				for(var i=0,len=linkIDList.length;i<len;i++){
					temp=[];
					for(var j=0,jlen=model.deviceType.length;j<jlen;j++){
						temp=temp.concat(model.deviceType[j].deviceLink.map(function(row){
							return {'type':model.deviceType[j].id,'cus':login.cusNumber,'linkid':linkIDList[i],'linkdevice':row.deviceid,'linkname':row.name,'actid':row.actid};
						}));
					}
					linkList.push({
						'sqlId':'insert_deviceLink_attachment',
						'params':temp
					});
				}
				
				linkList.unshift({
					'sqlId':'delete_deviceLink_attach',
					'whereId':'0',
					'params':linkIDList.map(function(row){
						return {'linkid':row,'cus':login.cusNumber}
					})//model.deviceSelect.map(function(row){return {'linkid':linkId,'cus':login.cusNumber}})
				});
				db.updateByParamKey({
					request:linkList,
					success:function(){
						model.deviceSelect.forEach(function(row){
							var tree=deviceList['ztree'+row.tId.substring(5,row.tId.indexOf('_'))];
							tree.checkNode(tree.getNodeByTId(row.tId),false,true);
						});
						model.deviceSelect=[];
						model.deviceType=[];
						tip.alert('保存成功');
						model.mark='';
					}
				});
			}
		});
	}
	//删除关联
	function remove(node){
		var type=node.tId.substring(5,node.tId.indexOf('_'));
		db.updateByParamKey({
			request:[{//删除从表
				sqlId:'delete_deviceLink_attach',
				params:{'linkid':node.linkid,'cus':login.cusNumber}
			},{//删除主表
				sqlId:'delete_deviceLink_base',
				params:{'linkid':node.linkid,'cus':login.cusNumber,'type':type}
			}],
			success:function(){
				tip.alert('删除完成');
			}
		});
	}
	var setting={
			check:{enable:true},
			path:'../../../libs/ztree/css/zTreeStyle/img/',
			data: {simpleData: {enable: true,pIdKey: "pid"}},
			callback:{
				onCheck:function(e,id,node){
					if(!node.checked){
						model.mark='';
						model.deviceSelect.splice(model.deviceSelect.indexOf(node),1);
						model.deviceSelect.length==0&&(model.deviceType=[]);
					}else{
						var deviceType=node.tId.substring(5,node.tId.indexOf('_'));
						db.query({
							request:{
								sqlId:'select_device_purpose',
								whereId:"0",
								params:{'cus':login.cusNumber,'device':node.id,'type':deviceType}
							},success:function(data){
								if(data.length>0){
									var temp=data[0];
									model.mark=temp.mark;
									db.query({
										request:{
											sqlId:'select_devcelink_dvc',
											whereId:'0',
											params:{'cus':login.cusNumber,'linkid':temp.linkid}
										},success:function(linkdata){//
											if(linkdata.length>0){
												model.deviceSelect.forEach(function(row){
													var tree=deviceList['ztree'+row.tId.substring(5,row.tId.indexOf('_'))];
													tree.checkNode(tree.getNodeByTId(row.tId),false,true);
												});
												model.deviceType=[];
												model.deviceSelect=[];
											}
											node.act=temp?temp.act:'动作';
											node.actid=temp&&temp.actid;
											node.linkid=temp&&temp.linkid;
											node.tip=!temp&&'1';
											model.deviceSelect.push(node);
											model.deviceType=model.deviceType.concat(initMap(linkdata));
											model.deviceType.length==0&&(model.deviceType.push({typeName:'设备类型',tip:'1',deviceLink:[{name:'请选择设备',act:'动作',tip:'1','tipd':'1'}]}));
										}
									});
								}else{
									node.act='动作';
									node.tip='1';
									model.deviceSelect.push(node);
									model.deviceType.length==0&&(model.deviceType.push({typeName:'设备类型',tip:'1',deviceLink:[{name:'请选择设备',act:'动作',tip:'1','tipd':'1'}]}));								}
							}
						});
					}
				}
			}
	};
	var set={
			path:'../../../libs/ztree/css/zTreeStyle/img/',
			data: {simpleData: {enable: true,pIdKey: "pid"}},
			callback:{
				onClick:function(e,id,node){
					if(node.type==1){
						if(validate(node.id))return;
						tempDevice.name=node.name;
						tempDevice.deviceid=node.id;
						tempDevice.tipd='';
						$("#"+id).parent().hide();
					}else{
						tip.alert("请选择设备");
					}
					
				}
			}
	};
	function validate(id){
		var temp=linkList.deviceLink;
		for(var i=0,len=temp.length;i<len;i++){
			if(id==temp[i].deviceid){
				tip.alert("设备已关联,请选择其他设备");
				return true;
			}
		}
		return false;
	}
	//初始化各种树
	function init(){
		//已关联设备
		db.query({
			request:{
				sqlId:'select_linked_device',
				params:{cus:login.cusNumber}
			},success:function(linkedData){
				var linkedData=linkedData.length?linkedData[0].id.split(','):[];
				//设备类型查询
				db.query({
					request:{
						"sqlId":"select_constant_bycode",
						"whereId":0,
						"params":["DGT_DVC_TYPE"]
					},success:function(data){
						model.deviceTypes=data;
						for(var key in deviceSql){
							queryDevice(key,linkedData);
						}
					}
				});
				//关联动作查询
				db.query({
					request:{
						"sqlId":"select_constant_bycode",
						"whereId":0,
						"params":["DEVICE_LINK_ACTION"]
					},success:function(data){
						model.deviceActions=data;
					}
				});
			}
		});
	}
	//查询设备，初始化用
	function queryDevice(deviceType,linkedData){
		db.query({
			request:deviceSql[deviceType].params,
			success:function(data){
				
				data=keepLeaf(data);
				
				//deviceTree['devicet'+deviceType]=
				$.fn.zTree.init($('#devicetree'+deviceType),set,data);
				
				data=data.concat(deviceSql[deviceType].node);
				
				deviceList['ztree'+deviceType]=$.fn.zTree.init($('#ztree'+deviceType),setting,data);
				//缓存搜索用
				treeData['ztree'+deviceType]=data;
				
				linkedDevice(data,deviceType,linkedData);
			}
		});
		
	}
	//已关联
	function linkedDevice(data,type,linkedData){
		
		linkedList[type]=[];
		linkingList[type]=[];
		for(var i =0,len=data.length;i<len;i++){
			if(data[i].type==1){
				linkedData.indexOf(data[i].id)>-1?linkedList[type].push(data[i]):
					linkingList[type].push(data[i]);
				continue;
			}
			linkedList[type].push(data[i]);
			linkingList[type].push(data[i]);
		} 
		for(var type in linkedList){
			linkedList[type]=keepLeaf(linkedList[type]);
			linkingList[type]=keepLeaf(linkingList[type]);
		}
	}
	
	//查询设备
	var deviceSql={
			"1":{//摄像机类别1
				params:{
					sqlId:'select_device_camera_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'摄像机',icon:'qiang.png',nocheck:true}
			},
			"2":{//门禁类别为2
				params:{
					sqlId:'select_device_door_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'门禁',icon:'door.png',nocheck:true}
			},
			"3":{//对讲设备
				params:{
					sqlId:'select_device_videotalk_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'对讲设备',icon:'talk.png',nocheck:true}
			},	
			"4":{//广播
				params:{
					sqlId:'select_device_broadcast_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},	
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'广播',icon:'broad.png',nocheck:true}
			},
			"5":{//电视墙
				params:{
					sqlId:'select_device_screen_type',
					params:{'cus':login.cusNumber},
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'电视墙',icon:'screen.png',nocheck:true}
			},
			"6":{//网络报警select_device_alertor_type
				params:{
					sqlId:'select_device_alertor_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'网络报警',icon:'alarm.png',nocheck:true}
			},
			"7":{//高压电网select_device_network_type
				params:{
					sqlId:'select_device_network_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'高压电网',icon:'power.png',nocheck:true}
			},
			"15":{//RFID
				params:{
					sqlId:'select_device_rfid_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'RFID基站',icon:'trans.png',nocheck:true}
			},
			"16":{//巡更基站
				params:{
					sqlId:'select_device_patrol_type',
					params:{'cus':login.cusNumber},
					orderId:'0',
					whereId:'0'
				},
				node:{id:'1-'+login.cusNumber,pid:'-2',name:'巡更刷卡器',icon:'door.png',nocheck:true}
			}
	}
	//保留子节点
	function keepLeaf(list){
		var leaf=[];
		//获取子元素
		for(var i=0;i<list.length;i++){
			if(list[i]['type']==1){
				leaf.push(list.splice(i,1)[0]);
				i--;
			}
		}
		var pid=[];
		//获取父元素id
		for(var j=0;j<leaf.length;j++){
			if(pid.indexOf(leaf[j]['pid'])<0){
				pid.push(leaf[j]['pid'])
			}
		}
		var treeArray=[];
		//搜索父级元素
		var searchP=function(pid){
			for(var i=0;i<list.length;i++){
				if(list[i]['id']==pid){
					var temp=list.splice(i,1)[0];
					treeArray.push(temp);
					searchP(temp['pid']);
					i--;
				}
			}
		};
		//根据父id搜索
		for(var l=0;l<pid.length;l++){
			searchP(pid[l]);
		}
		return treeArray.concat(leaf);
	}
	function initMap(data){
		var deviceType={
				'1':{
					'typeName':'摄像机',
					'id':'1',
					'deviceLink':[]
				},
				'2':{
					'id':'2',
					'typeName':'门禁',
					'deviceLink':[]
				},
				'3':{
					'id':'3',
					'typeName':'对讲设备',
					'deviceLink':[]
				},
				'4':{
					'id':'4',
					'typeName':'广播',
					'deviceLink':[]
				},
				'5':{
					'id':'5',
					'typeName':'大屏',
					'deviceLink':[]
				},
				'6':{
					'id':'6',
					'typeName':'网络报警',
					'deviceLink':[]
				},
				'7':{
					'id':'7',
					'typeName':'高压电网',
					'deviceLink':[]
				},
				'15':{
					'id':'15',
					'typeName':'RFID基站',
					'deviceLink':[]
				},
				'16':{
					'id':'16',
					'typeName':'巡更刷卡器',
					'deviceLink':[]
				}
		}
		var list=[];
	
		for(var i=0,len=data.length;i<len;i++){
			deviceType[data[i].type].deviceLink.push(data[i]);
		}
		for(var key in deviceType){
			if(deviceType[key].deviceLink.length!=0){
				list.push(deviceType[key]);
			}
		}
		return list;
	}
	init();
});