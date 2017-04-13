/**
 * 
 */
define(function (require) {
	var utils = require('frm/hz.utils');
	var user = require('frm/loginUser');
	var ztree = require('ztree');
	var vue = require('vue');

	var treeUrl = 'cameraCtr/videoStorageRecord';
	var listUrl = 'cameraCtr/getDirList';
	var zTreeObj = null;

	var setting = {
		data: {
			simpleData:{
				enable:true,
				pIdKey:'pid',
				idKey:'id'
			}
		},
		callback: {
			onClick: function (event, treeId, treeNode) {
				loadDirList(treeNode.dirPath);
			}
		}
	}

	var vmTab = new vue({
		el: '#tabDirList',
		data: {
			dirList: []
		},
		methods: {
			dblClick: function (data) {
				if (data.isDir) {
					loadDirList(data.path);
				}
			}
		}
	});

	/*
	 * 加载目录树
	 */
	function loadDirTree () {
		var params = {cusNumber: user.cusNumber};
		utils.ajax(treeUrl, params, function (result) {
			zTreeObj = $.fn.zTree.init($('#dataTree'), setting, result);
		});
	}

	function loadDirList (path) {
		var params = {dirPath: path};
		//var $tbody = $('#tabDirList >tbody').empty();

		utils.ajax(listUrl, params, function (result) {
			vmTab.dirList = result;

//			var data = null;
//			for(var i = 0; i < result.length; i++) {
//				data = result[i];
//				$tbody.append('<tr><td>' + data.name + '</td><td>' + (data.isDir ? '文件夹': '文件') + '</td></tr>');
//			}
		});
	}

	loadDirTree();
});