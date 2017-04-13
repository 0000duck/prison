/*
 * 数据库操作
 */
define(function (require) {
	// 核心文件引用及模块对象定义
	var db = require('frm/hz.db');

	function insertTest () {
		db.update({
			request: [{
				module: 'test',
				sqlId: 'hdt_test_add_table',
				seqParams:[0, 'HZ_DB_TEST', 'HDT_ID'],			// 序列号
				params: ['?','hz.db.add.test', 'insert', '<h2>CLOB</h2>'],			// 单个插入
//				params: [['?','hz.db.add.test', 'insert1', '<h1>CLOB-1</h1>'],['?','hz.db.add.test', 'insert2', '<h2>CLOB-2</h2>']],		// 批量多个插入
//				paramsType: {'3': 'CLOB'}
			},{
				module: 'test',
				sqlId: 'hdt_test_add_table',
//				seqParams:[0, 'HZ_DB_TEST', 'HDT_ID'],			// 序列号
				params: [['5','hz.db.add.test', 'insert', '']],							// 批量单个插入
//				params: [['?','hz.db.add.test', 'insert1', '<h1>CLOB-1</h1>'],['?','hz.db.add.test', 'insert2', '<h2>CLOB-2</h2>']],		// 批量多个插入
//				paramsType: {'3': 'CLOB'}
			}],
			success: function (data) {
				console.log('insertTest --> 插入成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('insertTest --> 插入失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}


	function insertTestByParamKey () {
		db.updateByParamKey({
			request: {
				sqlId: 'hdt_test_add_table_by_paramkey',
//				params: {hdt_name:'hz.db.add.test.paramkey.1', hdt_type:'insert.paramkey'},
				params: [{hdt_name:'hz.db.add.test.paramkey.4', hdt_type:'insert.paramkey.4'}, {hdt_name:'hz.db.add.test.paramkey.5', hdt_type:'insert.paramkey.5'}]
			},
			success: function (data) {
				console.log('insertTest --> 插入成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('insertTest --> 插入失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}

	/*
	 * 更新测试
	 */
	function updateTest (hdtId) {
		db.update({
			request: [{
				sqlId: 'hdt_test_update_table',
				whereId: 0,
//				params: ['hz.db.update.test', 'update', hdtId]
//				params: [['hz.db.update.test', 'update', hdtId]]	// 批量单个更新
				params: [['hz.db.update.test', 'update1', 1], ['hz.db.update.test', 'update2', 2]]	// 批量单个更新
			},{
				sqlId: 'hdt_test_update_table',
				whereId: 1,
//				params: ['hz.db.update.test', 'update', hdtId]
//				params: [['hz.db.update.test', 'update', hdtId]]	// 批量单个更新
				params: [['hz.db.update.test', 'update1', 1], ['hz.db.update.test', 'update2', 2]]	// 批量单个更新
			}],
			success: function (data) {
				console.log('updateTest --> 更新成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('updateTest --> 更新失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}


	/*
	 * 删除数据
	 */
	function deleteTest (hdtId) {
		db.update({
			request: {
				sqlId: 'hdt_test_delete_table',
				whereId: 0,
				params: [hdtId]
//				paramsList: [[hdtId]]
//				paramsList: [[hdtId], [hdtId]]
			},
			success: function (data) {
				console.log('updateTest --> 删除成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('updateTest --> 更新失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}

	/*
	 * 删除数据
	 */
	function deleteTest (hdtId) {
		db.updateByParamKey({
			request: {
				sqlId: 'hdt_test_delete_table'
			},
			success: function (data) {
				console.log('updateTest --> 删除成功，返回数据<' + JSON.stringify(data) + ">");
			},
			error: function (code, msg) {
				console.log('updateTest --> 更新失败，响应码<' + code + ">，响应结果<" + msg + ">");
			}
		});
	}

//	insertTest();
	insertTestByParamKey();
//	updateTest(0);
//	deleteTest('14');
});