import emailjs from '@emailjs/browser'

export const emailService = {
  // Initialize EmailJS
  init: () => {
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY
    if (publicKey) {
      emailjs.init(publicKey)
      console.log('EmailJS initialized with public key')
    } else {
      console.warn(
        'EmailJS public key not set. Email sending will not work until REACT_APP_EMAILJS_PUBLIC_KEY is provided'
      )
    }
  },

  // Send verification code email
  sendVerificationCode: async (
    email,
    verificationCode,
    userName,
    expiresAt,
    meta = {}
  ) => {
    try {
      const readableExpiresAt = expiresAt
        ? new Date(expiresAt).toLocaleString()
        : null

      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID

      if (!serviceId || !templateId) {
        console.error('EmailJS credentials not found')
        return { success: false, error: 'Email service not configured' }
      }

      const templateParams = {
        // Common variants for template variables to minimize mismatch errors
        to_email: email,
        email,
        to_name: userName,
        name: userName,
        user_name: userName,
        verification_code: verificationCode,
        code: verificationCode,
        passcode: verificationCode,
        passCode: verificationCode,
        verificationCode: verificationCode,
        // Additional aliases to cover many template variable names
        otp: verificationCode,
        one_time_password: verificationCode,
        oneTimePassword: verificationCode,
        // A plain text message field to make sure the code appears if template uses `message` or `body`
        message: `Your verification code is ${verificationCode}`,
        message_html: `<p>Your verification code is <strong>${verificationCode}</strong></p>`,
        // Human readable expiry
        expiresAt: readableExpiresAt,
        time: readableExpiresAt,
        app_name: 'Trading Checklist App',
        from_name: 'Trading Checklist Team',
        reply_to: 'no-reply@tradingchecklist.com',
        // Include any additional meta fields (e.g., newEmail, action) supplied by caller
        ...meta,
      }

      console.debug('EmailJS template params (full):', templateParams)

      console.log(
        'Sending verification email to:',
        email,
        'using service:',
        serviceId,
        'template:',
        templateId
      )

      const result = await emailjs.send(serviceId, templateId, templateParams)
      console.debug('EmailJS send result:', result)
      console.log('Email sent successfully:', result)
      return { success: true, message: 'Verification code sent to your email' }
    } catch (error) {
      // Improve logging with error content when possible
      // Improve logging with a few likely fields returned by emailjs
      let status = null
      let responseText = null
      try {
        status = error?.status || error?.statusCode || error?.httpStatus || null
        responseText = error?.text || error?.response || error?.message || null
        console.error('Failed to send verification email:', {
          status,
          responseText,
          error,
        })
      } catch (inner) {
        console.error('Failed to send verification email: unknown error', error)
      }
      return {
        success: false,
        error: 'Failed to send verification email. Please try again.',
        details: responseText || null,
      }
    }
  },

  // Send a basic test email to help debug EmailJS setup in dev
  sendTestEmail: async (email, userName = 'Dev Test', testCode = null) => {
    try {
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID
      if (!serviceId || !templateId) {
        console.error('EmailJS credentials not found for sendTestEmail')
        return { success: false, error: 'Email service not configured' }
      }

      const templateParams = {
        to_email: email,
        to_name: userName,
        email,
        name: userName,
        app_name: 'Trading Checklist App',
        from_name: 'Trading Checklist Team',
        message: `Test email from Trading Checklist App`,
        code: testCode,
        verification_code: testCode,
        message_html: testCode
          ? `<p>Your test code is <strong>${testCode}</strong></p>`
          : 'Test email from Trading Checklist App',
        passcode: testCode,
        passCode: testCode,
        time: new Date().toLocaleString(),
      }

      console.log(
        'EmailJS: Sending test email to:',
        email,
        'using service:',
        serviceId,
        'template:',
        templateId
      )
      console.debug('EmailJS test template params:', templateParams)

      const result = await emailjs.send(serviceId, templateId, templateParams)
      console.debug('EmailJS test send result:', result)
      return { success: true, message: 'Test email sent' }
    } catch (error) {
      let status = null
      let responseText = null
      try {
        status = error?.status || error?.statusCode || error?.httpStatus || null
        responseText = error?.text || error?.response || error?.message || null
        console.error('Failed to send test email:', {
          status,
          responseText,
          error,
        })
      } catch (inner) {
        console.error('Failed to send test email: unknown error', error)
      }
      return {
        success: false,
        error: 'Failed to send test email',
        details: responseText || null,
      }
    }
  },

  // Send welcome email after verification
  sendWelcomeEmail: async (email, userName) => {
    try {
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID
      // You might want a different template for welcome emails
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID

      const templateParams = {
        to_email: email,
        to_name: userName,
        app_name: 'Trading Checklist App',
        from_name: 'Trading Checklist Team',
      }

      await emailjs.send(serviceId, templateId, templateParams)
      return { success: true }
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false }
    }
  },
}
