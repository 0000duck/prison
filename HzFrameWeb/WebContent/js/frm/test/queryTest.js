/*
 * 数据库操作
 */
define(function (require) {
	// 核心文件引用及模块对象定义
	var db = require('frm/hz.db');

	/*
	 * 查询结果
	 */
	function query () {
		db.query({
			request: {
				sqlId: 'hdt_test_query_table',
				whereId: 0,
				params: [2]
			},
			success: function (data) {
				console.log('query --> 查询成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('query --> 查询失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}


	/*
	 * 查询结果
	 */
	function queryPaging () {
		db.query({
			request: {
				sqlId: 'hdt_test_query_table',
				whereId: 0,
				params: [4],
				pageIndex: 1,
				pageSize: 5
			},
			success: function (data) {
				console.log('queryPaging --> 查询成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('queryPaging --> 查询失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}


	/*
	 * 查询
	 */
	function queryByParamKey () {
		db.query({
			request: {
				sqlId: 'hdt_test_query_table',
				whereId: 1,
				params: {'hdt_id': 2}
			},
			success: function (data) {
				console.log('queryByParamKey --> 查询成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('queryByParamKey --> 查询失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}

	/*
	 * 查询
	 */
	function queryByParamKeyPaging () {
		db.query({
			request: {
				sqlId: 'hdt_test_query_table',
				whereId: 1,
				params: {'hdt_id': 5},
				pageIndex: 1,
				pageSize: 5
			},
			success: function (data) {
				console.log('queryByParamKeyPaging --> 查询成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('queryByParamKeyPaging --> 查询失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}

	/*
	 * 分页查询
	 */
	function queryTestByPage () {
		db.page({
			request: {
				sqlId: 'hdt_test_query_table',
				pageIndex: 2,
				pageSize: 3
			},
			success: function (data) {
				console.log('queryTestByPage --> 查询成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('queryTestByPage --> 查询失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}

	query();
//	queryPaging();
	queryByParamKey();
	queryByParamKeyPaging();
	queryTestByPage();
});