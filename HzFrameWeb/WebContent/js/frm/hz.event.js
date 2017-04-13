/*
 * 自定义事件处理对象
 */
define(function (require) {
	// 模块对象定义
	var event = {};

	/*
	 * 私有对象
	 */ 
	var _onEvents = {};		// 注册事件
	var _subsEvents = {}; 	// 订阅事件
	var _subsNum = 0;		// 计数值(匿名订阅者使用)
	var _subsKey = 'anonymity';	// 匿名订阅者标示



	/*
	 * 绑定事件（针对浏览器window、dom对象）
	 * @param obj	对象
	 * @param event	事件名（不带on）
	 * @param func	事件处理函数
	 */
	function bind (obj, event, func) {
		try {
			// 监听父类的onresize事件
			if (obj.addEventListener) {
				obj.addEventListener(event, func, false);
				_log('info', 'hzApi._bindEvent: addEventListener事件（'+event+'）成功!');
			}
			else if (obj.attachEvent) {
				obj.attachEvent('on'+event, func, false);
				_log('info', 'hzApi._bindEvent: attachEvent事件（'+event+'）成功!');
			}
			else {
				_log('warn', 'hzApi._bindEvent: 绑定事件（'+event+'）失败，对象不支持addEventListener和attachEvent!');
			}
		} catch (e) {
			_log('warn', 'hzApi._bindEvent: 绑定事件（'+event+'）错误：' + e);
		}
	}

	/*
	 * 解绑事件（针对浏览器window、dom对象）
	 * @param obj	对象
	 * @param event	事件名（不带on）
	 * @param func	事件处理函数
	 */
	function unbind(obj, event, func) {
		try {
			// 监听父类的onresize事件
			if (obj.removeEventListener) {
				obj.removeEventListener(event, func, false);
				_log('info', 'hzApi._unbindEvent: removeEventListener事件（'+event+'）成功!');
			}
			else if (obj.detachEvent) {
	            obj.detachEvent("on" + event, func, false);
	            _log('info', 'hzApi._unbindEvent: detachEvent事件（'+event+'）成功!');
			}
			else {
				_log('warn', 'hzApi._bindEvent: 解绑事件（'+event+'）失败，对象不支持removeEventListener和detachEvent!');
			}
		} catch (e) {
			_log('warn', 'hzApi._unbindEvent: 解绑事件（'+event+'）错误：' + e);
		}
	}

	/*
	 * 注册方法
	 * @param name	方法名
	 * @param func	处理函数
	 * @param rightAway 是否立即执行，默认false
	 * @param params 参数，多个参数存放在数组里面:[arg0,arg1,arg2,...,argn]
	 */
	function on (name, func, rightAway, params) {
		_on(name, func, -1, rightAway, params);
	}

	/*
	 * 注册方法
	 * @param name	方法名
	 * @param func	处理函数
	 */
	function one (name, func) {
		_on(name, func, 1);
	} 

	/*
	 * 注册方法
	 * @param name 	方法名
	 * @param func 	处理函数
	 * @param times 处理次数
	 * @param rightAway 是否立即执行，默认false
	 * @param params 参数，多个参数存放在数组里面:[arg0,arg1,arg2,...,argn]
	 */
	function _on (name, func, times, rightAway, params) {
		if (_onEvents[name]) {
			_log('warn', 'hzApi.on: 方法（'+ name + '）注册失败，注册名已存在!');
		} else {
			_onEvents[name] = {};
			_onEvents[name].fn = func;
			_onEvents[name].times = times;
			_log('info', 'hzApi.on: 方法（'+ name + '）注册成功!');

			// 是否立即执行
			if (rightAway) {
				return _call(name, params);// 执行事件并返回结果
			}
		}
	}

	/*
	 * 注销方法
	 * @param name 方法名
	 */
	function off (name) {
		delete _onEvents[name];
		_log('info', 'hzApi.off: 方法（'+ name + '）已注销!');
	}

	/*
	 * 调用方法
	 * @param name 方法名
	 * @param args 多个参数依次向后加：_call(name, arg0, arg1, arg2, ..., argn);
	 */
	function call (name) {
		return _call(name, _getArgs(arguments));
	}


	/*
	 * 调用方法
	 * @param name 方法名
	 * @param params 方法参数，多个参数存放在数组里面:[arg0,arg1,arg2,...,argn]
	 */
	function _call(name, params) {
		try {
			var data = _onEvents[name];
			if (data && _isFn(data.fn)) {
				// 一次性事件调用一次就注销
				data.times == 1 && off(name);
				// 执行事件并返回结果
				return _apply(data.fn, params, function (e) {
					if (_isFreed(e)) {
						_log('warn', 'hzApi.call：方法（'+ name + '）已被释放，无法完成调用，执行注销操作...');
						off(name);
					} else {
						_log('error', 'hzApi.call：方法（'+ name + '）内部处理错误：' + e);
					}
				});
			} else {
				_log('warn', 'hzApi.call：调用方法（'+ name + '）失败，该方法未注册或不是有效函数!');
			}
		} catch (e) {
			_log('error', 'hzApi.call：调用方法（'+ name + '）过程中错误：' + e);
			return null;
		}
	}


	/*
	 * 订阅消息
	 * @param name	事件名
	 * @param user	订阅者 | 处理消息的函数
	 * @param func	处理消息的函数
	 */
	function subs (name, user, func) {
		
		// 校验并纠正参数
		if (user) {
			if (_isFn(user)) {
				func = user;
				user = _subsKey + _subsNum++;
			}
		} else {
			user = _subsKey + _subsNum++;
		}

		if (_isFn(func)) {
			// 事件不存在时初始化事件对象
			_subsEvents[name] = _subsEvents[name] || {};

			if (_subsEvents[name][user]) {
				_log('info', 'hzApi.subs: 消息（'+ name + '）订阅失败，订阅者（'+ user + '）已存在!');
			} else {
				_subsEvents[name][user] = func;
				_log('info', 'hzApi.subs: 消息（'+ name + '）订阅成功，订阅者（'+ user + '）');
			}
		} else {
			_log('warn', 'hzApi.subs: 消息（'+ name + '）订阅失败，不是有效的函数!');
		}
	}

	/*
	 * 取消订阅
	 * @param name	消息名
	 * @param user	订阅者 | 处理消息的函数
	 */
	function unsubs (name, user) {
		var temp = _subsEvents[name] || {};
		if (user) {
			if (_isFn(user)) {
				for(var key in temp) {
					if (user == temp[key]) {
						delete temp[key];
						_log('info', 'hzApi.unsubs: 已取消（'+ user + '）对（'+ name + '）消息的匿名订阅!');
					}
				}
			} else {
				if (temp[user]) {
					delete temp[user];
					_log('info', 'hzApi.unsubs: 已取消（'+ user + '）对（'+ name + '）消息的订阅!');
				}
			}
		} else {
			if (_subsEvents[name]) {
				delete _subsEvents[name];
				_log('info', 'hzApi.unsubs: 已取消（'+ name + '）消息的所有订阅!');
			}
		}
	}

	/*
	 * 发布消息
	 * @param name	消息名
	 */
	function emit (name) {
		try {
			var temp = _subsEvents[name];
			var args = _getArgs(arguments);
			if (temp) {
				for(var user in temp) {
					_apply(temp[user], args, function (e) {
						if (_isFreed(e)) {
							_log('warn', 'hzApi.emit：订阅对象（'+ user + '）已被释放，无法处理消息（'+ name + '），执行注销操作...');
							unsubs(name, user);
						} else {
							_log('error', 'hzApi.emit：订阅对象（'+ name + '）处理消息（'+ name + '）时内部错误：' + e);
						}
					});
				}
			} else {
				_log('warn', 'hzApi.emit：消息（'+ name + '）无订阅!');
			}
		} catch (e) {
			_log('error', 'hzApi.emit：发布消息（'+ name + '）时错误：' + e);
		}
	}

	/*
	 * 获取参数
	 */
	function _getArgs (args) {
		var _args = [];
		// 整理参数
		for(var i = 1; i < args.length; i++){
			_args.push(args[i]);
		}
		return _args;
	}

	/*
	 * 回调
	 * @param func 回调函数
	 * @param args 参数
	 * @param error 失败回调
	 */
	function _apply (func, args, error) {
		try {
			return func ? func.apply(this, args) : null;
		} catch (e) {
			error(e);
		}
	}

	/*
	 * 是否是函数
	 */
	function _isFn (func) {
		return (typeof func === 'function');
	}

	/*
	 * 函数是否已被释放
	 * @param e 异常抛出的错误对象
	 */
	function _isFreed (e) {
		return e.number == -2146823277;
	}

	/*
	 * 日志打印
	 */
	function _log(level, msg) {
		console[level](msg);
	}

	/*
	 * 注入模块方法
	 */
	try {

		// 针对类似frame框架的模型化处理
		try {
			var hz = window.top.hz;
			if (hz) {
				event = hz.event;
				if (event) {
					return event;
				}
			} else {
				hz = window.top.hz = {};
			}
			event = hz.event = {};
		} catch (e) {
			console.error('hz.event：引用顶层父级event对象失败...');
		}

		// 事件
		event.on = on;
		event.one = one;
		event.off = off;
		event.call = call;

		// 事件订阅
		event.subs = subs;
		event.unsubs = unsubs;
		event.emit = emit;

		// 事件绑定
		event.bind = bind;
		event.unbind = unbind;
		_log('log', '初始化 --> 自定义事件处理模块...');

		return event;
	} catch (e) {
		_log('error', '初始化 --> 自定义事件处理模块失败，' + e);
	}
});