import crypto from 'crypto'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

interface EmailOTP {
  email: string
  otp: string
  expiresAt: Date
  attempts: number
}

// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map<string, EmailOTP>()

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = new Date()
  for (const [email, otpData] of otpStorage.entries()) {
    if (otpData.expiresAt < now) {
      otpStorage.delete(email)
    }
  }
}, 5 * 60 * 1000)

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString()
}

export const sendVerificationEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry
    
    // Store OTP
    otpStorage.set(email, {
      email,
      otp,
      expiresAt,
      attempts: 0
    })

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Email content
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: email,
      subject: 'Your Synapse Email Verification Code',
      text: `Your verification code is: ${otp}\n\nThis code will expire at ${expiresAt.toLocaleTimeString()} (in 10 minutes).\nIf you did not request this, please ignore this email.`,
      html: `<p>Your verification code is: <b>${otp}</b></p><p>This code will expire at <b>${expiresAt.toLocaleTimeString()}</b> (in 10 minutes).</p><p>If you did not request this, please ignore this email.</p>`
    }

    console.log(`📧 Attempting to send verification email to ${email}`)
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent:', info.response)

    return {
      success: true,
      message: 'Verification email sent successfully'
    }
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    return {
      success: false,
      message: 'Failed to send verification email'
    }
  }
}

export const verifyOTP = (email: string, otp: string): { success: boolean; message: string } => {
  const otpData = otpStorage.get(email)
  
  if (!otpData) {
    return {
      success: false,
      message: 'No verification code found for this email'
    }
  }

  if (otpData.expiresAt < new Date()) {
    otpStorage.delete(email)
    return {
      success: false,
      message: 'Verification code has expired'
    }
  }

  if (otpData.attempts >= 3) {
    otpStorage.delete(email)
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new verification code'
    }
  }

  if (otpData.otp !== otp) {
    otpData.attempts += 1
    return {
      success: false,
      message: 'Invalid verification code'
    }
  }

  // OTP is valid - remove it from storage
  otpStorage.delete(email)
  
  return {
    success: true,
    message: 'Email verified successfully'
  }
}

export const isEmailVerified = (email: string): boolean => {
  // In a real implementation, you would store verified emails in a database
  // For now, we'll use a simple in-memory set
  return verifiedEmails.has(email)
}

// In-memory storage for verified emails
const verifiedEmails = new Set<string>()

export const markEmailAsVerified = (email: string): void => {
  verifiedEmails.add(email)
} 