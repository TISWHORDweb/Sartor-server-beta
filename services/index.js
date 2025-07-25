
const LOG_DEBUG = true
const emailTemple = require("./services.email");


exports.sendNewEmployeeCredentials = (data) => {
    new emailTemple(data.email).who("New Employee")
        .body(`
            <p>Dear ${data.name},</p>
            
            <p>We're pleased to inform you that you've been assigned a <strong>Sartor role</strong> in our system.</p>
            
            <div style="background: #f8f9fb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>Your login credentials:</strong></p>
                <p style="margin: 5px 0;">Email: <strong>${data.email}</strong></p>
                <p style="margin: 5px 0;">Password: <strong>${data.password}</strong></p>
            </div>
            
            <p>To access your account:</p>
            <ol style="margin: 15px 0; padding-left: 20px;">
                <li>Go to our login page at <a href="https://app.sartorcrm.com/login" style="color: #1a237e;">app.sartorcrm.com/login</a></li>
                <li>Enter your email and the temporary password provided above</li>
                <li>You'll be prompted to change your password after first login</li>
            </ol>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="https://app.sartorcrm.com/login" style="display: inline-block; background: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 500;">Login to Your Account</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;"><strong>Important:</strong> For security reasons, please change your password immediately after logging in for the first time.</p>
            
            <p>If you need any assistance, please contact our support team at <a href="mailto:support@sartorcrm.com" style="color: #1a237e;">support@sartorcrm.com</a>.</p>
            
            <p>Best regards,<br>The Sartor CRM Team</p>
        `)
        .subject(`Welcome to Sartor CRM - Your Account Credentials`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};


exports.sendLoginNotification = (data) => {
    new emailTemple(data.email).who("User")
        .body(`
            <p>Hello ${data.name},</p>
            
            <p>We detected a login to your <strong>Sartor CRM</strong> account:</p>
            
            <div style="background: #f8f9fb; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>Login Details:</strong></p>
                <p style="margin: 5px 0;">Time: <strong>${data.loginTime}</strong></p>
                // <p style="margin: 5px 0;">Device: <strong>${data.device || 'Unknown'}</strong></p>
                // <p style="margin: 5px 0;">Location: <strong>${data.location || 'Unknown'}</strong></p>
            </div>
            
            <p>If this was you, you can safely ignore this email.</p>
            
            <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 6px; border-left: 4px solid #ef4444;">
                <strong>Security Alert:</strong> If you did not log in, your account may be compromised. 
                Please <a href="${data.passwordResetLink}" style="color: #1a237e; font-weight: 500;">Login to reset your password immediately</a> and contact support.
            </p>
            
            <p>For security questions, contact <a href="mailto:support@sartorcrm.com" style="color: #1a237e;">support@sartorcrm.com</a>.</p>
            
            <p>Stay secure,<br><strong>The Sartor CRM Team</strong></p>
        `)
        .subject(`🔒 Login Alert: New Access to Your Account`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};