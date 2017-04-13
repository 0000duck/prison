package com.hz.cds.alarm.message;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.hz.cache.util.RedisUtil;
import com.hz.cds.alarm.cache.AlarmBaseDtlsCache;
import com.hz.cds.alarm.cache.NetworkAlarmBaseDtlsCache;
import com.hz.cds.alarm.service.AlarmMessageService;
import com.hz.cds.alarm.utils.AlarmConstants;
import com.hz.db.dao.UpdateDao;
import com.hz.db.service.IQueryService;
import com.hz.db.util.ReqParams;
import com.hz.fe.bean.FeMessageHeader;
import com.hz.fe.service.FeMessageProcessAbstract;
import com.hz.frm.net.amq.service.MqMessageSendService;
import com.hz.frm.util.DeviceTypeConst;
import com.hz.frm.utils.SequenceUtil;
import com.hz.sql.util.SqlConfigUtil;
/**
 * 报警消息的处理类
 * @author zhongxy
 * @date 2015-05-20
 */
@Service
@Transactional
public class FeAlarmMessageProcess extends FeMessageProcessAbstract<FeAlarmMessageBean> {
	final Logger logger = LoggerFactory.getLogger(FeAlarmMessageProcess.class);
	@Resource
	private UpdateDao updateDao;
	@Resource
	private MqMessageSendService mqMessageSendService;
	@Resource
	private SequenceUtil sequenceUtil;
	@Resource
	private NetworkAlarmBaseDtlsCache networkAlarmBaseDtlsCache;
	@Resource
	private AlarmMessageService alarmMessageService;
	@Resource
	private IQueryService queryService;
	@Resource
	private AlarmBaseDtlsCache alarmBaseDtlsCache;

	@Override
	public Class<FeAlarmMessageBean> getBodyClass() {
		return FeAlarmMessageBean.class;
	}

	@Override
	protected void process(FeMessageHeader feMessageHeader, FeAlarmMessageBean feAlarmMessageBean) {
		JSONObject rtnObj = null;
		
		try {
			String alarmAction = feAlarmMessageBean.getAlarmAction();

			// 暂时只处理报警的消息
			if (AlarmConstants.ALARM_ACTION_1.equals(alarmAction)) {
				//报警消息入库
				insert(feMessageHeader.getCusNumber(), feAlarmMessageBean);

				//联动处理
				rtnObj = alarmMessageService.alarmProcess(feMessageHeader.getCusNumber(),feAlarmMessageBean);

				//临时写死
				//feAlarmMessageBean.setAlarmTypeName("摄像机智能分析报警");

				mqMessageSendService.sendInternalWebMessage(rtnObj, feMessageHeader.getCusNumber(),feMessageHeader.getMsgType());
			} else {
				// 取消报警暂时不处理
			}
		} catch (Exception e) {
			logger.error("报警消息处理失败 msgbody="+JSON.toJSONString(feAlarmMessageBean),e);
		}		
	}


	/**
	 * 插入报警记录
	 * @param cusNumber
	 * @param feAlarmMessageBean
	 */
	private void insert(String cusNumber,FeAlarmMessageBean feAlarmMessageBean){
		String sql=SqlConfigUtil.getSql("insert_alt_alert_record_dtls");
		Map<String, Object> paramMap=new HashMap<String,Object>();
		try {
			String ardRecordId=sequenceUtil.getSequence("alt_alert_record_dtls", "ard_record_id");
			feAlarmMessageBean.setRecordId(ardRecordId);
			String alarmId=feAlarmMessageBean.getAlarmID();
			String deviceType=feAlarmMessageBean.getAlarmDeviceType();
			String alarmType=feAlarmMessageBean.getAlarmType();
			Map<String, Object> where = new LinkedHashMap<String, Object>();
			where.put("type_id", "securityDeviceType");
			where.put("key", deviceType);
			String deviceTypeName="";

			try {
				deviceTypeName=RedisUtil.getObject("ConstantCodeDtls", where, "value").toString();
			} catch (Exception e) {
				logger.error("获取报警设备类型名称出错",e);
			}

			String alarmTypeName=getAlarmTypeName(deviceType,alarmType);;
			feAlarmMessageBean.setAlarmDeviceTypeName(deviceTypeName);
			feAlarmMessageBean.setAlarmTypeName(alarmTypeName);

			String alarmLevel="1";
			Map<String, Object> levelMap=getAlarmLevel(cusNumber,deviceType,alarmId,feAlarmMessageBean.getAlarmTime());

			if(levelMap!=null){
				alarmLevel=levelMap.get("lhs_level").toString();
				feAlarmMessageBean.setLevel(alarmLevel);
				String receiveDeptId=levelMap.get("receive_dept_id").toString();
				feAlarmMessageBean.setReceiveDeptId(receiveDeptId);
			}

			String deptId = alarmBaseDtlsCache.getAlarmDepartmentId(cusNumber, alarmId, deviceType);
			String alarmName = alarmBaseDtlsCache.getAlarmName(cusNumber, alarmId, deviceType);
			String alarmAddrs = alarmBaseDtlsCache.getAlarmAddress(cusNumber, alarmId, deviceType);

			feAlarmMessageBean.setLevel(alarmLevel);
			feAlarmMessageBean.setDeptId(deptId);
			feAlarmMessageBean.setAlarmName(alarmName);;
			feAlarmMessageBean.setAlarmAddrs(alarmAddrs);

			paramMap.put("ard_cus_number", cusNumber);
			paramMap.put("ard_record_id", ardRecordId);
			paramMap.put("ard_alertor_id", alarmId);
			paramMap.put("ard_alertor_name", alarmName);
			paramMap.put("ard_alert_addrs", alarmAddrs);
			paramMap.put("ard_alert_level", alarmLevel);
			paramMap.put("ard_dvc_type", deviceType);
			paramMap.put("ard_alert_reason", alarmType);
			paramMap.put("ard_alert_time", feAlarmMessageBean.getAlarmTime());
			paramMap.put("ard_alert_stts", feAlarmMessageBean.getAlarmAction());
			paramMap.put("ard_remark", feAlarmMessageBean.getRemark());
			paramMap.put("ard_img_src", feAlarmMessageBean.getAlarmImg());
			logger.debug(JSON.toJSONString(paramMap));
			updateDao.updateByParamKey(sql, paramMap);
		} catch (Exception e) {
			logger.error("插入报警记录失败 msg="+JSON.toJSONString(feAlarmMessageBean),e);
		}
	}
	
	private Map<String, Object> getAlarmLevel(String cusNumber,String deviceType,String alarmId,String alarmTime){
    	try {
			JSONObject queryJSON = new JSONObject();
			queryJSON.put(ReqParams.SQL_ID, "select_level_handle_set");
			queryJSON.put(ReqParams.WHERE_ID, "1");
			List<String> paraList=new ArrayList<String>();
			paraList.add(cusNumber);
			paraList.add(deviceType);
			paraList.add(alarmId);
			paraList.add(alarmTime);
			paraList.add(alarmTime);
			queryJSON.put(ReqParams.PARAMS, paraList.toArray());
			List<Map<String, Object>> queryData = queryService.query(queryJSON);
			if(queryData!=null&&queryData.size()>0){
				return queryData.get(0);
			}
		} catch (Exception e) {
			logger.error("查询报警等级出错",e);
		}
    	return null;
	}
	
	/**
	 * 获取报警类型名称
	 * @param deviceType
	 * @param alarmType
	 * @return
	 */
	private String getAlarmTypeName(String deviceType,String alarmType){
		int dvcType=Integer.valueOf(deviceType).intValue();
		String alarmTypeName="";
		if(dvcType==DeviceTypeConst.CAMERA_TYPE){//摄像机报警器

		}else if(dvcType==DeviceTypeConst.NETWORK_ALARM_TYPE){//网络报警器
			
		}
		return alarmTypeName;
	}
	
/*	*//**
	 * 获取报警器的名称
	 * @param cusNumber
	 * @param alarmId
	 * @param deviceType
	 * @return
	 *//*
	private String getAlarmDeviceName(String cusNumber,String alarmId,String deviceType){
		int dvcType=Integer.valueOf(deviceType).intValue();
		String deviceName="";
		if(dvcType==DeviceTypeConst.CAMERA_TYPE){//摄像机报警器
			deviceName=alarmMessageService.getCameraInfo(cusNumber, alarmId,"cbd_name");
		}else if(dvcType==DeviceTypeConst.NETWORK_ALARM_TYPE){//网络报警器
			deviceName=alarmMessageService.getNetworkAlarmInfo(cusNumber, alarmId,"nbd_name");
		}
		return deviceName;
	}*/
	
/*	*//**
	 * 获取报警器设备的地址
	 * @param cusNumber
	 * @param alarmId
	 * @param deviceType
	 * @return
	 *//*
	private String getAlarmDeviceAddr(String cusNumber,String alarmId,String deviceType){
		int dvcType=Integer.valueOf(deviceType).intValue();
		String deviceAddrs="";
		if(dvcType==DeviceTypeConst.CAMERA_TYPE){//摄像机报警器
			deviceAddrs=alarmMessageService.getCameraInfo(cusNumber, alarmId,"cbd_dvc_addrs");
		}else if(dvcType==DeviceTypeConst.NETWORK_ALARM_TYPE){//网络报警器
			deviceAddrs=alarmMessageService.getNetworkAlarmInfo(cusNumber, alarmId,"nbd_dvc_addrs");
		}
		return deviceAddrs;
	}*/

}
