/**
 * 加载三维地图
 */
define(function (require) {
	var hzMap = require('hz/map/map.handle'),
		hzEvent = require('frm/hz.event'),
		user = require('frm/loginUser'),
		tree = require('frm/hz.tree'),
		db = require('frm/hz.db'),
		message = require('frm/message'),
		mapFilter = require('hz/home/map.load.filter');
		mapTools = require('hz/map/mapTools');

	require('hz/map/extend/roomlabel.extend');

	var totleProgress = 0; // 总体进度
	var priorProgress = 0; // 上一次模型的进度

	var loadedNum = null;
	var loadingProgress = null;

	var loadArray, 
		length, 
		groundLength, 
		index = 0, 
		filter = [], 
		buildingMap = {};

	var node = null;

	/*
	 * 加载默认视角
	 */
	function queryDefaultView () {
		db.query({
			request: {
				sqlId: 'select_view_menu_for_map_handle',
				whereId: 0,
				params: [user.cusNumber]
			},
			success: function (array) {
				var view = array[0];
				if (view) {
					hzMap.location(view.id);
					console.log('初始化系统默认视角...');
				}
			}
		});
	}


	/*
	 * 查询模型文件的根目录名称
	 */
	function queryBaseFileName () {
		db.query({
			request:{
				sqlId: 'select_map_model_base_file_for_load',
				whereId: 0,
				params: [user.cusNumber]
			},
			success: function (result) {
				if (result && result.length) {
					getModelList(result[0].base_name);
				} else {
					message.alert('未导入模型文件信息，无法加载地图模型!');
					hzMap.visibleMap(false);
					$('#mapLoading').fadeOut(1000);
				}
			},
			error: function (code, desc) {
				$('#mapLoading').fadeOut(1000);
				message.alert('模型加载错误[' + code + ']：' + desc);
			}
		});
	}


	/*
	 * 获取模型列表
	 */
	function getModelList (baseName) {
		$.post(mapBasePath + 'map/getFile?name=' + baseName, function (data) {
			var temp, path, name, dx = [], simple = [], doors = [], outs = [], ins = [], others = [];

			data = JSON.parse(data);

			for(var i = 0 ; i < data.length; i++) {
				temp = data[i];
				path = temp.path;
				name = temp.name;
				node = {name: name, path: mapBasePath + path, obj: name + '.obj', mtl: name + '.mtl'}

				if (name.indexOf('Door_') > -1) {
					doors.push(node);
				} else {
					if (mapFilter.filter(name)) {
						if (name.indexOf('_dx') > 0 || path.indexOf('ground_model') > 0) {
							dx.push(node);
						} else if (name.indexOf('simple') > 0 || path.indexOf('simple_model') > 0){
							simple.push(node);
						} else {
							if (path.indexOf('/out/')) {
								outs.push(node);

								var strs = name.split('_');
								if (!buildingMap[strs[1]]) {
									buildingMap[strs[1]] = true;
								}
							} else if (path.indexOf('/in/')) {
								ins.push(node);
							} else {
								others.push(node);
							}
						}
					}
				}
			}

			groundLength = dx.length;
			loadArray = [].concat(dx, others, doors, simple, outs, ins);
			length = loadArray.length;

			if (length) {
				console.log('开始加载模型....' + length);
				$('#mapLoading').show();
				loadNext();
			} else {
				message.alert('无法加载模型，可加载模型资源未 0');
				visibleMap();
				hzMap.visibleMap(false);
			}
		});
	}


	/*
	 * 加载下一个模型
	 */
	function loadNext () {
		if (index < length) {
			node = loadArray[index++];
			loadModel(node.path, node.mtl, node.obj);
		} else {			
			console.log('模型加载完成!!!');
			console.log(hzMap.hzThree.objectMap);

			for(var name in buildingMap) {
				hzMap.initBuilding(name);
			}

			// 初始化功能配置列表
			hzMap.hasLoaded = true;
			hzMap.loadBuildingLabels();

    		hzEvent.emit('map.model.onload', hzMap);

    		loadArray = null;
    		length = null;
    		buildingMap = null;
    		groundLength = null;
    		priorProgress = null;
    		totleProgress = null;
    		filter = null;
    		index = null;
		}
	}


	/*
	 * 加载模型
	 */
	function loadModel (path, mtl, obj) {
//		console.log('加载模型[' + index + '/' + length + ']：' + obj);
		hzMap.hzThree.scene.loadObj(path, mtl, obj, {
			'onProgress': function (xhr) {
				if (xhr.lengthComputable) {
	                var percentComplete = Math.round(xhr.loaded / xhr.total * 100);
	                if (percentComplete == 100) {
	                	priorProgress += percentComplete;
	                	totleProgress = priorProgress;

	                	if (totleProgress == 100 * groundLength) {
	                		visibleMap();
	                		loadingProgress = null;
	                		loadedNum = null;
	                	}
	                } else {
	                	totleProgress = priorProgress + percentComplete;
	                }

	                drawLoading(Math.round(totleProgress / groundLength));
	            }
			},
			'onLoad': function (object) {
				loadNext();
			},
			'onError': function () {
				console.log('模型[' + obj + ']加载失败!');
				loadNext();
			}
		});
	}


	/*
	 * 显示地图
	 */
	function visibleMap () {
		$('#mapLoading').fadeOut(1000);
		$('#hzMap').show();
		hzMap.mapConfig.init();
	}


	/*
	 * 绘制加载进度动画
	 */
    function drawLoading (loaded) {
    	if (!loadedNum)
    		loadedNum = document.getElementById('loadedNum');
    	if (!loadingProgress)
    		loadingProgress = document.getElementById('loadingProgress').getContext('2d');

    	loadedNum.innerHTML = loaded;
        loaded = loaded * 2 / 100 * Math.PI, 

        loadingProgress.clearRect (0, 0, 204, 204);
        loadingProgress.beginPath();
        loadingProgress.arc(102, 102, 98, 0, loaded, false);
        loadingProgress.lineWidth = 8;
        loadingProgress.strokeStyle = '#ff6000';
        loadingProgress.stroke();
    }



	try {
		/*
		 * 添加样式 和核心DOM元素
		 */
		$(window.top.document.head).append('<link rel="stylesheet" href="css/map/map.main.css" charset="utf-8">');
		$(window.top.document.body).prepend(
			'<div id="mapLoading" style="display:none;">' +
				'<div class="splash" id="splash">' +
				    '<div class="splash-inner">' +
				        '<div class="loading-circle" id="loadingCircle">' +
				            '<p><span id="loadedNum">0</span>%</p>' +
				            '<canvas class="mask" id="loadingProgress" width="204" height="204"></canvas>' +
				            '<canvas class="bg" width="204" height="204"></canvas>' +
				        '</div>' +
				        '<h3>正在加载地图...</h3>' +
				    '</div>' +
				'</div>' +
			'</div>' +
			'<div id="hzMap" style="display:none;">' +
				'<div class="map-cross x"></div>' +
				'<div class="map-cross y"></div>' +
				'<div class="map-console"><div><ul class="contents"></ul></div></div>' +
		  	'</div>'
		);


		/*
		 * 初始化地图
		 */
		hzMap.initMap('hzMap', {
			isDebug: true,
			shadowFilter: function (mesh) {
				mesh.castShadow = mesh.name.indexOf('_dm_') < 0;
				mesh.receiveShadow = true;
			},
			pathFindingURL: pathFindingURL,
			onInit: function () {
				queryDefaultView();
				queryBaseFileName();
			}
		});
	} catch (e) {
		console.error(e);
	}
});