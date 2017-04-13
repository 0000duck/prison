/**
 * Created by chendm on 2017/4/1 14:13
 */
define(['vue','frm/localStorage', 'hz/map/map.handle'],function(vue,ls, mapHandle){
    ls.remove('isAddPointState');
    var vm = new vue({
        el:'#chose-panel',
        data:{
            active:{name:'',id:0},
            items:[
                {name:'添加摄像机点位',id:1},
                {name:'添加门禁点位',id:2},
                {name:'添加对讲机点位',id:3},
                {name:'添加网络报警点位',id:6},
                {name:'添加RFID基站点位', id:15},
                {name:'添加巡更刷卡点位', id:16},
                {name:'添加犯人点位', id:98}
            ]
        },
        methods:{
            setActive:function (item) {
                this.active = item;
                mapHandle.setHandleStatus(mapHandle.EDITMODEL);
                window.top.addPointViewModel.point.mpi_link_type = item.id;
                ls.setItem('isAddPointState',true);
            }
        }
    });
});