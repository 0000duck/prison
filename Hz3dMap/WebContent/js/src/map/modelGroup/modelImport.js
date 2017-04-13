define(['jquery','vue','frm/hz.db','frm/message','frm/loginUser', 'frm/hz.tree'],
function($,vue,db,message,user, hzTree){
	var vm = new vue({
		el:'body',
		data:{
			path:'mkjy',
			modelLog:'暂无记录日志',
			success:0,	//导入记录
			error:0,	//导入失败记录
			updateSuccess:0,	//更新记录
			updateError:0,		//更新失败记录
			modelTreeData:[],	
			result:[],
			model:{
			   mfi_cus_number:user.cusNumber,
			   mfi_file_id:'',		//id
			   mfi_file_pid:'',		//文件父id
			   mfi_file_name:'',	//文件名称
			   mfi_file_title:'',	//标题（别名，暂时与文件名称相同）
			   mfi_file_path:'',	//文件全路径
			   mfi_file_type:'',	//1.文件夹、2.OBJ文件';
			   mfi_file_flag:'',	//0.常规模型、1.外模型、2.内模型';
			   mfi_file_attr:'',	//存放模型文件的配置信息,可为空
			   mfi_file_order:'',	//排序，默认给mfi_file_id
			   mfi_create_uid:user.userId,
			   mfi_update_uid:user.userId
			}
		},
		methods:{
			save:function(){		//保存
				if($.trim(vm.path) == ''){
					message.alert('请输入导入路径');
					return;
				}
				vm.modelLog = "模型导入开始...";
				vm.requestModel();
			},
			requestModel:function(){	//请求获取文件数据
				$.ajax({
					url: mapBasePath + 'map/getModelData',
					data:{path:vm.path},
					success:function(data){
						data = JSON.parse(data);
						if(!data || data.length <= 0){
							vm.print("获取模型数据失败！！！",false);
						}else{
							vm.print("获取模型数据成功！！！",true);
							vm.convertModel(data);
						}
					},
					error:function(req,status,msg){
						message.alert(msg);
					}
				})
			},
			convertModel:function (data) {		//转换数据
				hzTree.toTree(data, {
					formatter: function (node) {
						// TODO: 格式化数据
					}, 
					success: function (nodes, maps) {
						console.log('toTree --> ' + JSON.stringify(nodes));
						vm.modelTreeData = nodes;
					}
				});
				
				if(!vm.modelTreeData || vm.modelTreeData.length <= 0){
					vm.modelLog += "转换树节点数据失败！！！";
					return;
				}
				//插入数据
				
				vm.insertModel(0,[vm.modelTreeData[0]]);
				vm.print("模型导入结束！！！",true);
				vm.print("导入成功:"+vm.success+" 导入失败:"+vm.error,true);
				vm.print("更新成功:"+vm.updateSuccess+" 更新失败:"+vm.updateError,true);
				vm.success = vm.updateSuccess = vm.error = vm.updateError = 0;
			},
			joinModel:function(obj){		//组装数据
				var modelData = JSON.parse(JSON.stringify(vm.model));
				modelData.mfi_file_id = obj.id;
				modelData.mfi_file_pid = obj.pid;
				modelData.mfi_file_name =obj.name;
				modelData.mfi_file_title = obj.name;
				modelData.mfi_file_path = obj.attributes.path;
				modelData.mfi_file_type = obj.attributes.type;
				modelData.mfi_file_order = obj.attributes.order;
				modelData.mfi_file_flag = obj.attributes.flag;	
				return modelData;
			},
			insertModel:function (pid,childrens) {	//添加数据
				for(var i = 0; i < childrens.length; i++){
					var obj = childrens[i];
					obj.pid = pid;
					//获取入库数据
					var modelData = vm.joinModel(obj);
					//添加数据
					var sqlId = 'insert_model_data';
					//返回查询数据
					vm.checkModel(obj.attributes.path);
					if(vm.result && vm.result.length > 0){
						sqlId = 'update_model_data'	
						modelData.mfi_file_id = vm.result[0].mfi_file_id;
					}
					db.updateByParamKey({
						request: [{
							sqlId:sqlId,
							whereId:0,
							params:modelData
						}],
						async:false,
						success: function (data) {
							var tid = 0;
							if(sqlId.indexOf('insert') != -1){
								vm.print("导入成功：<br>"+modelData.mfi_file_path,true);
								tid = data.data[0].seqList[0];
								vm.success++;
							}else{
								vm.print("更新成功：<br>"+modelData.mfi_file_path,true);
								tid = modelData.mfi_file_id;
								vm.updateSuccess++;
							}
							//判断是否有子节点
							if(obj.children && obj.children.length > 0){
								vm.insertModel(tid,obj.children);
							}
						},
						error: function (code, msg) {
							if(sqlId.indexOf('insert') != -1){
								vm.print("导入失败：<br>"+modelData.mfi_file_path,false);
								vm.error++;
							}else{
								vm.print("更新失败：<br>"+modelData.mfi_file_path,false);
								vm.updateError++;
							}
							//判断是否有子节点
							if(obj.children && obj.children.length > 0){
								vm.insertModel(modelData.mfi_file_id,obj.children);
							}
						}
					})
				}
			},
			checkModel:function(path){		//检查模型是否唯一
				db.query({
					request: {
						sqlId: 'select_model_data_by_path',
						whereId: 0,
						params: {'mfi_cus_number':user.cusNumber,'mfi_file_path':path}
					},
					async:false,
					success: function (data) {
						vm.result = data;
					},
					error: function (code, msg) {
						console.log(msg);
						vm.result = [];
					}
				});
			},
			print:function(msg,flag){	//打印插入记录
				if(!flag){
					vm.modelLog += '<p style="color:#ff6f6f">'+msg+'</p>';
				}else{
					vm.modelLog += '<p>'+msg+'</p>';
				}
			}
		}
	})
})