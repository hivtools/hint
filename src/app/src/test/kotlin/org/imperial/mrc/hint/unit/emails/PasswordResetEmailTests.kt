package org.imperial.mrc.hint.unit.emails

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.AccountCreationEmailTemplate
import org.imperial.mrc.hint.emails.PasswordResetEmailTemplate
import org.junit.jupiter.api.Test

class PasswordEmailTemplateTests {
    private val values = mapOf("appTitle" to "testApp",
            "appUrl" to "http://testAppUrl",
            "token" to "testToken",
            "email" to "test.user@test.com")

    private val accountCreationEmail = AccountCreationEmailTemplate()
    private val accountCreationEmailData = accountCreationEmail.emailData(values)
    private val passwordResetEmail = PasswordResetEmailTemplate()
    private val passwordResetEmailData = passwordResetEmail.emailData(values)

    @Test
    fun `account creation has correct subject`() {
        assertThat(accountCreationEmail.subject).isEqualTo("Account creation for {{appTitle}}")
        assertThat(accountCreationEmailData.subject).isEqualTo("Account creation for testApp")
    }

    @Test
    fun `account creation has correct text`() {

        assertThat(accountCreationEmail.textTemplate).isEqualTo("account-creation.txt")
        assertThat(accountCreationEmailData.text).isEqualTo("""Hello,

This is an automated email from testApp. We have received a request to create an account for
this email address (test.user@test.com).

To set your password on testApp please browse to:

http://testAppUrl/password/reset-password/?token=testToken

This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one by
visiting http://testAppUrl/password/forgot-password/

Have a great day!""")
    }

    @Test
    fun `account creation has correct html`() {
        assertThat(accountCreationEmail.htmlTemplate).isEqualTo("account-creation.html")
        assertThat(accountCreationEmailData.html).isEqualTo("""<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
<p>Hello,</p>
<p>
    This is an automated email from
    <a href="http://testAppUrl">testApp</a>.
    We have received a request to create an account for
    this email address (test.user@test.com).
</p>
<p>
    To set your password on testApp please click:
    <a href="http://testAppUrl/password/reset-password/?token=testToken">here</a>.
</p>
<p>
    This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one
    <a href="http://testAppUrl/password/forgot-password/">here</a>.
</p>
<p>Have a great day!</p>
</body>
</html>
""")
    }

    @Test
    fun `password reset has correct subject`() {
        assertThat(passwordResetEmail.subject).isEqualTo("Password change for {{appTitle}}")
        assertThat(passwordResetEmailData.subject).isEqualTo("Password change for testApp")
    }

    @Test
    fun `password reset has correct text`() {
        assertThat(passwordResetEmail.textTemplate).isEqualTo("password-reset.txt")
        assertThat(passwordResetEmailData.text).isEqualTo("""Hello,

This is an automated email from testApp. We have received a request to reset the password for the account with
this email address (test.user@test.com).

To change your password on testApp please browse to:

http://testAppUrl/password/reset-password/?token=testToken

This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one.

If you did not request a password change, or you no longer want to change your password, please ignore this email.

Have a great day!""")
    }

    @Test
    fun `password reset has correct html`() {
        assertThat(passwordResetEmail.htmlTemplate).isEqualTo("password-reset.html")
        assertThat(passwordResetEmailData.html).isEqualTo("""<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>
<p>Hello,</p>
<p>
    This is an automated email from
    <a href="http://testAppUrl">testApp</a>.
    We have received a request to reset the password for the account with
    this email address (test.user@test.com).
</p>
<p>
    To change your password on testApp please click:
    <a href="http://testAppUrl/password/reset-password/?token=testToken">here</a>.
</p>
<p>
    This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one.
</p>
<p>
    If you did not request a password change, or you no longer want to change your password, please ignore this email.
</p>
<p>Have a great day!</p>
</body>
</html>
""")
    }

}
