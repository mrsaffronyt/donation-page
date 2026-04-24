import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_ShPzxbuah8gXkM',
  key_secret: 'UuK1GzB0jR9K8S1y4rV8lHU5',
});

razorpay.orders.create({
  amount: 100,
  currency: 'INR',
  receipt: 'test_rcpt_1'
}).then(console.log).catch(err => console.error(JSON.stringify(err, null, 2)));
