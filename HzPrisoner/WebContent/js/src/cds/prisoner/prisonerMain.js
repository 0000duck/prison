/**
 * 
 */
define(function (require) {
	var mapHandle = require('hz/map/map.handle'),
		hzEvent = require('frm/hz.event'),
		user = require('frm/loginUser'),
		drag = require('frm/hz.drag'),
		dialog = require('frm/dialog'),
		db = require('frm/hz.db'),
		ls = require('frm/localStorage');

	var mapHeadTitle = require('hz/map/tools/map.headtitle');

	var mapPrisoner = null;
	var labelObjs = [];
	var prisonerPositions = {};
	var prisonerCountLabels = [];

	var todayCountNodeHtml = '<div class="tc-node"><span class="tc-title"></span><span class="tc-num"></span><span class="tc-unit">人</span></div><div class="tc-split"></div>';
	var todayCountData = [];
	var jqNodeMap = {};
	var enabledTodayCount = true;

	/*
	 * 添加标注
	 */
	function addLabel (node, bind) {
		if (mapHandle && node.position) {
			mapHandle.addLabelPoint({
				id: node.id,
				text: node.text,
				image: node.image || (basePath + 'css/images/location.png'),
				className: node.className || '',
				minDis: node.minDis || 0,
				maxDis: node.maxDis || 10000,
				position: node.position
			}, bind, function (labelObj) {
				//labelObjs.push(labelObj);
			});
		}
	}


	/*
	 * 统计人员
	 */
	function countPrisoner (viewId, loadNo) {
		var array = [];

		while(prisonerCountLabels.length) {
			mapHandle.hzThree.removeLabelById(prisonerCountLabels.shift());
		}


		var viewMenu = mapHandle.mViewMenu[viewId];
		if (viewMenu && viewMenu.area_id) {
			db.query({
				request: {
					sqlId: 'select_count_prisoner_by_area_rfid_for_map',
					params: [user.cusNumber, viewMenu.area_id]
				},
				success: function (result) {
					var temp;
					for(var i = 0; i < result.length; i++) {
						temp = result[i];
						array.push({id:temp.rfid_id, text: temp.count + '人'});
					}

					hzEvent.call('hz.building.prisoner.count', array);
				},
				error: function (code, msg) {
					console.error('查询统计区域当前罪犯异常：' + code + ':' + msg);
				}
			})
		}
	}


	/*
	 * 清除统计
	 */
	function clearPrisonerPanel () {
		mapPrisoner && mapPrisoner.clear();
	}


	/*
	 * 加载罪犯信息面板
	 * @param loadNo	加载编号
	 * @param viewId	视角菜单
	 */
	function loadPrisonerPanel (loadNo, viewId) {
		try {
			var self = this;

			requirejs(['hz/map/mapPoint/map.prisoner'], function (MapPrisoner) {
				var temp, panel;

				mapPrisoner = mapPrisoner || new MapPrisoner();
				mapPrisoner.clear();

				db.query({
					request: {
						sqlId: 'select_prisoner_panel_for_map_handle',
						whereId: 0,
						params: [user.cusNumber, viewId]
					},
					success: function (result) {
						if (mapHandle._loadNo == loadNo) {
							for(var i = 0; i < result.length; i++) {
								temp = result[i];
								mapPrisoner.add({
									'id': temp.point_id,
									'code': temp.prsnr_code,
									'name': temp.prsnr_name,
									'image': temp.photo_path || (basePath + 'css/image/zfpic.jpg'),
									'position': {'x': temp.pos_x, 'y': temp.pos_y, 'z': temp.pos_z}
								}, function (infoPanel) {
									infoPanel.on('click', function (event) {
										var target = event.target || {};
										var data = target.data;
										hzEvent.emit('map.infopanel.click', data, target);
									});
								});
							}
						}
					}
				});
			});
		} catch (e) {
			console.warn(e);
		}
	}


	/*
	 * 初始化当日统计面板
	 */
	function initTodayCountPanel () {
		var mapConfig = mapHandle.mapConfig;
		if (mapConfig) {
			// 添加到配置面板
			mapConfig.add('PRISONER001', '显示当日统计', function (id, checked) {
				visibleTodayCount(checked);
			}, enabledTodayCount);

			if (mapConfig.getConfig('PRISONER001')){
				visibleTodayCount(true);
			}
		} else {
			setTimeout(initTodayCountPanel, 100);
		}
	}


	/*
	 * 显示隐藏统计
	 */
	function visibleTodayCount (v) {
		if (enabledTodayCount = v) {
			loadTodayCount();
		}

		for(var key in jqNodeMap) {
			jqNodeMap[key].toggle(v);
		}
		mapHeadTitle.visible();
	}


	/*
	 * 加载当日统计
	 */
	function loadTodayCount () {
		db.query({
			request: {
				sqlId: 'query_count_today_prisoner',
				params: {cusNumber: user.cusNumber}
			},
			success: function (list) {
				if (!list || !list.length) return;

				for(var i = 0; i < list.length; i++) {
					var data = list[i];
					var id = data.id;

					if (jqNodeMap[id]) {
						jqNodeMap[id].find('span.mht-num').html(data.count);
						todayCountData[id] = data;
					} else {
						var jqNode = mapHeadTitle.add({id:id, html: data.title + '<span class="mht-num" data-id="' + id + '">' + data.count + '</span>人', index:i});
						if (jqNode) {
							todayCountData[id] = data;
							jqNodeMap[id] = jqNode;
							jqNode.find('span.mht-num').on('click', function () {
								var data = todayCountData[$(this).attr('data-id')];
								sessionStorage.setItem("cdm-prisoner-flag",data.id);
								dialog.open({
									id:'cdm-rfid-prisoner',
									type:2,
									title:'学员信息查询',
									url:'page/cds/prisoner/prisonerInfo.html'
								});
								console.log(data);
								// TODO: 
							});
						}
					}
				}
			}
		});
	}





	try {
		// 添加RFID相关样式
		$(window.top.document.head).append('<link rel="stylesheet" href="css/cds/prisoner/prisoner.main.css" charset="utf-8">');

		/*
		 * 统计罪犯
		 */
		hzEvent.on('hz.building.prisoner.count', function (list, bind) {
			var node;
			for(var i = 0; i < list.length; i++) {
				node = JSON.parse(JSON.stringify(list[i]));
				node.position = prisonerPositions[node.id];
				node.id = 'prisoner_count_label_' + node.id
				node.className = 'prisoner-count';
				node.image = node.image || (basePath + 'css/images/peoples_red.png');
				node.minDis = 10;
				node.maxDis = 8000;
				prisonerCountLabels.push(node.id);
				addLabel(node, bind);
			}
		});

		hzEvent.subs('hz.location.data.onclear', function (mapHandle) {
			clearPrisonerPanel();
			countPrisoner();
		});


		hzEvent.subs('hz.location.data.onload', function (mapHandle, loadNo, viewId) {
			loadPrisonerPanel(loadNo, viewId);
			countPrisoner(viewId, loadNo);
		});

		initTodayCountPanel();
	} catch (e) {
		console.error(e);
	}
});