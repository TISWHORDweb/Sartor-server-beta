
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


exports.sendConsultationConfirmation = (data) => {
    new emailTemple(data.email).who("Consultation Confirmation")
        .body(`
            <p>Hi ${data.firstName},</p>
            
            <p>Thanks for scheduling your consultation with <strong>Sartor Limited</strong>! We're excited to learn more about your business and help you unlock new levels of growth using strategy, systems, and smart tools.</p>
            
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
