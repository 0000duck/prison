define(["frm/hz.three","vue","frm/hz.db","frm/loginUser","frm/dialog","frm/message","frm/localStorage"],function(hzThree,vue,db,login,dialog,tip,ls){
	//搜索容器
	var searchAll=document.getElementById("searchAll");
	//搜索输入框
	var inputSearch=searchAll.children[0];
	//搜索类型
	var searchList={
			'1':{//查询罪犯
				icon:'',
				type:'2',
				tip:'信息',
				cache:[],
				request:{
					sqlId:'select_search_by_prisoner',
					whereId:'1',
					orderId:'0',
					params:{cus:login.cusNumber}
				}
			},
	};
	var model=new vue({
		el:"#searchAll",
		data:{
			key:"",
			type:'1',//搜索类型
			searchs:[]
		}, 
		methods:{
			find:function(params){
				if(!params.id){
					tip.alert('请选择要查询的项');
					return ;
				}
				ls.setItem("ckParam",{id:params.id,name:params.name});
				dialog.open({
					id:'316',
					title:'动态跟踪',
					type:2,
					url:'page/cds/prisoner/rfid/rfid.html',
					params:{id:params.id,name:params.name}
				});
				searchAll.style.display="none";
				model.key='';
			}
		},
		watch:{
			key:function(val){
				if(val.length==0){
					this.searchs=[];
					return;
				}
				var cur=searchList[this.type];
				if(cur.cache.length==0){
					initData(searchList[this.type]);
					return;
				}
				var tempList=search(cur.cache,val,cur.tip);
				if(tempList.length==0){
					this.searchs=[{name:'暂无相关信息'}];
				}else{
					this.searchs=tempList;
				}
			}
		}
	});
	setTimeout(function(){
		document.onkeydown=function(e){
			if(e.ctrlKey&&e.keyCode==70){
				hzThree.setControlKeysEnable(false);
				model.searchs=[];
				searchAll.style.display="block";
				e.preventDefault();
				inputSearch.value="";
				inputSearch.focus();
			}
		};
		document.getElementById('navs').focus();
		inputSearch.onkeydown=function(e){
			if(e.keyCode==13){
				hzThree.setControlKeysEnable(true);
				searchAll.style.display="none";
				
				if(model.searchs.length){
					ls.setItem("ckParam",{id:model.searchs[0].id,name:model.searchs[0].name});
					dialog.open({
						id:'316',
						title:'动态跟踪',
						type:2,
						url:'page/cds/prisoner/rfid/rfid.html',
						params:{id:model.searchs[0].id,name:model.searchs[0].name}
					});
				}
			}
		}
	},800);
	function search(list,value,tip){
		var temp=[],key='';
		if(Number.isNaN(Number.parseInt(value))){
			key='name';
		}else{
			key='id';
		}
		for(var i=0,len=list.length;i<len;i++){
			if(list[i][key].toString().includes(value)){
				console.log(list[i]);
				temp.push({name:list[i].name,tip:tip,id:list[i].id});
			}
		}
		console.log(temp);
		return temp;
	}
	//缓存数据用作搜索
	function initData(search){
		db.query({
			request:search.request,
			success:function(data){
				search.cache=data;
				delete search.request;
			}
		});
	}
	initData(searchList['1']);
});