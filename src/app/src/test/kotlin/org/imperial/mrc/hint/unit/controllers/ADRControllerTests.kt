package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.controllers.ADRController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class ADRControllerTests {

    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn CommonProfile().apply { id = "test" }
    }

    private val mockEncryption = mock<Encryption> {
        on { encrypt(any()) } doReturn "encrypted".toByteArray()
        on { decrypt(any()) } doReturn "decrypted"
    }

    private val mockProperties = mock<AppProperties> {
        on { adrSchema } doReturn "adr-schema"
    }

    private val objectMapper = ObjectMapper()

    @Test
    fun `encrypts key before saving it`() {
        val mockRepo = mock<UserRepository>()
        val sut = ADRController(mockSession, mockEncryption, mockRepo, mock(), mock(), mock())
        sut.saveAPIKey("plainText")
        verify(mockRepo).saveADRKey("test", "encrypted".toByteArray())
    }

    @Test
    fun `decrypts key before returning it`() {
        val mockRepo = mock<UserRepository>() {
            on { getADRKey("test") } doReturn "encrypted".toByteArray()
        }
        val sut = ADRController(mockSession, mockEncryption, mockRepo, mock(), mock(), mock())
        val result = sut.getAPIKey()
        val data = objectMapper.readTree(result.body!!)["data"].asText()
        assertThat(data).isEqualTo("decrypted")
    }

    @Test
    fun `returns null if key does not exist`() {
        val sut = ADRController(mockSession, mock(), mock(), mock(), mock(), mock())
        val result = sut.getAPIKey()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isNull).isTrue()
    }

    @Test
    fun `gets datasets without inaccessible resources by default`() {
        val expectedUrl = "package_search?q=type:adr-schema&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mockSession,
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties)
        val result = sut.getDatasets()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `gets datasets including inaccessible resources if flag is passed`() {
        val expectedUrl = "package_search?q=type:adr-schema"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mockSession,
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties)
        val result = sut.getDatasets(true)
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `filters datasets to only those with resources`() {
        val expectedUrl = "package_search?q=type:adr-schema&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mockSession,
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties)
        val result = sut.getDatasets()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `passes error responses along`() {
        val badResponse = ResponseEntity<String>(HttpStatus.BAD_REQUEST)
        val expectedUrl = "package_search?q=type:adr-schema&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn badResponse
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mockSession,
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties)
        val result = sut.getDatasets()
        assertThat(result).isEqualTo(badResponse)
    }

    private fun makeFakeSuccessResponse(): ResponseEntity<String> {
        val resultWithResources = mapOf("resources" to listOf(1, 2))
        val resultWithoutResources = mapOf("resources" to listOf<Any>())
        val data = mapOf("results" to listOf(resultWithResources, resultWithoutResources))
        val body = mapOf("data" to data)
        return ResponseEntity
                .ok()
                .body(objectMapper.writeValueAsString(body))
    }

}
