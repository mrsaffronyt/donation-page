import handler from './api/create-order.js';

const req = {
  method: 'POST',
  body: { amount: 100 }
};

const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Status:', this.statusCode);
    console.log('Data:', data);
  }
};

process.env.RAZORPAY_KEY_ID = 'rzp_test_123';
process.env.RAZORPAY_KEY_SECRET = 'secret_123';

handler(req, res).catch(console.error);
