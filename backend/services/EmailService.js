// services/EmailService.js
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const Contract = require('../models/Contract');
const Rent = require('../models/Rent');
const Business = require('../models/Business');
const User = require('../models/User');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      // host: process.env.SMTP_HOST,
      // port: process.env.SMTP_PORT,
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Email templates
  getContractExpiryTemplate(businessName, daysLeft) {
    return {
      subject: `Contract Expiry Notice - ${businessName}`,
      text: `Your contract for ${businessName} will expire in ${daysLeft} days. Please renew it to continue operating your business.`,
      html: `
        <h2>Contract Expiry Notice</h2>
        <p>Your contract for <strong>${businessName}</strong> will expire in ${daysLeft} days.</p>
        <p>Please log in to your account to renew your contract and avoid any business interruptions.</p>
        <p>If you have any questions, please contact support.</p>
      `
    };
  }

  getRentReminderTemplate(businessName, amount, dueDate) {
    return {
      subject: `Rent Payment Reminder - ${businessName}`,
      text: `Your rent payment of ${amount} for ${businessName} is due on ${dueDate.toLocaleDateString()}.`,
      html: `
        <h2>Rent Payment Reminder</h2>
        <p>This is a reminder that your rent payment for <strong>${businessName}</strong> is due soon.</p>
        <p>Amount: ${amount}</p>
        <p>Due Date: ${dueDate.toLocaleDateString()}</p>
        <p>Please log in to your account to make the payment.</p>
      `
    };
  }

  getRentOverdueTemplate(businessName, amount, daysOverdue) {
    return {
      subject: `Rent Payment Overdue - ${businessName}`,
      text: `Your rent payment of ${amount} for ${businessName} is ${daysOverdue} days overdue.`,
      html: `
        <h2>Rent Payment Overdue Notice</h2>
        <p>Your rent payment for <strong>${businessName}</strong> is now ${daysOverdue} days overdue.</p>
        <p>Outstanding Amount: ${amount}</p>
        <p>Please log in to your account immediately to make the payment and avoid any penalties.</p>
      `
    };
  }

  getUserEmailTemplate(username) {
    return {
      subject: `Welcome to MUSRECBMS`,
      text: `Your account with username ${username} was created successfully.`,
      html: `
        <h2>Welcome to MUSRECBMS!</h2>
        <p>Your account with username ${username} was created successfully.</p>
        <p>Access your dashboard here: <a href="${process.env.FRONTEND_URL}">MUSRECBMS Dashboard</a></p>
        <p>Please log in to your account to view your dashboard.</p>
      `
    };
  }

  static getPasswordResetTemplate(username, temporaryPassword) {
    return {
      subject: 'Account Reactivation - Temporary Password',
      html: `
        <h1>Account Reactivated</h1>
        <p>Hello ${username},</p>
        <p>Your support account has been reactivated. Please use the following temporary password to log in:</p>
        <p style="font-size: 16px; font-weight: bold; padding: 10px; background-color: #f0f0f0;">${temporaryPassword}</p>
        <p>For security reasons, please change your password immediately after logging in.</p>
        <p>If you did not request this reactivation, please contact the administrator immediately.</p>
        <br>
        <p>Best regards,</p>
        <p>Your Admin Team</p>
      `
    };
  }

  // Send email
  async sendEmail(to, template) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html
      });
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  // Schedule notifications
  async scheduleNotifications() {
    // Check contract expiry daily at 9 AM
    schedule.scheduleJob('0 9 * * *', async () => {
      await this.sendContractExpiryNotifications();
    });

    // Check rent payments daily at 10 AM
    schedule.scheduleJob('0 10 * * *', async () => {
      await this.sendRentNotifications();
    });
  }

  // Send contract expiry notifications
  async sendContractExpiryNotifications() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const contracts = await Contract.find({
        status: 'paid',
        expiry: {
          $lte: thirtyDaysFromNow,
          $gt: new Date()
        }
      }).populate('business owner');

      for (const contract of contracts) {
        const daysLeft = Math.ceil((contract.expiry - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 30 || daysLeft === 14 || daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
          const template = this.getContractExpiryTemplate(
            contract.business.name,
            daysLeft
          );
          await this.sendEmail(contract.owner.email, template);
        }
      }
    } catch (error) {
      console.error('Contract notification error:', error);
    }
  }

  // Send rent notifications
  async sendRentNotifications() {
    try {
      const currentDate = new Date();
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Get all active businesses
      const businesses = await Business.find({ status: 'approved' })
        .populate('owner');

      for (const business of businesses) {
        const rent = await Rent.findOne({
          business: business._id,
          month: currentMonth
        });

        const dueDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5);
        
        // Send reminder 5 days before due date
        if (!rent || rent.status === 'pending') {
          const daysUntilDue = Math.ceil((dueDate - currentDate) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue === 5 || daysUntilDue === 3 || daysUntilDue === 1) {
            const template = this.getRentReminderTemplate(
              business.name,
              business.rentFee,
              dueDate
            );
            await this.sendEmail(business.owner.email, template);
          }
        }
        
        // Send overdue notices
        if ((!rent || rent.status === 'pending') && currentDate > dueDate) {
          const daysOverdue = Math.floor((currentDate - dueDate) / (1000 * 60 * 60 * 24));
          
          if (daysOverdue === 1 || daysOverdue === 3 || daysOverdue === 7 || daysOverdue === 14) {
            const template = this.getRentOverdueTemplate(
              business.name,
              business.rentFee,
              daysOverdue
            );
            await this.sendEmail(business.owner.email, template);
          }
        }
      }
    } catch (error) {
      console.error('Rent notification error:', error);
    }
  }
}

module.exports = new EmailService();