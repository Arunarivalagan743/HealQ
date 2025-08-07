const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendOTP(email, otp, name) {
    const mailOptions = {
      from: {
        name: 'HealQ Support',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Password Reset OTP - HealQ',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Clinic Token Management System</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${name},</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              We received a request to reset your password for your HealQ account. 
              Use the verification code below to proceed with your password reset.
            </p>
            
            <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your verification code is:</p>
              <h3 style="font-size: 32px; font-weight: bold; color: #667eea; margin: 0; letter-spacing: 3px;">${otp}</h3>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Important:</strong> This code will expire in 5 minutes for security reasons.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you didn't request this password reset, please ignore this email or contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hello ${name},
        
        We received a request to reset your password for your HealQ account.
        
        Your verification code is: ${otp}
        
        This code will expire in 5 minutes for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        © 2025 HealQ - Clinic Token Management System
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('OTP email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendWelcomeEmail(email, name, role) {
    const mailOptions = {
      from: {
        name: 'HealQ Support',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `Welcome to HealQ - ${role} Account Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to HealQ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Clinic Token Management System</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome ${name}! 🎉</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Your ${role} account has been successfully created in the HealQ system. 
              You can now access all features available for your role.
            </p>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #155724;">
                <strong>✅ Account Details:</strong><br>
                Email: ${email}<br>
                Role: ${role}<br>
                Status: Active
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions or need assistance, please contact our support team.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email as it's not critical
      return { success: false, error: error.message };
    }
  }

  async sendNewUserRequestNotification(requestData) {
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['harishmkr88@gmail.com'];
    
    const mailOptions = {
      from: {
        name: 'HealQ System',
        address: process.env.EMAIL_USER,
      },
      to: adminEmails,
      subject: `🏥 New User Request - ${requestData.role} | HealQ`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New User Request - HealQ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ Admin</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">New User Request Notification</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">📋 New ${requestData.role} Request</h2>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>👤 User Details:</strong><br>
                Name: ${requestData.fullName}<br>
                Email: ${requestData.email}<br>
                Phone: ${requestData.phone}<br>
                Age: ${requestData.age}<br>
                Role: ${requestData.role}<br>
                Address: ${requestData.address}<br>
                ${requestData.role === 'Doctor' ? `Specialization: ${requestData.specialization}<br>` : ''}
                ${requestData.role === 'Patient' ? `Medical Concern: ${requestData.problem}<br>` : ''}
              </p>
            </div>
            
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #0c5460;">
                <strong>📅 Request Info:</strong><br>
                Request ID: ${requestData._id}<br>
                Submitted: ${new Date().toLocaleString()}<br>
                Status: Pending Review
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Please review this request in the admin dashboard and approve or reject accordingly.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New User Request - HealQ
        ========================
        
        A new user has requested access to the HealQ system:
        
        Name: ${requestData.fullName}
        Email: ${requestData.email}
        Phone: ${requestData.phone}
        Age: ${requestData.age}
        Role: ${requestData.role}
        Address: ${requestData.address}
        ${requestData.role === 'Doctor' ? `Specialization: ${requestData.specialization}` : ''}
        ${requestData.role === 'Patient' ? `Medical Concern: ${requestData.problem}` : ''}
        
        Request ID: ${requestData._id}
        Submitted: ${new Date().toLocaleString()}
        
        Please review this request in the admin dashboard.
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Admin notification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send admin notification email:', error);
      throw new Error('Failed to send admin notification email');
    }
  }

  async sendUserRequestConfirmation(requestData) {
    const mailOptions = {
      from: {
        name: 'HealQ Support',
        address: process.env.EMAIL_USER,
      },
      to: requestData.email,
      subject: `✅ Request Received - HealQ | ${requestData.role}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Confirmation - HealQ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Clinic Token Management System</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Request Received! ✅</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Dear ${requestData.fullName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for your interest in HealQ! We have successfully received your request to join our clinic management system.
            </p>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #155724;">
                <strong>📋 Your Request Details:</strong><br>
                Name: ${requestData.fullName}<br>
                Email: ${requestData.email}<br>
                Role: ${requestData.role}<br>
                Request ID: ${requestData._id}<br>
                Submitted: ${new Date().toLocaleString()}
              </p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>🔄 What happens next?</strong><br>
                1. Our admin team will review your request<br>
                2. You will receive an email notification within 1-2 business days<br>
                3. If approved, you'll receive login credentials and access instructions
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions, please contact our support team at ${process.env.EMAIL_USER}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Request Confirmation - HealQ
        ============================
        
        Dear ${requestData.fullName},
        
        Thank you for your interest in HealQ! We have received your request to join our clinic management system.
        
        Request Details:
        - Name: ${requestData.fullName}
        - Email: ${requestData.email}
        - Role: ${requestData.role}
        - Request ID: ${requestData._id}
        - Submitted: ${new Date().toLocaleString()}
        
        What happens next?
        ==================
        1. Our admin team will review your request
        2. You will receive an email notification within 1-2 business days
        3. If approved, you'll receive login credentials and access instructions
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The HealQ Team
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 User confirmation email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send user confirmation email:', error);
      throw new Error('Failed to send user confirmation email');
    }
  }

  async sendUserApprovalNotification(userData, temporaryPassword) {
    const mailOptions = {
      from: {
        name: 'HealQ Support',
        address: process.env.EMAIL_USER,
      },
      to: userData.email,
      subject: `🎉 Account Approved - Welcome to HealQ!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Approved - HealQ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Account Approved!</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Welcome ${userData.name || userData.fullName}! 🎉</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Great news! Your request to join HealQ has been <strong>APPROVED</strong>!
            </p>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #155724;">
                <strong>� Your Account Details:</strong><br>
                Email: ${userData.email}<br>
                Role: ${userData.role}<br>
                Temporary Password: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px; font-weight: bold;">${temporaryPassword}</code>
              </p>
            </div>
            
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #0c5460;">
                <strong>🚀 Getting Started:</strong><br>
                1. Download the HealQ mobile app or visit our web portal<br>
                2. Log in using your email and temporary password<br>
                3. You'll be prompted to change your password on first login<br>
                4. Complete your profile setup
              </p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 25px; text-align: center; color: #28a745; font-weight: bold;">
              Welcome to the HealQ family! 🏥✨
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions or need assistance, please contact our support team at ${process.env.EMAIL_USER}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Account Approved - HealQ
        ========================
        
        Dear ${userData.name || userData.fullName},
        
        Great news! Your request to join HealQ has been APPROVED!
        
        Your account has been created with the following details:
        - Email: ${userData.email}
        - Role: ${userData.role}
        - Temporary Password: ${temporaryPassword}
        
        Getting Started:
        ================
        1. Download the HealQ mobile app or visit our web portal
        2. Log in using your email and temporary password
        3. You'll be prompted to change your password on first login
        4. Complete your profile setup
        
        Welcome to HealQ!
        
        Best regards,
        The HealQ Team
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Approval notification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send approval notification email:', error);
      throw new Error('Failed to send approval notification email');
    }
  }

  async sendUserRejectionNotification(requestData, reason) {
    const mailOptions = {
      from: {
        name: 'HealQ Support',
        address: process.env.EMAIL_USER,
      },
      to: requestData.email,
      subject: `📋 Request Update - HealQ`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Request Update - HealQ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Request Update</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Request Status Update 📋</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Dear ${requestData.fullName},
            </p>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Thank you for your interest in HealQ. After careful review, we are unable to approve your request at this time.
            </p>
            
            ${reason ? `
            <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #721c24;">
                <strong>📝 Reason:</strong><br>
                ${reason}
              </p>
            </div>
            ` : ''}
            
            <div style="background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #0c5460;">
                <strong>💡 Next Steps:</strong><br>
                • If you believe this is an error, please contact our support team<br>
                • You are welcome to submit a new request in the future<br>
                • Please ensure all required information is provided accurately
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions or would like to discuss this decision, please contact our support team at ${process.env.EMAIL_USER}.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Request Update - HealQ
        ======================
        
        Dear ${requestData.fullName},
        
        Thank you for your interest in HealQ. After careful review, we are unable to approve your request at this time.
        
        ${reason ? `Reason: ${reason}` : ''}
        
        If you believe this is an error or would like to discuss this decision, please contact our support team.
        
        You are welcome to submit a new request in the future.
        
        Best regards,
        The HealQ Team
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Rejection notification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send rejection notification email:', error);
      throw new Error('Failed to send rejection notification email');
    }
  }

  async sendOTPVerification(email, otp) {
    const mailOptions = {
      from: {
        name: 'HealQ Support',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `🔐 Verification Code - HealQ`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code - HealQ</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 HealQ</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Verification Code</p>
          </div>
          
          <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Verification Required 🔐</h2>
            
            <p style="font-size: 16px; margin-bottom: 25px;">
              Your verification code for HealQ is:
            </p>
            
            <div style="background: #f8f9fa; border: 2px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⏰ Important:</strong><br>
                This code will expire in 10 minutes for security reasons.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you didn't request this code, please ignore this email and ensure your account is secure.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <div style="text-align: center; color: #888; font-size: 12px;">
              <p>© 2025 HealQ - Clinic Token Management System</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Verification Code - HealQ
        =========================
        
        Your verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        Best regards,
        The HealQ Team
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 OTP verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Failed to send OTP verification email:', error);
      throw new Error('Failed to send OTP verification email');
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
