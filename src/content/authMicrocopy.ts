/** Authentication UX copy (staff + shared flows). */

export const AUTH_COPY = {
  adminCreateStaffHelper:
    'Create user profile. A temporary password will be auto-generated and sent via email. The user will be required to update it upon their first login.',
  adminInviteStaffHelper:
    'Send an email invitation. The recipient opens the link to choose a username and password (valid for 7 days).',
  firstLoginPassword: {
    header: 'Update Your Password',
    subtext:
      'For security, you are using a temporary password. Please choose a new, secure password to continue.',
    currentLabel: 'Current (Temporary) Password',
    newLabel: 'New Password',
    confirmLabel: 'Confirm New Password',
    cta: 'Save and Continue',
  },
  changePassword: {
    header: 'Change Password',
    subtext: 'Ensure your account is using a long, random password to stay secure.',
    currentLabel: 'Current Password',
    newLabel: 'New Password',
    confirmLabel: 'Confirm New Password',
    cta: 'Update Password',
    success: 'Your password has been successfully updated.',
  },
  forgotPassword: {
    link: 'Forgot your password?',
    header: 'Reset Your Password',
    subtext:
      'Enter the email address associated with your account, and we’ll send you a link to reset your password.',
    emailLabel: 'Email Address',
    cta: 'Send Reset Link',
    success:
      'If an account exists for this email, you will receive password reset instructions shortly.',
  },
  resetPassword: {
    header: 'Set a New Password',
    subtext: 'Enter your new password below.',
    newLabel: 'New Password',
    confirmLabel: 'Confirm New Password',
    cta: 'Reset Password',
  },
  staffInviteAccept: {
    header: 'Set up your staff account',
    subtext:
      'Choose a username and password for BuyNHaul. You will use these credentials to sign in.',
    usernameLabel: 'Username',
    passwordLabel: 'Password (min 8 characters)',
    cta: 'Create account',
  },
} as const;
