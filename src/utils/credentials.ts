/** A login created when an admin approves an application (temporary password, shown once) */
export interface IssuedLogin {
  name: string
  email: string
  temp_password: string
  label: string
  /** Whether the login-details email was sent */
  emailed: boolean
}
