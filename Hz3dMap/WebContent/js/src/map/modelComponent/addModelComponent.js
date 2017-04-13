/**
 * Created by chendm on 2017/4/1 15:22
 */
define(['vue','frm/loginUser','frm/hz.db','hz/map/map.handle','frm/message', 'frm/hz.event','frm/select'],
    function(vue,user,db,mapHandle,message, hzEvent,select){
    var componentId = '161226';
    var modelObj=null;
    var vm = new vue({
        el:'#compon',
        data: {
            selectModel: {},
            model: initParams()
        },
        watch: {
            'mcl_load_mode': function () {
                if (vm.model.mcl_load_mode == 2) {
                    initViewMenu();
                }
            }
        },
        methods:{
            setPosition: function (data) {
                this.model.mcl_pos_x = data.x;
                this.model.mcl_pos_y = data.y;
                this.model.mcl_pos_z = data.z;
            },
            save: function () {
                if (modelObj==null) {
                    message.alert('请先在地图上添加组件模型'); return;
                }
                if (!vm.model.mcl_load_name) {
                    message.alert('请填写组件名称'); return;
                }
                if (vm.model.mcl_load_mode==2 && vm.model.mcl_view_id=='0') {
                    message.alert('加载方式为视角加载，视角菜单必选'); return;
                }

                vm.model.mcl_rot_x = modelObj.rotation.x;
                vm.model.mcl_rot_y = modelObj.rotation.y;
                vm.model.mcl_rot_z = modelObj.rotation.z;
                vm.setPosition(modelObj.position);

                db.updateByParamKey({
                    request: [{
                        sqlId: vm.model.mcl_load_id ? 'update_model_component_load' : 'insert_model_component_load',
                        params: vm.model
                    }],
                    success: function (res) {
                        addComponent(res.data[0].seqList[0], false);
                        message.alert('添加成功');
                    }
                });
            },
            reset: function () {
                vm.selectModel = {};
                vm.model = initParams();
                initViewMenu();
            }
        }
    });

    // 订阅视角菜单点击事件
    hzEvent.subs('view.menu.onclick', 'addModelComponent.html', function (m) {
        vm.model.mcl_view_id = m.id;
        vm.model.mcl_view_name = m.name;
    });

    mapHandle.modelComponent.enabledEdit(function (data) {
        if (vm.selectModel.class_flag) {
            vm.setPosition(data);
            addComponent(componentId, true, function (obj) {
                modelObj = obj;
            });
        } else {
            message.alert('请先选择要添加的模型');
        }
    });

    /*
     * 添加组件
     */
    function addComponent (cid, enable, callback) {
        if (modelObj) {
            mapHandle.removeModelByName(modelObj.name);
            modelObj = null;
        }

        mapHandle.addComponent({
            'id': cid,
            'modelClass': vm.selectModel.class_flag,
            'modelType': vm.selectModel.type_flag,
            'editHelper': enable,
            'position': {
                x: vm.model.mcl_pos_x,
                y: vm.model.mcl_pos_y,
                z: vm.model.mcl_pos_z
            },
            'rotation': {
                x:vm.model.mcl_rot_x,
                y:vm.model.mcl_rot_y,
                z:vm.model.mcl_rot_z
            }
        }, callback);
    }

    function initParams () {
        return {
            mcl_cus_number: user.cusNumber,
            mcl_load_id:'',
            mcl_mci_id:'',
            mcl_load_mode: 2,
            mcl_view_id: '0',
            mcl_view_name: '',
            mcl_pos_x:'',
            mcl_pos_y:'',
            mcl_pos_z:'',
            mcl_rot_x:0,
            mcl_rot_y:0,
            mcl_rot_z:0,
            mcl_order:'',
            mcl_create_uid:user.userId,
            mcl_update_uid:user.userId
        };
    }

    function initViewMenu () {
        var curViewMenu = hzEvent.call('home.viewmenu.getCurViewMenu');
        if (curViewMenu) {
            vm.model.mcl_view_id = curViewMenu.id;
            vm.model.mcl_view_name = curViewMenu.name;
        }
    }

    try {
        initViewMenu();
    } catch (e) {
        // TODO: handle exception
    }
})