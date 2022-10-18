package org.imperial.mrc.hint.unit.controllers

import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.AssertionsForClassTypes.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.HomeController
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl
import org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup
import org.springframework.ui.Model


class HomeControllerTests
{
    private val fakeAPIResponseBody = "{\"status\":\"success\",\"errors\":null," +
            "\"data\":{\"chocolatey_whippet_2\":\"IDLE\",\"chocolatey_whippet_1\":\"IDLE\"," +
            "\"chocolatey_whippet_3\":\"PAUSED\", \"chocolatey_whippet_4\":\"EXITED\"," +
            "\"chocolatey_whippet_5\":\"BUSY\"}}"

    @Test
    fun `index saves version and sets model properties`()
    {
        val mockRepo = mock<VersionRepository>()

        val mockProfile = mock<CommonProfile> {
            on { id } doReturn "test-user"
        }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { getVersionId() } doReturn "test-version"
        }
        val mockAppProps = mock<AppProperties> {
            on { applicationTitle } doReturn "Test App Title"
        }
        val mockModel = mock<Model>()

        val sut = HomeController(mockRepo, mockSession, mockAppProps, mock())

        val result = sut.index(mockModel)
        assertThat(result).isEqualTo("index")

        verify(mockSession).setMode("naomi")
        verify(mockRepo).saveVersion("test-version", null)
        verify(mockModel).addAttribute("title", "Test App Title")
        verify(mockModel).addAttribute("user", "test-user")
    }

    @Test
    fun `explore saves version and sets model properties`()
    {
        val mockRepo = mock<VersionRepository>()

        val mockProfile = mock<CommonProfile> {
            on { id } doReturn "test-user"
        }
        val mockSession = mock<Session> {
            on { getUserProfile() } doReturn mockProfile
            on { getVersionId() } doReturn "test-version"
        }
        val mockAppProps = mock<AppProperties> {
            on { exploreApplicationTitle } doReturn "Test Explore App Title"
        }
        val mockModel = mock<Model>()

        val sut = HomeController(mockRepo, mockSession, mockAppProps, mock())

        val result = sut.explore(mockModel)
        assertThat(result).isEqualTo("data-exploration")

        verify(mockSession).setMode("explore")
        verify(mockRepo).saveVersion("test-version", null)
        verify(mockModel).addAttribute("title", "Test Explore App Title")
        verify(mockModel).addAttribute("user", "test-user")
    }

    @Test
    fun `gets metrics for each worker status type`()
    {
        val mockAPIClient = mock<HintrAPIClient> {
            on { get("hintr/worker/status") } doReturn ResponseEntity(fakeAPIResponseBody, HttpStatus.OK)
        }
        val sut = HomeController(mock(), mock(), mock(), mockAPIClient)
        val result = sut.metrics()
        assertThat(result.body)
                .isEqualTo("running 1\nbusy_workers 1\nidle_workers 2" +
                        "\npaused_workers 1\nexited_workers 1\nlost_workers 0\nlive_workers 4")
    }

    @Test
    fun`can redirect from explore to callback slash explore endpoint`()
    {
        val mockMvc = standaloneSetup(HomeController(mock(), mock(), mock(), mock())).build()

        mockMvc.perform(get("/explore")).andExpect(redirectedUrl("/callback/explore"))
    }
}
