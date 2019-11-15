package org.imperial.mrc.hint.unit.emails

import com.nhaarman.mockito_kotlin.argumentCaptor
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.emails.*
import org.imperial.mrc.hint.security.tokens.OneTimeTokenManager
import org.junit.jupiter.api.Test
import org.simplejavamail.email.Email
import org.simplejavamail.mailer.Mailer
import org.slf4j.Logger

class RealEmailManagerTests {
    private val mockAppProps = mock<AppProperties> {
        on { applicationTitle } doReturn "testApp"
        on { applicationUrl } doReturn "http://testurl.com"
        on { emailPassword } doReturn "testPassword"
        on { emailPort } doReturn 100
        on { emailSender } doReturn "test@sender.com"
        on { emailServer } doReturn "testServer"
        on { emailUsername } doReturn "testUserName"
    }

    val mockLogger = mock<Logger>()
    val mockMailer = mock<Mailer>()

    @Test
    fun `initialises correctly`() {
        val sut = RealEmailManager(mockAppProps, mock())

        assertThat(sut.sender).isEqualTo("test@sender.com")
        assertThat(sut.appTitle).isEqualTo("testApp")

        assertThat(sut.mailer.session.properties["mail.smtp.host"]).isEqualTo("testServer")
        assertThat(sut.mailer.session.properties["mail.smtp.port"]).isEqualTo("100")
        assertThat(sut.mailer.session.properties["mail.smtp.username"]).isEqualTo("testUserName")
        assertThat(sut.mailer.session.properties["simplejavamail.transportstrategy"]).isEqualTo("SMTP_TLS")

        assertThat(sut.logger.name).isEqualTo("org.imperial.mrc.hint.emails.RealEmailManager")
    }


    @Test
    fun `sends email`() {
        val mockEmailData = EmailData("testSubject", "testText", "testHtml")
        val sut = RealEmailManager(mockAppProps, mock(), mockLogger, mockMailer)
        sut.sendEmail(mockEmailData, "test@email.com")

        argumentCaptor<Email>().apply {
            verify(mockMailer).sendMail(capture())

            val emailObj = firstValue
            assertThat(emailObj.subject).isEqualTo("testSubject")
            assertThat(emailObj.text).isEqualTo("testText")
            assertThat(emailObj.textHTML).isEqualTo("testHtml")
            assertThat(emailObj.fromRecipient.address).isEqualTo("test@sender.com")
            assertThat(emailObj.fromRecipient.name).isEqualTo("testApp notifications")
            assertThat(emailObj.recipients.count()).isEqualTo(1)
            assertThat(emailObj.recipients[0].address).isEqualTo("test@email.com")
        }

        verify(mockLogger).info("mail sent to: test@email.com")
    }

    @Test
    fun `send password reset email`() {

        val mockTokenManager = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken("test.user") } doReturn "TOKEN"
        }
        val sut = RealEmailManager(mockAppProps, mockTokenManager, mockLogger, mockMailer)
        sut.sendPasswordEmail("test.user@example.com", "test.user", PasswordEmailTemplate.ResetPassword())
        argumentCaptor<Email>().apply {
            verify(mockMailer).sendMail(capture())

            val emailObj = firstValue
            assertThat(emailObj.subject).isEqualTo("Password change for testApp")
            assertThat(emailObj.text).isEqualTo("""Hello,

This is an automated email from testApp. We have received a request to reset the password for the account with
this email address (test.user@example.com).

To change your password on testApp please browse to:

http://testurl.com/password/reset-password/?token=TOKEN

This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one.

If you did not request a password change, or you no longer want to change your password, please ignore this email.

Have a great day!""")
        }
    }

    @Test
    fun `send account creation email`() {

        val mockTokenManager = mock<OneTimeTokenManager> {
            on { generateOnetimeSetPasswordToken("test.user") } doReturn "TOKEN"
        }
        val sut = RealEmailManager(mockAppProps, mockTokenManager, mockLogger, mockMailer)
        sut.sendPasswordEmail("test.user@example.com", "test.user", PasswordEmailTemplate.CreateAccount())

        argumentCaptor<Email>().apply {
            verify(mockMailer).sendMail(capture())

            val emailObj = firstValue
            assertThat(emailObj.subject).isEqualTo("Account creation for testApp")
            assertThat(emailObj.text).isEqualTo("""Hello,

This is an automated email from testApp. We have received a request to create an account for
this email address (test.user@example.com).

To set your password on testApp please browse to:

http://testurl.com/password/reset-password/?token=TOKEN

This link will expire in 24 hours. If you don't get a chance to use it within that time, you can request a new one by
visiting http://testurl.com/password/forgot-password/

Have a great day!""")
        }
    }
}
