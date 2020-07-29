package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.controllers.ADRController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile

class ADRControllerTests {

    @Test
    fun `encrypts key before saving it`() {
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn CommonProfile().apply { id = "test" }
        }
        val mockEncryption = mock<Encryption> {
            on { encrypt(any()) } doReturn "encrypted".toByteArray()
        }
        val mockRepo = mock<UserRepository>()
        val sut = ADRController(mockSession, mockEncryption, mockRepo)
        sut.saveAPIKey("plainText")
        verify(mockRepo).saveADRKey("test", "encrypted".toByteArray())
    }

    @Test
    fun `decrypts key before returning it`() {
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn CommonProfile().apply { id = "test" }
        }
        val mockEncryption = mock<Encryption> {
            on { decrypt(any()) } doReturn "decrypted"
        }
        val mockRepo = mock<UserRepository>() {
            on {getADRKey("test")} doReturn "encrypted".toByteArray()
        }
        val sut = ADRController(mockSession, mockEncryption, mockRepo)
        val result = sut.getAPIKey()
        val data = ObjectMapper().readTree(result.body!!)["data"].asText()
        assertThat(data).isEqualTo("decrypted")
    }

    @Test
    fun `returns null if key does not exist`() {
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn CommonProfile().apply { id = "test" }
        }
        val sut = ADRController(mockSession, mock(), mock())
        val result = sut.getAPIKey()
        val data = ObjectMapper().readTree(result.body!!)["data"]
        assertThat(data.isNull).isTrue()
    }

}
