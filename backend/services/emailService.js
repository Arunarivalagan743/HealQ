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
