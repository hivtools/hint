package org.imperial.mrc.hint.unit.emails

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.PasswordResetEmail
import org.junit.jupiter.api.Test

class PasswordResetEmailTests
{
    private val firstTimeEmail = PasswordResetEmail("testApp",
            "http://testAppUrl",
            "testToken",
            "test.user@test.com", true)

    private val nonFirstTimeEmail = PasswordResetEmail("testApp",
            "http://testAppUrl",
            "testToken",
            "test.user@test.com", false)

    @Test
    fun `initialises values correctly for first time email`()
    {
        assertThat(firstTimeEmail.subject).isEqualTo("Password change for testApp")
        assertThat(firstTimeEmail.textTemplate).isEqualTo("password-set.txt")
        assertThat(firstTimeEmail.htmlTemplate).isEqualTo("password-set.html")

        assertThat(firstTimeEmail.values["appTitle"]).isEqualTo("testApp")
        assertThat(firstTimeEmail.values["appUrl"]).isEqualTo("http://testAppUrl")
        assertThat(firstTimeEmail.values["token"]).isEqualTo("testToken")
        assertThat(firstTimeEmail.values["email"]).isEqualTo("test.user@test.com")
    }

    @Test
    fun `initialises values correctly for non first time email`()
    {
        assertThat(nonFirstTimeEmail.subject).isEqualTo("Password change for testApp")
        assertThat(nonFirstTimeEmail.textTemplate).isEqualTo("password-reset.txt")
        assertThat(nonFirstTimeEmail.htmlTemplate).isEqualTo("password-reset.html")

        assertThat(nonFirstTimeEmail.values["appTitle"]).isEqualTo("testApp")
        assertThat(nonFirstTimeEmail.values["appUrl"]).isEqualTo("http://testAppUrl")
        assertThat(nonFirstTimeEmail.values["token"]).isEqualTo("testToken")
        assertThat(nonFirstTimeEmail.values["email"]).isEqualTo("test.user@test.com")
    }

    @Test
    fun `can generate first time text email`() {
        val result = firstTimeEmail.text()

        assertThat(result).isEqualTo("""Hello,

This is an automated email from testApp. We have received a request to create an account for
this email address (test.user@test.com).

To set your password on testApp please browse to:

http://testAppUrl/password/reset-password/?token=testToken

This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one by
visiting http://testAppUrl/password/forgot-password/

Have a great day!""")
    }

    @Test
    fun `can generate first time html email`() {
        val result = firstTimeEmail.html()

        assertThat(result).isEqualTo("""<html>
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
    fun `can generate non first time text email`() {
        val result = nonFirstTimeEmail.text()

        assertThat(result).isEqualTo("""Hello,

This is an automated email from testApp. We have received a request to reset the password for the account with
this email address (test.user@test.com).

To change your password on testApp please browse to:

http://testAppUrl/password/reset-password/?token=testToken

This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one.

If you did not request a password change, or you no longer want to change your password, please ignore this email.

Have a great day!""")
    }

    @Test
    fun `can generate html email`() {
        val result = nonFirstTimeEmail.html()

        assertThat(result).isEqualTo("""<html>
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
