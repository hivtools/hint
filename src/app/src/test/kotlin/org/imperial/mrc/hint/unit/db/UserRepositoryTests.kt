package org.imperial.mrc.hint.unit.db

import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.db.DbProfileServiceUserRepository
import org.imperial.mrc.hint.emails.EmailManager
import org.imperial.mrc.hint.emails.PasswordEmailTemplate
import org.imperial.mrc.hint.exceptions.UserException
import org.junit.jupiter.api.Test
import org.mockito.ArgumentCaptor
import org.pac4j.core.profile.CommonProfile
import org.pac4j.sql.profile.DbProfile
import org.pac4j.sql.profile.service.DbProfileService
import java.util.*

class UserRepositoryTests {

    companion object {
        const val TEST_EMAIL = "test@test.com"
    }

    @Test
    fun `add user calls create on profile service`() {

        val mockProfileService = mock<DbProfileService>()
        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mock())

        sut.addUser(TEST_EMAIL, "testpassword")

        val argumentCaptor = ArgumentCaptor.forClass(DbProfile::class.java)
        verify(mockProfileService).create(argumentCaptor.capture(), eq("testpassword"))
        assertThat(argumentCaptor.value.id).isEqualTo(TEST_EMAIL)
        assertThat(argumentCaptor.value.username).isEqualTo(TEST_EMAIL)
    }


    @Test
    fun `adding user without password creates random pw and sends account creation email`() {
        val mockEmailManager = mock<EmailManager>()
        val mockProfileService = mock<DbProfileService>()
        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mockEmailManager)

        sut.addUser(TEST_EMAIL, null)
        verify(mockEmailManager).sendPasswordEmail(eq(TEST_EMAIL),
                eq(TEST_EMAIL),
                argWhere { it is PasswordEmailTemplate.CreateAccount })
        verify(mockProfileService).create(any(),
                argWhere {
                    Base64.getDecoder()
                            .decode(it).size == DbProfileServiceUserRepository.PASSWORD_LENGTH
                })
    }

    @Test
    fun `adding user with password does not send email`() {
        val mockEmailManager = mock<EmailManager>()
        val sut = DbProfileServiceUserRepository(mock(), mock(), mockEmailManager)

        sut.addUser(TEST_EMAIL, "test_pw")
        verifyZeroInteractions(mockEmailManager)
    }

    @Test
    fun `add user throws exception if finds existing user with email`() {

        val mockProfileService = mock<DbProfileService> {
            on { findById(TEST_EMAIL) } doReturn mock<DbProfile>()
        }

        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mock())

        assertThatThrownBy { sut.addUser(TEST_EMAIL, "testpassword") }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User already exists")
    }

    @Test
    fun `remove user calls removeById on profile service`() {

        val mockProfileService = mock<DbProfileService> {
            on { findById(TEST_EMAIL) } doReturn mock<DbProfile>()
        }

        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mock())
        sut.removeUser(TEST_EMAIL)

        verify(mockProfileService).removeById(TEST_EMAIL)
    }

    @Test
    fun `remove user throws exception if does not find existing user`() {

        val mockProfileService = mock<DbProfileService>()

        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mock())

        assertThatThrownBy { sut.removeUser(TEST_EMAIL) }
                .isInstanceOf(UserException::class.java)
                .hasMessageContaining("User does not exist")
    }

    @Test
    fun `getUser calls findById on profile service`() {
        val mockProfile = mock<DbProfile>()
        val mockProfileService = mock<DbProfileService> {
            on { findById(TEST_EMAIL) } doReturn mockProfile
        }

        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mock())
        val result = sut.getUser(TEST_EMAIL)
        assertThat(result).isSameAs(mockProfile)
    }

    @Test
    fun `updateUserPassword updates profile`() {
        val mockCommonProfile = mock<CommonProfile> {
            on { id } doReturn TEST_EMAIL
        }

        val mockDbProfile = mock<DbProfile>()

        val mockProfileService = mock<DbProfileService> {
            on { findById(TEST_EMAIL) } doReturn mockDbProfile
        }

        val sut = DbProfileServiceUserRepository(mock(), mockProfileService, mock())
        sut.updateUserPassword(mockCommonProfile, "testPassword")

        verify(mockProfileService).update(mockDbProfile, "testPassword")
    }

}
