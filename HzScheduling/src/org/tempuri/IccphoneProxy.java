package org.tempuri;

public class IccphoneProxy implements org.tempuri.Iccphone {
  private String _endpoint = null;
  private org.tempuri.Iccphone iccphone = null;
  
  public IccphoneProxy() {
    _initIccphoneProxy();
  }
  
  public IccphoneProxy(String endpoint) {
    _endpoint = endpoint;
    _initIccphoneProxy();
  }
  
  private void _initIccphoneProxy() {
    try {
      iccphone = (new org.tempuri.IccphoneserviceLocator()).getIccphonePort();
      if (iccphone != null) {
        if (_endpoint != null)
          ((javax.xml.rpc.Stub)iccphone)._setProperty("javax.xml.rpc.service.endpoint.address", _endpoint);
        else
          _endpoint = (String)((javax.xml.rpc.Stub)iccphone)._getProperty("javax.xml.rpc.service.endpoint.address");
      }
      
    }
    catch (javax.xml.rpc.ServiceException serviceException) {}
  }
  
  public String getEndpoint() {
    return _endpoint;
  }
  
  public void setEndpoint(String endpoint) {
    _endpoint = endpoint;
    if (iccphone != null)
      ((javax.xml.rpc.Stub)iccphone)._setProperty("javax.xml.rpc.service.endpoint.address", _endpoint);
    
  }
  
  public org.tempuri.Iccphone getIccphone() {
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone;
  }
  
  public java.lang.String callOutQun(java.lang.String sheetNum, java.lang.String sendNum, java.lang.String sphone) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.callOutQun(sheetNum, sendNum, sphone);
  }
  
  public java.lang.String callOut(java.lang.String sheetNum, java.lang.String sendNum, java.lang.String sphone) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.callOut(sheetNum, sendNum, sphone);
  }
  
  public java.lang.String clearCall(java.lang.String sheetNum) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.clearCall(sheetNum);
  }
  
  public java.lang.String intoCall(java.lang.String curSheetNum, java.lang.String callingSheetNum) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.intoCall(curSheetNum, callingSheetNum);
  }
  
  public java.lang.String lisCall(java.lang.String curSheetNum, java.lang.String callingSheetNum) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.lisCall(curSheetNum, callingSheetNum);
  }
  
  public java.lang.String doGetUserPhone(java.lang.String sPhone) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.doGetUserPhone(sPhone);
  }
  
  public java.lang.String getRecordData(java.lang.String phoneNum, java.lang.String date0, java.lang.String date1) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.getRecordData(phoneNum, date0, date1);
  }
  
  public java.lang.String getRecordPathByFile(java.lang.String dirfile) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.getRecordPathByFile(dirfile);
  }
  
  public java.lang.String getSheetStatus(java.lang.String sheetNum) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.getSheetStatus(sheetNum);
  }
  
  public java.lang.String getDataBySQL(java.lang.String sSQL, java.lang.String sAction) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.getDataBySQL(sSQL, sAction);
  }
  
  public java.lang.String sendDX(java.lang.String phone, java.lang.String msg) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.sendDX(phone, msg);
  }
  
  public java.lang.String doErrorPhone(java.lang.String sPhone, int nAction) throws java.rmi.RemoteException{
    if (iccphone == null)
      _initIccphoneProxy();
    return iccphone.doErrorPhone(sPhone, nAction);
  }
  
  
}