/**
 * 地图工具
 */
define(['frm/hz.videoclient','frm/message','frm/hz.db','frm/loginUser','hz/map/map.handle'],
	function (videoclient,message,db,user,mapHandle) {
	var soundControlFlag = false;
	var timerId = null;

	//初始化声控快捷键
	window.onkeydown = function(event){
		var e = event || window.event;
		if (e && e.keyCode == 112) {	//F1
			e.preventDefault();

			timerId && clearTimeout(timerId);
			timerId = null;

			if (soundControlFlag) {
				message.alert('声控功能关闭');
				closeSpeechRec();
			} else {
				message.alert('声控功能开启');
				openSpeechRec();
				//4秒后自动关闭
				timerId = setTimeout(closeSpeechRec, 4000);
			}
		}
	}

	function openSpeechRec () {
		videoclient.switchSpeechRec(1);
		soundControlFlag = true;
	}

	function closeSpeechRec () {
		videoclient.switchSpeechRec(2);
		soundControlFlag = false;
	}

	//定位视角
	function location(msg){
		//添加、更新操作
		db.query({
			request: {
				sqlId:'select_sound_control_menu_id',
				params: {
					cusNumber:user.cusNumber,
					message:msg
				}
			},
			success: function (data) {
				if(data){
					var viewId = data[0].vmi_id;
					mapHandle.location(viewId);
				}else{
					message.alert('视角菜单‘'+msg+'’不存在');
				}
			},
			error: function (code, msg) {
				message.alert(msg);
			}
		});
	}


	//订阅后台推送消息
	videoclient.webmessage.off('VIDEO030','videoClient');
	videoclient.webmessage.on('VIDEO030','videoClient',function(data){
		console.log(data);
		var msg = JSON.parse(data.body).content;
		location(msg);
	})

});