/**
 * 
 */
define(function (require) {
	var mapHandle = require('hz/map/map.handle');
	var message = require('frm/message');
	var hzEvent = require('frm/hz.event');
	var login = require('frm/loginUser');
	var db = require('frm/hz.db');
	var dialog = require('frm/dialog');

	var detailHtml = '<div class="label-detail" oncontextmenu="return false;"><ul></ul></div>';
	var countLabelHtml = '<div class="label-html" title="{1}"><div class="count-name">{2}</div><span class="count-now">当前区域<span class="number">{3}</span>人</span></div>';
	var countLabelTimerId = null;		// 统计标注定时取消效果的定时器编号

	var plusHtml = '<span class="label-num plus">+1</span>';
	var minusHtml = '<span class="label-num minus">-1</span>';

	var hasLoadingLabels = true;	// 是否正在加载人员分布点位

	var linkType = 15;				// 关联类型：15是RFID设备
	var movingManager = null;		// 移动管理对象
	var movingClass = 'moving';		// 移动对象的样式
	var movingWaitPools = {};		// 移动等待处理池
	var movingObjs = {};			// 当前正在移动的对象
	var moveObj = null;	

	var curWayObj = null;		// 当前的网格
	var viewMenu = {};			// 当前视角
	var rfidList = [];			// 当前视角下的RFID点位数据
	var randomDistMap = {};		// RFID编号 与 随机分布对象映射关系数据
	var labelObjMap = {};		// 添加的标注点位的对象
	var labelDataMap = {};		// 查询的标注点位的原信息{"id": "点位编号", "rid": "RFID编号", "text": "点位名称", "title": "标题", "image": "显示的图标", "position": "显示的位置"}
	var labelDetailMap = {};	// RFID人员标注的详情信息映射关系数据
	var locationPeopleId;		// 定位的人员编号

	var rfidRoomMap = {};		// RFID对应房间
	var roomRfidMap = {};		// 房间对应显示的RFID
	var countLabelObjMap = {};	// 统计标注对象
	var timerIdMap = {};		// 在未启用动态流动时，人员流动需要显示一下名字已起到提醒作用（表示该人员移动了得效果），1秒之后关闭效果，这里存放的是关闭的定时器任务ID

	var enabledScatter = true;		// 启用RFID人员分布功能
	var enabledShowName = false;	// 显示RFID人员名称
	var enabledDynamicFlow = true;	// 启用RFID人员动态流动跟踪
	var enabledCount = false;		// 启用RFID人员统计

	var POLICE_ICON = basePath + 'css/images/pos_plc_1.png';
	var PRISONER_ICON = basePath + 'css/images/pos_psr_1.png';
	var PRISONER_ICONS = {
		'0': PRISONER_ICON,
		'1': basePath + 'css/images/pos_psr_3.png'	
	}




	/*
	 * 初始化对象属性
	 */
	function initProperty (object) {
		object.range = 100;
		object.xFlag = 1;
		object.zFlag = 1;
		object.number = 0;

		object.groupArray = [[],[],[],[]];
		object.groupIndex = 0;
		object.group = null;
		object.childrenData = [];
	}




	/*
	 * 随机分布对象
	 * @param rfid = {
	 * 		"id": "",
	 * 		"position": ""
	 * }
	 */
	function RandomDist (rfid) {
		this.rfid = rfid;

		initProperty(this);

		if (!moveObj) {
			moveObj = mapHandle.hzThree.createSphere(2, 0x00FFFF, {x:0,y:0,z:0});
			moveObj.visible = false;
		}
	}


	/*
	 * 添加一个随机点
	 * @param data = {
	 * 		"id": "人员编号",
	 * 		"rid": "RFID编号",
	 * 		"text": "人员名称",
	 * 		"title": "显示TITLE",
	 * 		"image": "显示的图标"
	 * }
	 */
	RandomDist.prototype.pushToMap = function (child, callback) {
		if (!enabledScatter) return;

		var group = this.groupArray[this.groupIndex++];
		var pos = this.rfid.position;
		var rid = this.rfid.id;
		var thiz = this;

		var maxTimes = 70, space = 20, x = 0, z = 0;
		var randomPos, childPos;

		if (this.groupIndex > 3) {
			this.groupIndex = 0;
		}

		/*
		 * 生成随机数
		 */
		function random (times, callback) {
			if (times-- > 0) {
				x = RandomNumBoth(10, thiz.range) * thiz.xFlag;
				z = RandomNumBoth(10, thiz.range) * thiz.zFlag;

				var success = true;
				for(var i = 0, I = group.length; i < I; i++) {
					if (Math.abs(group[i].x - x) < space || Math.abs(group[i].z - z) < space) {
						success = false; break;
					}
				}

				if (success) {
					childPos = {'x': pos.x + x, 'y': pos.y, 'z': pos.z + z};
					randomPos = {'x':x, 'z':z};

					// 判断点是否在寻路网格上
					if (curWayObj) {
						curWayObj.isInPoly(childPos, function (position) {
							if (position) {
								callback(randomPos, position);
							} else {
								random(times, callback);
							}
						});
					} else {
						callback(randomPos, childPos);
					}
				} else {
					random(times, callback);
				}
			} else {
				// 在某个间距之内没有随机到坐标则缩小间距再随机生成
				if (space > 0) {
					space -= 5;
					random(maxTimes, callback);
				} else {
					console.log('random over...');
				}
			}
		}

		// 开始产生随机坐标
		random(maxTimes, function (randomPos, childPos) {
			if (!enabledScatter) return;

			child.position = childPos;
			group.push(randomPos);

			// 更新相关的数据
			thiz.number++;
			if (thiz.number % 2 == 0) {
				thiz.xFlag *= -1;
			} else {
				thiz.zFlag *= -1;
			}

			// 获取上一次的信息
			var lastInfo = labelDataMap[child.id] || {};
			if (lastInfo) {
				var lastRoomId = rfidRoomMap[lastInfo.rid] || lastInfo.rid;
				var nowRoomId = rfidRoomMap[child.rid] || child.rid;

				if (randomDistMap[lastInfo.rid]) {
					randomDistMap[lastInfo.rid].removeChild(child.id);
					if (lastRoomId != nowRoomId) {
						updateCountLabel(lastInfo);
					}
				} else {
					lastInfo = null;
				}
			}

			if (child.position) {
				// 记录添加的数据并添加一个标注点
				thiz.removeChild(child.id);
				thiz.addChild(child);

				labelDataMap[child.id] = child;

				var labelObj = labelObjMap[child.id];
				if (labelObj) {
					createMoving(labelObj, moveObj.clone(), labelObj.position, child.position);
				} else {
					addLabelPoint(child, lastInfo);
				}
			}
			callback();
		});
	}


	/*
	 * 添加子类
	 * @param child 子类的编号
	 */
	RandomDist.prototype.addChild = function (child) {
		this.childrenData.push(child);
	}


	/*
	 * 删除所有子类
	 */
	RandomDist.prototype.removeAllChild = function () {
		var cid = null;
		while(this.childrenData.length) {
			cid = this.childrenData.shift().id;
			removeLabelPoint(cid);
			delete labelObjMap[cid];
			delete movingObjs[cid];
			delete movingWaitPools[cid];
		}

		initProperty(this);
	};


	/*
	 * 删除子类
	 * @param cid 子类的编号
	 */
	RandomDist.prototype.removeChild = function (cid) {
		for(var i = 0; i < this.childrenData.length; i++) {
			if (this.childrenData[i].id == cid) {
				return this.childrenData.splice(i, 1);
			}
		}
	};


	/*
	 * 添加标注点位
	 * @params params = {
	 * 		"id": "点位编号",
	 * 		"rid": "RFID编号",
	 * 		"text": "点位名称",
	 * 		"title": "标题",
	 * 		"image": "显示的图标",
	 * 		"position": "显示的位置"
	 * }
	 * @params pos	点位坐标
	 */
	function addLabelPoint (params, lastInfo) {
		if (!enabledScatter) return;
		mapHandle.label.add({
			id: params.id,
			text: params.text || '',
			showText: enabledShowName,
			title: params.title,
			image: params.image,
			className: 'label-rfid',
			minDis: 10,
			maxDis: 50000,
			position: params.position
		}, {
			'click': function (event) {
				var labelData = labelDataMap[event.data.id];
				if (labelData) {
					queryAndLinkageDvc(labelData.rid);
				}
			},
			'dblclick': function (event) {
//				var labelData = labelDataMap[event.data.id];
//				if (labelData) {
//					hzEvent.emit('map.infopanel.click', {'code': labelData.id});	// 打开人员详情
//				}
			},
			'mouseenter': function () {
				var offset = $(this).offset();
				var width = $(this).width();
				var height = $(this).height();

				// 显示hover效果并显示详情
				showMovingCss(labelObjMap[this.id]);
				showPeopleDetail(labelDetailMap[this.id], {
					top: offset.top + height + 2,
					left: offset.left + width / 2 + 2
				});
			},
			'mouseleave': function () {
				hideMovingCss(labelObjMap[this.id]);
				hidePeopleDetail();
			}
		}, function (obj) {
			/*
			 * 因为异步的问题会导致如果切换视角过快，上一个视角的数据不会被及时清除掉，所以这里需要判断下
			 * 模型加载完成之后还是否在上一次的数据中，不在则删除该模型
			 */
			var id = params.id;
			if (labelDataMap[id]) {
				labelObjMap[id] = obj;

				// 突出显示定位人员信息
				if (locationPeopleId == id) {
					locationPeopleId = null;
					showMovingCss(obj);
				}

				if (lastInfo) {
					createMoving(obj, moveObj.clone(), lastInfo.position, obj.position);
				} else {
					updateCountLabel(labelDataMap[id]);
				}
			} else {
				removeLabelPoint(id);
			}
		});
	};


	/*
	 * 删除标注点位对象
	 * @param id 标注编号
	 */
	function removeLabelPoint (id) {
		delete labelDataMap[id];
		delete labelDetailMap[id];
		mapHandle.label.remove(id);
		movingManager.deleteMoving(id);
		$('#'+id).remove();
	}


	/*
	 * 图片HOVER 效果
	 * @param obj dom对象
	 * @param hover 是否hover
	 */
	function imgHover (obj, hover) {
		if (!$(obj).hasClass(movingClass)) {
			var $img = $(obj).find('img');
			if ($img.length > 0) {
				$img.css('background', hover ? ('url(' + $img.attr('src').replace('.png', '_h.png') + ') center center no-repeat') : '');
			}
		}
	}


	/*
	 * 随机取一个范围的值
	 */
	function RandomNumBoth (min, max) {
	      return min + Math.round(Math.random() * (max - min)); //四舍五入
	}



	/*
	 * 创建移动
	 * @param child		子类对象
	 * @param moveObj	移动的对象
	 * @param beginPos	开始坐标
	 * @param endPos	结束坐标
	 */
	function createMoving (child, moveObj, beginPos, endPos) {
		if (!curWayObj) {
			updatePointPos(child, endPos);
			printLog('该区域未配置寻路路径，无法自动寻路!');
			return;
		}

		// 在未启用动态流动时，人员流动需要显示一下名字已起到提醒作用（表示该人员移动了得效果），1秒之后关闭效果，这里存放的是关闭的定时器任务ID
		// 再下一个流动消息过来后关闭上一次还未执行的定时任务
		var id = child.div.id;
		if (timerIdMap[id]) {
			clearTimeout(timerIdMap[id]);
			delete timerIdMap[id];
		}

		// 查找线路
		curWayObj.findPath(beginPos, endPos, function (meshName, points) {
			if (enabledDynamicFlow && points) {
				child.endPos = endPos;
				showMovingCss(child);

				movingManager.createMoving({
			         targetId: child.div.id,
			         target: moveObj,
			         data: child,
			         path: points,
			         showPath: false,
			         speed: 20,
			         lineColor:0x0000ff
				});
			} else {
				// 再未启用实时流动效果时，让名字显示一秒后关闭，以便提醒用户该人员流动了
				updatePointPos(child, endPos);
				showMovingCss(child);
				stopMoving(child, child.div.id);
			}
		});
	}


	/*
	 * 显示移动样式
	 */
	function showMovingCss (child) {
		if (child) {
			child.showText(true);
			imgHover(child.div, true);
			$(child.div).removeClass(movingClass).addClass(movingClass);			
		}
	}


	/*
	 * 隐藏移动样式
	 */
	function hideMovingCss (child) {
		if (child) {
			$(child.div).removeClass(movingClass);
			imgHover(child.div, false);
			child.showText(enabledShowName);
		}
	}


	/*
	 * 停止移动
	 */
	function stopMoving (child, tid) {
		// 停止移动1秒后再隐藏效果（隐藏名字）
		timerIdMap[tid] = setTimeout(function (child, id) {
			hideMovingCss(child);
			delete timerIdMap[id];
		}, 1000, child, tid);

		delete movingWaitPools[tid];
		delete movingObjs[tid];
	}


	/*
	 * 更新点位坐标
	 */
	function updatePointPos (labelObj, pos3) {
		labelObj.position.x = pos3.x;
		labelObj.position.y = pos3.y;
		labelObj.position.z = pos3.z;
		labelObj.updatePos();
	}


	/*
	 * 查询并联动设备
	 * @param rid RFID编号
	 */
	function queryAndLinkageDvc (rid) {
		// 查询相关的联动监控设备
		db.query({
			request: {
				sqlId: 'select_linkage_dvc_by_rfid',
				whereId: 0,
				params: [login.cusNumber, rid]
			},
			success: function (list) {
				if (list && list.length) {
					var vc = window.top.hz.videoclient;
					if (vc && vc.isInit) {
						var cameras = [];
						for(var i = 0; i < list.length; i++) {
							cameras.push(list[0].cbd_id);
						}
						vc.play(cameras);
					} else {
						message.alert('视频客户端未打开或初始化，无法查看监控视频!');
					}
				} else {
					printLog('未获取到关联的监控设备信息，无法打开监控!');
				}
			},
			error: function (code, msg) {
				printLog('获取当前房间相关设备信息异常：' + code + msg);
			}
		});
	}


	/*
	 * 查询当前监控的人员分布
	 * @params rfidArray = [{
	 * 		"id": "",		// RFID设备的编号
	 * 		"position": {	// RFID设备在地图上的点位坐标
	 * 			x:0,
	 * 			y:0,
	 * 			z:0
	 * 		}]
	 * }
	 */
	function queryPeopleScatter (rfidArray, loadNo) {
		var whereId, params = [login.cusNumber, '', '', linkType, viewMenu.id];

		clearPeopleScatter();

		if (!viewMenu.id) return;	// 无视角菜单不处理
		if (rfidArray.length < 1) return; // 无RFID设备不处理

		if (rfidArray.length == 1) {
			params.push(rfidArray[0].id);
			whereId = 0;
		}

		db.query({
			request: {
				sqlId: 'select_people_scatter_by_rfid',
				whereId: whereId,
				params: params
			},
			success: function (list) {
				if (!enabledScatter) return;
				if (loadNo && mapHandle._loadNo != loadNo) return;

				if (list && list.length) {
					var pushList = [];
					var index = 0;
					var temp = null;

					var lpId = getLocationPeopleId();	// 定位人员的编号
					var lpData = null;					// 定位人员的数据

					for(var i = 0; i < list.length; i++) {
						for(var x = 0; x < rfidArray.length; x++) {
							if (rfidArray[x].id == list[i].rfid_id) {
								temp = [rfidArray[x], list[i]];

								if (list[i].people_id != lpId) {
									pushList.push(temp);
								} else {
									lpData = temp;
								}
							}
						}
					}

					// 如果有数据则放在第一个（其目的是为了能最快的去定位该人员）
					lpData && pushList.unshift(lpData);
					hasLoadingLabels = true;

					(function forList () {
						if (!enabledScatter) return;
						if (loadNo && mapHandle._loadNo != loadNo) return;
						if (index == 1) peopleLocation();	// 等第一次添加完之后就开始定位

						if (index < pushList.length) {
							temp = pushList[index++];
							addToMap(temp[0], temp[1], forList);
						} else {
							hasLoadingLabels = false;
						}
					})();
				} else {
					printLog(viewMenu.name + '视角下没有RFID人员分布数据!');
				}
			},
			error: function (code, msg) {
				printLog('查询当前监控的人员分布异常：' + code + '-' + msg);
			}
		});
	}


	/*
	 * 人员定位
	 */
	function peopleLocation () {
		var id = getLocationPeopleId();
		if (id) {
			var data = labelDataMap[id];
			if (data) {
				mapHandle.flyToLookAt(data.position, 400, data.position.y + 550, 1000);
				queryAndLinkageDvc(data.rid);
				showMovingCss(labelObjMap[id]);

				// 定位完成之后删除临时数据
				delete window.top._tempData;
			}
		}
	}


	/*
	 * 获取定位人员的编号
	 */
	function getLocationPeopleId () {
		return locationPeopleId = window.top._tempData;
	}


	/*
	 * 清除RFID人员分布点位
	 */
	function clearPeopleScatter () {
		for(var key in randomDistMap) {
			randomDistMap[key].removeAllChild();
		}
	}



	/*
	 * 查询当前监控人员信息
	 * @param rfidId
	 * @param psrId
	 * @param callback
	 */
	function queryMonitorPeople (rfidId, psrId, callback) {
		db.query({
			request: {
				sqlId: 'select_people_info_by_rfid',
				whereId: 0,
				params: [login.cusNumber, rfidId, psrId]
			},
			success: callback,
			error: function (code, msg) {
				printLog('查询当前监控人员信息异常：' + code + msg);
			}
		});
	}


	/*
	 * 查询人员统计
	 * 
	 */
	function queryPeopleCount (type) {
		if (!viewMenu.id) return;

		clearCountLabel();

		db.query({
			request: {
				sqlId: 'select_count_people_by_rfid',
				whereId: 0,
				params: [login.cusNumber, type, type, linkType, viewMenu.id]
			},
			success: function (list) {
				if (list && list.length) {
					if (!enabledCount) return;

					var fmtMap = {};

					/*
					 * 整理并格式化数据，相同房间的RFID归并为一个统计显示
					 */
					for(var i = 0; i < list.length; i++) {
						var rfidId = list[i].rfid_id;
						var roomId = list[i].room_id;

						if (roomId) {
							if (roomRfidMap[roomId]) {
								fmtMap[roomRfidMap[roomId]].count += list[i].count;
							} else {
								fmtMap[rfidId] = list[i];
								roomRfidMap[roomId] = rfidId;
							}
							rfidRoomMap[rfidId] = roomId;
						} else {
							fmtMap[rfidId] = list[i];
						}
					}

					for(var key in fmtMap) {
						var temp = fmtMap[key];
						if (temp.pos_x && temp.pos_y && temp.pos_z) {
							var text = temp.rfid_name;
							var splits = [];

							if (temp.room_id) {
								splits = temp.room_id.split('_');
								text = splits[splits.length - 2] + '室';
							}

							fmtAddCountLabel({
								'id': temp.rfid_id,
								'text': text,
								'count': temp.count,
								'position': {
									'x': temp.pos_x,
									'y': temp.pos_y,
									'z': temp.pos_z
								}
							})
						}
					}
				} else {
					printLog(viewMenu.name + '视角下没有RFID人员统计数据!');
				}
			},
			error: function (code, msg) {
				printLog('查询人员统计信息异常：' + code + msg);
			}
		});
	}


	/*
	 * 清楚统计标注点位
	 */
	function clearCountLabel () {
		for(var key in countLabelObjMap) {
			mapHandle.label.remove(key);
		}
		rfidRoomMap = {};	// RFID对应房间
		roomRfidMap = {};	// 房间对应显示的RFID
		countLabelObjMap = {};
	}



	/*
	 * 获取RFID设备人员分布数量
	 */
	function getRfidDistCount (rid) {
		var rd = randomDistMap[rid];
		return rd ? rd.childrenData.length : 0;
	}


	/*
	 * 更新统计数据
	 * @param data = {"rid": "RFID编号", "rname": "RFID名称"}
	 */
	function updateCountLabel (data, rid) {
		var count = 0;

		// 找到RFID绑定的房间号再找到这个房间用户显示统计的RFID编号
		var roomId = rfidRoomMap[data.rid];
		if (roomId) {
			rid = roomRfidMap[roomId];
			for (var key in rfidRoomMap) {
				if (roomId == rfidRoomMap[key]) {
					count += getRfidDistCount(key);
				}
			}
		} else {
			rid = data.rid;
			count = getRfidDistCount(rid);
		}

		// 通过RFID编号找到统计的对象
		var countObj = countLabelObjMap[rid];
		if (countObj) {
			countObj.setVisible(count ? true : false);

			var $num = $(countObj.div).find('span.count-now >span.number');
			if ($num.length) {
				var num = $num.html() * 1;

				if (count != num) {
					// 显示 +1 / -1 的效果
					(count > num ? $(plusHtml) : $(minusHtml))
						.appendTo($(countObj.div).removeClass('update').addClass('update'))
							.animate({top:3, opacity: 0.3}, 1000, function () {
								$(this).parent().removeClass('update');
								$(this).remove();
							});

					$num.html(count);
				}
			}
		} else {
			// 如果是没有统计面板的情况下，新增一个
			if (count > 0) {
				var rfidModel = getRfidPointObj(rid);
				if (rfidModel) {

					try {
						// 获取房间BOX
						var roomBoxObj = mapHandle.hzThree.getRoomBox(rfidModel.position, 1);
						if (roomBoxObj) {
							roomId = roomBoxObj.name;
							rfidRoomMap[rid] = roomId;		// 记录RFID和房间的映射关系

							// 如果房间BOX已经有了统计面板，则重新调用更新
							if (roomRfidMap[roomId]) {
								updateCountLabel(data); 
								return;
							} else {
								roomRfidMap[roomId] = rid;	// 记录房间和RFID的映射关系
							}
						}
					} catch (e) {
						console.error(e);
					}

					// 新增一个统计面板
					fmtAddCountLabel({
						id: data.rid,
						text: data.rname,
						count: count,
						position: rfidModel.position.clone()
					});
				}
			}
		}
	}


	/*
	 * 格式化并添加统计标注
	 * @param data = {"id":"标注编号", "text": "显示文本", "count":"统计数量", "position":{x:0, y:0, z:0}}
	 */
	function fmtAddCountLabel (data) {
		var html = countLabelHtml.replace('{1}', '区域：' + data.text + '\n提示：点击人数可以查看详情')

		html = html.replace('{2}', data.text)
		html = html.replace('{3}', data.count);

		addCountLabel({
			'id': data.id,
			'html': html,
			'position': data.position
		});
	}


	/*
	 * 添加统计标注
	 * @param params = {"id":"标注编号", "html": "显示HMTL内容", "position":{x:0, y:0, z:0}}
	 */
	function addCountLabel (params) {
		if (!enabledCount) return;
		mapHandle.label.add({
			id: params.id,
			html: params.html,
			minDis: 10,
			maxDis: 100000,
			lineHeight: 80,
			className: 'label-count',
			position: params.position
		}, {
			'click': function (event) {
				// printLog('暂时无法查看人员详情!');
			},
			'mouseenter': function (event) {
				countLabelTimerId && clearTimeout(countLabelTimerId);
				countLabelTimerId = null;

				$('div.label-html').addClass('opacity');
				$(this).find('div.label-html').removeClass('opacity');
			},
			'mouseleave': function (event) {
				countLabelTimerId = setTimeout(function () {
					$('div.label-html').removeClass('opacity');
				}, 1000);
			}
		}, function (obj) {
			countLabelObjMap[params.id] = obj;

			$(obj.div).find('span.count-now').on({
				'click': function () {
					sessionStorage.setItem("cdm-rfid-id",params.id);
					dialog.open({
						id:'cdm-rfid-prisoner',
						type:2,
						title:'学员信息查询',
						url:'page/cds/prisoner/prisonerInfo.html'
					});
					//printLog('暂时无法查看人员统计详情!');
				}
			});
		});
	}


	/*
	 * 将点位标注到地图上
	 * @param rfid	RFID基站设备信息{"id":"", "position":{x:0,y:0,z:0}}
	 * @param child	RFID监控的人员信息
	 */
	function addToMap (rfid, child, callback) {
		var cid = child.people_id;
		var rid = rfid.id;
		var list = [];
		var title = null,
			icon = null;

		var lastDetail = labelDetailMap[cid];

		if (child.people_type == 1) {
			icon = POLICE_ICON;
			list.push('民警姓名：' + child.people_name);
		} else {
			icon = PRISONER_ICONS[child.type_indc] || PRISONER_ICON;
			list.push('学员姓名：' + child.people_name);
			list.push('学员编号：' + child.prnsr_code);
			list.push('RFID编号：' + child.prnsr_code);
			list.push('学员类型：' + child.type_indc_cn);
			list.push('分管等级：' + child.sprt_mnge_cn);
		}

		list.push('所属部门：' + child.dept_name);
		list.push('监控时间：' + child.monitor_time);
		list.push('监控位置：' + child.rfid_name);

		// 上一次位置
		if (lastDetail) {
			list.push(lastDetail[lastDetail.length - 2].replace('监控位置', '上次位置'));
		} else {
			list.push('上次位置：' + child.before_rfid_name);
		}

		if (randomDistMap[rid] == undefined) {
			randomDistMap[rid] = new RandomDist(rfid);
		}

		labelDetailMap[cid] = list;
		randomDistMap[rid].pushToMap({
			'id': cid,
			'text': child.people_name,
			'title': title,
			'image': icon,
			'rid': child.rfid_id,
			'rname': child.rfid_name,
		}, callback);
	}



	/*
	 * 注册监听消息
	 */
	function onWebMessage () {
		var wm = window.top.webmessage;
		if (wm) {
			wm.on('RFID001', 'rfid.main', function (data) {
				if (!enabledScatter) return;
				if (hasLoadingLabels) return;

				try {
					var msg = JSON.parse(data.msg);
					var monitorInfo = msg.rfidInfo || {};
					var peopleId = monitorInfo.peopleId;

					// 正在移动的对象将数据存放到移动池
					if (labelObjMap[peopleId] && movingObjs[peopleId]) {
						if (!movingWaitPools[peopleId]) {
							movingWaitPools[peopleId] = [];
						}
						movingWaitPools[peopleId].push(monitorInfo);
					} else {
						startMoving(monitorInfo);
					}
				} catch (e) {
					console.error('接收到RFID人员监测消息，处理异常：', e);
					printLog('接收到RFID人员监测消息，处理异常' + e.message);
				}
			});
		} else {
			setTimeout(onWebMessage, 100);
		}
	}


	/*
	 * 开始启动移动
	 * @param data 移动相关数据
	 */
	function startMoving (data) {
		try {
			var rfidId = data.rfid;
			var rfidModel = getRfidPointObj(rfidId);

			if (rfidModel) {
				queryMonitorPeople(data.rfid, data.peopleId, function (list) {
					if (!enabledScatter) return;
					if (list && list.length) {
						var rfid_id = list[0].rfid_id;
						if (rfidId == rfid_id) {
							addToMap({
								'id': rfidId,
								'position': {
									'x': rfidModel.position.x,
									'y': rfidModel.position.y,
									'z': rfidModel.position.z
								}
							}, list[0], function () {});
						} else {
							console.warn('查询结果的RFID设备编号和查询的RFID设备编号不一致[', rfidId, rfid_id, ']');
							printLog('查询结果的RFID设备编号和查询的RFID设备编号不一致');
						}
					} else {
						console.warn('没有查询到RFID监测的相关人员信息：', data);
						printLog('没有查询到RFID监测的相关人员信息');
					}
				});
			}
		} catch (e) {
			console.error('启动RFID人员定位移动失败：', e);
			message.alert('启动RFID人员定位移动失败：' + e.message);
		}
	}


	/*
	 * 获取RFID基站的模型点位对象
	 */
	function getRfidPointObj (id) {
		return mapHandle.getModelPointByLinkId(linkType, id);
	}



	/*
	 * 初始化地图配置节点
	 */
	function initMapConfig () {
		var mapConfig = mapHandle.mapConfig;
		if (mapConfig) {
			mapConfig.add('RFID001', 'RFID人员分布', function (id, checked) {
				enabledScatter = checked;

				if (enabledScatter) {
					queryPeopleScatter(rfidList);
				} else {
					clearPeopleScatter();
				}
			}, enabledScatter);

			mapConfig.add('RFID002', '显示分布人员姓名', function (id, checked) {
				enabledShowName = checked;
				for(var key in labelObjMap) {
					labelObjMap[key].showText(checked);
				}
			}, enabledShowName);

			mapConfig.add('RFID003', 'RFID人员动态轨迹', function (id, checked) {
				enabledDynamicFlow = checked;
			}, enabledDynamicFlow);

			mapConfig.add('RFID004', 'RFID人员分布统计', function (id, checked) {
				enabledCount = checked;
				if (enabledCount) {
					queryPeopleCount();
				} else {
					clearCountLabel();
				}
			}, enabledCount);
		}
	}


	/*
	 * 初始化移动事件
	 */
	function initMovingEvent () {
		movingManager = mapHandle.hzThree.movingManager;
		if (movingManager) {
			movingManager.on('moving_3d_update', function (data) {
				try {
					var child = data.data.data;
					var tid = data.data.tid;

					if (enabledDynamicFlow) {
						if (movingObjs[tid] != true) {
							movingObjs[tid] = true
						}
						updatePointPos(child, data.data.pos3);
					} else {
						movingManager.deleteMoving(tid);
						updatePointPos(child, child.endPos);
						updateCountLabel(labelDataMap[tid]);
						stopMoving(child, tid);
					}
				} catch (e) {
					console.error('RFID移动定位时异常：', e);
					printLog('RFID移动定位时异常：' + e.message);
				}
			});

			movingManager.on('moving_stop', function (data) {
				try {
					var tid = data.data.tid;
					var pools = movingWaitPools[tid] || [];

					updateCountLabel(labelDataMap[tid]);

					// 如果移动池有数据则继续移动
					if (pools.length > 0) {
						startMoving(pools.shift());
					} else {
						stopMoving(data.data.data, tid);
					}
				} catch (e) {
					console.error('RFID移动定位停止时异常：', e);
					printLog('RFID移动定位停止时异常：' + e.message);
				}
			});


			/*
			 * 显示标注
			 */
			function visibleLabel (visible) {
				for(var key in labelObjMap) {
					labelObjMap[key].setVisible(visible);
				}
				for(var key in countLabelObjMap) {
					countLabelObjMap[key].setVisible(visible);
				}
			}

			var hasCtrlKey = false;
			// 检测键盘的CTRL按键，按下之后隐藏人员分布标注和统计标注
			window.top.addEventListener('keydown', function (event) {
				if (event.ctrlKey) {
					if (!hasCtrlKey) {
						hasCtrlKey = true;
						visibleLabel(false);
					}
				}
			});

			// 检测键盘的CTRL按键，按下之后显示人员分布标注和统计标注
			window.top.addEventListener('keyup', function (event) {
				if (hasCtrlKey) {
					hasCtrlKey = false;
					visibleLabel(true);
				}
			});

			$('#'+mapHandle.mapId).append(detailHtml);
		} else {
			setTimeout(initMovingEvent, 100);
		}
	}


	/*
	 * 显示RFID人员详情
	 */
	function showPeopleDetail (list, pos) {
		var $ul = $('div.label-detail >ul');
		if ($ul.length) {
			$ul.empty();

			for(var i = 0; i < list.length; i++) {
				$ul.append('<li>' + list[i] + '</li>');
			}

			$ul.parent().css({top:pos.top, left:pos.left}).show();
		}
	}

	/*
	 * 隐藏RFID人员详情
	 */
	function hidePeopleDetail () {
		$('div.label-detail').hide();
	}


	/*
	 * 打印日志消息
	 */
	function printLog (text) {
		// message.alert(text);
		mapHandle.console(text);
	}


	try {
		// 添加RFID相关样式
		$(window.top.document.head).append('<link rel="stylesheet" href="css/cds/rfid/rfid.main.css" charset="utf-8">');


		/*
		 * 监听地图加载模型点位的事件
		 */
		hzEvent.subs('hz.modelpoint.onload', function (hzMap, loadNo, viewId, data) {
			if (hzMap._loadNo == loadNo && viewMenu.id != mapHandle.cusViewMenu.id) {
				curWayObj = mapHandle.Wayfinding.findWay(viewId);
				viewMenu = mapHandle.cusViewMenu;
				rfidList = [];

				for(var i = 0; i < data.length; i++) {
					var info = data[i];

					if (info.mpi_link_type == linkType) {
						rfidList.push({
							'id': info.mpi_link_id,
							'position': {
								'x': parseFloat(info.mpi_pos_x),
								'y': parseFloat(info.mpi_pos_y),
								'z': parseFloat(info.mpi_pos_z)
							}
						});
					}
				}

				if (enabledScatter) {
					queryPeopleScatter(rfidList, loadNo);
				}

				if (enabledCount) {
					queryPeopleCount();
				}
			}
		});


		/*
		 * 监听楼层分离事件
		 */
		hzEvent.subs('hz.building.floor.separate', 'rfid.main', function (buildView, floorView) {
			for(var key in labelObjMap) {
				labelObjMap[key].setVisible(false);
			}
			for(var key in countLabelObjMap) {
				countLabelObjMap[key].setVisible(false);
			}
		});


		/*
		 * 监听建筑模型隐藏事件
		 */
		hzEvent.subs('hzmap.visible.floor', 'rfid.main', function (modelName, visible) {
			for(var key in labelObjMap) {
				labelObjMap[key].setVisible(visible);
			}
			for(var key in countLabelObjMap) {
				countLabelObjMap[key].setVisible(visible);
			}
		});


		/*
		 * 注册人员定位事件
		 */
		hzEvent.on('rfid.main.people.location', peopleLocation);

		// 消息注册
		onWebMessage();

		// 地图配置菜单
		initMapConfig();
		initMovingEvent();
	} catch (e) {
		console.error(e);
	}
});