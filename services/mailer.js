const nodemailer = require('nodemailer');
const config = require('../config');

const errorTemplate = (error, jobType, time) => {
    const html = `Hello,

    <p>We are unable to execute job due to following error:</p>
    Type: <strong>${jobType}</strong><br/>
    Message: <strong>${error.message}</strong><br/>
    Time: <strong>${time || 'NA'}</strong><br/>
    Error: 
    <pre> ${error.stack || error}</pre>

    Thanks
    
    `;
    return html;
}

const sendErrorMail = (error, name, time) => {
    const transporter = nodemailer.createTransport(config.mail.smtp);
    const mailOptions = {
        from: config.mail.emailFrom,
        to: config.mail.emailOnError,
        subject: config.mail.subjectForError,
        html: errorTemplate(error, name, time)
    };
    transporter.sendMail(mailOptions, error => {
        if (error) {
            return console.log(error);
        }
    });
}

module.exports = {
    sendErrorMail
}