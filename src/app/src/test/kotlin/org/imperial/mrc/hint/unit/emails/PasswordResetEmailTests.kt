package org.imperial.mrc.hint.unit.emails

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.emails.PasswordResetEmail
import org.junit.jupiter.api.Test

class PasswordResetEmailTests
{
    private val sut = PasswordResetEmail("testApp",
        "http://testAppUrl",
        "testToken",
        "test.user@test.com")


    @Test
    fun `initialises values correctly`()
    {
        assertThat(sut.subject).isEqualTo("Password change for testApp")
        assertThat(sut.textTemplate).isEqualTo("password-reset.txt")
        assertThat(sut.htmlTemplate).isEqualTo("password-reset.html")

        assertThat(sut.values["appTitle"]).isEqualTo("testApp")
        assertThat(sut.values["appUrl"]).isEqualTo("http://testAppUrl")
        assertThat(sut.values["token"]).isEqualTo("testToken")
        assertThat(sut.values["email"]).isEqualTo("test.user@test.com")
    }

    @Test
    fun `can generate text email`() {
        val result = sut.text()

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
        val result = sut.html()

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