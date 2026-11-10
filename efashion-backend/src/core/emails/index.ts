import Config from '@/config';
import { UserDB } from '@/database/models/user';
import nodemailer from 'nodemailer';

class EmailServices {
  private transporter: nodemailer.Transporter;
  constructor(private senderName: string, private email: string, pass: string) {
    const isGmail = this.email.endsWith('@gmail.com');
    this.transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: this.email,
              pass: pass.replace(/\s+/g, ''),
            },
          }
        : {
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: {
              user: this.email,
              pass: pass.replace(/\s+/g, ''),
            },
          },
    );
  }
  private async sendMail(content: Omit<nodemailer.SendMailOptions, 'from'>) {
    await this.transporter.sendMail({
      from: `"${this.senderName}" ${this.email}`,
      ...content,
    });
  }
  async sendOTPEmail(otp: string, user: UserDB): Promise<boolean> {
    try {
      log.info(`OTP for ${user.email}: ${otp}`);
      await this.sendMail({
        to: user.email,
        subject: 'OTP Verification',
        html: `<p>Hello ${user.fullName},</p><p>Here is the verification code. Please copy it and verify yor Email.</p><div style="text-align: center; background-color: #e2ebff; font-weight: bold; padding: 20px;">code: ${otp}</div>`,
      });
      return true;
    } catch (err) {
      log.error(err);
      return false;
    }
  }
  async sendOTPPassword(otp: string, user: UserDB): Promise<boolean> {
    try {
      log.info(`Password Reset OTP for ${user.email}: ${otp}`);
      await this.sendMail({
        to: user.email,
        subject: 'OTP Verification',
        html: `<p>Hello ${user.fullName},</p><p>Here is the verification code. Please copy to reset your password.</p><div style="text-align: center; background-color: #e2ebff; font-weight: bold; padding: 20px;">code: ${otp}</div>`,
      });
      return true;
    } catch (err) {
      log.error(err);
      return false;
    }
  }
}

export default new EmailServices('Mahmoud', Config.EMAIL_SENDER, Config.EMAIL_SENDER_PASSWORD);
