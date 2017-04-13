define(function(require){
	
   var layer = require('layer');
	   
   layer.config({
		shift:0, //默认动画风格
		extend: ['blue/style.css'],
		skin: 'layer-ext-blue',
		path:ctx+'libs/layer/' //layer.js所在的目录，requirejs必须用
	});

    var	vue = require('vue'),
    	dialog = require('frm/dialog'),
    	ls = require('frm/localStorage'),
    	panel = require('frm/panel'),
    	select = require('frm/select'),
    	loginUser=require('frm/loginUser'),
    	message=require('frm/message'),
    	frmwebmessage = require('frm/webmessage'),
    	db = require('frm/hz.db'),
    	drag = require('frm/hz.drag'),
    	hzMap = require('hz/map/map.handle'),
    	hzEvent = require('frm/hz.event'),

    	viewMenu = require('hz/home/viewMenu'),
    	search=require('hz/home/search'),
    	hzDiagram=require('hz/map/diagram/diagram'),
    	videoClient = require('frm/hz.videoclient');
	  	talkbackConfig = require('cds/talkback/talkbackConfig');
    	timerTask = require('frm/timerTask');
        require('hz/cds/door/cardtps/cardtips');
        
        videoClient.setTalkConfigObj(talkbackConfig);
        
    var webmessage;

    if(loginUser.cusNumber){
    	webmessage = window.webmessage = new frmwebmessage();
    	webmessage.init(websocketUrl, function () {
    		webmessage.websocket.on('onconnecting','showTip', function(event){
                console.log('系统已断开连接，正在尝试连接中...');
                $('#connectionTip').show();
            });
    		webmessage.websocket.on('onopen','showTip', function(event){
    			message.alert('系统连接成功!');
            });

    		webmessage.send({
                "serviceId": "LoginService",
                "method": "login",
                "cusNumber": loginUser.cusNumber,
                "userId": loginUser.userId,
                "msgId": loginUser.userId + '' + (new Date()).getTime()
            });

    		console.log('系统连接成功!');
    		$('#connectionTip').hide();
    	});


        require(['hz/cds/prisoner/person/personMsg'],function(personMsg){
    		personMsg.initPersonEvent();
    	});
    }

    /**
     * 用户登录
     */
   function _login() {
        var loginJson={
            "serviceId": "LoginService",
            "method": "login",
            "cusNumber": loginUser.cusNumber,
            "userId": loginUser.userId,
            "msgId": loginUser.userId + '' + (new Date()).getTime()
        };
        webmessage.send(loginJson);
    };
    
    var menus =ls.menus();

    var panels = ls.getItem('ps');
    var vm = new vue({
    	el:'body',
    	data:{
    		menuIsExpand:false,
    		menus:menus,
    		isShowViewMenu:false,
    		twomenus:[],
    		threemenus:[{}],
    		viewMenus:[],//视角菜单
    		curViewMenu: null,
    		boxSelect:1,//当前框选模式
    		boxSelectCameras:[],
    		panels:[
    		   {id:1, name:'地图工具', simple:true,icon:'css/images/police.png',url:'page/map/mapTools.html'},
    		   {id:2, name:'信息汇聚', icon:'css/images/zb.png'},
    		   {id:2, name:'值班民警', icon:'css/images/zb.png',url:'page/cds/dutyQuery/todayDuty-pendant.html'},
    		],
    		rightMenus:[],
    		selectPanels:!panels ? [] : panels,
			plan:{
				id:'',
				dgm_cus_number:loginUser.cusNumber,
				name:'',
				plan_type:'',
				dgm_use_range:0,
				dgm_crte_user_id:loginUser.userId,
				dgm_updt_user_id:loginUser.userId
			}
    	},
    	events:{
    		'viewMenuClick':function(m){
    			$('#vname').val(m.name);
    			$('#vid').val(m.id);
    			vm.curViewMenu = m;
    			hzEvent.emit('view.menu.onclick', m);
    			hzMap.location(m.id);
    		}
    	},
    	methods:{
    		saveVideoPlan:function(n){savePlan(n)},
    		closeVideoPlanPanel:function(){$('#addVideoPlanPanel').hide()},
    		setBoxSelect:function(n){this.boxSelect = n;},
    		showViewMenu:function(){this.isShowViewMenu = !this.isShowViewMenu},
    		bodyClick:function(event){event.stopPropagation();},
    		showTowMenus:function(m){
    			$('#threeMenu').hide();
    			if(!m.childs || m.childs.length==0){
    				this.twomenus=[] ; 
    			}else{
    				this.twomenus = m.childs;    				
    			}
    		},
    		open:function(m,event){
    			event.stopPropagation();
    			
    			if(m.url){
    				openModuleMenu(m);
    				return;
    			}
    			this.threemenus = m.childs;
    			var curClickMenu = $('#tmenu_'+m.id);
    			this.$nextTick(function(){
    				$('#threeMenu').css({
    					left:curClickMenu.offset().left,
    					top:curClickMenu.offset().top-$('#threeMenu').height()-15
    				}).show(); 
    			});
    		},
    		openModule:function(m){
    			$('#threeMenu').hide();
    			ls.remove('doorId');
    			openModuleMenu(m);
    		}
    	},
    	ready:function(){
    		var me =this;
    		var index,curTarget,downL,downT,downX,downY;
    		$('body').bind('dragover',function(ev){
    			ev.preventDefault();
    		})
    		$('body').bind('drop',function(ev){
    			ev.preventDefault();
    			var w = !me.panels[index].w ? 300 : me.panels[index].w;
    			var h = !me.panels[index].h ? 350 : me.panels[index].h;
    			
    			var x = window.event.clientX;
    			var y = window.event.clientY;
    			var bodyW = $('body').width();
    			var bodyH = $('body').height();
    			
    			var left =x ,top = y;
    			if(w+x+140 > bodyW){
    				left = bodyW - w - 15;
    			}
    			if(h+y > bodyH){
    				top = bodyH - h - 15;
    			}
    			
    			if(ev.target.tagName=='CANVAS'){
    				var p = {
    					id:me.panels[index].id,
    					name:me.panels[index].name,
    					icon:me.panels[index].icon,
    					url:me.panels[index].url,
    					simple:me.panels[index].simple,
    					w:w,
    					h:h,
    					left:left+'px',
    					top:top+'px'
    				}
    				if(isExsitPanel(me.selectPanels,p) == -1){
    					me.selectPanels.push(p);
    				}
    				ls.setItem('ps',me.selectPanels);					
    			}
    		});
    		$('#configs').bind('drag','.item-btn',function(ev){
    			curTarget = ev.target;
    			index = ev.target.attributes['index'].value;
    		});
    	}
    });
    
    window.homeVm = vm; 

    /*
     * 获取当前视角菜单数据
     */
    hzEvent.on('home.viewmenu.getCurViewMenu', function () {
    	return vm.curViewMenu;
    });
    
    $('#config_btn').click(function() {
	   $('#configs').toggleClass('menu-open');
    });

    $('#hzMap').bind('click',function(){
	   $('#configs').removeClass('menu-open');
	   $('#threeMenu').hide();
    });

    $('.view_menus').on('mouseenter','.view_menu',function(){
    	$(this).addClass('active');
    	var id = $(this).attr('id');
    	$('#cm'+id).css({
    		left:143,
    		top:$(this).position().top+4
    	}).show();
    })
    $('.view_menus').on('mouseleave','.view_menu',function(){
    	$(this).removeClass('active');
    	var id = $(this).attr('id');
    	$('#cm'+id).hide();
    })    
    $('#threeMenu').on('mouseover',function(){
    	$('#threeMenu').css('zIndex',199010000);
    })
    
    drag.on($('#addPointPanel'));
    drag.on($('#addVideoPlanPanel'));
    drag.on($('#roomDetail'));

    hzEvent.unsubs('map.infopanel.click', 'loadPrisoner');
	hzEvent.subs('map.infopanel.click', 'loadPrisoner', function (data, target) {
		ls.setItem('prisonerCode',data.code);
		dialog.open({
			id:'259',
			title:'罪犯信息查询',
			type:2,
			url:'page/cds/prisoner/prisonerInfo.html'
		});
	});
    
    
    var ul=$("#navs"),li=$(".nav"),i=li.length,n=i-1,r=190;
    ul.click(function(event){
	   	 vm.menuIsExpand = !vm.menuIsExpand;
         if(vm.menuIsExpand){
           for(var a=0;a<i;a++){
             li.eq(a).css({
               'visibility':'visible',
               'transition-delay':""+(50*a)+"ms",
               '-webkit-transition-delay':""+(50*a)+"ms",
               '-o-transition-delay':""+(50*a)+"ms",
               'transform':"translate("+(r*Math.cos(90/n*a*(Math.PI/180)))+"px,"+(-r*Math.sin(90/n*a*(Math.PI/180)))+"px",
               '-webkit-transform':"translate("+(r*Math.cos(90/n*a*(Math.PI/180)))+"px,"+(-r*Math.sin(90/n*a*(Math.PI/180)))+"px",
               '-o-transform':"translate("+(r*Math.cos(90/n*a*(Math.PI/180)))+"px,"+(-r*Math.sin(90/n*a*(Math.PI/180)))+"px",
               '-ms-transform':"translate("+(r*Math.cos(90/n*a*(Math.PI/180)))+"px,"+(-r*Math.sin(90/n*a*(Math.PI/180)))+"px"
             });
           }
         }else{
           li.removeAttr('style');
           $("#indexDiv").show();
//           $("#indexDiv").hide();
//           $("#mainIframe").show();
         }
    });
    
	loadPage('#viewMenuAdd', 'page/map/viewMenu/viewMenuAdd.html');
	loadPage('#modelGroupEdit', 'page/map/modelGroup/modelEdit.html');
	loadPage('#modelGroupAdd', 'page/map/modelGroup/modelGroupAdd.html');
	loadPage('#addPointPanel', 'page/map/mapPoint/mapPoint.html');
	loadPage('#roomDetail', 'page/map/roomDetail/roomDetail.html');
	loadPage('#alarmHandle', 'page/cds/alarm/alarmHandle.html');
	loadPage('#pointRightMenu', 'page/map/mapPoint/pointRightMenu.html');

	function loadPage (selecter, url) {
		$(selecter).load(url, function (responseText, textStatus, XMLHttpRequest) {
			$(selecter).html(XMLHttpRequest.responseText);
		});
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
		curLayer.parent().css('z-index',1990100);
		var minH = curLayer.parent().height();
		var maxminBtn = curLayer.parent().find('.layui-layer-maxmin');
		if(minH<50 && maxminBtn.length>0){
			curLayer.parent().find('.layui-layer-maxmin').trigger('click');    				
		}
	}

   function isExsitPanel(panels,p){
		for(var i=0;i<panels.length;i++){
			if(panels[i].id == p.id){
				if(p.left){
					panels[i].left = p.left;					
				}else{
					panels[i].left = '600';
				}
				if(p.top){
					panels[i].top = p.top;					
				}
				return true;
			}
		}
		return -1;
	}
    /**
     * 查询视角菜单
     * @returns
     */
    function queryViewMenus(){
    	db.query({
    		request:{
    			sqlId:'select_map_view_menu',
    			whereId:1,
    			orderId:1,
    			params:[loginUser.cusNumber]
    		},
    		success:function(data){
    			vm.viewMenus = transData(data,'id','pid','childs');
    		}
    	});
    }

    function transData(a, idStr, pidStr, chindrenStr){ 
    	var r = [], hash = {}, id = idStr, pid = pidStr, children = chindrenStr, i = 0, j = 0, len = a.length; 
    	for(; i < len; i++){ 
    		hash[a[i][id]] = a[i]; 
    	} 
    	for(; j < len; j++){ 
    		var aVal = a[j], hashVP = hash[aVal[pid]]; 
    		if(hashVP){ 
    			!hashVP[children] && (hashVP[children] = []); 
    			hashVP[children].push(aVal); 
    		}else{ 
    			r.push(aVal); 
    		} 
    	} 
    	return r; 
	} 
    
    queryViewMenus();
    
    /**
	 * 保存视频预案
	 * @param n
	 * @returns
	 */
	function savePlan(n){
		vm.plan.dgm_use_range = n;
		if(!$.trim(vm.plan.name)){
			message.alert('请填写预案名称');
			return;
		}
		if(n==0 && !vm.plan.plan_type){
			message.alert('保存公共预案必须选择预案类型');
			return;
		}
		if(vm.plan.name.length>26){
			message.alert('预案名称过长，请输入26个以内字符');
			return;
		}
		var sqlId  = !vm.plan.id ? 'insert_videoplan' : 'update_videoplan';
		db.updateByParamKey({
			request:[{
				sqlId:sqlId,
				params:vm.plan
			}],
			success:function(data){
				var grpId = !vm.plan.id ? data.data[0].seqList[0] : vm.plan.id;
				var pcs = [];
				var pname = vm.plan.name;
				for(var i=0;i<vm.boxSelectCameras.length;i++){
					pcs.push({
						dgr_cus_number:loginUser.cusNumber,
						dgr_dvc_id:vm.boxSelectCameras[i].linkId,
						dgr_grp_id:grpId,
						dgr_seq:i,
						dgr_crte_user_id:loginUser.userId
					});					
				}
				db.updateByParamKey({
					request:[{
						sqlId:'delete_videoplan_rltn',
						whereId:0,
						params:{dgr_grp_id:grpId,dgr_cus_number:loginUser.cusNumber}
					},{
						sqlId:'insert_videoplan_rltn',
						params:pcs
					}],
					success:function(data){
						message.alert('保存成功');
						resetPlan();
						$('#addVideoPlanPanel').hide();
					}
				});
			},
			error:function(){}
		});
	}
	
	function resetPlan(){
		vm.plan={
			id:'',
			dgm_cus_number:loginUser.cusNumber,
			name:'',
			plan_type:'',
			dgm_use_range:0,
			dgm_crte_user_id:loginUser.userId,
			dgm_updt_user_id:loginUser.userId
		}
	}
	//获取门禁密码，
	db.query({
		request:{
			sqlId:'select_door_pwd_by_userId',
			params:{userId:loginUser.userId,cus:loginUser.cusNumber},
			whereId:'0'
		},success:function(data){
			top.userInfodd.doorpwd=data[0].doorpwd;
			top.userInfodd.doorAvoid=data[0].dooravoid;
		}
	});

	timerTask.createTimerTask(); //加载定时任务
	require('cds/talkback/message/talkbackMessageHandle');
	require('cds/LED/LEDCtrl');
	//require('cds/callroll/callRollMain');
	require('cds/prisoner/prisonerMain');
});
