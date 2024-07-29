const nodemailer = require('nodemailer');

//Creating transponder to use nodemon
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }

});

function sendEmailWithAttachment(to, subject, text, htmlContent, attachmentPath, callback) {
    const mailOptions = {
        to,
        subject,
        text,
        html: htmlContent, // Use html key to include HTML content
        attachments: [
            { path: attachmentPath }
        ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            callback(error);
        } else {
            console.log('Email sent:', info.response);
            callback(null, info);
        }
    });
}

module.exports = { sendEmailWithAttachment };
