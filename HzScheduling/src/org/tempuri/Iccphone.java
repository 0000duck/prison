/**
 * Iccphone.java
 *
 * This file was auto-generated from WSDL
 * by the Apache Axis 1.4 Apr 22, 2006 (06:55:48 PDT) WSDL2Java emitter.
 */

package org.tempuri;

public interface Iccphone extends java.rmi.Remote {
    public java.lang.String callOutQun(java.lang.String sheetNum, java.lang.String sendNum, java.lang.String sphone) throws java.rmi.RemoteException;
    public java.lang.String callOut(java.lang.String sheetNum, java.lang.String sendNum, java.lang.String sphone) throws java.rmi.RemoteException;
    public java.lang.String clearCall(java.lang.String sheetNum) throws java.rmi.RemoteException;
    public java.lang.String intoCall(java.lang.String curSheetNum, java.lang.String callingSheetNum) throws java.rmi.RemoteException;
    public java.lang.String lisCall(java.lang.String curSheetNum, java.lang.String callingSheetNum) throws java.rmi.RemoteException;
    public java.lang.String doGetUserPhone(java.lang.String sPhone) throws java.rmi.RemoteException;
    public java.lang.String getRecordData(java.lang.String phoneNum, java.lang.String date0, java.lang.String date1) throws java.rmi.RemoteException;
    public java.lang.String getRecordPathByFile(java.lang.String dirfile) throws java.rmi.RemoteException;
    public java.lang.String getSheetStatus(java.lang.String sheetNum) throws java.rmi.RemoteException;
    public java.lang.String getDataBySQL(java.lang.String sSQL, java.lang.String sAction) throws java.rmi.RemoteException;
    public java.lang.String sendDX(java.lang.String phone, java.lang.String msg) throws java.rmi.RemoteException;
    public java.lang.String doErrorPhone(java.lang.String sPhone, int nAction) throws java.rmi.RemoteException;
}
