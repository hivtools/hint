package org.imperial.mrc.hint.unit.emails

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.emails.EmailConfig
import org.imperial.mrc.hint.emails.RealEmailManager
import org.imperial.mrc.hint.emails.WriteToDiskEmailManager
import org.junit.jupiter.api.Test

class EmailManagerConfigTests
{
    val sut = EmailConfig()

    @Test
    fun `returns WriteToDisk manager when email mode is disk`()
    {
        val mockAppProperties = mock<AppProperties>{
            on { emailMode } doReturn "disk"
        }

        val result = sut.getEmailManager(mockAppProperties)
        assertThat(result).isInstanceOf(WriteToDiskEmailManager::class.java)
    }

    @Test
    fun `returns RealEmailManager when email mode is real`()
    {
        val mockAppProperties = mock<AppProperties>{
            on { emailMode } doReturn "real"
            on { emailUsername } doReturn "testUsername"
            on { emailServer } doReturn "testServer"
            on { emailSender } doReturn "testSender"
            on { emailPort } doReturn 100
            on { emailPassword } doReturn "testpassword"
        }

        val result = sut.getEmailManager(mockAppProperties)
        assertThat(result).isInstanceOf(RealEmailManager::class.java)
    }

    @Test
    fun `throws exception when email mode is unknown`() {
        val mockAppProperties = mock<AppProperties> {
            on { emailMode } doReturn "unsupported"
        }

        assertThatThrownBy { sut.getEmailManager(mockAppProperties) }.hasMessage("Unknown email mode 'unsupported'")
    }
}