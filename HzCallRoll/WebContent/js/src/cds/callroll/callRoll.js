define(["jquery","vue","frm/hz.drag","frm/hz.event","frm/loginUser",'frm/hz.db'],function($,tpl,drag,hzEvent,login,db){
	var model ;
	var callRoll;
	var arrayList=[], cacheList={},permission=[];	

	//绑定模型
	function bingModel(msg){
		model=new tpl({
			el:callRoll,
			data:{
				total:1,
				callList:[msg],
				areaPage:1,
				cur:'',
				currentArea:{
					detail:{},
					detailList:[],
					detailPage:0,
					flag:1,
					finish:false
				},
			},
			methods:{
				slideup:function(e){
					e.target.parentNode.classList.remove("slideup");
				},
				showDetail:function(item){
					
					this.currentArea.detail=item;
					
					this.cur=item['crm_record_id'];
					
					var list=cacheList[this.cur];//list,finish,time
					
					this.currentArea.detailList=list.length?list.slice(0,11):[];//获取缓存中的数据
					
					this.currentArea.flag=this.currentArea.detailPage=list.length<11?1: Math.ceil(list.length/11);

					hzEvent.call("callRollMain.linkageByDprt", item.crm_dprt_id);
					
				},

				getCalledList: function () {
					var list = cacheList[this.cur] || [];
					return list.map(function(item){
						return item.crd_prisoner_id;
					});
				},

				turnPage:function(index,e,type){
					
					if(type==1){//罪犯面板
						this.currentArea.detailList=cacheList[this.cur].slice(index*11,index*11+11);//获取缓存中的数据
					}else{//监区面板
						this.callList=arrayList.slice(index*11,index*11+11);
					}
					
					e.target.parentNode.childNodes.forEach(function(item){
						item.classList&&item.classList.remove("active");
					});
					
					e.target.classList.add("active");
					e.target.parentNode.previousElementSibling.querySelector("ul").classList.toggle("toggle");
				},
				changeS:function(e,type){
					e.target.parentNode.childNodes.forEach(function(item){
						item.classList&&item.classList.remove("active");
					});
					e.target.classList.add("active");
					
					if(type==1){//已点
						var l=cacheList[this.cur];
						
						this.currentArea.flag=this.currentArea.detailPage=l.length<11?1: Math.ceil(l.length/11);
						this.currentArea.detailList=l.slice(0,11);
						
						var call=l.map(function(item){
							return item.crd_prisoner_id;
						});
						hzEvent.call("callRollMain.calledPeople",call);
						
					}else{
						queryNoCalled(this.currentArea.detail['crm_record_id']);
					}
				},
				close:function(e,type){
					var pos=e.target.getBoundingClientRect();
					if(pos.top+2<e.y&&e.y<pos.top+22 && pos.right-22<e.x&&e.x<pos.right-2){//定位
						e.target.parentNode.classList.add('h');
						callRoll.previousElementSibling.classList.remove("show");
						hzEvent.call("callRollMain.clearStyle");
						if(type==1){//清楚缓存
							cacheList={};
							this.callList=arrayList=[];
							this.total=0;
							this.areaPage=0;
							this.cur='';
						}
					}else if(pos.top+2<e.y&&e.y<pos.top+22 && pos.right-42<e.x&&e.x<pos.right-22){//定位
						callRoll.classList.add("slideup");
					}
				}
			}
		});
	}
	function queryNoCalled(recordid){
		db.query({
			request:{
				sqlId:'select_no_call_roll_list',
				params:[login.cusNumber,recordid],
				whereId:'0'
			},success:function(data){
				model.currentArea.detailList=data;
				model.currentArea.flag=1;
				model.currentArea.detailPage=Math.ceil(data.length/11);
				var noCall=data.map(function (item){
					return item.crd_prisoner_id;
				});
				hzEvent.call("callRollMain.noCallPeople",noCall);
			}
		});
	}
	//开始结束点名
	function beginRoll(data){
		var msg = data.msg[0];
		
		if(!permission.includes(msg['crm_dprt_id'])||isRepeat(arrayList,msg['crm_record_id'],'crm_record_id')){
			return;
		}
		msg.finish=false;
		msg.time=msg['crm_begin_time'];
		
		cacheList[msg['crm_record_id']] =[];
		
		//发布事件
		hzEvent.call("callRollMain.callrollBegin");
		
		arrayList.push(msg);
		
		if(!msg['crm_end_time']){//开始点名
			if(!callRoll.childElementCount){//加载面板
				$(callRoll).load("page/cds/callroll/callRoll.html",function (responseText, textStatus, XMLHttpRequest) {
					
					callRoll.innerHTML = XMLHttpRequest.responseText;
					
					bingModel(msg);//只执行一次
					
					var detail=callRoll.querySelector("#detail");
					
					document.body.insertBefore(detail,callRoll);
					
					drag.on(detail);
				});
			} else {//显示点名区域
				initPage(msg);
			}
		}else{//结束点名
			endRoll(msg);
		}
		model&&model.total++;
		callRoll.classList.remove('h');
	}
	//正在点名
	function rolling(data){
		var msg = data.msg[0];
		if(!cacheList[msg['crd_record_id']]||isRepeat(cacheList[msg['crd_record_id']],msg['crd_prisoner_id'],'crd_prisoner_id')){
			return;
		}
		
		hzEvent.call("callRollMain.callrolling", msg.crd_prisoner_id);
		
		var curList=cacheList[msg['crd_record_id']];
		
		curList.push(msg);//缓存数据crd_record_id
		
		if(model.cur!=msg['crd_record_id']){
			return;
		}
		model.currentArea.flag!=1&&(model.currentArea.flag=1);//永远展示最后一页
		
		var arrLen=curList.length;
		
		a=callRoll.previousElementSibling.querySelector("a.active:not(:last-child)");
		a&&a.classList&&a.classList.remove("active");
		if(arrLen>11&&1==arrLen%11){
			model.currentArea.detailList=[msg];
			model.currentArea.detailPage++;
		}else{
			if(model.currentArea.detailList.length==11){
				model.currentArea.detailList=curList.slice(arrLen-(arrLen%11?(arrLen%11):11),arrLen);
			}else{
				model.currentArea.detailList.push(msg);
			}
			a=callRoll.previousElementSibling.querySelector("a:last-child");
			a.classList.add("active");
		}
	}
	//判断是否重复
	function  isRepeat(list,id,key){
		for(var i=0,len=list.length;i<len;i++){
			if(list[i][key]==id){
				return true;
			}
		}
		return false;
	}
	//结束点名
	function endRoll(data){
		if(!model)return;
		data=data.msg[0];
		for(var i=0,len=model.callList.length;i<len;i++){
			if(data['crm_record_id']==model.callList[i]['crm_record_id']){
				model.callList[i]['finish']=true;
				model.callList[i]['time']=data['crm_end_time'];
				model.callList[i]['crm_fact_num']=data['crm_fact_num'];
				model.callList[i]['crm_predict_num']=data['crm_predict_num'];
				break;
			}
		}
		hzEvent.call("callRollMain.callrollEnd");
	}
	function initPage(msg){
		
		var arrLen=arrayList.length;
		var a=callRoll.querySelector("a.active:not(:last-child)");
		a&&a.classList&&a.classList.remove("active");
		
		if(arrLen%11==1){
			model.callList=[msg];
			model.areaPage++;
		}else{
			if(model.callList.length==11){
				model.callList=arrayList.slice(arrLen-(arrLen%11?(arrLen%11):11),arrLen);
			}else{
				model.callList.push(msg);
			}
			a=callRoll.querySelector("a:last-child");
			a.classList.add("active");
		}
	}
	/*
	 * 初始化事件消息监听
	 */
	function initSubs () {
		var wm = window.top.webmessage;
		if (wm) {
			wm.on('CALLROLL_BEGIN','callRollBegin',beginRoll);
			wm.on('CALLROLL_END','callRollEnd',endRoll);
			wm.on('CALLROLL_ING','callRolling',rolling);
		} else {
			setTimeout(initSubs, 200);
		}
	}
	db.query({
		request:{
			sqlId:'select_permission_dep',
			params:[login.dataAuth>0?login.cusNumber:login.deptId],
		},
		success:function(data){
			data.length&&(permission=data[0].child.split(",").map(function(item){return parseInt(item);}));
		}
	});
	//追加面板
	(function (){
		callRoll = document.createElement("section");
		callRoll.id = "callRoll";
		callRoll.classList.add("callRoll", "vbox");
		top.document.body.appendChild(callRoll);
		drag.on(callRoll);

		
		var calledList = null;
		hzEvent.on('callRoll.openDetail', function () {
			calledList = model.getCalledList();
			callRoll.classList.add("slideup");
			callRoll.previousElementSibling.classList.add("show");
		});

		hzEvent.on('callRoll.getCalledList', function () {
			return calledList || [];
		});
	})();

	initSubs();
});