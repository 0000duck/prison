package com.hz.cds.talkback.alarm;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.hz.cache.util.RedisUtil;
import com.hz.cds.alarm.message.FeAlarmMessageBean;
import com.hz.cds.alarm.service.AlarmMessageService;
import com.hz.cds.talkback.util.TalkbackConfigUtil;
import com.hz.db.dao.UpdateDao;
import com.hz.db.service.IQueryService;
import com.hz.frm.net.amq.service.MqMessageSendService;
import com.hz.frm.utils.SequenceUtil;
import com.hz.sql.util.SqlConfigUtil;


/**
 * ITC MQ 消息处理（主要发送到前台）
 * @author xie.yh 2016.09.06
 *
 */
@Service(value="itcMessageHandleImpl")
public class ITCMessageHandleImpl implements IITCMQHandleService {
	final Logger logger = LoggerFactory.getLogger(ITCMessageHandleImpl.class);
	//---------不合理代码开始----------------
//	@Resource
//	private IAddService addService;
	@Resource
	private UpdateDao updateDao;
	@Resource
	private SequenceUtil sequenceUtil;
	@Resource
	private AlarmMessageService alarmMessageService;
	@Resource
	IQueryService queryService;
	@Resource
	private MqMessageSendService mqMessageSendService;
	//---------不合理代码结束----------------
	
	public ITCMessageHandleImpl () {
		ITCMQListener.onOneKeyTalkbackEvent("itcMessageHandleImpl");
		ITCMQListener.onTalkbackEvent("itcMessageHandleImpl");
		ITCMQListener.onAlarmForHelp("itcMessageHandleImpl");
		ITCMQListener.onoffevent("itcMessageHandleImpl");
//		ITCMQListener.onAlarmForHelp("ITCAlarmHandle");
	}

	@Override
	public void handle(JSONObject msgJSON) {
		
		//-----------垃圾逻辑开始--------------
		String jobType = msgJSON.getString("job_type");
		switch(jobType){
			case "alarmforhelp":
				if("start".equals(msgJSON.getString("job_status"))){
					talkAlarm(msgJSON);
				}else if("close".equals(msgJSON.getString("job_status"))){
					String caller = msgJSON.getString("caller");
					JSONObject jsonCaller = JSONObject.parseObject(caller);
					String name  = jsonCaller.getString("name");//对讲机名称
					logger.debug("对讲机"+name +"结束报警");
					//取消报警处理
				}
				break;
			case "onekeytalkbackevent":
				break;
			case "talkbackevent": //对讲事件推送
				logger.debug("对讲事件"+msgJSON.toJSONString());
				break;
			case "onoffevent"://终端上下线推送
				logger.debug("对讲设备上下线"+msgJSON.toJSONString());
				break;
		}
		//-----------垃圾逻辑结束--------------
//		String orgCode = ConfigUtil.get("PRISON_CODE_DEFAULT");
//		String msgType = ConfigUtil.get("ITC_MQ_MSG_TYPE");
//		WebSocketMessage webSocketMessage = new WebSocketMessage();
//		webSocketMessage.setMsgType(msgType);
//		webSocketMessage.setContent(msgJSON);
		// 向前台发送消息
//		MsgManager.sendNettyMessage(JSON.toJSONString(webSocketMessage), orgCode);
	}	
	/**
	 * 对讲报警处理
	 * @param msgJSON
	 */
	private void talkAlarm(JSONObject msgJSON){
//		String action = msgJSON.getString("job_status");
		String cusNumber = TalkbackConfigUtil.get("CUSNUMBER");
		String caller = msgJSON.getString("caller");
		JSONObject jsonCaller = JSONObject.parseObject(caller);
		String name  = jsonCaller.getString("name");//主叫的名字
		String telephone =  jsonCaller.getString("telephone");//主叫的号码
		String talkId  = getTalkbackInfo(cusNumber,telephone,"tbd_id"); //对讲设备编号
		if(talkId.equals(""))  talkId = telephone;
		String departmentId  =  getTalkbackInfo(cusNumber,telephone,"tbd_dept_id");
		
//		String addrs = getTalkbackInfo(cusNumber,telephone,"tbd_dvc_addrs");
		String addrs = name; //地点暂时写为与名称相同
		FeAlarmMessageBean alarmBean = new FeAlarmMessageBean();
		alarmBean.setAlarmID(talkId);
		alarmBean.setAlarmName(name);
		alarmBean.setAlarmAction("1");
//		alarmBean.setAlarmAction(action.equals("start")?"1":"2");
		alarmBean.setLevel("2");
		alarmBean.setAlarmDeviceType("3");
		alarmBean.setAlarmDeviceTypeName("对讲机报警");
		alarmBean.setAlarmType("1");
		alarmBean.setAlarmTypeName("对讲机一键求助报警");
		alarmBean.setAlarmTime(msgJSON.getString("datetime"));
		alarmBean.setRemark("对讲机"+ name + "发生报警");
		alarmBean.setAlarmAddrs(addrs);//报警地点
		alarmBean.setReceiveDeptId(departmentId);//通知部门
		try {
			insert(cusNumber,alarmBean);
			JSONObject rtnObj = alarmMessageService.alarmProcess(cusNumber,alarmBean);
			mqMessageSendService.sendInternalWebMessage(rtnObj,cusNumber,"Alarm001");
		} catch (Exception e) {
			logger.error("对讲报警消息处理失败 msgbody="+JSON.toJSONString(alarmBean),e);
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
			paramMap.put("ard_cus_number", cusNumber);
			paramMap.put("ard_record_id", ardRecordId);
			paramMap.put("ard_alertor_id", alarmId);
			paramMap.put("ard_alertor_name", feAlarmMessageBean.getAlarmName());
			paramMap.put("ard_alert_addrs", feAlarmMessageBean.getAlarmAddrs());
			paramMap.put("ard_alert_level", feAlarmMessageBean.getLevel());
			paramMap.put("ard_dvc_type", deviceType);
			paramMap.put("ard_alert_reason", alarmType);
			paramMap.put("ard_alert_time", feAlarmMessageBean.getAlarmTime());
			paramMap.put("ard_alert_stts", feAlarmMessageBean.getAlarmAction());
			paramMap.put("ard_remark", feAlarmMessageBean.getRemark());
			logger.debug(JSON.toJSONString(paramMap));
			updateDao.updateByParamKey(sql, paramMap);
		} catch (Exception e) {
			logger.error("插入对讲报警记录失败 msg="+JSON.toJSONString(feAlarmMessageBean),e);
		}
	}
	/**
	 * 获取对讲设备信息
	 * @param cusNumber
	 * @param otherid 
	 * @param key
	 * @return
	 */
	public String getTalkbackInfo(String cusNumber,String otherid,String key){
		String id="";
		Map<String, Object> talkbackMap=RedisUtil.getHashMap("tbk_talkback_id"+"_"+cusNumber, otherid);
		if(talkbackMap!=null){
			id=talkbackMap.get(key).toString();
		}
		return id;
	}
}
