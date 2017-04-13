package com.hz.cds.door.message;

import javax.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.hz.cache.util.RedisUtil;
import com.hz.fe.bean.FeMessageHeader;
import com.hz.fe.service.FeMessageProcessAbstract;
import com.hz.frm.net.amq.service.MqMessageSendService;
/**
 * 报警消息的处理类
 * @author zhongxy
 * @date 2015-05-20
 */
@Service
@Transactional
public class FeDoorMessageProcess extends FeMessageProcessAbstract<FeDoorMessageBean> {
	final Logger logger = LoggerFactory.getLogger(FeDoorMessageProcess.class);
	public static final String cacheId = "dor_swipe_card_record";
	@Resource
	private MqMessageSendService mqMessageSendService;

	@Override
	public Class<FeDoorMessageBean> getBodyClass() {
		return FeDoorMessageBean.class;
	}

	@Override
	protected void process(FeMessageHeader feMessageHeader, FeDoorMessageBean feDoorMessageBean) {
		feDoorMessageBean.setCusNumber(feMessageHeader.getCusNumber());
		//刷卡数据缓存到redis
		RedisUtil.putBound(cacheId, JSONObject.toJSONString(feDoorMessageBean));
		//消息推送到前台
		try {
			mqMessageSendService.sendInternalWebMessage(feDoorMessageBean, feMessageHeader.getCusNumber(),feMessageHeader.getMsgType());
		} catch (Exception e) {
			logger.error("向Web端发送门禁消息异常 msgbody="+JSON.toJSONString(feDoorMessageBean),e);
		}		
	}
}
