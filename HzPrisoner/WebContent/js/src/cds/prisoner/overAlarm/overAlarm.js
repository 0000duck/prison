define(["jquery","vue","hz/map/map.handle"],function($,tpl,map){
	var overAlarm;
	
	var model;
	
	function reviceMessage(data){
		data=JSON.parse(data.msg);
		if(!model){
			init(data);
		}else{
			overAlarm.parentNode.parentNode.classList.remove("h");
			overAlarm.style.height='';
			if(model.alarms.length>10){
				
				model.alarms=[];
			}
			model.alarms.push(data);
			model.$nextTick(function(){
				
				overAlarm.scrollTop=overAlarm.scrollHeight;
				
			});
		}
	}
	function init(msg){
			
			overAlarm = document.createElement("section");
			
			overAlarm.id = "overAlarm";
			
			overAlarm.classList.add("overAlarm");
			
			top.document.body.appendChild(overAlarm);
			
			$(overAlarm).load("page/cds/prisoner/overAlarm/overAlarm.html",function(responseText, textStatus, XMLHttpRequest){
				overAlarm.innerHTML = XMLHttpRequest.responseText;
				
				model=new tpl({
					el:overAlarm,
					data:{
						alarms:[msg]
					},
					methods:{
						locate:function(t){
							map.locationDvc(15,t.deviceId);//RFID id
						},
						slidup:function(e){
							e.target.previousElementSibling.style.height=e.target.previousElementSibling.clientHeight+'px';
							setTimeout(function(){e.target.parentNode.parentNode.classList.add("h")},100);
						}
					}
				});
				
				overAlarm=overAlarm.querySelector("ul");
			});
	}
	//监听事件
	function bindLisenter(){
		if (window.top.webmessage) {
			window.top.webmessage.on('RFID001_OVER','prisoner_over',reviceMessage);
		}else{
			setTimeout(bindLisenter, 200);
		}
	}
	bindLisenter();
});