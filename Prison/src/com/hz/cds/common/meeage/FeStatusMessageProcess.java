package com.hz.cds.common.meeage;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.hz.cds.common.utils.CommonConstants;
import com.hz.db.bean.UpdateResp;
import com.hz.db.service.IQueryService;
import com.hz.db.service.IUpdateService;
import com.hz.fe.bean.FeMessageHeader;
import com.hz.fe.service.FeMessageProcessAbstract;
import com.hz.frm.net.amq.service.MqMessageSendService;
import com.hz.frm.util.StringUtil;
/**
 * 报警消息的处理类
 * @author zhongxy
 * @date 2015-05-20
 */
@Service
@Transactional
public class FeStatusMessageProcess extends FeMessageProcessAbstract<FeStatusMessageBean> {
	final Logger logger = LoggerFactory.getLogger(FeStatusMessageProcess.class);
	@Resource
	private IUpdateService updateService;
	@Resource
	private IQueryService queryService;
	@Resource
	private MqMessageSendService mqMessageSendService;
	
	/** 摄像机 */
	private static final String CAMERA = "1";
	/** 报警器 */
	private static final String NET_ALARM = "2";
	/** 门禁 */
	private static final String DOOR = "3";
	/**对讲 */
	private static final String TALKBACK = "4";
	/** 数字广播 */
	private static final String BROADCAST = "5";
	
	@Override
	public Class<FeStatusMessageBean> getBodyClass() {
		return FeStatusMessageBean.class;
	}

	@Override
	protected void process(FeMessageHeader feMessageHeader, FeStatusMessageBean feStatusMessageBean) {
		String deviceType = feStatusMessageBean.getDeviceType(); //获取设备类型
		//为空直接返回
		if(StringUtil.isNull(deviceType)){
			logger.error("设备类型为空,无效数据");
			return;
		}
		
		String updateSql = "";
		
		switch(deviceType){
			case CAMERA://摄像机
				updateSql = "update_camera_status";
				break;
			case NET_ALARM://报警器
				updateSql = "update_alertor_status";
				break;
			case DOOR://门禁
				updateSql = "update_door_status";
				break;
			case TALKBACK:
				break;
			case BROADCAST://数字广播  0 空闲  1 离线 2 使用中
				updateSql = "update_broadcast_device_stts";
				break;
		}
		
		if(!updateSql.equals("")){
			update(feMessageHeader.getCusNumber(),feStatusMessageBean,updateSql);
		}else{
			logger.debug("未知的设备类型:"+deviceType);
		}
	}
	
	/**
	 * 更新设备状态
	 * @param cusNumber
	 * @param feAlarmMessageBean
	 */
	private void update(String cusNumber,FeStatusMessageBean feStatusMessageBean,String sqlid){
		//更新数据库
		JSONObject parasList = new JSONObject();
		parasList.put("device_status", feStatusMessageBean.getStatus());//设备状态
		parasList.put("cusNumber", cusNumber); // 机构编号
		parasList.put("device_id", feStatusMessageBean.getDeviceID());// 设备编号
		JSONArray jsonary = new JSONArray();
		jsonary.add(parasList);
		JSONObject jsonobj = new JSONObject();
		jsonobj.put("sqlId",sqlid);
		jsonobj.put("params", jsonary);

		UpdateResp resp = null;
		try {
			resp = updateService.updateByParamKey(jsonobj);
		} catch (Exception e) {
			logger.error("更新设备状态异常", e);
		}

		if (resp.getSuccess()) {
			logger.debug("更新设备状态成功");
			//追加设备类型
			parasList.put("device_type", feStatusMessageBean.getDeviceType());
			//前台消息推送
			mqMessageSendService.sendInternalWebMessage(parasList, cusNumber, CommonConstants.STATUS_MSG);
		}		
	}
}
