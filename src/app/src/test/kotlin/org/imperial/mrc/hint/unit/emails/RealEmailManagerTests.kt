package org.imperial.mrc.hint.unit.emails

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.emails.RealEmailManager
import org.junit.jupiter.api.Test

class RealEmailManagerTests
{
    @Test
    fun `initialises correctly`()
    {
        val mockAppProps = mock<AppProperties>{
            on { emailPassword } doReturn "testPassword"
            on { emailPort } doReturn 100
            on { emailSender } doReturn "test@sender.com"
            on { emailServer } doReturn "testServer"
            on { emailUsername } doReturn "testUserName"
        }

        val sut = RealEmailManager(mockAppProps)

        assertThat(sut.password).isEqualTo("testPassword")
        assertThat(sut.port).isEqualTo(100)
        assertThat(sut.sender).isEqualTo("test@sender.com")
        assertThat(sut.server).isEqualTo("testServer")
        assertThat(sut.username).isEqualTo("testUserName")
    }
}