define(function(require){
	if(top.userInfodd){
		return top.userInfodd;
	}
	var ls = require('frm/localStorage');
	var userInfo = ls.getItem('userInfo');
	!userInfo&&(top.location.href=ctx+"login.html");
	top.userInfodd={
			userId:userInfo.id,//用户ID
			userName:userInfo.user_name,//登录用户名
			cusNumber:userInfo.cus_number,//登录用户所属机构号
			cusNumberName:userInfo.cus_number_name,//登录用户所属机构名称
			dataAuth:userInfo.data_auth,//登录用户拥有权限 （数据权限:0本辖区（默认）1全监狱 2全省3超级管理员）
			deptId:userInfo.dept_id,//登录用户所属部门IDdept_id
			deptName:userInfo.dept_name,//登录用户所属部门名称
			sysAdmin:userInfo.admin,//是否为系统管理员
			childDep:userInfo.childDep,//登录用户所属部门的子级部门
			admin:userInfo.ubd_admin,//超级管理员
			doorpwd:userInfo.doorpwd,//门禁开关门密码
			doorAvoid:userInfo.dooravoid//是否免密
		};
	return top.userInfodd;
});