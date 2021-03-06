define(["vue","frm/hz.db","frm/loginUser","frm/message","frm/treeSelect","frm/datepicker"],function(tpl,db,login,tip,tree){
	var model=new tpl({
		el:'#container',
		data:{
			total:0,
			condition:{
				date:new Date().Format('yyyy-MM-dd'),
				user:'',
				userid:'',
				planName:'', 	
				planid:''
			},
			plans:[]
		},
		watch:{
			"condition.userid":function(val,old){
				if(val&&val!=old){
					query(1);
				}
			},
			"condition.planid":function(val,old){
				if(val&&val!=old){
					query(1);
				}
			},
			"condition.date":function(val,old){
				if(val&&val!=old){
					query(1);
				}
			}
		},
		methods:{
			toggle:function(e,plan){
				if(e.target.nodeName=="SPAN"){
					e.target.parentNode.parentNode.nextElementSibling.classList.toggle("show");
				}else if(e.target.nodeName=='P'){
					e.target.parentNode.nextElementSibling.classList.toggle("show");
				}else {
					e.target.nextElementSibling.classList.toggle("show");
				}
				if(!plan.cameras){
					queryDetail(plan);
				}
			}
		}
	});
	function queryDetail(plan){
		db.query({
			request:{
				sqlId:'select_plan_detail',
				params:{planid:plan['vcr_vpp_id'],userid:plan['vcr_vpp_user'],cus:login.cusNumber}
			},success:function(data){
				if(data.length){
					plan.cameras=data;
				}
			}
		});
	}
	//滚动事件
	var direction=0;
	document.getElementById("scroll").onscroll=function(){
		//距离底部的高度
		var l=this.scrollHeight-this.scrollTop-this.clientHeight,f=l<direction;
		direction= l;
		if(f&&l==0){//判断滚动方向小于乡下
			if(model.total==this.children.length){
				tip.alert("没有了");
				return;
			}
			this.children.length>=20&&query(parseInt(this.children.length/20)+1,true);
		}
	};
	//查询记录
	function query(pageindex,flag){
		db.query({
			request:{
				 sqlId:'select_vedio_plan_record',
				 params:{cus:login.cusNumber,excutetime:model.condition.date},
				 pageIndex:pageindex,
				 pageSize:20,
				 whereId:model.condition.userid||model.condition.planid?"0":null
			},success:function(data){
				model.plans=flag?model.plans.concat(data.data):data.data;
				model.total=data.count;
			}
		});
	}
	//初始化用户树
	db.query({
		request:{
			sqlId:'select_plc_by_orgid',
			params:{'org':login.cusNumber,'level':'1'}//'level':(login.dataAuth!=2)?'2':'3'
		},success:function(data){
			var setting={
					key:'name',
					diyClass:'conditionslid',
					expand:true,
					path:'../../../libs/ztree/css/zTreeStyle/img/',
					data: {simpleData: {enable: true,pIdKey: "pid"}},
					callback:{
						onClick:function(e,id,node){
							if(node.type==1){	
								model.condition.userName=node.name;
								model.condition['user']=node.id;
							}else{
								tip.alert("请选择执行人");
							}
						}
					}
			};
			tree.init("finda",setting,keepLeaf(data));
		}
	});
	
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
	query(1);
});