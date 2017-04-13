/**
 * IccphoneserviceLocator.java
 *
 * This file was auto-generated from WSDL
 * by the Apache Axis 1.4 Apr 22, 2006 (06:55:48 PDT) WSDL2Java emitter.
 */

package org.tempuri;

public class IccphoneserviceLocator extends org.apache.axis.client.Service implements org.tempuri.Iccphoneservice {

    public IccphoneserviceLocator() {
    }


    public IccphoneserviceLocator(org.apache.axis.EngineConfiguration config) {
        super(config);
    }

    public IccphoneserviceLocator(java.lang.String wsdlLoc, javax.xml.namespace.QName sName) throws javax.xml.rpc.ServiceException {
        super(wsdlLoc, sName);
    }

    // Use to get a proxy class for IccphonePort
    private java.lang.String IccphonePort_address = "http://10.43.239.31:8888/ccphone.dll/soap/Iccphone";

    public java.lang.String getIccphonePortAddress() {
        return IccphonePort_address;
    }

    // The WSDD service name defaults to the port name.
    private java.lang.String IccphonePortWSDDServiceName = "IccphonePort";

    public java.lang.String getIccphonePortWSDDServiceName() {
        return IccphonePortWSDDServiceName;
    }

    public void setIccphonePortWSDDServiceName(java.lang.String name) {
        IccphonePortWSDDServiceName = name;
    }

    public org.tempuri.Iccphone getIccphonePort() throws javax.xml.rpc.ServiceException {
       java.net.URL endpoint;
        try {
            endpoint = new java.net.URL(IccphonePort_address);
        }
        catch (java.net.MalformedURLException e) {
            throw new javax.xml.rpc.ServiceException(e);
        }
        return getIccphonePort(endpoint);
    }

    public org.tempuri.Iccphone getIccphonePort(java.net.URL portAddress) throws javax.xml.rpc.ServiceException {
        try {
            org.tempuri.IccphonebindingStub _stub = new org.tempuri.IccphonebindingStub(portAddress, this);
            _stub.setPortName(getIccphonePortWSDDServiceName());
            return _stub;
        }
        catch (org.apache.axis.AxisFault e) {
            return null;
        }
    }

    public void setIccphonePortEndpointAddress(java.lang.String address) {
        IccphonePort_address = address;
    }

    /**
     * For the given interface, get the stub implementation.
     * If this service has no port for the given interface,
     * then ServiceException is thrown.
     */
    public java.rmi.Remote getPort(Class serviceEndpointInterface) throws javax.xml.rpc.ServiceException {
        try {
            if (org.tempuri.Iccphone.class.isAssignableFrom(serviceEndpointInterface)) {
                org.tempuri.IccphonebindingStub _stub = new org.tempuri.IccphonebindingStub(new java.net.URL(IccphonePort_address), this);
                _stub.setPortName(getIccphonePortWSDDServiceName());
                return _stub;
            }
        }
        catch (java.lang.Throwable t) {
            throw new javax.xml.rpc.ServiceException(t);
        }
        throw new javax.xml.rpc.ServiceException("There is no stub implementation for the interface:  " + (serviceEndpointInterface == null ? "null" : serviceEndpointInterface.getName()));
    }

    /**
     * For the given interface, get the stub implementation.
     * If this service has no port for the given interface,
     * then ServiceException is thrown.
     */
    public java.rmi.Remote getPort(javax.xml.namespace.QName portName, Class serviceEndpointInterface) throws javax.xml.rpc.ServiceException {
        if (portName == null) {
            return getPort(serviceEndpointInterface);
        }
        java.lang.String inputPortName = portName.getLocalPart();
        if ("IccphonePort".equals(inputPortName)) {
            return getIccphonePort();
        }
        else  {
            java.rmi.Remote _stub = getPort(serviceEndpointInterface);
            ((org.apache.axis.client.Stub) _stub).setPortName(portName);
            return _stub;
        }
    }

    public javax.xml.namespace.QName getServiceName() {
        return new javax.xml.namespace.QName("http://tempuri.org/", "Iccphoneservice");
    }

    private java.util.HashSet ports = null;

    public java.util.Iterator getPorts() {
        if (ports == null) {
            ports = new java.util.HashSet();
            ports.add(new javax.xml.namespace.QName("http://tempuri.org/", "IccphonePort"));
        }
        return ports.iterator();
    }

    /**
    * Set the endpoint address for the specified port name.
    */
    public void setEndpointAddress(java.lang.String portName, java.lang.String address) throws javax.xml.rpc.ServiceException {
        
if ("IccphonePort".equals(portName)) {
            setIccphonePortEndpointAddress(address);
        }
        else 
{ // Unknown Port Name
            throw new javax.xml.rpc.ServiceException(" Cannot set Endpoint Address for Unknown Port" + portName);
        }
    }

    /**
    * Set the endpoint address for the specified port name.
    */
    public void setEndpointAddress(javax.xml.namespace.QName portName, java.lang.String address) throws javax.xml.rpc.ServiceException {
        setEndpointAddress(portName.getLocalPart(), address);
    }

}
