package org.imperial.mrc.hint.unit.clients

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.GitHubApiException
import org.imperial.mrc.hint.clients.GitHubFuelClient
import org.imperial.mrc.hint.helpers.TranslationAssert.Companion.assertThatThrownBy
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class GitHubFuelClientTest {

    private lateinit var mockWebServer: MockWebServer
    private lateinit var client: GitHubFuelClient
    private lateinit var objectMapper: ObjectMapper

    @BeforeEach
    fun setup() {
        mockWebServer = MockWebServer()
        mockWebServer.start()

        objectMapper = ObjectMapper()

        val mockAppProperties = mock<AppProperties> {
            on { githubAuthBaseUrl } doReturn mockWebServer.url("/").toString().trimEnd('/')
            on { githubAuthOrg } doReturn "my-org"
            on { githubAuthTeamSlug } doReturn "my-team"
        }

        client = GitHubFuelClient(objectMapper, mockAppProperties)
    }

    @AfterEach
    fun teardown() {
        mockWebServer.shutdown()
    }

    @Test
    fun `getUsername returns username on successful response`() {
        mockWebServer.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody("""{"login":"testuser","id":12345}""")
            .addHeader("Content-Type", "application/json")
        )

        val result = client.getUsername("valid-token")

        assertThat(result).isEqualTo("testuser")

        val request = mockWebServer.takeRequest()
        assertThat(request.path).isEqualTo("/user")
        assertThat(request.getHeader("Authorization")).isEqualTo("Bearer valid-token")
    }

    @Test
    fun `getUsername throws GitHubApiException when login field is missing`() {
        mockWebServer.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody("""{"id":12345}""")
            .addHeader("Content-Type", "application/json")
        )

        assertThatThrownBy {
            client.getUsername("valid-token")
        }
            .isInstanceOf(GitHubApiException::class.java)
            .hasMessageContaining("No login field in response")
    }

    @Test
    fun `getUsername throws GitHubApiException on HTTP error`() {
        mockWebServer.enqueue(MockResponse()
            .setResponseCode(401)
            .setBody("""{"message":"Bad credentials"}""")
        )

        assertThatThrownBy {
            client.getUsername("invalid-token")
        }
            .isInstanceOf(GitHubApiException::class.java)
            .hasMessageContaining("Failed to fetch username: 401")
    }

    @Test
    fun `isUserInTeam returns true when user is member`() {
        mockWebServer.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody("""{"state":"active","role":"member"}""")
            .addHeader("Content-Type", "application/json")
        )

        val result = client.isUserInTeam("valid-token", "testuser")

        assertThat(result).isTrue()

        val request = mockWebServer.takeRequest()
        assertThat(request.path).isEqualTo("/orgs/my-org/teams/my-team/memberships/testuser")
        assertThat(request.getHeader("Authorization")).isEqualTo("Bearer valid-token")
    }

    @Test
    fun `isUserInTeam returns false when response is 404`() {
        mockWebServer.enqueue(MockResponse()
            .setResponseCode(404)
            .setBody("""{"message":"Not Found"}""")
        )

        val result = client.isUserInTeam("valid-token", "testuser")

        assertThat(result).isFalse()
    }

    @Test
    fun `isUserInTeam throws GitHubApiException on other error codes`() {
        mockWebServer.enqueue(MockResponse()
            .setResponseCode(500)
            .setBody("""{"message":"Internal Server Error"}""")
        )

        assertThatThrownBy {
            client.isUserInTeam("valid-token", "testuser")
        }
            .isInstanceOf(GitHubApiException::class.java)
            .hasMessageContaining("Failed to check team membership: 500")
    }
}
