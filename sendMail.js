const nodemailer = require("nodemailer");

async function sendEmail() {
  // Create a transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hoangvinh.academy.dautubenvung@gmail.com", // replace with your email
      pass: "kdfj zdoo xzqs mwig", // replace with your password or App Password
    },
  });

  // Email options
  let mailOptions = {
    from: '"Hoàng Vinh" hoangvinh.academy.dautubenvung@gmail.com', // sender address
    to: "silinh66@gmail.com", // list of receivers
    subject: "Hello from NodeJS", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
  });
}

sendEmail().catch(console.error);
