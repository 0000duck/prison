define(function(require){
	var db = require('frm/hz.db');
	var message = require('frm/message');
	var loginUser = require('frm/loginUser');
	
	var userSetting = {
			/**
			 * 添加用户设定
			 * @param timerTaskInfo
			 */
			addSetting:function(setTing,msg){
				db.updateByParamKey({
					request:{
						sqlId:'insert_user_setting',
						params:setTing
					},
					success:function(){
						message.alert(msg);
					},
					error:function(errorCode, errorMsg){
						message.alert(errorCode + ":" + errorMsg);
					}
				});
			},
			/**
			 * 更新定时任务
			 * @param timerTaskInfo
			 */
			updateSetting:function(setTing,msg){
				db.updateByParamKey({
					request:{
						sqlId:'update_user_setting',
						params:setTing
					},
					success:function(){
						message.alert(msg);
					},
					error:function(errorCode, errorMsg){
						message.alert(errorCode + ":" + errorMsg);
					}
				});
			},
			deleteSetting:function(id,msg){
				db.updateByParamKey({
					request:{
						sqlId:'',
						whereId:'0',
						params:{'id':id}
					},
					success:function(){
						message.alert(msg);
					},
					error:function(errorCode, errorMsg){
						message.alert(errorCode + ":" + errorMsg);
					}
				});
			},
			/**
			 * 查询定时任务信息
			 */
			querySetting:function(){
				var taskInfo = null;
				db.query({
					request:{
						sqlId:'',
						whereId:'',
						orderId:'0',
						params:{'utt_cus_number':loginUser.cusNumber,'utt_user_id':loginUser.userId}
					},
					async:false,
					success:function(data){
						taskInfo  = data;
					},
					error:function(errorCode, errorMsg){
						message.alert(errorCode + ":" + errorMsg);
					}
				});
				return taskInfo;
			}
	};
	return userSetting;
});