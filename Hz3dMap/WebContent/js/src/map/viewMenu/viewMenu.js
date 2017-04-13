/**
 * 
 */
define(function(require) {
	var $ = require("jquery");
	var db = require('frm/hz.db');
	var loginUser = require('frm/loginUser');
	var hzDrag = require('frm/hz.drag');
	var $panel = $('div.map-func-panel.view-menu-add');

	var zModelTree, zViewTree, 
		moreStatus = false,
		hzThree = window.hzThree;

	


	function loadViewMenu () {
		db.query({
			request: {
				sqlId: 'select_map_view_menu',
				whereId: 1,
				orderId: 1,
				params: [loginUser.cusNumber]
			},
			success: function (data) {
				
			},
			error: function(code, msg) {
//				message.alert(code + ':' + msg);
			}
		});
	}


	hzDrag.on($panel);
	loadViewMenu();

});