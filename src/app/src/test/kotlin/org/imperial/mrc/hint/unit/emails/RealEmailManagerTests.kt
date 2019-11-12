package org.imperial.mrc.hint.unit.emails

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.emails.EmailData
import org.imperial.mrc.hint.emails.RealEmailManager
import org.simplejavamail.mailer.Mailer
import org.junit.jupiter.api.Test
import org.simplejavamail.email.Email
import org.slf4j.Logger

class RealEmailManagerTests
{
    private val mockAppProps = mock<AppProperties> {
        on { applicationTitle } doReturn "testApp"
        on { emailPassword } doReturn "testPassword"
        on { emailPort } doReturn 100
        on { emailSender } doReturn "test@sender.com"
        on { emailServer } doReturn "testServer"
        on { emailUsername } doReturn "testUserName"
    }

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
    fun `sends email`()
    {
        val mockLogger = mock<Logger>()
        val mockMailer = mock<Mailer>()
        val mockEmailData = mock<EmailData>{
            on { subject } doReturn "testSubject"
            on { text() } doReturn "testText"
            on { html() } doReturn "testHtml"
        }

        val sut = RealEmailManager(mockAppProps, mock(), mockLogger, mockMailer)

        sut.sendEmail(mockEmailData, "test@email.com")

        argumentCaptor<Email>().apply{
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
}