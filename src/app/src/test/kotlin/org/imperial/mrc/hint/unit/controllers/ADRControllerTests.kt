package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.ADRController
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity

class ADRControllerTests : HintrControllerTests()
{

    private val mockEncryption = mock<Encryption> {
        on { encrypt(any()) } doReturn "encrypted".toByteArray()
        on { decrypt(any()) } doReturn "decrypted"
    }

    private val mockProperties = mock<AppProperties> {
        on { adrUrl } doReturn "adr-url"
        on { adrDatasetSchema } doReturn "adr-schema"
        on { adrANCSchema } doReturn "adr-anc"
        on { adrARTSchema } doReturn "adr-art"
        on { adrPJNZSchema } doReturn "adr-pjnz"
        on { adrPopSchema } doReturn "adr-pop"
        on { adrShapeSchema } doReturn "adr-shape"
        on { adrSurveySchema } doReturn "adr-survey"
    }

    private val mockFileManager = mock<FileManager>()

    private val objectMapper = ObjectMapper()

    private val mockUserRepo = mock<UserRepository>() {
        on { getADRKey("test") } doReturn "encrypted".toByteArray()
    }

    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn CommonProfile().apply { id = "test" }
    }

    @Test
    fun `encrypts key before saving it`()
    {
        val mockRepo = mock<UserRepository>()
        val sut = ADRController(mockEncryption, mockRepo, mock(), mock(), mock(), mock(), mock(), mockSession, mock())
        sut.saveAPIKey("plainText")
        verify(mockRepo).saveADRKey("test", "encrypted".toByteArray())
    }

    @Test
    fun `decrypts key before returning it`()
    {

        val sut = ADRController(mockEncryption, mockUserRepo, mock(), mock(), mock(), mock(), mock(), mockSession, mock())
        val result = sut.getAPIKey()
        val data = objectMapper.readTree(result.body!!)["data"].asText()
        assertThat(data).isEqualTo("decrypted")
    }

    @Test
    fun `returns null if key does not exist`()
    {
        val sut = ADRController(mock(), mock(), mock(), mock(), mock(), mock(), mock(), mockSession, mock())
        val result = sut.getAPIKey()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isNull).isTrue()
    }

    @Test
    fun `gets datasets without inaccessible resources by default`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties,
                mock(),
                mock(),
                mockSession,
                mock())
        val result = sut.getDatasets()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `gets datasets including inaccessible resources if flag is passed`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties,
                mock(),
                mock(),
                mockSession,
                mock())
        val result = sut.getDatasets(true)
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `filters datasets to only those with resources`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties,
                mock(),
                mock(),
                mockSession,
                mock())
        val result = sut.getDatasets()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue()
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `passes error responses along`()
    {
        val badResponse = ResponseEntity<String>(HttpStatus.BAD_REQUEST)
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn badResponse
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties,
                mock(),
                mock(),
                mockSession,
                mock())
        val result = sut.getDatasets()
        assertThat(result).isEqualTo(badResponse)
    }

    @Test
    fun `gets dataset by id`()
    {
        val expectedUrl = "package_show?id=1234"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn ResponseEntity
                    .ok()
                    .body("whatever")
        }
        val mockBuilder = mock<ADRClientBuilder> {
            on { build() } doReturn mockClient
        }
        val sut = ADRController(
                mock(),
                mock(),
                mockBuilder,
                objectMapper,
                mockProperties,
                mock(),
                mock(),
                mockSession,
                mock())
        val result = sut.getDataset("1234")
        assertThat(result.body!!).isEqualTo("whatever")
    }

    @Test
    fun `returns map of names to adr file schemas`()
    {
        val sut = ADRController(
                mock(),
                mock(),
                mock(),
                objectMapper,
                mockProperties,
                mock(),
                mock(),
                mockSession,
                mock())
        val result = sut.getFileTypeMappings()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data["pjnz"].textValue()).isEqualTo("adr-pjnz")
        assertThat(data["population"].textValue()).isEqualTo("adr-pop")
        assertThat(data["programme"].textValue()).isEqualTo("adr-art")
        assertThat(data["anc"].textValue()).isEqualTo("adr-anc")
        assertThat(data["shape"].textValue()).isEqualTo("adr-shape")
        assertThat(data["survey"].textValue()).isEqualTo("adr-survey")
        assertThat(data["baseUrl"].textValue()).isEqualTo("adr-url")
    }

    // used for the import{FileType} tests below
    override fun getSut(mockFileManager: FileManager,
                        mockAPIClient: HintrAPIClient,
                        mockSession: Session,
                        mockVersionRepository: VersionRepository): HintrController
    {
        return ADRController(mockEncryption,
                mockUserRepo,
                mock(),
                objectMapper,
                mockProperties,
                mockFileManager,
                mockAPIClient,
                mockSession,
                mockVersionRepository)
    }

    @Test
    fun `imports anc`()
    {
        assertSavesAndValidatesUrl(FileType.ANC) { sut ->
            (sut as ADRController).importANC(fakeUrl)
        }
    }

    @Test
    fun `imports pjnz`()
    {
        assertSavesAndValidatesUrl(FileType.PJNZ) { sut ->
            (sut as ADRController).importPJNZ(fakeUrl)
        }
    }

    @Test
    fun `imports programme`()
    {
        assertSavesAndValidatesUrl(FileType.Programme) { sut ->
            (sut as ADRController).importProgramme(fakeUrl)
        }
    }

    @Test
    fun `imports population`()
    {
        assertSavesAndValidatesUrl(FileType.Population) { sut ->
            (sut as ADRController).importPopulation(fakeUrl)
        }
    }

    @Test
    fun `imports shape file`()
    {
        assertSavesAndValidatesUrl(FileType.Shape) { sut ->
            (sut as ADRController).importShape(fakeUrl)
        }
    }

    @Test
    fun `imports survey`()
    {
        assertSavesAndValidatesUrl(FileType.Survey) { sut ->
            (sut as ADRController).importSurvey(fakeUrl)
        }
    }

    private fun makeFakeSuccessResponse(): ResponseEntity<String>
    {
        val resultWithResources = mapOf("resources" to listOf(1, 2))
        val resultWithoutResources = mapOf("resources" to listOf<Any>())
        val data = mapOf("results" to listOf(resultWithResources, resultWithoutResources))
        val body = mapOf("data" to data)
        return ResponseEntity
                .ok()
                .body(objectMapper.writeValueAsString(body))
    }

}
