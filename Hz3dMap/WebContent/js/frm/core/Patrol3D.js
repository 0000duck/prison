/**
 * 3d巡视类
 */

define(['frm/events/EventConsts', 'THREE', 'frm/core/expand'], function(EventConsts, THREE, Expand) {

    var HzEvent = EventConsts.HzEvent;
    var Events = EventConsts.Events;
    var Pvo = function() {
        this.walkTime = 0; //运动时间
        this.startPos = null; //开启坐标
        this.endPos = null; //结束坐标
        this.rad = 0;
    };
    Pvo.prototype.constructor = Pvo;

    var Patrol3D = function(camera, scene) {
        THREE.Object3D.call(this);
        this.objectNameMap = EventConsts.objectNameMap;
        this.hzThree = EventConsts.hzThree;
        var scope = this;
        this.camera = camera; //当前摄像机
        this.scene = scene;
        this.walkSpeed = 30; //每秒移动速度
        this.pathData = [];
        this.pVoArray = []; //时间总数据
        this.stepNum = 0; //阶段数
        this.defalutY = 170; //默认高度
        this.positionTween = null;
        this.rotationTween = null;
        this.lastData = null;
        this.lastRotation = null; // new THREE.Vector3();
        this.lastPosition = null;
        this.curNode = null;
        this.line = null;
        this.searchRadius = 300; //搜索半径
        this.searchGap = 200; //搜索距离间距
        this.searchType = []; //这里为寻找的类型 为数组可能寻找的不止一种类型的东西
        this.searchResult = [];
        this.nodeList = undefined; //从maproute中拿到的节点数组
        this.needCheckListOrigin = [];
        this.needCheckList = []; //需要被查找物体的数组
        this.needSearchDataOrigin = []; //传入搜索的点数据 {id: '', name: '', position: {x: 0, y: 0, z: 0}}
        this.needSearchData = []; //传入搜索的点数据 {id: '', name: '', position: {x: 0, y: 0, z: 0}}
        this.sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), this.searchRadius); //搜索使用的半径
        this.line3List = []; // 实际线段数组
        this.searchPointList = []; //查找路径点数组
        this.ballList = [];
        this.showViewBall = false; //是否展示视野球

        this.lastNode = null;
        /**
         * 开始行走
         * @return {[type]} [description]
         */
        this.beginWalk = function() {
            if (scope.stepNum < scope.pVoArray.length) {
                if (scope.stepNum === 0) {
                    scope.camera.rotation.y = scope.pVoArray[scope.stepNum].rad;
                }
                if (scope.stepNum > 0) {
                    scope.lastData = scope.pVoArray[scope.stepNum - 1];
                }
                scope.curNode = scope.pVoArray[scope.stepNum];
                scope.startMove(scope.pVoArray[scope.stepNum]);
                scope.stepNum++;
            } else {
                var e = new Events(HzEvent.PATROL_3D_OVER);
                scope.dispatchEvent(e);
                scope.hzThree.setControlMouseEnable(true);
                scope.hzThree.setControlKeysEnable(true);
                scope.hzThree.Controls.enablePan = true;
                scope.hzThree.Controls.refreshLookAt();
                if (scope.line !== null) {
                    scope.scene.remove(scope.line);
                    scope.line.dispose();
                    scope.line = null;
                }
            }
        };
        this.startMove = function(data) {
            scope.positionTween = new TWEEN.Tween(data.startPos)
                .to(data.endPos, data.walkTime)
                .onUpdate(function() {
                    scope.camera.position.x = this.x;
                    scope.camera.position.z = this.z;
                    scope.camera.position.y = this.y;
                    //  console.log('位移改变');
                    scope.hzThree.Controls.refreshLookAt();
                    scope.hzThree.Controls.update2dImage();
                    var e = new Events(HzEvent.MOVE_PATROL3D, scope.camera.position.clone());
                    scope.dispatchEvent(e);
                })
                .onComplete(
                    scope.beginWalk
                )
                .start();


            if (scope.stepNum > 0) {
                data.rad = scope.checkAngle(scope.lastData.rad, data.rad);
                scope.rotationTween = new TWEEN.Tween(scope.lastData)
                    .to(data, 500)
                    .onUpdate(function() {
                        scope.camera.rotation.y = this.rad;
                    })
                    .onComplete(
                        function() {
                            scope.rotationTween = null;
                        }

                    )

                .start();
            }
        };
        this.checkAngle = function(fromAngle, toAngle) {

            var result = toAngle;
            if (Math.abs(fromAngle - toAngle) > Math.PI) {

                if ((toAngle - fromAngle) > 0) {
                    result = toAngle - Math.PI * 2;
                } else {
                    result = toAngle + Math.PI * 2;
                }
            }
            return result;
        };
        this.resumedCameraRotation = function() {
            var ratObj = {};
            ratObj.y = scope.checkAngle(scope.camera.rotation.y, scope.curNode.rad);
            ratObj.x = scope.checkAngle(scope.camera.rotation.x, 0);
            ratObj.z = scope.checkAngle(scope.camera.rotation.z, 0);

            var disLen = scope.lastPosition.distanceTo(scope.curNode.endPos);
            var useTime = Math.floor(disLen / this.walkSpeed) * 100;

            scope.positionTween = new TWEEN.Tween(scope.lastPosition)
                .to(scope.curNode.endPos, useTime)
                .onUpdate(function() {
                    scope.camera.position.x = this.x;
                    scope.camera.position.z = this.z;
                    scope.camera.position.y = this.y;
                    scope.hzThree.Controls.refreshLookAt();
                    scope.hzThree.Controls.update2dImage();
                    var e = new Events(HzEvent.MOVE_PATROL3D, scope.camera.position.clone());
                    scope.dispatchEvent(e);
                })
                .onComplete(
                    scope.beginWalk
                )
                .start();


            new TWEEN.Tween(scope.camera.rotation)
                .to(ratObj, 500)
                .onUpdate(function() {
                    scope.camera.rotation.x = this.x;
                    scope.camera.rotation.y = this.y;
                    scope.camera.rotation.z = this.z;
                })
                .onComplete(
                    function() {
                        scope.lastRotation = null;
                        if (scope.camera.position.equals(scope.pVoArray[scope.pVoArray.length - 1].endPos) === true) {
                            var e = new Events(HzEvent.PATROL_3D_OVER);
                            scope.dispatchEvent(e);
                            scope.hzThree.setControlMouseEnable(true);
                            scope.hzThree.setControlKeysEnable(true);
                            scope.hzThree.Controls.enablePan = true;
                            scope.hzThree.Controls.refreshLookAt();
                            scope.hzThree.Controls.update2dImage();
                            if (scope.line !== null) {
                                scope.scene.remove(scope.line);
                                scope.line.dispose();
                                scope.line = null;
                            }
                        }
                    }

                )
                .start();
        };
        /**
         * 绘制路径
         * @return {[type]} [description]
         */
        this.drawPath = function() {
            var material = new THREE.LineBasicMaterial({
                color: 0x0000ff,
                linewidth: 100,
                depthTest: true
            });
            var geometry = new THREE.Geometry();
            for (var index = 0; index < scope.pathData.length; index++) {

                var v = new THREE.Vector3(scope.pathData[index].x, scope.pathData[index].y, scope.pathData[index].z);
                geometry.vertices.push(v);

            }


            scope.line = new THREE.Line(geometry, material);
            scope.scene.add(scope.line);
        };
        /**
         * 根据点检查每个需要检查的对象
         * @return {[type]} [description]
         */
        function checkForPoint(pos, line) {
            scope.sphere.set(pos.clone(), scope.searchRadius); //重新设置圆的半径
            var findArray = [];
            var searchDataArray = [];
            for (var index = 0; index < scope.needCheckList.length; index++) {
                var cube = scope.needCheckList[index];
                var dis = cube.position.distanceTo(scope.sphere.center);
                if (dis <= scope.sphere.radius) { //找到一个点
                    scope.needCheckList.remove(cube); //从待选列表中删除
                    findArray.add(cube); //加入到搜索结果列表中
                }
            }
            for (var i = 0; i < scope.needSearchData.length; i++) {
                var cube1 = scope.needSearchData[i];
                var cubeVector = new THREE.Vector3(parseFloat(cube1.position.x), parseFloat(cube1.position.y), parseFloat(cube1.position.z));
                var dis1 = cubeVector.distanceTo(scope.sphere.center);
                if (dis1 <= scope.sphere.radius) { //找到一个点
                    scope.needSearchData.remove(cube1); //从待选列表中删除
                    searchDataArray.add(cube1); //加入到搜索结果列表中
                }
            }

            for (var a = 0; a < findArray.length; a++) {
                var cube2 = findArray[a];
                var cubePos = cube2.position;
                var pos1 = line.closestPointToPoint(cubePos, true);
                var data1 = {
                    pos: pos1,
                    data: [cube2],
                    searchData: []
                };
                scope.searchResult.push(data1);
            }
            for (var b = 0; b < searchDataArray.length; b++) {
                var cubePos1 = searchDataArray[b];
                var pos2 = line.closestPointToPoint(cubePos1, true);
                var data2 = {
                    pos: pos2,
                    data: [],
                    searchData: [cubePos1]
                };
                scope.searchResult.push(data2);

            }

            // if (findArray.length > 0 || searchDataArray.length > 0) {
            //     var data = {
            //         pos: pos,
            //         data: findArray,
            //         searchData: searchDataArray
            //     };
            //     scope.searchResult.push(data);
            // }



        }
        /**
         * 分析所有线并分析线段间距
         * @return {[type]} [description]
         */
        this.analyseAllLine = function() {


            scope.searchPointList.removeAll(); //删除所有已经查到的点进行
            scope.searchResult.removeAll();
            for (var index = 0; index < scope.line3List.length; index++) {
                var tempLine = scope.line3List[index];
                var linePointsObj = {};
                linePointsObj.line = tempLine;
                linePointsObj.points = [];
                var dis = tempLine.distance();
                var step = Math.floor(dis / scope.searchGap) - 1;
                if (step < 0) { //两点距离太短不够搜索距离只加入两个端点查询
                    linePointsObj.points.push(tempLine.at(0));
                    linePointsObj.points.push(tempLine.at(1));
                } else {
                    linePointsObj.points.push(tempLine.at(0));
                    for (var k = 1; k <= step; k++) {
                        linePointsObj.points.push(tempLine.at((1 / step) * k));
                    }
                    linePointsObj.points.push(tempLine.at(1));
                    scope.searchPointList.push(linePointsObj);

                }
            }

            //    scope.searchPointList = scope.searchPointList.uniqueVector3();

            if (scope.showViewBall === true) {
                for (var b = 0; b < scope.ballList.length; b++) {
                    var ball = scope.ballList[b];
                    scope.hzThree.sceneRemove(ball);
                }
                scope.ballList.removeAll();
                for (var n = 0; n < scope.searchPointList.length; n++) {
                    for (var f = 0; f < scope.searchPointList[n].points.length; f++) {
                        var p = scope.searchPointList[n].points[f];
                        var geometry = new THREE.SphereGeometry(scope.searchRadius, 32, 32);
                        var material = new THREE.MeshBasicMaterial({
                            color: 0xffff00
                        });
                        material.opacity = 0.5;
                        material.transparent = true;
                        var sphere = new THREE.Mesh(geometry, material);
                        scope.hzThree.sceneAdd(sphere);
                        sphere.position.x = p.x;
                        sphere.position.y = p.y;
                        sphere.position.z = p.z;
                        scope.ballList.push(sphere);
                    }

                }
            }




            scope.searchResult.removeAll(); //检查结果
            scope.needCheckList.removeAll(); //需要检查的数组
            scope.needCheckList = scope.needCheckListOrigin.slice();
            scope.needSearchData = scope.needSearchDataOrigin.slice();
            for (var i = 0; i < scope.searchPointList.length; i++) {
                for (var i1 = 0, len = scope.searchPointList[i].points.length; i1 < len; i1++) {
                    checkForPoint(scope.searchPointList[i].points[i1], scope.searchPointList[i].line);
                }

            }
            var e = new Events(HzEvent.UPDATE_SEARCH_DATA, scope.getSearchResult());
            scope.dispatchEvent(e);

        };


        this.addRouteHandler = function(e) {
            var addNode = e.data;
            scope.nodeList = scope.hzThree.MapRoute.getNodeList();
            if (scope.nodeList.length > 1) {
                var tempLine = new THREE.Line3(scope.lastNode.position, addNode.position); //两点之间创建一条线段判断
                scope.line3List.push(tempLine);

            }
            scope.lastNode = addNode;
            if (scope.nodeList.length > 1) {
                scope.analyseAllLine();
            }

        };

        this.changeRouteHandler = function() {

            scope.nodeList = scope.hzThree.MapRoute.getNodeList();
            scope.line3List.removeAll();

            for (var index = 0; index < scope.nodeList.length - 1; index++) {
                var tempLine = new THREE.Line3(scope.nodeList[index].position, scope.nodeList[index + 1].position); //两点之间创建一条线段判断
                scope.line3List.push(tempLine);

            }
            if (scope.nodeList.length > 1) {
                scope.analyseAllLine();
            }
        };


    };
    Patrol3D.prototype = Object.assign(Object.create(THREE.EventDispatcher.prototype), {
        constructor: Patrol3D,
        proxy: this,
        /**
         * 重置摄像头
         * @type {[type]}
         */
        resetCamrer: function() {
            this.camera.rotation.x = 0;
            this.camera.rotation.y = 0;
            this.camera.rotation.z = 0;
        },
        /**
         * 进入分析阶段
         * @return {Boolean} [description]
         */
        analysisData: function() {
            if (this.pathData.length < 2) {
                console.warn('数据长度不够2个以上 无法形成路径');
                return;
            }
            var preObj = null;
            for (var index = 1; index < this.pathData.length; index++) {
                if (index === 1) {
                    preObj = this.pathData[index - 1];
                }
                var endObj = this.pathData[index];
                var startPos = new THREE.Vector3(parseFloat(preObj.x), this.defalutY + parseFloat(preObj.y), parseFloat(preObj.z));
                var endPos = new THREE.Vector3(parseFloat(endObj.x), this.defalutY + parseFloat(endObj.y), parseFloat(endObj.z));
                var disLen = startPos.distanceTo(endPos);
                var useTime = Math.floor(disLen / this.walkSpeed) * 100;
                var rad = Math.atan2(((-endPos.z) - (-startPos.z)), (endPos.x - startPos.x)) - Math.PI / 2;
                var pVo = new Pvo();
                pVo.walkTime = useTime;
                pVo.startPos = startPos;
                pVo.endPos = endPos;
                pVo.rad = rad;
                this.pVoArray.push(pVo);
                preObj = endObj;
            }
            this.stepNum = 0;
            this.resetCamrer();
            this.beginWalk();

        },
        /**
         * 传入路径数据 并开启行走路径
         * @param {[type]} arr [description]
         */
        setPathData: function(arr) {
            this.pathData.removeAll();
            this.pVoArray.removeAll();
            if (arr instanceof Array) {
                this.pathData = arr;
            } else if (arr.constructor == String) {
                this.pathData = JSON.parse(arr);
            }
            this.analysisData();
            this.drawPath();
        },
        /**
         * 如果在运行的过程中 可以暂停动画
         * @return {[type]} [description]
         */
        pause: function() {
            if (this.positionTween !== null) {
                //保存暂停后的镜头角度 为了恢复后保持角度

                this.lastRotation = new THREE.Vector3();
                this.lastRotation.x = this.camera.rotation.x;
                this.lastRotation.y = this.camera.rotation.y;
                this.lastRotation.z = this.camera.rotation.z;

                this.lastPosition = new THREE.Vector3();
                this.lastPosition.x = this.camera.position.x;
                this.lastPosition.y = this.camera.position.y;
                this.lastPosition.z = this.camera.position.z;
            }
        },
        /**
         * 继续运行动画
         * @return {[type]} [description]
         */
        goPlay: function() {
            if (this.positionTween !== null && this.lastRotation !== null) {
                if (this.rotationTween !== null) {
                    this.rotationTween.stop();
                    this.rotationTween = null;
                }
                if (this.positionTween != null) {
                    this.positionTween.stop();
                    this.positionTween = null;
                }
                this.resumedCameraRotation();
            }

        },


        //=======开放的接口
        setIsEditRoute: function(val) {
            //这里为寻找的类型 为数组可能寻找的不止一种类型的东西
            this.searchResult.removeAll();
            this.needCheckList.removeAll();
            this.needSearchData.removeAll();
            this.line3List.removeAll(); // 实际线段数组
            this.searchPointList.removeAll(); //查找路径点数组
            this.ballList.removeAll();
            this.hzThree._isEditRoute = val;
            this.hzThree.MapRoute.enable(this.hzThree._isEditRoute);
            if (val === true) {
                this.hzThree.MapRoute.addEventListener(HzEvent.ADD_POINT_ROUTE, this.addRouteHandler);
                this.hzThree.MapRoute.addEventListener(HzEvent.CHANGE_POINT_ROUTE, this.changeRouteHandler);
                this.hzThree.MapRoute.addEventListener(HzEvent.ADD_POINT_ROUTE_ONLINE, this.changeRouteHandler);
            } else {
                this.hzThree.MapRoute.removeEventListener(HzEvent.ADD_POINT_ROUTE, this.addRouteHandler);
                this.hzThree.MapRoute.removeEventListener(HzEvent.CHANGE_POINT_ROUTE, this.changeRouteHandler);
                this.hzThree.MapRoute.removeEventListener(HzEvent.ADD_POINT_ROUTE_ONLINE, this.changeRouteHandler);
                this.searchType.removeAll();

            }

        },

        getRouteList: function() {
            return this.hzThree.MapRoute.getRouteList();
        },
        /**
         * 清除所有点
         * @return {[type]} [description]
         */
        clearRoute: function() {
            this.hzThree.MapRoute.clearAll();
        },
        /**
         * {searchType:xxxx,searchRadius:100}
         * @param {[type]} value [description]
         */
        setPatrol3DParam: function(value) {
            this.needCheckListOrigin.removeAll(); //删除所有待选列表
            this.needSearchDataOrigin.removeAll();
            this.needCheckList.removeAll();
            this.needSearchData.removeAll();
            if (value.hasOwnProperty('searchRadius') === true && isNaN(value.searchRadius) === false) {
                this.searchRadius = value.searchRadius;
            }
            if (value.hasOwnProperty('showViewBall') === true) {
                this.showViewBall = value.showViewBall;
            }
            if (value.hasOwnProperty('searchType') === true) {
                this.searchType.removeAll();
                if ((Array == value.searchType.constructor) === true) { //数组
                    this.searchType = this.searchType.concat(value);
                } else if ((typeof value.searchType) === 'string' && value.searchType.constructor == String) { //为单个字符串
                    this.searchType.add(value.searchType);
                }
            }
            if (value.hasOwnProperty('searchGap') === true && !isNaN(value.searchGap)) {
                this.searchGap = value.searchGap; //设置搜索间距
            }
            if (value.searchData !== undefined) { // 获取到点数据
                this.needSearchDataOrigin = value.searchData.slice();
            }

            //初始化循环查找所有待选
            if (this.searchType.length > 0 && this.needSearchData.length === 0) {
                for (var key in this.objectNameMap) {
                    var obj = this.objectNameMap[key];
                    for (var index = 0; index < this.searchType.length; index++) {
                        if (obj.hasOwnProperty('objectType') === true && obj.objectType === this.searchType[index]) { //判断类型名相同加入到待选列表
                            this.needCheckListOrigin.add(obj); //待选列表

                        }
                    }
                }
            }


        },
        setRoutePath: function(arr) {
            this.setIsEditRoute(true); //
            this.hzThree.MapRoute.setData(arr);
            this.nodeList = this.hzThree.MapRoute.getNodeList();
            this.lastNode = this.nodeList[this.nodeList.length - 1];
            this.line3List.removeAll();

            for (var index = 0; index < this.nodeList.length - 1; index++) {
                var tempLine = new THREE.Line3(this.nodeList[index].position, this.nodeList[index + 1].position); //两点之间创建一条线段判断
                this.line3List.push(tempLine);

            }
            if (this.nodeList.length > 1) {
                this.analyseAllLine();
            }

        },
        /**
         * 设置一个类型检查
         * @param {[type]} value [description]
         */
        setSearchRadius: function(value) {
            this.searchRadius = this.searchRadius.concat(value);
        },
        getSearchResult: function() {
            return this.searchResult;
        },
        /**
         * [setPatrol3DPath description]
         * @param {[type]} path [description]
         * @param {[type]} data [description]
         */
        setPatrol3DPath: function(path, data) {
            if (data !== undefined) {
                if (data.hasOwnProperty('walkSpeed') === true) {
                    this.walkSpeed = data.walkSpeed * 1;
                }
                if (data.hasOwnProperty('defalutY') === true) {
                    this.defalutY = data.defalutY * 1;
                }
            }

            this.stepNum = 0;
            this.hzThree.tweenRunning = true;
            this.setPathData(path.slice());

            this.hzThree.setControlMouseEnable(false);
            this.hzThree.setControlKeysEnable(false);
            this.hzThree.Controls.enablePan = false;
        },
        patrol3dToggle: function() {
            if (this.hzThree.tweenRunning === true) {
                this.pause();
                this.hzThree.tweenRunning = false;
                this.hzThree.Controls.rightMode = 1;
                this.hzThree.setControlMouseEnable(true);
            } else {
                this.goPlay();
                this.hzThree.tweenRunning = true;
                this.hzThree.Controls.rightMode = 0;
                this.hzThree.setControlMouseEnable(false);
            }

        },
        stopPatrol3d: function() {

            this.searchResult.removeAll();
            this.needCheckListOrigin.removeAll();
            this.needCheckList.removeAll();
            this.needSearchDataOrigin.removeAll();
            this.needSearchData.removeAll();
            this.line3List.removeAll(); // 实际线段数组

            this.searchPointList.removeAll(); //查找路径点数组
            this.ballList.removeAll();
            this.searchType.removeAll();
            this.stepNum = 0;
            this.hzThree.tweenRunning = true;
            if (this.rotationTween !== null) {
                this.rotationTween.stop();
                this.rotationTween = null;
            }
            if (this.positionTween != null) {
                this.positionTween.stop();
                this.positionTween = null;
            }
            this.hzThree.setControlMouseEnable(true);
            this.hzThree.setControlKeysEnable(true);
            this.hzThree.Controls.enablePan = true;
            this.hzThree.Controls.refreshLookAt();
            this.hzThree.Controls.rightMode = 0;
            if (this.line !== null) {
                this.scene.remove(this.line);
                this.line.dispose();
                this.line = null;
            }
            var e = new Events(HzEvent.PATROL_3D_OVER);
            this.dispatchEvent(e);
        }

    });



    return Patrol3D;

});