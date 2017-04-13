define(function(require) {
	var hz = require('hz.frm');
	var select = require('frm/select');
	var dialog = require('frm/dialog');
	var vue = require('vue');
	
	var s = select.init({
		id:'mj',
		data:[{
			id:'001',
			name:'李易'
		},{
			id:'002',
			name:'王建'
		}]
	});
	var vm = new vue({
		el:'body',
		data:{
			msg:'Hello 监狱',
			btnTxt:'新增'
		}
	});
	
	s.setValue({id:'001'});
	console.log(s.getDisplayText(),s.getValue());
	
	$('#del').bind('click',function(){
		hz.closeDialog();
	});
	$('#save').bind('click',function(){
		var d = dialog.open({
			targetId:'ddsda',
			type:1,
			title:$(this).text()
		});
	});
	$('.add').bind('click',function(){
		vm.msg = 'Hello 女监';
		vm.btnTxt = 'baocun';
	});
});
