define(function(require){
	var Vue = require('vue');
	
	var viewMenu = Vue.extend({
		props:['data','cm'],
		methods:{
			viewMenuC:function(m){
				this.$dispatch('viewMenuClick',m);
			}
		},
		template:'<div class="view_menu" v-for="m in data" v-bind:id="m.id">'+
	  		'<span style="width:100%;height:100%" @click="viewMenuC(m)" v-text="m.name"></span>'+
	  		'<div v-cloak v-bind:id="cm+m.id" style="display:none" class="child_menus">'+
	  		'<view-menu :data="m.childs" cm="cm"/>'+
	  		'</div>'+
	  		'</div>'
	});
	
	Vue.component('view-menu',viewMenu);
});