const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: `${process.env.EMAIL}`, // hostinger mail
    pass: `${process.env.PASS}`, //honstiner mail password
  },
});

async function sentMail(name, phone, email, city) {
  const forwarMail = await transporter.sendMail({
    from: '"Debt Relief India" <care@debtreliefindia.com>',
    to: `${process.env.EMAIL}`,
    subject: `Debt Relief App / New Lead | ${name}`,
    html: `
    <h3>New Lead Received</h3>
    <p><b>Full Name:</b> ${name}</p>
    <p><b><a href="tel:${phone}">Phone Number:</a></b> ${phone}</p>
    <p><b>Email:</b> ${email}</p>
    <p><b>City/State:</b> ${city}</p>
  `,
  });
  return forwarMail;
}
module.exports = sentMail;

// Test_api_key = rzp_test_SPqsfePbj0hUnn
// Test_secret_key = gxMYJkN7JXDVQSzOLrivtuhQ
