import crypto from 'crypto'
import nodemailer from 'nodemailer'

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

// SMTP transporter setup
const smtpHost = process.env.SMTP_HOST
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const fromEmail = process.env.FROM_EMAIL || smtpUser

let transporter: nodemailer.Transporter | null = null
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })
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

    // Email content
    const subject = 'Your Synapse Verification Code'
    const text = `Your verification code is: ${otp}\nThis code will expire in 10 minutes.`
    const html = `<p>Your verification code is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`

    if (transporter) {
      await transporter.sendMail({
        from: fromEmail,
        to: email,
        subject,
        text,
        html,
      })
      console.log(`📧 Verification email sent to ${email}`)
      return {
        success: true,
        message: 'Verification email sent successfully',
      }
    } else {
      // Fallback: log OTP to console
      console.log(`📧 [DEV MODE] Verification email to ${email}`)
      console.log(`🔐 OTP: ${otp}`)
      console.log(`⏰ Expires at: ${expiresAt.toISOString()}`)
      return {
        success: true,
        message: 'Verification email sent (console log only, SMTP not configured)',
      }
    }
  } catch (error) {
    console.error('Error sending verification email:', error)
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