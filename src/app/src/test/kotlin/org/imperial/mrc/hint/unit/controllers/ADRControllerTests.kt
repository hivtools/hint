package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
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

}
