/*
	requirejs config 配置项
	Rui.Zhou
	baseUrl:默认的第三方插件库路径
	paths:自定义的插件库路径 key val 形式；
				其中 key 即为调用时的虚拟目录
				如下方的 "hz":'../js/src' 在页面调用 requirejs(['hz/home/index']);其实就是加载的 js/src/home/index.js
*/
var ip = "192.168.3.110";
var domain = "http://" + ip,
	prjName = "Prison",
	port = "8080",
	ctx = domain + ":" + port + "/" + prjName + "/";

var basePath = ctx;
var mapBasePath = 'http://' + ip + ':8080/MapResource/';
var pathFindingURL = 'http://' + ip + ':8080/MapResource/mesh-data/';		// 寻路网格的数据文件地址
var websocketUrl='ws://' + ip + ':8442/websocket';
var videoWebsocketUrl='ws://127.0.0.1:4502/websocket';


/** 数字广播http服务地址(用于试听文件) **/
var http_broadcast = 'http://192.168.3.85/mp3/';

/** 对讲 **/
/** 对讲服务器ip **/
var talk_server = '10.43.239.27';
var talk_user = 'admin';
var talk_pwd = '111111';
var talk_type = 802;
var talk_caller = '00001';
var talk_http = 'http://'+talk_server+'/v2/audio/';

requirejs.config({
	baseUrl: ctx + 'libs',
	"paths": {
	  	"hz.frm": "../js/hz.frm",//内部核心框架库
		"hz":"../js/src",
		"sys":"../js/src/sys",
		"cds":"../js/src/cds",
		"frm":"../js/frm",
		"jquery":"jquery/jquery",
		"bootstrap":"bootstrap/bootstrap",
		"bootstrapMenu":"bootstrap/BootstrapMenu.min",
		"layer":"layer/layer",
		"hzdate":"hzdate/hzdate",
		"vue":"vue/vue.min",
		"echarts":"echarts/echarts.min",
		"zrender":"echarts/zrender.min",
		"echarts_theme":"echarts/theme",
		"map":"echarts/map",
		"fastclick":"fastclick/fastclick",//用于触屏消除300ms点击延迟
		"table":"bootstrap/bootstraptable/bootstrap-table",
		"table-export":"bootstrap/bootstraptable/table-export",
		"ztree":"ztree/js/jquery.ztree.all.min",
		"webuploader":'webuploader/webuploader.min',
		'moment':'moment/moment.min',
		'twix':'moment/twix.min',
		'cxcolor':'cxcolor/jquery.cxcolor',

		'THREE': 'three/three',
		'MTLLoader': 'three/loaders/MTLLoader',
		'OBJLoader': 'three/loaders/OBJLoader',
		'TWEEN': 'three/libs/tween.min',
		'Stats': 'three/libs/stats.min',
        'Detector':'three/Detector',
        'EffectComposer':'three/postprocessing/EffectComposer',
        'MaskPass':'three/postprocessing/MaskPass',
        'OutlinePass':'three/postprocessing/OutlinePass',
        'RenderPass':'three/postprocessing/RenderPass',
        'ShaderPass':'three/postprocessing/ShaderPass',
        'CopyShader':'three/shaders/CopyShader',
        'FXAAShader':'three/shaders/FXAAShader',

        'underscore': 'underscore-min',
        'Patrol': 'patrol'
	},
	"shim": {
		//下方可配置jquery的一些插件
		//bootstrap都依赖于jquery
		'bootstrap':['jquery'],
		'frm/datepicker':['jquery'],
		'layer':['jquery'],
		'table':['bootstrap','jquery'],
		'table-export':['table'],
		'ztree':['jquery'],
		'cxcolor':['jquery'],
		'THREE': {
			'exports': 'THREE'
		},
		'MTLLoader': {
			'exports': 'MTLLoader',
			'deps': ['THREE']
		},
		'OBJLoader': {
			'exports': 'OBJLoader',
			'deps': ['THREE']
		},
		'TWEEN': {
			'exports': 'TWEEN',
			'deps': ['THREE']
		},
		'Stats': {
			'exports': 'Stats',
			'deps': ['THREE']
		},

		'underscore': {
            'exports': 'underscore',
        },
        'Detector':{
             'exports': 'Detector'
        },
        'EffectComposer':{
             'exports': 'EffectComposer',
             'deps': ['THREE']
        },
        'MaskPass':{
             'exports': 'MaskPass',
             'deps': ['THREE']
        },
        'OutlinePass':{
             'exports': 'OutlinePass',
             'deps': ['THREE']
        },
        'RenderPass':{
            'exports': 'RenderPass',
            'deps': ['THREE']
        },
        'ShaderPass':{
            'exports': 'ShaderPass',
            'deps': ['THREE']
        },
        'CopyShader':{
            'exports': 'CopyShader',
            'deps': ['THREE']
        },
        'FXAAShader':{
            'exports': 'FXAAShader',
            'deps': ['THREE']
        }
	}
});
require(['../js/frm/permission']);
