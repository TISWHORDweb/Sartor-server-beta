
const LOG_DEBUG = true
const emailTemple = require("./services.zoho.email");


exports.sendNewEmployeeCredentials = (data) => {
    new emailTemple(data.email).who("New Employee")
        .body(`
            <p>Dear ${data.name},</p>
            
            <p>We're pleased to inform you that you've been assigned a <strong>${data.role} role</strong> in our system.</p>
            
            <div style="background: #f8f9fb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>Your login credentials:</strong></p>
                <p style="margin: 5px 0;">Email: <strong>${data.email}</strong></p>
                <p style="margin: 5px 0;">Password: <strong>${data.password}</strong></p>
            </div>
            
            <p>To access your account:</p>
            <ol style="margin: 15px 0; padding-left: 20px;">
                <li>Go to our login page at <a href="${process.env.LOGIN_URL}" style="color: #1a237e;">${process.env.LOGIN_URL}</a></li>
                <li>Enter your email and the temporary password provided above</li>
                <li>You'll be prompted to change your password after first login</li>
            </ol>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.LOGIN_URL}" style="display: inline-block; background: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 500;">Login to Your Account</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b;"><strong>Important:</strong> For security reasons, please change your password immediately after logging in for the first time.</p>
            
            <p>If you need any assistance, please contact our support team at <a href="mailto:${process.env.EMAIL_SUPPORT}" style="color: #1a237e;">${process.env.EMAIL_SUPPORT}</a>.</p>
            
            <p>Best regards,<br>The Sartor CRM Team</p>
        `)
        .subject(`Welcome to Sartor CRM - Your Account Credentials`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};


exports.sendLoginNotification = (data) => {
    const now = new Date().toLocaleString(); // local date & time

    new emailTemple(data.email).who("User")
        .body(`
            <p>Hello ${data.name},</p>

            <p>This is a security notification from <strong>Sartor CRM</strong>.</p>

            <p>We noticed a login to your account on:</p>

            <div style="background: #f8f9fb; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>Date:</strong> ${now}</p>
            </div>

            <p>If you recognize this activity, no further action is required.</p>

            <p style="font-size: 14px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 6px; border-left: 4px solid #ef4444;">
                <strong>Security Reminder:</strong> If you did <em>not</em> log in, please secure your account immediately by resetting your password and contacting support.
            </p>

            <p>For help, reach us anytime at 
            <a href="mailto:${process.env.EMAIL_SUPPORT}" style="color: #1a237e;">${process.env.EMAIL_SUPPORT}</a>.</p>

            <p>Stay safe,<br><strong>The Sartor CRM Team</strong></p>
        `)
        .subject(`🔒 Login Alert: New Access to Your Account`)
        .send()
        .then(r => LOG_DEBUG ? console.log(r) : null);
};

exports.sendPasswordResetMail = (data) => {
    const now = new Date().toLocaleString(); // local date & time

    new emailTemple(data.email).who("User")
        .body(`
            <p>Hello ${data.name},</p>

            <p>You requested a password reset for your <strong>Sartor CRM</strong> account.</p>

            <p>Your temporary password has been generated. Please use it to log in and then change your password immediately.</p>

            <div style="
                background: #f8f9fb; 
                padding: 16px; 
                border-radius: 6px; 
                margin: 20px 0; 
                border-left: 4px solid #1a237e;
            ">
                <p style="margin: 5px 0;">
                    <strong>Temporary Password:</strong> 
                    <span style="font-family: monospace; font-size: 16px;">${data.tempPassword}</span>
                </p>
                <p style="margin: 5px 0;"><strong>Issued on:</strong> ${now}</p>
            </div>

            <p>
                You can log in using the button below:
            </p>

            <a href="${process.env.LOGIN_URL}" style="
                display: inline-block;
                background-color: #1a237e;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 6px;
                text-decoration: none;
                margin: 10px 0;
                font-weight: bold;
            ">
                Log In
            </a>

            <p style="
                font-size: 14px; 
                color: #ef4444; 
                background: #fef2f2; 
                padding: 12px; 
                border-radius: 6px; 
                border-left: 4px solid #ef4444;
            ">
                <strong>Important:</strong> For your security, make sure to update this temporary password after your next login.
            </p>

            <p>If you did not request this change, please contact support immediately.</p>

            <p>Need help? Reach us at 
            <a href="mailto:${process.env.EMAIL_SUPPORT}" style="color: #1a237e;">
                ${process.env.EMAIL_SUPPORT}
            </a>.</p>

            <p>Stay secure,<br><strong>The Sartor CRM Team</strong></p>
        `)
        .subject(`🔐 Password Reset Request – Your Temporary Password`)
        .send()
        .then(r => LOG_DEBUG ? console.log(r) : null);
};

exports.sendTaskAssignmentNotification = (data) => {
    const dueDate = data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'Not specified';

    new emailTemple(data.email).who("User")
        .body(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <p>Hello <strong>${data.userName}</strong>,</p>

                <p>You have been assigned a new task by <strong>${data.managerName}</strong>.</p>

                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0369a1;">
                    <h3 style="margin-top: 0; color: #0369a1;">📋 Task Details</h3>
                    <p style="margin: 8px 0;"><strong>Task Title:</strong> ${data.taskTitle}</p>
                    <p style="margin: 8px 0;"><strong>Due Date:</strong> ${dueDate}</p>
                    ${data.description ? `<p style="margin: 8px 0;"><strong>Description:</strong> ${data.description}</p>` : ''}
                </div>

                <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Assigned By:</strong> ${data.managerName}</p>
                    <p style="margin: 5px 0;"><strong>Assigned On:</strong> ${new Date().toLocaleString()}</p>
                </div>

                <p>Please review the task details and start working on it as soon as possible.</p>

                <p style="font-size: 14px; color: #059669; background: #f0fdf4; padding: 12px; border-radius: 6px; border-left: 4px solid #059669;">
                    <strong>💡 Tip:</strong> You can update the task status and add comments in the Sartor CRM system.
                </p>

                <p>Need help with this task? Contact your manager or reach out to 
                <a href="mailto:${process.env.EMAIL_SUPPORT}" style="color: #0369a1;">${process.env.EMAIL_SUPPORT}</a>.</p>

                <p>Best regards,<br><strong>The Sartor CRM Team</strong></p>
            </div>
        `)
        .subject(`📋 New Task Assigned: ${data.taskTitle}`)
        .send()
        .then(r => LOG_DEBUG ? console.log(r) : null);
};

exports.sendNewLeadNotification = (leadData, salesRepData, email) => {

    const leadDate = new Date().toLocaleString();

    new emailTemple(email).who("Team")
        .body(`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <p>Hello Team,</p>

                    <p>Great news! <strong>${salesRepData.fullName}</strong> has captured a new lead.</p>

                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0369a1;">
                        <h3 style="margin-top: 0; color: #0369a1;">🎯 New Lead Details</h3>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px;">
                            <div>
                                <p style="margin: 8px 0;"><strong>Lead Name:</strong><br>${leadData.name}</p>
                                <p style="margin: 8px 0;"><strong>Email:</strong><br>${leadData.email}</p>
                                <p style="margin: 8px 0;"><strong>Phone:</strong><br>${leadData.phone || 'Not provided'}</p>
                                <p style="margin: 8px 0;"><strong>State:</strong><br>${leadData.state}</p>
                            </div>
                            <div>
                                <p style="margin: 8px 0;"><strong>Business Type:</strong><br>${leadData.type}</p>
                                <p style="margin: 8px 0;"><strong>Number of Stores:</strong><br>${leadData.stores}</p>
                                <p style="margin: 8px 0;"><strong>Deal Size:</strong><br>${leadData.dealSize}</p>
                                <p style="margin: 8px 0;"><strong>Status:</strong><br>${leadData.status}</p>
                            </div>
                        </div>

                        ${leadData.address ? `
                        <div style="margin-top: 15px;">
                            <p style="margin: 8px 0;"><strong>Address:</strong><br>${leadData.address}</p>
                        </div>
                        ` : ''}

                        ${leadData.notes ? `
                        <div style="margin-top: 15px; background: #f8f9fa; padding: 12px; border-radius: 6px;">
                            <p style="margin: 8px 0;"><strong>Notes:</strong><br>${leadData.notes}</p>
                        </div>
                        ` : ''}
                    </div>

                    <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Sales Representative:</strong> ${salesRepData.fullName}</p>
                        <p style="margin: 5px 0;"><strong>Lead Captured On:</strong> ${leadDate}</p>
                        <p style="margin: 5px 0;"><strong>Lead ID:</strong> #${leadData.userId || 'N/A'}</p>
                    </div>

                    <p style="font-size: 14px; color: #059669; background: #f0fdf4; padding: 12px; border-radius: 6px; border-left: 4px solid #059669;">
                        <strong>🚀 Action Required:</strong> Please review this lead and follow up with ${salesRepData.fullName} for next steps.
                    </p>

                    <p>This lead has been automatically added to your CRM system for tracking.</p>

                    <p>Best regards,<br><strong>The Sartor CRM Team</strong></p>
                </div>
            `)
        .subject(`🎯 New Lead Captured: ${leadData.name} by ${salesRepData.fullName}`)
        .send()
        .then(r => LOG_DEBUG ? console.log(`Lead notification sent to ${email}:`, r) : null)
        .catch(error => console.error(`Failed to send lead notification to ${email}:`, error));

};

exports.sendLPOEmail = (lpoData, createdByData, recipientEmail) => {
    const lpoDate = new Date().toLocaleString();

    const totalProducts = lpoData.product.length;
    const totalQuantity = lpoData.product.reduce((sum, item) => sum + (item.quantity || 0), 0);

    new emailTemple(recipientEmail).who("Team")
        .body(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <p>Hello Team,</p>

                <p>A new Local Purchase Order (LPO) has been created by <strong>${createdByData.fullName}</strong>.</p>

                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0369a1;">
                    <h3 style="margin-top: 0; color: #0369a1;">📋 LPO Summary</h3>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                            <div style="font-size: 24px; color: #0369a1; font-weight: bold;">${totalProducts}</div>
                            <div style="font-size: 14px; color: #666;">Total Products</div>
                        </div>
                        
                        <div style="text-align: center; padding: 15px; background: white; border-radius: 6px;">
                            <div style="font-size: 24px; color: #0369a1; font-weight: bold;">${totalQuantity}</div>
                            <div style="font-size: 14px; color: #666;">Total Quantity</div>
                        </div>
                    </div>

                    <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
                        <p style="margin: 8px 0;"><strong>Payment Terms:</strong> ${lpoData.terms}</p>
                    </div>
                </div>

                <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Created By:</strong> ${createdByData.fullName}</p>
                    <p style="margin: 5px 0;"><strong>LPO Created On:</strong> ${lpoDate}</p>
                    <p style="margin: 5px 0;"><strong>LPO ID:</strong> #${lpoData.lpoId || 'N/A'}</p>
                </div>

                <p style="font-size: 14px; color: #059669; background: #f0fdf4; padding: 12px; border-radius: 6px; border-left: 4px solid #059669;">
                    <strong>📦 Action Required:</strong> Please process this LPO and coordinate with the supplier.
                </p>

                <p>This LPO has been automatically added to your procurement system.</p>

                <p>Best regards,<br><strong>The Sartor CRM Team</strong></p>
            </div>
        `)
        .subject(`📋 New LPO: ${totalProducts} products by ${createdByData.fullName}`)
        .send()
        .then(r => LOG_DEBUG ? console.log(`LPO notification sent to ${recipientEmail}:`, r) : null)
        .catch(error => console.error(`Failed to send LPO notification to ${recipientEmail}:`, error));
};

exports.sendLPOProcessingEmail = (lpoData, recipientData) => {
    const lpoDate = new Date(lpoData.createdAt || Date.now()).toLocaleString();
    const deliveryCode = lpoData.deliveryCode || "N/A";
    const recipientEmail = recipientData.email

    new emailTemple(recipientEmail).who(recipientData.fullName)
        .body(`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

                <p>Hello <strong>${recipientData.fullName}</strong>,</p>

                <p>We’re pleased to inform you that your Local Purchase Order (LPO) is currently 
                <strong style="color:#d97706;">in processing</strong>.</p>

                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                    <h3 style="margin-top: 0; color: #065f46;">📦 LPO Details</h3>

                    <div style="text-align: center; margin: 20px 0;">
                        <p style="font-size: 16px; color: #555; margin-bottom: 8px;">Your Delivery Code</p>
                        <div style="font-size: 28px; font-weight: bold; color: #059669; background: #d1fae5; display: inline-block; padding: 12px 24px; border-radius: 8px; letter-spacing: 1px;">
                            ${deliveryCode}
                        </div>
                    </div>

                    <p style="margin: 8px 0;"><strong>LPO Date:</strong> ${lpoDate}</p>
                    <p style="margin: 8px 0;"><strong>Status:</strong> In Processing</p>

                    <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
                        <p style="margin: 8px 0;"><strong>Payment Terms:</strong> ${lpoData.terms || 'N/A'}</p>
                    </div>
                </div>

                <p style="margin-top: 20px;">Thank you for your patience and trust in us.</p>

                <p>Warm regards,<br><strong>The Sartor Procurement Team</strong></p>
            </div>
        `)
        .subject(`🚚 Your LPO is Now in Processing | Delivery Code: ${deliveryCode}`)
        .send()
        .then(r => LOG_DEBUG ? console.log(`Processing email sent to ${recipientEmail}:`, r) : null)
        .catch(error => console.error(`Failed to send LPO processing email to ${recipientEmail}:`, error));
};

















exports.sendConsultationConfirmation = (data) => {
    new emailTemple(data.email).who("Consultation Confirmation")
        .body(`
            <p>Hi ${data.firstName},</p>
            
            <p>Thanks for scheduling your consultation with <strong>Sartor Limited</strong>! </br> We're excited to learn more about your business and help you unlock new levels of growth using strategy, systems, and smart tools.</p>
            
            <div style="background: #f8f9fb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>🗓️ Your call is confirmed for:</strong></p>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1a237e;">${data.dateTime}</p>
            </div>
            
            <p>Here’s how to prepare for the session:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>Make sure you're in a quiet space with strong internet.</li>
                <li>Think about your top 2–3 challenges or goals.</li>
                <li>We’ll review your current setup and show you what’s possible.</li>
            </ul>
            
            <p>In the meantime, check out this quick 2-minute overview of how we support businesses like yours:</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="${data.videoLink}" style="display: inline-block; background: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 500;">Watch the Overview</a>
            </div>
            
            <p>Looking forward to our conversation!</p>
            
            <p>Best regards,<br>Confidence<br><strong>Founder, Sartor Limited</strong></p>
        `)
        .subject(`Your Consultation is Booked – Here’s What’s Next`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};


exports.sendConsultationReminder = (data) => {
    new emailTemple(data.email).who("Consultation Reminder")
        .body(`
            <p>Hi ${data.firstName},</p>
            
            <p>Just a quick reminder that your <strong>Business Discovery Call</strong> with Sartor Limited is coming up!</p>
            
            <div style="background: #f8f9fb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>🗓️ Scheduled for:</strong></p>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1a237e;">${data.dateTime}</p>
                <p style="margin: 10px 0;"><strong>📍 Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #1a237e;">Join Call</a></p>
            </div>
            
            <p>This call will help us:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>Understand your current business structure</li>
                <li>Identify bottlenecks in growth, systems, or sales</li>
                <li>Recommend next steps tailored to your goals</li>
            </ul>
            
            <p>If anything changes, you can reschedule using the link below:</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="${data.rescheduleLink}" style="display: inline-block; background: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 500;">Reschedule Call</a>
            </div>
            
            <p>Talk soon!</p>
            
            <p>Best regards,<br>Confidence<br><strong>Founder, Sartor Limited</strong></p>
        `)
        .subject(`🔔 Reminder: Your Business Discovery Call is Tomorrow`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};

exports.sendPostConsultationFollowUp = (data) => {
    new emailTemple(data.email).who("Post-Consultation Follow Up")
        .body(`
            <p>Hi ${data.firstName},</p>
            
            <p>It was great connecting with you! I enjoyed learning about your business journey so far and the challenges you’re ready to solve.</p>
            
            <div style="background: #f8f9fb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1a237e;">
                <p style="margin: 5px 0;"><strong>📌 Here’s a quick recap of what we discussed:</strong></p>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    <li>${data.challenge1}</li>
                    <li>${data.challenge2}</li>
                    <li>${data.nextSteps}</li>
                </ul>
            </div>
            
            <p>Based on our call, I believe you'd benefit from one of these two tracks:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li><strong>One-on-One Consulting Support</strong> → Strategy, branding, and operations</li>
                <li><strong>Our 6-Week START Program</strong> → A step-by-step framework to launch and grow smarter</li>
            </ul>
            
            <p>If you're ready to get started, just reply to this email or click one of the options below:</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="${data.startProgramLink}" style="display: inline-block; background: #1a237e; color: white; padding: 12px 25px; margin: 5px; text-decoration: none; border-radius: 4px; font-weight: 500;">Join the START Program</a>
                <a href="${data.consultingLink}" style="display: inline-block; background: #0284c7; color: white; padding: 12px 25px; margin: 5px; text-decoration: none; border-radius: 4px; font-weight: 500;">Book Your First Consulting Session</a>
            </div>
            
            <p>Let’s build momentum.</p>
            
            <p>Best regards,<br>Confidence<br><strong>Founder, Sartor Limited</strong></p>
        `)
        .subject(`Thanks for Joining! Let’s Talk Next Steps`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};

exports.sendDay3FollowUp = (data) => {
    new emailTemple(data.email).who("Day 3 Follow Up")
        .body(`
            <p>Hi ${data.firstName},</p>
            
            <p>Since our call, I’ve been thinking about the best way <strong>Sartor Limited</strong> can support your business. Whether you’re working solo or leading a team, our work focuses on three key pillars:</p>
            
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>✅ <strong>Strategy</strong> – so your business moves with purpose</li>
                <li>✅ <strong>Systems</strong> – so growth becomes scalable</li>
                <li>✅ <strong>Support</strong> – so you’re not figuring it out alone</li>
            </ul>
            
            <p>Here are some case studies and examples of how we’ve helped others in your space:</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="${data.caseStudyLink}" style="display: inline-block; background: #1a237e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: 500;">View Case Studies</a>
            </div>
            
            <p>If you'd like to move forward with a plan, simply reply and I’ll share the next steps.</p>
            
            <p>Talk soon,</p>
            
            <p>Best regards,<br>Confidence<br><strong>Founder, Sartor Limited</strong></p>
        `)
        .subject(`Here’s How Sartor Can Support You`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};

exports.sendDay5OfferCTA = (data) => {
    new emailTemple(data.email).who("Day 5 Offer CTA")
        .body(`
            <p>Hi ${data.firstName},</p>
            
            <p>Just a heads up — we have only <strong>${data.spotsLeft}</strong> open slots left for this month’s cohort of the <strong>START Program</strong>.</p>
            
            <p>This program is perfect for you if you want to:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>✅ Stop second-guessing your strategy</li>
                <li>✅ Build a reliable system for sales & growth</li>
                <li>✅ Get weekly expert support from our team</li>
            </ul>
            
            <p>We keep it small so each participant gets 1:1 attention.</p>
            
            <div style="text-align: center; margin: 25px 0;">
                <a href="${data.reserveLink}" style="display: inline-block; background: #1a237e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 500;">📅 Reserve Your Spot in the START Program Now</a>
            </div>
            
            <p>Let’s turn your goals into real, measurable progress.</p>
            
            <p>Best regards,<br>Confidence<br><strong>Founder, Sartor Limited</strong></p>
        `)
        .subject(`Join the START Program – Only ${data.spotsLeft} Spots Left This Month`).send().then(r => LOG_DEBUG ? console.log(r) : null);
};
