package com.hz.cds.video.message;

import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.hz.db.service.IQueryByParamKeyService;
import com.hz.db.service.IUpdateService;
import com.hz.fe.bean.FeMessageHeader;
import com.hz.fe.service.FeMessageProcessAbstract;
import com.hz.frm.net.amq.service.MqMessageSendService;

/**
 * 
 * 
 * @author 
 *
 * @date 2017年01月16日
 */
@Service
@Transactional
public class FePatrolMessageProcess extends FeMessageProcessAbstract<FePatrolMessageBean> {
	private static final Logger logger = LoggerFactory.getLogger(FePatrolMessageProcess.class);
	
	@Resource
	private MqMessageSendService mqMessageSendService;
	
	@Resource
	private IQueryByParamKeyService queryService;
	
	@Resource
	private IUpdateService updateService;

	@Override
	public Class<FePatrolMessageBean> getBodyClass() {
		return FePatrolMessageBean.class;
	}

	@Override
	protected void process(FeMessageHeader feMessageHeader, FePatrolMessageBean msgBody) {
		String cusNumber = feMessageHeader.getCusNumber();
		msgBody.setCusNumber(cusNumber);
		String doorOrDeviceId = msgBody.getPatrolTagId();
		try {
			String policeId = "",
				   lineId = "";
			Map<String,Object> policeMap = getPoliceIdByDoorTagId(doorOrDeviceId,cusNumber);
			Map<String,Object> lineMap = getLineId(msgBody.getPatrolDevId(),cusNumber);
			if(policeMap !=null) policeId = policeMap.get("people_id").toString();
			if(lineMap   !=null)   lineId = lineMap.get("plr_line_id").toString();
			msgBody.setPoliceId(policeId);
			msgBody.setLineId(lineId);
			insertPatrolRecord(msgBody);
			String sendJsonString = "";
			if(getPatrolRecord(cusNumber,lineId) != null){
				sendJsonString = JSON.toJSONString(getPatrolRecord(cusNumber,lineId));
			}
			//向前端发送消息
			mqMessageSendService.sendInternalWebMessage(sendJsonString, feMessageHeader.getCusNumber(),feMessageHeader.getMsgType());
		} catch (Exception e) {
			logger.error("巡更消息处理失败， msgbody="+msgBody,e);
		}	
	}
	
	private Map<String,Object> getPatrolRecord(String cusNumber,String lineId) throws Exception{
		String requestData = "{sqlId: 'select_patrol_line_record',whereId:'1',params: {cusNumber:"+cusNumber+",lineId:'"+lineId+"'}}";
		List<Map<String, Object>> resultObj = queryService.query(JSON.parseObject(requestData));
		if(!resultObj.isEmpty()){
			return resultObj.get(0);
		}else{
			return null;			
		}
	}
	
	private void insertPatrolRecord(FePatrolMessageBean msgBody) throws Exception{
		JSONObject json = new JSONObject();
		JSONArray array = new JSONArray();
		array.add(JSON.toJSON(msgBody));
		json.put("sqlId","insert_patrol_record");
		json.put("params",array);
		updateService.updateByParamKey(json);
	}
	
	/**
	 * 根据门禁卡或其他签到设备ID 去 DOR_DOOR_CARD_DTLS 表查询警员编号
	 * @param doorOrDeviceId
	 * @return
	 * @throws Exception 
	 */
	private Map<String,Object> getPoliceIdByDoorTagId(String doorOrDeviceId,String cusNumber) throws Exception{
		String args = "{sqlId:'select_police_bydoorordeviceid',params: {cusNumber:"+cusNumber+",doorOrDeviceId:"+doorOrDeviceId+"}}";
		JSONObject param = JSONObject.parseObject(args);
		List<Map<String,Object>> list = queryService.query(param);
		if(list.isEmpty()) return null;
		return list.get(0);
	}
	/**
	 * 
	 * @param getLineId
	 * @return
	 * @throws Exception 
	 */
	private Map<String,Object> getLineId(String pointId,String cusNumber) throws Exception{
		String args = "{sqlId:'select_lineid_bypointid',params: {cusNumber:"+cusNumber+",pointId:"+pointId+"}}";
		JSONObject param = JSONObject.parseObject(args);
		List<Map<String,Object>> list = queryService.query(param);
		if(list.isEmpty()) return null;
		return list.get(0);
	}
}
