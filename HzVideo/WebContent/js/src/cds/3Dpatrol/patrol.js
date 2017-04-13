define(['jquery','vue','frm/hz.db',"frm/message","frm/model","frm/loginUser","hz/map/map.handle","frm/hz.videoclient"],function($,tpl,db,tip,modelData,login,dthree,video){
	//窗口设置
	var pl=window.frameElement.parentNode.parentNode;//包含iframe的div
	setTimeout(function(){pl.classList.add("flip")},400);
	
	var cameraList=[],patrlTimer,accept=false;//巡视过程中的摄像机
	//地图api
	var map=dthree.routePatrol;
	//返回标志
	var backflag=true;
	//
	var layout=1;
	//创建数据模型
	var model=new tpl({
		el:"#modelcontainer",
		data:{
			patrol:[],//预案列表
			camera:[],//摄像机列表
			name:'',//线路名称
			route:[],//线路坐标
			routeid:'',//线路id
			type:'',//设备类型
			linkdevice:[],//线路关联的设备
			view:{
				height:'',
				speed:'',
				radius:''
			}
		},
		methods:{
			stop:function(e){//暂停
				clearTimeout(patrlTimer);
				if(!e.target.classList.contains("play")){//暂停
					map.pausePatrol();
					e.target.classList.add("play");
					accept=false;
				}else {//继续
					map.startPatrol();
					e.target.classList.remove("play");
					accept=true;
				}
			},
			over:function(e){//结束
				accept=true;
				clearTimeout(patrlTimer);
				map.stopPatrol();
				e.target.previousElementSibling.classList.remove("play");
			}
		}
	});
	for(var list=document.getElementById("mainopr").children, i=0;i<3;i++){
		list.length&&pl.appendChild(list[0]);
	}

	//初始化列表线路
	db.query({
		request:{
			sqlId:'select_patrol_list',
			params:{"cus":login.cusNumber,'user':login.userId},//省局用户要查出下面的所有机构号
		},success:function(data){
			//console.log(data);
			model.patrol=data;
			video.setLayout(1);
		}
	});

	//巡视的时候搜索
	map.onPatrolMove(function(pos){
		if(!accept)return;
		var list=getCamera(pos,200);//
		if(list.length){//如果设备存在则暂停巡视 启用客户端
			//pl.children[4].textContent='跳过';
			map.pausePatrol();
			layout!=list.length&&(layout=list.length,video.setLayout(layout));
			video.play(list);
			setCarmer(list);
			patrlTimer=setTimeout(function(){map.startPatrol()},0);//暂停pl.children[4].textContent='暂停';
		}
	},"move_play_video_ck");
	//巡视结束
	map.onPatrolStop(function(){
		accept&&patrolOver();
	},'move_play_over_stop');
	//设置摄像机状态
	var camerasShow=pl.children[6];
	function setCarmer(list){
		var temp;
		var child=camerasShow.children;
		for(var i=0,len=child.length;i<len;i++){
			child[i].style.animation='';
		}
		for(var i=0,len=list.length;i<len;i++){
			temp=camerasShow.querySelector("li[data-rel='"+list[i]+"']");
			temp&&(temp.style.animation='videoplay 1s infinite',(temp.offsetLeft+temp.clientWidth>pl.clientWidth)&&(camerasShow.style.left=pl.clientWidth/2-temp.offsetLeft+"px"));
		}
	}
	//获取行进线路中的摄像机
	function  getCamera(pos,f){
		var temp=[];
		for(var i=0;i<cameraList.length;i++){
			if((Math.abs(Math.abs(cameraList[i].x)-Math.abs(pos.x))<f)&&(Math.abs(Math.abs(cameraList[i].y+180)-Math.abs(pos.y))<f)&&(Math.abs(Math.abs(cameraList[i].z)-Math.abs(pos.z))<f)){
				temp.push(cameraList.splice(i,1)[0]['device']);//摄像机id
			}
		}
		return temp;
	}
	/*---按钮操作---*/
	var edit=$("#editmap");
	//正面操作按钮
	var cutentLi,dbclick=false,timer;//当前选中的线路
	
	var container;
	//单击事件翻转双击巡视
	var container=$("#modelcontainer").on("click","li",function(){
		cutentLi=this;
		model.routeid=this.dataset.route;
		model.view.speed=this.dataset.speed;
		model.view.height=this.dataset.height;
		model.view.radius=this.dataset.radius;
		if(dbclick){
			clearTimeout(timer);
			dbclick=false;
			db.query({
				request:{//查询摄像机
					sqlId:'select_device_query',
					params:{'routid':model.routeid}
				},success:function(camera){
					
					var carmers='';
					
					for(var i=0,len=camera.length;i<len;i++){
						carmers+='<li data-rel='+camera[i].device+'>'+camera[i].name+'</li>';
					}
					camerasShow.innerHTML=carmers.length?carmers:'暂未关联设备';
					db.query({//查询点位
						request:{
							sqlId:'select_pos_query',
							params:{'routid':model.routeid}
						},success:function(data){
							model.route=data;//线路的坐标点
							if(data.length==0){
								tip.alert("<p style='color:white;'>巡视线路未标注</p>");
								return;
							}
							pl.style.animationName='slidup';
							model.linkdevice=camera; //当前线路已经关联的设备
							cameraList=camera.slice(0,camera.length);
							map.setEditStatus(false);
							map.startPatrol(data,{"walkSpeed":parseInt(model.view.speed), "defalutY":parseInt(model.view.height)});
						}
					});
				}
			});
		}else{
			timer=setTimeout(function(){
				dbclick=false
				db.query({
					request:{//查询摄像机
						sqlId:'select_device_query',
						params:{'routid':model.routeid}
					},success:function(camera){
						db.query({//查询点位
							request:{
								sqlId:'select_pos_query',
								params:{'routid':model.routeid}
							},success:function(data){
								var carmers='';
								for(var i=0,len=camera.length;i<len;i++){
									carmers+='<li data-rel='+camera[i].device+'>'+camera[i].name+'</li>';
								}
								camerasShow.innerHTML=carmers.length?carmers:'暂未关联设备';
								cameraList=model.linkdevice=camera; //当前线路已经关联的设备
								model.route=data;//线路的坐标点
								model.name=name;//线路名称
							}
						});
					}
				});
			},240);
			dbclick=true;
		}
		container.find("li.select").removeClass("select");
		cutentLi.classList.toggle("select");
	});
	//开始巡视
	$("#modelcontainer").on("click","#oprs",function(){
		if(!container.find("li.select").length>0){
			tip.alert("<p style='color:white;'>请选择线路</p>");
			return;
		}
		if(model.route.length==0){
			tip.alert("<p style='color:white;'>巡视线路未标注</p>");
			return;
		}
		cameraList=model.linkdevice.slice(0,model.linkdevice.length);
		setCarmer([]);
		map.setEditStatus(false);
		map.startPatrol(model.route,{"walkSpeed":parseInt(model.view.speed), "defalutY":parseInt(model.view.height)});
		pl.style.animationName='slidup';
	});
	//巡视结束
	function patrolOver(){
		camerasShow.style.display='none';
		var left=pl.offsetLeft+pl.clientWidth/2;
		pl.style.animationName='sliddown';
		pl.classList.remove("mapopr","transa");
		pl.style.left=left-pl.children[0].clientWidth/2+"px";
		(pl.style.transform=='rotateY(0deg)'||pl.style.transform=='')&&(map.setEditStatus(false),map.clearRoute(),pl.children[2].style.display='');//关闭最大化最小化
	}
	//旋转终止
	pl.addEventListener("animationend",function(e){
		if(e.animationName=='slidup'){
			camerasShow.style.display='';
			pl.classList.add("mapopr");
			accept=true;//接收事件
			pl.style.left=(top.innerWidth-pl.clientWidth)/2+"px";
		}else{
			accept=false;
			camerasShow.style.left='0px';
		}
	});

}); 