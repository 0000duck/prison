define(function(require){
	var $ = require("jquery");
	var tpl = require('vue');
	var utils = require('frm/hz.utils');
	var db = require('frm/hz.db');
	var login =  require('frm/loginUser');
	var util  = require('frm/treeUtil');
	var modelUtil = require('frm/model');	
	var treeSelect = require('frm/treeSelect');
	var tip = require('frm/message');
	var select = require('frm/select');
	var dialog = require('frm/dialog');
	var videoClient = require('frm/hz.videoclient');
	var talkbackConfig = require('cds/talkback/talkbackConfig');
	var userSetting = require('userSetting');
	
	var config = talkbackConfig.getConfig();//对讲服务配置信息
	var host = talkbackConfig.getRelationHost();
	var talkback_http_url = config.tsd_http_url; //
	
	
	var treeContainer;
	model=new tpl({
		el:'body',
		data:{
			caller:getCaller(),
			callee:'',
			cusNumber:login.cusNumber,
			userName:login.userName,
			call_id:'',//当前会话id
			info:{
				
			},
			itcStatus:'',
			serviceId:'',
			userSettingInfo:{
				sus_cus_number:login.cusNumber,
				sus_record_id:'',
				sus_type:1,//对讲主机关联
				sus_value:'',
				sus_user_id:login.userId,
				userId:login.userId			
			}
		},
		methods:{
			talk:function(){
				_talk();
			},
			call_close:function(){
				_call_close();
			},
			call:function(){
				_call();
			},
			monitor:function(){
				_monitor();
			},
			startTalk:function(){
				if(!check()) return;
				videoClient.startTalk(model.callee);
			},
			stopTalk:function(){
				if(!check()) return;
				videoClient.stopTalk(model.callee);
			},
			relationDialog:function(){
				var hostInfo = talkbackConfig.getRelationHost();
				if(hostInfo.sus_record_id){
					model.serviceId = hostInfo.tbd_relation_service;
					model.userSettingInfo.sus_record_id = hostInfo.sus_record_id;
					model.userSettingInfo.sus_value = hostInfo.sus_value;
				}else{
					console.log('该用户还未关联对讲主机');
				}

				dialog.open({targetId:'relation_dialog',title:'对讲主机关联',h:"50",w:"480",top:"3%"});
			},
			saveRelation:function(){
				if(!getTalkbackStatus(model.userSettingInfo.sus_value)){
					return;
				}
				if(this.userSettingInfo.sus_record_id){
					userSetting.updateSetting(this.userSettingInfo,'更新关联对讲主机成功');
				}else{
					userSetting.addSetting(this.userSettingInfo,'关联对讲主机成功');
				}
				model.caller = this.userSettingInfo.sus_value;
				videoClient.setTalkConfigByid(this.serviceId);
			},
			switchHost:function(){
				if(!getTalkbackStatus(model.userSettingInfo.sus_value)){
					return;
				}
				if(this.serviceId){
					console.log('对讲配置切换到编号为:'+this.serviceId+'的对讲服务');
					videoClient.setTalkConfigByid(this.serviceId) && tip.alert('对讲主机配置切换成功');
				}else{
					tip.alert('该对讲主机未关联相应的对讲服务');
				}
			}
		}
	});
	/*
	 * 获取当前用户关联的对讲主机
	 */
	function getCaller(){
		var hostInfo = talkbackConfig.getRelationHost();
		if(hostInfo.sus_value){
			return hostInfo.sus_value;
		}else{
			tip.alert('该用户尚未关联对讲主机');
			return '';
		}
	}
	
	var setting={
			path:'../../../libs/ztree/css/zTreeStyle/img/',
			data: {simpleData: {enable: true,pIdKey: "pid"}},
			callback:{
				onClick:function(e,id,node){
					if(!node.type) return;
					if(node.type == 1){
						model.callee = node.other_id;
					}
				}
			}
	};
	//初始化设备树
	db.query({
		request:{
			sqlId:'select_videotalk_org',
			orderId:'0',
			params:{
				org:login.dataAuth==0?login.deptId:login.cusNumber,//
				cus:login.cusNumber,
			    level:login.dataAuth==2?3:2,//如果为省局用户
			}
		},success:function(data){
			treeContainer=$.fn.zTree.init($("#tree"), setting,keepLeaf(data));
			treeContainer.expandAll(true);
		}
	});
	//获取正在通话的设备
	function  queryDevice(){
		db.query({
			request:{
				sqlId:'select_videotalk_org',
				whereId:'',
				params:{
					org:login.dataAuth==0?login.deptId:login.cusNumber,//
					cus:login.cusNumber,
				    level:login.dataAuth==2?3:2,//如果为省局用户
				}
			},success:function(data){
				
			}
		});
	}
	//更改呼叫的设备状态
	function updateStatus(list,node){
		db.updateByParamKey({
			request:{
				sqlId:'update_talk_by_id',
				params:list
			},success:function(data){
				changeStatus(list,node);
			}
		});
	}
	//获取选中的设备
	function getSelect(search,status){
		if(!treeContainer)return [];
		var temp=[];
		//查询所有设备为对讲机的节点
		treeContainer.getCheckedNodes().forEach(function(item){
			if(item.type==1){
				temp.push({device:item.id,tid:item.tId,name:item.name,status:item.status});
			}
		});
		//根据状态不同查询不同节点
		if(search){
			var filter=[];
			temp.forEach(function(row){
				if(search.indexOf(row.status+'')>-1){
					filter.push({device:row.device,tid:row.tid,name:row.name,status:status});
				}
			});
			temp=filter;
		}
		return temp;
	}
	//更新设备状态
	function changeStatus(list,node){
		var temp;
		if(node.listen){
			for(var i=0;i<list.length;i++){
				temp=treeContainer.getNodeByTId(list[i].tid);
				treeContainer.updateNode(temp);
				if(node.type=='listen'){
					$("#"+list[i].tid+"_a").addClass("listen").removeClass("broad");
				}else{
					$("#"+list[i].tid+"_a").addClass("broad").removeClass("listen");
				}
			}
			return;
		}
		for(var i=0;i<list.length;i++){
			temp=treeContainer.getNodeByTId(list[i].tid);
			if(temp){
				temp.status=node.status;
				temp.name=temp.tname+node.name;
				temp.icon=node.icon?node.icon:temp.icon;
				treeContainer.updateNode(temp);
				$("#"+list[i].tid+"_a").removeClass("listen broad");
			}
		}
	}
	//过滤节点树
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
	/**
	 * 对讲
	 */
	function _talk(){
		if(!check()) return;
		model.itcStatus = 'talk';
		console.log('对讲呼叫');
		var url = talkback_http_url+'talk.json?send_terminal='+model.caller+'&recive_terminal='+model.callee;
		_httpGet(url,http_success);
	}
	/**
	 * 监听
	 */
	function _monitor(){
		if(!check()) return;
		model.itcStatus = 'monitor';
		var url = talkback_http_url + 'monitor.json?send_terminal='+model.caller+'&recive_terminal='+model.callee;
		_httpGet(url,http_success);
	}
	/**
	 * 广播
	 */
	function _call(){
		if(!check()) return;
		model.itcStatus = 'call';
		var url = talkback_http_url + 'call.json?send_terminal='+model.caller+'&recive_terminal='+model.callee;
		_httpGet(url,http_success);
	}
	/**
	 * 挂断
	 */
	function _call_close(){
		if(model.call_id == '') {
			tip.alert('没有需要挂断的会话');
			return;
		}
		model.itcStatus = '';
		var url = talkback_http_url + 'call_close.json?id='+model.call_id;
		_httpGet(url,close_success);
	}
	
	/**
	 * 发送Http请求
	 */
	function _httpGet (url,success,error) {
		utils.ajax('itcTalkCtrl/httpGet', {'url':url}, function(json){
			success(json);
		}, function(json){
			http_error(json);
		});
	}
	/**
	 * 获取会话信息
	 */
	function getStatus(){
		var url = talkback_http_url + 'call_status.json';
		_httpGet(url,status_success);
	}
	
	function close_success(){
		console.log('成功关闭id为'+model.call_id+'的会话');
		tip.alert('成功挂断');
		model.call_id = '';
	}
	/**
	 * 获取会话信息成功回调
	 */
	function status_success(resp){
		var result  = JSON.parse(resp);
		var calls = result.calls;
		if(!calls || calls.length == 0){
			setTimeout(getStatus,1000);
		}else{
			var calls = result.calls;
			for(var i=0;i<calls.length;i++){
				if(calls[i].caller == model.caller){
					model.call_id = calls[i].call_id;
					console.log('会话id:'+model.call_id);
					break;//立即退出循环
				}
			}
			if(model.call_id == '') setTimeout(getStatus,1000);
		}
	}
	/**
	 * 操作执行成功回调
	 */
	function http_success(resp){
		var result = JSON.parse(resp);
		if(result.message.indexOf('ok')==1){
			tip.alert('操作失败:'+result.message);
			return;
		}
		setTimeout(getStatus,1000);
	}
	/**
	 * 操作执行异常回调
	 */	
	function http_error(resp){
		model.itcStatus = '';
		console.log('error:'+JSON.stringify(resp));
	}
	
	function check(){
		if(model.caller == ''){
			tip.alert('请先关联操作的对讲主机');
			return false;
		}
		if(model.callee == ''){
			tip.alert('请选择被叫的对讲主机');
			return false;
		}
		if(model.call_id !=''){
			tip.alert('请挂断当前会话后再进行其他操作!');
			return false;
		}
		return true;
	}
	
	/**
	 * 获取对讲机设备状态
	 */
	function getTalkbackStatus(otherid){
		var flag = false;
		db.query({
			request:{
				sqlId:'select_talkback_status_map',
				whereId:'1',
				params:{'cusNumber':login.cusNumber,'other_id':otherid}
			},
			async:false,
			success:function(data){
				if(data.length>0) {
					var status = data[0].dvc_stts;
					switch(status){
					case 0: flag = true;break;
					case 1: tip.alert('对讲主机离线中,暂时无法完成切换'); break;
					case 2: tip.alert('对讲主机正在使用中,暂时无法完成切换'); break;
					}
				}
			},
			error:function(errorCode, errorMsg){
				tip.alert("获取对讲服务配置信息失败:" + errorMsg);
			}
		});
		return flag;
	}
});