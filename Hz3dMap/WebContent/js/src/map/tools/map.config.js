/**
 * 地图数据配置对象
 */
define(function(require) {
	var configHtml = '<div class="map-config"><a class="map-base-bgc map-config-btn" title="地图数据控制显示列表">显示控制</a><ul class="map-config-list map-base-bgc"></ul></div>';
	var labelTypeRoom = 2;


	/*
	 * 依赖模块引入
	 */
	var localStorage = require('frm/localStorage');
	var hzEvent = require('frm/hz.event'),
		db = require('frm/hz.db');


	/*
	 * 保存配置
	 */
	function setConfig (id, checked) {
		localStorage.setItem('MAP_CONFIG_'+ id, checked);
	}


	/*
	 * 获取配置
	 */
	function getConfig (id) {
		var config = localStorage.getItem('MAP_CONFIG_'+ id);
		if (config != undefined) {
			return config == 'true';
		}
	}


	/*
	 * 地图配置对象
	 */
	function MapConfig (parent) {
		this.parent = parent;
		this.configMap = {}; 	// 配置映射对象
		this.hasInit = false;
		this.waitAddList = [];		// 等待初始化的功能
		this.callbackPools = {};	// 各配置的回调事件映射
		this.$ul = null;

		this.init = function () {
			if (this.hasInit == false && parent.mapId) {
				this.hasInit = true;

				var $hzMap = $('#' + parent.mapId);
				var $config = $(configHtml).appendTo($(window.top.document.body));
				var $configBtn = $config.find('.map-config-btn');

				var $ul = this.$ul = $config.find('>ul');
				var isAnimate = true;
					hasHidden = true;

				function hideConfig () {
					var pl = $configBtn.css('padding-left').replace('px', '') * 1;
					var w = $configBtn.outerWidth();
					$config.stop().animate({'right': pl-w-2});
					isAnimate = true;
				}

				hideConfig();

				// 点击地图隐藏配置面板
				$hzMap.on('click', function (event) {
					if ($config.find('>a').hasClass('open')) {
						$config.find('>a').click();
						hideConfig();
					}
				});

				// 点击配置面板时阻止$hzMap的点击事件
				$config.on('click', function () {
					event.stopPropagation();
				});

				// 配置面板的事件注册
				$config.find('>a').on({
					'click': function (event) {
						event.stopPropagation();
						hasHidden = $(this).hasClass('open');
						if (hasHidden) {
							$(this).removeClass('open');
							$ul.hide();
						} else {
							$(this).addClass('open');
							if (isAnimate) {
								isAnimate = false;
								$ul.show();
							} else {
								$ul.show();
							}
						}
					},
					'mouseover': function (event) {
						$config.stop().animate({'right': '0px'});
					},
					'mouseleave': function (event) {
						if (hasHidden) {
							hideConfig();
						}
					}
				});


				this._add('STATS001', '显示运行状态', function (id, checked) {
					parent.mapStats.showPanel(id, checked);
				});

				this._add('CONSOLE001', '显示系统消息', function (id, checked) {
					if (checked) {
						$('div.map-console').fadeIn(500);
					} else {
						$('div.map-console').fadeOut(500);
					}
				});

				this._add('MESH001', '显示寻路网格', function (id, checked) {
					if (parent.cusViewMenu) {
						var wayObj = parent.Wayfinding.findWay(parent.cusViewMenu.id);
						if (wayObj) {
							wayObj.mesh.visible = checked;
						} else {
							checked && parent.console(parent.cusViewMenu.name + '视角下没有寻路网格，无法显示!');
						}
					}
				});

				while(this.waitAddList.length) {
					this._add.apply(this, this.waitAddList.shift());
				}

				console.log('初始化系统功能列表...');
			}		
		};

		this.getConfig = getConfig;
	}


	/*
	 * 添加配置
	 * @param id	配置编号
	 * @param name	配置名称
	 * @param click 点击事件，接受2个参数：id-配置编号, checked-是否已选择true/false
	 * @param checked 是否默认选中：true 是 / false 否
	 */
	MapConfig.prototype.add = function (id, name, click, checked) {
		// 初始化

		if (this.hasInit == false) {
			this.waitAddList.push([id, name, click, checked]);
		} else {
			this._add(id, name, click, checked);
		}
	}


	/*
	 * 添加配置
	 * @param id	配置编号
	 * @param name	配置名称
	 * @param click 点击事件，接受2个参数：id-配置编号, checked-是否已选择true/false
	 * @param checked 是否默认选中：true 是 / false 否
	 */
	MapConfig.prototype._add = function (id, name, click, checked) {
		try {
			var thiz = this;
			if (this.hasInit == true) {
				// 添加节点
				if (this.$ul.find('#' + id).length == 0) {
					this.callbackPools[id] = click;

					var $li = $('<li id="' + id + '">' + name + '</li>').on({
						'click': function () {
							var checked = !$(this).hasClass('checked');
							if (checked) {
								$(this).addClass('checked');
							} else {
								$(this).removeClass('checked');
							}
							setConfig(this.id, checked);
//							click(this.id, checked);
							thiz.callbackPools[this.id](this.id, checked);
						}
					}).appendTo(this.$ul);

					var config = getConfig(id);
					if (config == undefined) {
						if (checked != undefined) {
							$li.addClass(checked ? '': 'checked').click();
						}
					} else {
						$li.addClass(config ? '': 'checked').click();
					}

				} else {
					if (this.$ul.find('#' + id).html() == name) {
						return '配置编号和名称已存在!';
					} else {
						return '配置编号已存在!';
					}
				}
				return '';
			} else {
				return '配置对象还未初始化完成，无法添加!';
			}
		} catch (e) {
			console.error(e);
		}
	}


	/*
	 * 删除节点
	 * @param id 配置编号
	 */
	MapConfig.prototype.remove = function (id) {
		if (this.hasInit) {
			this.$ul.find('#' + id).remove();
		}
	}


	/*
	 * 选择节点
	 * @param id		节点的编号
	 * @param checked	是否选中
	 * @param isEmit	是否触发事件（回调）
	 */
	MapConfig.prototype.checked = function (id, checked, isEmit) {
		var $node = this.$ul.find('#' + id);
		if ($node.length) {
			if (checked) {
				$node.addClass('checked');
			} else {
				$node.removeClass('checked');
			}

			if (isEmit) {
				setConfig(id, checked);
				this.callbackPools[id](id, checked);
			}
		}
	}


	return MapConfig;
})