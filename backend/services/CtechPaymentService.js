const axios = require('axios');
const FormData = require('form-data');

class CtechPaymentService {
  constructor(apiToken, registration, sandbox = true) {
    this.apiToken = apiToken;
    this.reg = registration;
    this.baseUrl = sandbox 
      ? 'https://api-sandbox.ctechpay.com/student'
      : 'https://api-sandbox.ctechpay.com/student'; // replace with `https://api.ctechpay.com/student` in prod
  }

  async createCardPaymentOrder(amount, options = {}) {
    const formData = new FormData();
    formData.append('token', this.apiToken);
    formData.append('registration', this.reg);
    formData.append('amount', amount.toString());

    if (options.merchantAttributes) {
      formData.append('merchantAttributes', 'true');
      if (options.redirectUrl) formData.append('redirectUrl', options.redirectUrl);
      if (options.cancelUrl) formData.append('cancelUrl', options.cancelUrl);
      if (options.cancelText) formData.append('cancelText', options.cancelText || 'Cancel payment');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/?endpoint=order`,
        formData,
        { headers: { ...formData.getHeaders() } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createMobilePayment(amount, phoneNumber) {
    const formData = new FormData();
    formData.append('airtel', '1');
    formData.append('token', this.apiToken);
    formData.append('registration', this.reg);
    formData.append('amount', amount.toString());
    formData.append('phone', this.formatPhoneNumber(phoneNumber));

    try {
      const response = await axios.post(
        `${this.baseUrl}/mobile/`,
        formData,
        { headers: { ...formData.getHeaders() } }
      );
      // console.log("Payment response: \n" + response.data.data.transaction.id);
      // console.log("Payment response: \n" + response.data.status.message);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkOrderStatus(registration, orderRef) {
    const formData = new FormData();
    formData.append('token', this.apiToken);
    formData.append('registration', this.reg);
    formData.append('orderRef', orderRef);

    try {
      let url;
      if (orderRef.startsWith('TRANS')) {
        $url = `https://api-sandbox.ctechpay.com/student/mobile/status?trans_id=${orderRef}`;
      } else {
        $url = `${this.baseUrl}/status/`;
      }
      console.log("url : " + url);
      const response = await axios.post(
        `${url}`,
        formData,
        { headers: { ...formData.getHeaders() } }
      );
      console.log(response);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkCardPaymentStatus(orderRef) {
    try {
      const response = await axios.post(this.baseUrl + '/status/', {
        token: this.token,
        registration: this.reg,
        orderRef: orderRef
      });

      return response.data;
    } catch (error) {
      throw new Error(`Payment status check failed: ${error.message}`);
    }
  }

  async checkMobilePaymentStatus(transactionId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/mobile/status?trans_id=${transactionId}`
      );
      console.log("service105: " + response.data.transaction_status + response.data.message);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  formatPhoneNumber(phone) {
    // Remove any spaces or special characters
    phone = phone.replace(/\s+/g, '');
    
    // If starts with 0, replace with +265
    if (phone.startsWith('0')) {
      return '+265' + phone.slice(1);
    }
    
    // If starts with 265, add +
    if (phone.startsWith('265')) {
      return '+' + phone;
    }
    
    // If already starts with +265, return as is
    if (phone.startsWith('+265')) {
      return phone;
    }
    
    throw new Error('Invalid phone number format');
  }

  handleError(error) {
    if (error.response) {
      return new Error(error.response.data.message || 'Payment gateway error');
    }
    return new Error('Network error while processing payment');
  }
}

module.exports = CtechPaymentService;