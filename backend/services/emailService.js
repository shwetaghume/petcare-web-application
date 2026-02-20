const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.testAccount = null;
    this.initializePromise = this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // If real email credentials are provided, use them
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const emailConfig = {
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true' || false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        };

        this.transporter = nodemailer.createTransport(emailConfig);
        console.log('✅ Using real email service:', process.env.EMAIL_USER);
        
        // Verify transporter
        this.transporter.verify((error, success) => {
          if (error) {
            console.error('❌ Email verification failed:', error.message);
          } else {
            console.log('✅ Email service verified and ready!');
          }
        });
        
        this.initialized = true;
        return;
      }

      // For development, create test account
      console.log('🔧 Setting up test email service...');
      await this.createTestAccount();
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      // Fallback: create a simple console logger
      this.createFallbackService();
    }
  }

  // Create test account for development
  async createTestAccount() {
    try {
      console.log('🔄 Creating Ethereal test account...');
      this.testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass
        }
      });
      
      console.log('✅ Test email account ready:', this.testAccount.user);
      console.log('📧 All emails will be captured and can be viewed via preview URLs');
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Ethereal account creation failed:', error.message);
      this.createFallbackService();
    }
  }

  // Fallback service that logs emails to console
  createFallbackService() {
    console.log('⚠️  Using fallback email service (console logging)');
    this.transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL WOULD BE SENT:');
        console.log('='.repeat(60));
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('\nText Content:');
        console.log('-'.repeat(40));
        console.log(mailOptions.text);
        console.log('='.repeat(60) + '\n');
        
        return {
          messageId: 'fallback-' + Date.now(),
          response: 'Email logged to console'
        };
      }
    };
    this.initialized = true;
  }

  // Generate HTML template for verification email
  generateVerificationEmailHTML(verificationCode, userName = 'Pet Lover') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to PetCare - Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 0;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .paw-icon {
            font-size: 24px;
            margin-right: 10px;
        }
        .content {
            padding: 40px 30px;
            text-align: center;
        }
        .welcome-text {
            font-size: 18px;
            color: #333;
            margin-bottom: 30px;
        }
        .verification-section {
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 30px;
            margin: 30px 0;
            border: 2px dashed #667eea;
        }
        .verification-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }
        .verification-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            background-color: #ffffff;
            padding: 15px 25px;
            border-radius: 8px;
            border: 2px solid #667eea;
            display: inline-block;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
        }
        .expiry-notice {
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
        }
        .expiry-icon {
            font-size: 18px;
            margin-right: 8px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-text {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        .security-notice {
            background-color: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 5px;
            }
            .content {
                padding: 20px 15px;
            }
            .verification-section {
                padding: 20px 15px;
            }
            .verification-code {
                font-size: 28px;
                letter-spacing: 4px;
                padding: 12px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1><span class="paw-icon">🐾</span>PetCare</h1>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <strong>Welcome to your pet adoption journey!</strong>
            </div>
            
            <div class="verification-section">
                <div class="verification-title">Verify Your Email Address</div>
                <p style="color: #666; margin-bottom: 20px;">
                    Enter this verification code to complete your registration:
                </p>
                
                <div class="verification-code">${verificationCode}</div>
                
                <div class="expiry-notice">
                    <span class="expiry-icon">⏰</span>
                    <strong>This code expires in 10 minutes</strong>
                </div>
            </div>
            
            <div class="security-notice">
                <strong>🔐 Security Notice:</strong> If you didn't create an account with PetCare, please ignore this email. Your account won't be created without email verification.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                <strong>Thank you for joining PetCare!</strong>
            </div>
            <div class="footer-text">
                Help connect loving families with their perfect pet companions.
            </div>
            <div class="footer-text" style="margin-top: 15px; font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  // Generate plain text version for email clients that don't support HTML
  generateVerificationEmailText(verificationCode, userName = 'Pet Lover') {
    return `
🐾 PetCare
Welcome to your pet adoption journey!

Verify Your Email Address
Enter this verification code to complete your registration:

${verificationCode}

⏰ This code expires in 10 minutes

Security Notice: If you didn't create an account with PetCare, please ignore this email.

Thank you for joining PetCare!
Help connect loving families with their perfect pet companions.

This is an automated message. Please do not reply to this email.
`;
  }

  // Send verification email
  async sendVerificationEmail(email, verificationCode, userName) {
    try {
      // Wait for transporter to be initialized
      await this.initializePromise;
      
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `"PetCare" <${process.env.EMAIL_USER || 'noreply@petcare.com'}>`,
        to: email,
        subject: 'Welcome to PetCare - Verify Your Email',
        text: this.generateVerificationEmailText(verificationCode, userName),
        html: this.generateVerificationEmailHTML(verificationCode, userName)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log success
      console.log('✅ Verification email sent successfully:', {
        messageId: info.messageId,
        to: email,
        preview: nodemailer.getTestMessageUrl(info) // Only works with Ethereal
      });

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };

    } catch (error) {
      console.error('❌ Failed to send verification email:', error.message);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  // Send welcome email after successful verification
  async sendWelcomeEmail(email, userName) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to PetCare!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 Welcome to PetCare!</h1>
        </div>
        <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Your email has been successfully verified! You're now part of the PetCare family.</p>
            <p>You can now:</p>
            <ul>
                <li>🐕 Browse available pets for adoption</li>
                <li>🛍️ Shop for pet supplies</li>
                <li>📅 Book pet services</li>
                <li>❤️ Save your favorite pets</li>
            </ul>
            <p>Start your pet adoption journey today!</p>
        </div>
        <div class="footer">
            <p>Thank you for joining PetCare!</p>
        </div>
    </div>
</body>
</html>`;

      const mailOptions = {
        from: `"PetCare" <${process.env.EMAIL_USER || 'noreply@petcare.com'}>`,
        to: email,
        subject: '🎉 Welcome to PetCare - Email Verified!',
        text: `Welcome to PetCare!\n\nHello ${userName}!\n\nYour email has been successfully verified! You're now part of the PetCare family.\n\nStart your pet adoption journey today!`,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Welcome email sent successfully:', {
        messageId: info.messageId,
        to: email
      });

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      // Don't throw error for welcome email, it's not critical
      return { success: false, error: error.message };
    }
  }

  // Generate HTML for adoption status notification
  generateAdoptionStatusEmailHTML(status, userName, petName, petImage, adminNotes = '') {
    const statusColors = {
      'Approved': '#28a745',
      'Rejected': '#dc3545',
      'Pending': '#ffc107'
    };
    
    const statusIcons = {
      'Approved': '🎉',
      'Rejected': '😔',
      'Pending': '⏳'
    };

    const statusMessages = {
      'Approved': 'Congratulations! Your adoption application has been approved!',
      'Rejected': 'We regret to inform you that your adoption application was not approved.',
      'Pending': 'Your adoption application is currently under review.'
    };

    const nextSteps = {
      'Approved': `
        <div style="background-color: #d4edda; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0;">🎊 Next Steps:</h3>
          <ul style="margin-bottom: 0;">
            <li>We will contact you within 24 hours to arrange the adoption process</li>
            <li>Please prepare the necessary documents and adoption fee</li>
            <li>Get ready to welcome your new furry family member!</li>
          </ul>
        </div>
      `,
      'Rejected': `
        <div style="background-color: #f8d7da; color: #721c24; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0;">💝 Don't Give Up!</h3>
          <p style="margin-bottom: 0;">There are many other wonderful pets looking for loving homes. Please continue browsing our available pets and consider applying for another companion that might be perfect for you.</p>
        </div>
      `,
      'Pending': `
        <div style="background-color: #fff3cd; color: #856404; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0;">⏰ What's Next:</h3>
          <p style="margin-bottom: 0;">Our team is carefully reviewing your application. We'll notify you as soon as we have an update. Thank you for your patience!</p>
        </div>
      `
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Adoption Application Update - PetCare</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 0;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, ${statusColors[status]} 0%, ${status === 'Approved' ? '#20c997' : status === 'Rejected' ? '#e83e8c' : '#fd7e14'} 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .status-badge {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .pet-info {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 10px;
        }
        .pet-image {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            object-fit: cover;
            border: 5px solid ${statusColors[status]};
            margin-bottom: 15px;
        }
        .pet-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 10px 0;
        }
        .status-message {
            font-size: 18px;
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background-color: ${status === 'Approved' ? '#d4edda' : status === 'Rejected' ? '#f8d7da' : '#fff3cd'};
            color: ${status === 'Approved' ? '#155724' : status === 'Rejected' ? '#721c24' : '#856404'};
            border-radius: 8px;
            border-left: 4px solid ${statusColors[status]};
        }
        .admin-notes {
            background-color: #e9ecef;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #6c757d;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer-text {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 5px;
            }
            .content {
                padding: 20px 15px;
            }
            .pet-image {
                width: 120px;
                height: 120px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 PetCare</h1>
            <div class="status-badge">
                ${statusIcons[status]} Application ${status}
            </div>
        </div>
        
        <div class="content">
            <h2 style="text-align: center; color: #333; margin-bottom: 10px;">Hello ${userName}!</h2>
            
            <div class="status-message">
                <strong>${statusMessages[status]}</strong>
            </div>
            
            <div class="pet-info">
                ${petImage ? `<img src="${petImage}" alt="${petName}" class="pet-image">` : ''}
                <div class="pet-name">🐕 ${petName}</div>
                <p style="color: #666; margin: 0;">Your application for this lovely pet</p>
            </div>
            
            ${adminNotes ? `
            <div class="admin-notes">
                <h3 style="margin-top: 0; color: #495057;">📝 Additional Notes:</h3>
                <p style="margin-bottom: 0; font-style: italic;">${adminNotes}</p>
            </div>
            ` : ''}
            
            ${nextSteps[status]}
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666;">Thank you for choosing PetCare for your pet adoption journey!</p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                <strong>PetCare - Connecting Hearts with Paws</strong>
            </div>
            <div class="footer-text">
                Questions? Contact us at support@petcare.com
            </div>
            <div class="footer-text" style="margin-top: 15px; font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  // Generate plain text for adoption status notification
  generateAdoptionStatusEmailText(status, userName, petName, adminNotes = '') {
    const statusMessages = {
      'Approved': 'Congratulations! Your adoption application has been APPROVED!',
      'Rejected': 'We regret to inform you that your adoption application was not approved.',
      'Pending': 'Your adoption application is currently under review.'
    };

    const nextStepsText = {
      'Approved': `\nNext Steps:
- We will contact you within 24 hours to arrange the adoption process
- Please prepare the necessary documents and adoption fee
- Get ready to welcome your new furry family member!`,
      'Rejected': `\nDon't Give Up!
There are many other wonderful pets looking for loving homes. Please continue browsing our available pets and consider applying for another companion that might be perfect for you.`,
      'Pending': `\nWhat's Next:
Our team is carefully reviewing your application. We'll notify you as soon as we have an update. Thank you for your patience!`
    };

    return `
🐾 PetCare - Adoption Application Update

Hello ${userName}!

${statusMessages[status]}

🐕 Pet: ${petName}
Status: ${status.toUpperCase()}

${adminNotes ? `Additional Notes:
${adminNotes}\n` : ''}
${nextStepsText[status]}

Thank you for choosing PetCare for your pet adoption journey!

Questions? Contact us at support@petcare.com

This is an automated message. Please do not reply to this email.
`;
  }

  // Send adoption status notification email
  async sendAdoptionStatusEmail(email, userName, petName, status, petImage = '', adminNotes = '') {
    try {
      // Wait for transporter to be initialized
      await this.initializePromise;
      
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const statusEmojis = {
        'Approved': '🎉',
        'Rejected': '📧',
        'Pending': '⏳'
      };

      const mailOptions = {
        from: `"PetCare" <${process.env.EMAIL_USER || 'noreply@petcare.com'}>`,
        to: email,
        subject: `${statusEmojis[status]} Adoption Application ${status} - ${petName}`,
        text: this.generateAdoptionStatusEmailText(status, userName, petName, adminNotes),
        html: this.generateAdoptionStatusEmailHTML(status, userName, petName, petImage, adminNotes)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log success
      console.log('✅ Adoption status email sent successfully:', {
        messageId: info.messageId,
        to: email,
        status: status,
        petName: petName,
        preview: nodemailer.getTestMessageUrl(info) // Only works with Ethereal
      });

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };

    } catch (error) {
      console.error('❌ Failed to send adoption status email:', error.message);
      // Don't throw error to prevent breaking the adoption status update
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testEmailService() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const testCode = '123456';
      const result = await this.sendVerificationEmail('test@example.com', testCode, 'Test User');
      return result;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
