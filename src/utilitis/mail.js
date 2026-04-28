// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 487,
//   secure: false,
//   auth: {
//     user: `${process.env.EMAIL}`,
//     pass: `${process.env.PASS}`,
//   },
// });

// async function sentMail(name, phone, email, city) {
//   const forwarMail = await transporter.sendMail({
//     from: '"Debt Relief India" <care@debtreliefindia.com>',
//     to: `${process.env.EMAIL}`,
//     subject: `Debt Relief App / New Lead | ${name}`,
//     html: `
//     <h3>New Lead Received</h3>
//     <p><b>Full Name:</b> ${name}</p>
//     <p><b><a href="tel:${phone}">Phone Number:</a></b> ${phone}</p>
//     <p><b>Email:</b> ${email}</p>
//     <p><b>City/State:</b> ${city}</p>
//   `,
//   });
//   return forwarMail;
// }
// module.exports = sentMail;

// // Test_api_key = rzp_test_SPqsfePbj0hUnn
// // Test_secret_key = gxMYJkN7JXDVQSzOLrivtuhQ
// require("dotenv").config();
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: "smtp.hostinger.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.PASS,
//   },
//   tls: {
//     rejectUnauthorized: false,
//   },
// });
// async function sentMail(
//   name,
//   phone,
//   email,
//   city,
//   employment_status,
//   total_debt_value,
//   call_back_time,
//   language,
//   call_type,
//   message,
// ) {
//   const htmlTemplate = `
// <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:20px;font-family:Arial,sans-serif;">
//   <tr>
//     <td align="center">

//       <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:20px;">

//         <tr>
//           <td style="font-size:20px;font-weight:bold;color:#333;padding-bottom:20px;">
//             Debt Relief App / New Lead | ${name}
//           </td>
//         </tr>

//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Full Name</div>
//             <div style="margin-top:5px;color:#111;">${name}</div>
//           </td>
//         </tr>

//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Phone Number</div>
//             <div style="margin-top:5px;color:#111;">${phone}</div>
//           </td>
//         </tr>

//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Email</div>
//             <div style="margin-top:5px;">
//               <a href="mailto:${email}" style="color:#1a73e8;">
//                 ${email}
//               </a>
//             </div>
//           </td>
//         </tr>

//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">City/State</div>
//             <div style="margin-top:5px;color:#111;">${city}</div>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Employment Status</div>
//             <div style="margin-top:5px;color:#111;">${employment_status}</div>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Total Debt Value</div>
//             <div style="margin-top:5px;color:#111;">${total_debt_value}</div>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Call Back Time</div>
//             <div style="margin-top:5px;color:#111;">${call_back_time}</div>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Language</div>
//             <div style="margin-top:5px;color:#111;">${call_type}</div>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Call Type</div>
//             <div style="margin-top:5px;color:#111;">${language}</div>
//           </td>
//         </tr>
//         <tr>
//           <td style="padding:10px 0;">
//             <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Message</div>
//             <div style="margin-top:5px;color:#111;">${message}</div>
//           </td>
//         </tr>

//       </table>

//     </td>
//   </tr>
// </table>
// `;

//   const info = await transporter.sendMail({
//     from: `"Debt Relief India" <${process.env.EMAIL}>`,
//     to: process.env.EMAIL,
//     subject: "New Lead",
//     html: htmlTemplate,
//   });
//   console.log("info", info);
// }

// module.exports = sentMail;

require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
async function sentMail(
  name,
  phone,
  email,
  city,
  employment_status,
  total_debt_value,
  call_back_time,
  language,
  call_type,
  message,
) {
  const htmlTemplate = `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:20px;font-family:Arial,sans-serif;">
  <tr>
    <td align="center">
      
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;padding:20px;">

        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Full Name</div>
            <div style="margin-top:5px;color:#111;">${name}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Phone Number</div>
            <div style="margin-top:5px;color:#111;">${phone}</div>
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Email</div>
            <div style="margin-top:5px;">
              <a href="mailto:${email}" style="color:#1a73e8;">
                ${email}
              </a>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">City/State</div>
            <div style="margin-top:5px;color:#111;">${city}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Employment Status</div>
            <div style="margin-top:5px;color:#111;">${employment_status}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Total Debt Value</div>
            <div style="margin-top:5px;color:#111;">${total_debt_value}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Call Back Time</div>
            <div style="margin-top:5px;color:#111;">${call_back_time}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Language</div>
            <div style="margin-top:5px;color:#111;">${call_type}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Call Type</div>
            <div style="margin-top:5px;color:#111;">${language}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-weight:bold;color:#555;background:#F4F6F8;padding:5px">Message</div>
            <div style="margin-top:5px;color:#111;">${message}</div>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
`;

  const info = await transporter.sendMail({
    from: `"Debt Relief India" <${process.env.EMAIL}>`,
    to: process.env.EMAIL,
    subject: `Debt Relief App / New Lead | ${name}`,
    html: htmlTemplate,
  });
  console.log("info", info);
}

module.exports = sentMail;
