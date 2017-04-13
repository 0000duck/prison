define(function(require){
	var $          = require('jquery'),
	   tpl         = require('vue'),
	   local       = require('frm/localStorage'),
	   videoClient = require('frm/hz.videoclient'),
	   dialog      = require('frm/dialog');
	
	   var buttonList_3D = [ //监所3D可视子系统
		                  {'class':'item_01','text':'三维可视化','click':'toIndex'},
		                  {'class':'item_02','text':'高点视频全覆盖','click':'open_gd'},
		                  {'class':'item_03','text':'周边视频全接入','click':'toVideoPage'},
		                  {'class':'item_04','text':'周界监控全共享','click':'open_zj'},
		                  {'class':'item_05','text':'动态人员全控制','click':'rfid'},
		                  {'class':'item_06','text':'内部视频全整合','click':'open_nb'}
		];
		var buttonList_03 = [//监室安全智能管控子系统
			                  {'class':'item_01','text':'异常行为预警'},
			                  {'class':'item_02','text':'在押人员声纹库','click':'prisoner'},
			                  {'class':'item_03','text':'人员区域定位','click':'rfid_2'}
			];
		var buttonList_05 = [//就医安全管控子系统
			                  {'class':'item_01','text':'远程就医会诊'},
			                  {'class':'item_02','text':'出所就医跟踪'},
			                  {'class':'item_03','text':'住院就医管控'}
			];
		var buttonList_02 = [//民警执法管理子系统
			                  {'class':'item_01','text':'监区巡控督查','click':'patrolLine'},
			                  {'class':'item_02','text':'执法仪管理'},
			                  {'class':'item_03','text':'监区巡更管理','click':'toRecord'},
			                  {'class':'item_04','text':'管教执法管理','click':'policeSerives'}
			];
		var buttonList_04 = [//应急处置子系统
			                  {'class':'item_01','text':'应急报警呼叫'},
			                  {'class':'item_02','text':'武警应急联动'},
			                  {'class':'item_03','text':'预案自动启动','click':'alarmPlan'},
			                  {'class':'item_04','text':'中央门禁控制','click':'doorCtrl'}
			];
		var buttonList_06 = [//监所服务子系统
			                  {'class':'item_01','text':'发布信息'},
			                  {'class':'item_02','text':'政务公开'},
			                  {'class':'item_03','text':'预约会见'}
			];
		
	    model=new tpl({
			el:'.main',
			data:{
				buttons:[],
				deptName:local.getItem('userInfo').dept_name,
				userName:local.getItem('userInfo').user_name
			},
			methods:{
				switchMode:function(mode){
					this.buttons = [];
					switch(mode){
					case 1: this.buttons = buttonList_3D; break;
					case 2: this.buttons = buttonList_02; break;
					case 3: this.buttons = buttonList_03; break;
					case 4: this.buttons = buttonList_04; break;
					case 5: this.buttons = buttonList_05; break;
					case 6: this.buttons = buttonList_06; break;
					}
				},
				click_event:function(method){ //动态点击事件
					if(method == undefined || method == 'undefined') return;
					switch(method){
					case 'toIndex':toIndex();break;
					case 'policeSerives':toPoliceSerives();break;
					case 'prisonSerives':toPrisonSerives();break;
					case 'mp3play':mp3Play();break;
					case 'toVideoPage':openModuleMenu(video_menu);break;
					case 'toRecord':openModuleMenu(record_menu);break;
					case 'doorCtrl':openModuleMenu(doorCtrl_menu);break;
					case 'patrolLine':openModuleMenu(patrolLine_menu);break;
					case 'rfid':openModuleMenu(rfid_menu);break;
					case 'rfid_2':openModuleMenu(rfid2_menu);break;
					case 'alarmPlan':openModuleMenu(alarmPlan_menu);break;
					case 'prisoner':openModuleMenu(prisoner_menu);break;
					case 'open_gd':openVideoPlan(cameras_gd);break;
					case 'open_zj':openVideoPlan(cameras_zj);break;
					case 'open_nb':openVideoPlan(cameras_nb);break;
					
					}
				},
				back:function(){
					window.parent.outSystem();
				}
			}
		});
		model.switchMode(1);
		$(".mid .menu").hover(function(){
			var imgSrc = $(this).attr("src").split(".")[0];
			$(this).attr("src",imgSrc + "_h.png");
		})
		$(".mid .menu").mouseleave(function(){
			var imgSrc = $(this).attr("src").split(".")[0].split("_");
			$(this).attr("src",imgSrc[0] + "_" + imgSrc[1] + "_" + imgSrc[2] + ".png");
		})
//		var userInfo = local.getItem('userInfo');
//		$("#deptName").html(userInfo.dept_name);
//		$("#userName").html(userInfo.user_name);
//		
		/**
		 *转到三维地图页面
		 */
		function toIndex(){
			$("#mainIframe", window.parent.document).hide();
			$("#indexDiv", window.parent.document).show();
		}
		
		function toPoliceSerives(){
//	 		window.location.href = "page/test/policeServices.html";
			window.open('http://10.73.172.118:6080');
		}
		
		function toPrisonSerives(){
			window.location.href = "page/test/prisonServices.html";
		}
//		/**
//		 * 跳转到视频监控页面
//		 */
//		function toPage(url){
////			var url = '';
////			switch(type){
////			case 'video': url =  video_menu; break; //视频监控
////			case 'record': url = record;break; //巡更记录
////			}
//			openModuleMenu(url);
//		}
			var video_menu = {
					"id" : 233,
					"pid" : 232,
					"name" : "视频监控",
					"width" : "",
					"height" : "",
					"url" : "page/cds/video/videoCtrl.html",
					"permission" : "cc",
					"type" : 2,
					"seq" : 233
				};
			var record_menu = {
					"id" : 0,
					"pid" : 311,
					"name" : "监区巡更管理",
					"width" : "",
					"height" : "",
					"url" : "page/cds/patrol/patrolRecord.html",
					"permission" : "patrol",
					"type" : 2,
					"seq" : 94
				};
			var doorCtrl_menu = {
				"id" : 238,
				"pid" : 237,
				"name" : "中央门禁控制",
				"width" : "",
				"height" : "",
				"url" : "page/cds/door/remoteControl/remoteControl.html",
				"permission" : "xx",
				"type" : 2,
				"seq" : 238
			};
		  var rfid_menu = {
				"id" : 316,
				"pid" : 258,
				"name" : "动态人员全控制",
				"width" : "",
				"height" : "",
				"url" : "page/cds/prisoner/rfid/rfid.html",
				"permission" : "3",
				"type" : 0,
				"seq" : 88
			};
		  var rfid2_menu = {
					"id" : 316,
					"pid" : 258,
					"name" : "人员区域定位",
					"width" : "",
					"height" : "",
					"url" : "page/cds/prisoner/rfid/rfid.html",
					"permission" : "3",
					"type" : 0,
					"seq" : 88
				};		  
		 var patrolLine_menu = {
				"id" : 314,
				"pid" : 311,
				"name" : "监区巡控督查",
				"width" : 900,
				"height" : "",
				"url" : "page/cds/patrol/patrolLine.html",
				"permission" : "patrol",
				"type" : 0,
				"seq" : 86
			} 

			var alarmPlan_menu = {
				"id" : 268,
				"pid" : 208,
				"name" : "预案自动启动",
				"width" : "",
				"height" : "",
				"url" : "page/cds/alarm/alarmPlan.html",
				"permission" : "xyh",
				"type" : 2,
				"seq" : ""
			};
		   var prisoner_menu = {
				"id" : 259,
				"pid" : 258,
				"name" : "在押人员声纹库",
				"width" : "",
				"height" : "",
				"url" : "page/cds/prisoner/prisonerInfo.html",
				"permission" : "1",
				"type" : 2,
				"seq" : 259
			}
		function openModuleMenu(m){
			var curLayer = $('#'+m.id);
			if(curLayer.length==0){
				dialog.open({
					id:m.id,
					type:m.type,
					title:m.name,
					w:m.width,
					h:m.height,
					url:m.url
				});
				return;
			}
			$('.layui-layer').css('z-index',1990);
			curLayer.parent().css('zIndex',1990100);
			var minH = curLayer.parent().height();
			var maxminBtn = curLayer.parent().find('.layui-layer-maxmin');
			if(minH<50 && maxminBtn.length>0){
				curLayer.parent().find('.layui-layer-maxmin').trigger('click');    				
			}
		}	
	var cameras_zj =  ["1147", "1148", "1222", "1223", "1007", "1008", "1009", "1010", "1011"];//周界
	var cameras_gd =  ["1", "2", "3", "4", "5", "6", "7", "8", "9"];//高点
	var cameras_nb =  ["1137", "1140", "1141", "1143", "1144", "1146", "1149", "1150", "1165"];//内部
	function  openVideoPlan(cameras){
		videoClient.setLayout(cameras.length);
		videoClient.play(cameras);
	}
	 
});
