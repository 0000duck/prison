package com.hz.cds.video.test;

import java.text.SimpleDateFormat;
import java.util.Date;

import javax.jms.Connection;
import javax.jms.DeliveryMode;
import javax.jms.Destination;
import javax.jms.MessageProducer;
import javax.jms.Session;
import javax.jms.TextMessage;

import org.apache.activemq.ActiveMQConnectionFactory;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.hz.cds.video.message.FePatrolMessageBean;
import com.hz.cds.video.utils.PatrolConstants;
import com.hz.frm.net.netty.bean.MsgHeader;

/**
 * @version 2014-7-26 下午10:13:06
 * 
 */
public class MessageProductTest {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		try {

			// Create a ConnectionFactory
			ActiveMQConnectionFactory connectionFactory = new ActiveMQConnectionFactory("tcp://0.0.0.0:8001");
			// ActiveMQConnectionFactory connectionFactory = new
			// ActiveMQConnectionFactory("failover:(tcp://10.58.6.105:8001,tcp://10.58.6.106:8001,tcp://10.58.6.107:8001)");
			// Tell the producer to send the message

			SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			String text = "";
			String datetime = dateFormat.format(new Date());

			MsgHeader pnHeader = new MsgHeader();
			pnHeader.setMsgID(String.valueOf(new Date().getTime()));
			pnHeader.setMsgType(PatrolConstants.PATROLID);
			pnHeader.setLength(4);
			pnHeader.setSender("PATROLID");
			pnHeader.setRecevier("SERVER");
			pnHeader.setSendTime(datetime);

			Connection connection = connectionFactory.createConnection();
			connection.start();
			Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

			FePatrolMessageBean bean = new FePatrolMessageBean();
			bean.setPatrolDevId("45");//模拟设置巡更设备id
			bean.setPatrolTagId("1");//模拟设置门禁id
			bean.setPatrolTime(dateFormat.format(new Date()));

			JSONObject out = new JSONObject();
			out.put("header", pnHeader);
			out.put("body", JSON.toJSONString(bean));
			TextMessage message = session.createTextMessage(out.toJSONString());
			message.setIntProperty("cusNumber", 3223);
			Destination destination = session.createQueue("queue.fe.patrolid.in");
			MessageProducer producer = session.createProducer(destination);
			producer.setDeliveryMode(DeliveryMode.NON_PERSISTENT);
			producer.send(message);
			session.close();
			connection.close();
		} catch (Exception e) {
			System.out.println("Caught: " + e);
			e.printStackTrace();
		}
	}

}
