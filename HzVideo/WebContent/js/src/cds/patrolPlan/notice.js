define(["vue","frm/hz.db","frm/loginUser","frm/hz.videoclient"],function(tpl,db,login,video){
	var model ,noticeContainer;
	var test={id:100421,name:'视频巡视'}
	function task(data){
		data=test;//JSON.parse(data.msg);
		if(!model){
			init(data);
		}else{
			
			noticeContainer.parentNode.parentNode.classList.add("h");
			
			noticeContainer.style.height='';
			
			if(model.notice.length>10){
				
				model.notice=[data];
			}
			model.notice.push(data);
			
			model.$nextTick(function(){
				
				noticeContainer.scrollTop=noticeContainer.scrollHeight;
				
			});
		}
	}
	
	function init(msg){
		
		noticeContainer = document.createElement("section");
		
		noticeContainer.id = "personal_notice";
		
		noticeContainer.classList.add("notice");
		
		top.document.body.appendChild(noticeContainer);
		
		$(noticeContainer).load("page/cds/patrolPlan/notice.html",function(responseText, textStatus, XMLHttpRequest){
			
			noticeContainer.innerHTML = XMLHttpRequest.responseText;
			
			model=new tpl({
				el:noticeContainer,
				data:{
					notice:[msg],
					cameras:[]
				},
				methods:{
					close:function(e){
						var pos=e.target.getBoundingClientRect();
						if(pos.right-10<e.x&&e.x<pos.right+10&&pos.top-10<e.y&&e.y<pos.top+10){
							e.target.style.display="none";
						}
					},
					detail:function(t){
						detail(t);
						//this.notice.splice(t);
						noticeContainer.parentNode.nextElementSibling.style.display="block";
						noticeContainer.parentNode.parentNode.classList.remove("h");
					},
					play:function(c,e){
						if(!e.target.classList.contains("play")){
							video.play([c.id]);
							e.target.classList.add("play");
							//更新记录
							update(c.id);
						}
					}
				}
			});
			noticeContainer.classList.add("h");
			
			noticeContainer=noticeContainer.querySelector("ul");
		});
	}
	function  update(camera){
		db.updateByParamKey({
			request:{
				sqlId:'update_plan_record',
				params:{cus:login.cusNumber,planid:model.planid,userid:login.userId,camera:camera}
			},success:function(){
				
			}
		});
	}

	//
	function detail(notice){
		db.query({
			request:{
				sqlId:'select_plan_detail',
				params:{cus:login.cusNumber,planid:notice.id,userid:login.userId}
			},success:function(data){
				model.cameras=data;
				model.planid=notice.id;
			}
		});
	}

	//监听事件
	function bindLisenter(){
		if (window.top.webmessage) {
			window.top.webmessage.on('VEDIO_PLAN_NOTICE', 'prisonal_task', task, true);
		} else {
			setTimeout(bindLisenter,200);
		}
	}
	bindLisenter();
});