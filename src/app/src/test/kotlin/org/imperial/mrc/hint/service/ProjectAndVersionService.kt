package org.imperial.mrc.hint.service

import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.Project
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.mockito.internal.verification.Times
import org.pac4j.core.profile.CommonProfile

class ProjectServiceTest
{

    private val mockProfile = mock<CommonProfile> {
        on { id } doReturn "testUser"
    }

    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn mockProfile
        on { generateVersionId() } doReturn "testVersion"
    }

    private val mockVersionRepo = mock<VersionRepository>()

    private val mockProjectRepo = mock<ProjectRepository> {
        on { getProject(1, "testUser") } doReturn Project(1, "p1",
            listOf(
                Version("v1", "createdTime", "updatedTime", 1),
                Version("v2", "createdTime", "updatedTime", 1)
            ))
        on { saveNewProject("uid1", "p1","testUser") } doReturn 2
        on { saveNewProject("uid2", "p1","testUser") } doReturn 3
    }

    @Test
    fun `can clone project to user`()
    {
        val mockProperties = mock<AppProperties> {
            on { oauth2LoginMethod } doReturn false
        }
        assertUserCanCloneProjectWith(mockProperties)
    }

    @Test
    fun `can clone project to user with oauth2 login method`()
    {
        val oauthLogin = mock<AppProperties> {
            on { oauth2LoginMethod } doReturn true
        }

        assertUserCanCloneProjectWith(oauthLogin)
    }

    @Test
    fun `clone project to user throws if any user does not exist`()
    {
        val mockLogic = mock<UserLogic> {
            on { getUser("a.user@email.com") } doReturn CommonProfile().apply { id = "1" }
            on { getUser("new.user@email.com") } doReturn null as CommonProfile?
        }
        val sut = ProjectService(mockSession, mockVersionRepo, mockProjectRepo, mockLogic, mock())
        val userList = listOf("a.user@email.com", "new.user@email.com")
        Assertions.assertThatThrownBy { sut.cloneProjectToUser(1, userList) }
            .isInstanceOf(UserException::class.java)
            .hasMessageContaining("userDoesNotExist")
        verify(mockProjectRepo, Times(0)).saveNewProject(any(), any(), any(), any(), any())
    }

    private fun assertUserCanCloneProjectWith(loginMethod: AppProperties)
    {
        val mockLogic = mock<UserLogic> {
            on { getUser("new.user@email.com", loginMethod.oauth2LoginMethod) } doReturn CommonProfile().apply { id = "uid1" }
            on { getUser("a.user@email.com", loginMethod.oauth2LoginMethod) } doReturn CommonProfile().apply { id = "uid2" }
        }
        val sut = ProjectService(mockSession, mockVersionRepo, mockProjectRepo, mockLogic, loginMethod)
        sut.cloneProjectToUser(1, listOf("new.user@email.com", "a.user@email.com"))

        verify(mockVersionRepo).cloneVersion("v1", "testVersion", 2)
        verify(mockVersionRepo).cloneVersion("v2", "testVersion", 2)

        verify(mockVersionRepo).cloneVersion("v1", "testVersion", 3)
        verify(mockVersionRepo).cloneVersion("v2", "testVersion", 3)
    }
}
