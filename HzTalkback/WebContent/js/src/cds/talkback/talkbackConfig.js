define(function(require){
	var $ = require("jquery");
	   db = require('frm/hz.db');
	   login =  require('frm/loginUser');
	   tip = require('frm/message');
	   
	var talkbackConfig = {};
	var config = null;
	var configbyid = null;
	/**
	 * 获取当前机构下的对讲服务信息(默认条件)
	 * 返回id最小的配置信息
	 * return {
	 *   			tsd_cus_number:'机构编号',
	 *				tsd_id:'对讲服务ID',
	 *				tsd_name:'对讲服务名称',
	 *				tsd_type:'对讲服务类型'
	 *				tsd_ip: '对讲服务IP',
	 *				tsd_port:'对讲服务端口',
	 *				tsd_login_name:'登录用户名',
     *				tsd_login_pwd:'登录密码',
	 *				tsd_http_url:'http服务地址'
	 *        }
	 **/
	function _getConfig(){
		console.log('查询对讲服务配置信息...');
		if(config){
			return config;
		}
		db.query({
			request:{
				sqlId:'select_tbk_talkback_service_info',
				whereId:'0',
				orderId:'0',
				params:{'cusNumber':login.cusNumber}
			},
			async:false,
			success:function(data){
				if(data.length>0) config = data[0];
			},
			error:function(errorCode, errorMsg){
				tip.alert("获取对讲服务配置信息失败:" + errorMsg);
			}
		});
		return config; 
	}
	/**
	 * 根据id获取对讲服务配置信息
	 * return {
	 *   			tsd_cus_number:'机构编号',
	 *				tsd_id:'对讲服务ID',
	 *				tsd_name:'对讲服务名称',
	 *				tsd_type:'对讲服务类型'
	 *				tsd_ip: '对讲服务IP',
	 *				tsd_port:'对讲服务端口',
	 *				tsd_login_name:'登录用户名',
     *				tsd_login_pwd:'登录密码',
	 *				tsd_http_url:'http服务地址'
	 *        }
	 */
	function _getConfigByid(id){
		console.log('根据id: '+id+' 查询对讲服务配置信息...');
		if(configbyid){
			return configbyid;
		}
		db.query({
			request:{
				sqlId:'select_tbk_talkback_service_info',
				whereId:'1',
				params:{'cusNumber':login.cusNumber,'tsd_id':id}
			},
			async:false,
			success:function(data){
				if(data.length>0) configbyid = data[0];
			},
			error:function(errorCode, errorMsg){
				tip.alert("根据id获取对讲服务配置信息失败:" + errorMsg);
			}
		});
		return configbyid; 
	}
	
	function _getRelationHost(){
		var hostInfo = {};
		db.query({
			request:{
				sqlId:'select_user_host_setting',
				whereId:'0',
				params:{'cusNumber':login.cusNumber,'userId':login.userId}
			},
			async:false,
			success:function(data){
				if(data.length>0) hostInfo = data[0];
			},
			error:function(errorCode, errorMsg){
				tip.alert("获取用户关联对讲主机信息失败:" + errorMsg);
			}
		});
		return hostInfo;
	}
	
	/*
	 * 注入模块方法
	 */
	try {

		// 针对类似frame框架的模型化处理
		try {
			var hz = window.top.hz;
			if (hz) {
				talkbackConfig = hz.talkbackConfig;
				if (talkbackConfig) {
					console.log('获取对讲服务配置对象');
					return talkbackConfig;
				}
			} else {
				hz = window.top.hz = {};
			}
			talkbackConfig = hz.talkbackConfig = {};
		} catch (e) {
			console.error('hz.talkbackConfig：引用顶层父级talkbackConfig对象失败...');
		}

		// 获取/创建模块并注入方法
		talkbackConfig.getConfig = _getConfig;		// 获取对讲服务配置信息
		talkbackConfig.getConfigByid = _getConfigByid; //根据对讲服务ID获取配置信息
		talkbackConfig.getRelationHost = _getRelationHost;
		
		return talkbackConfig;
	} catch (e) {
		console.error('初始化 --> 对讲服务配置信息模块失败，' + e);
	}
});


