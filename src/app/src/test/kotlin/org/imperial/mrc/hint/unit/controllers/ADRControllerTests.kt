package org.imperial.mrc.hint.unit.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.*
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.ADRClient
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.controllers.ADRController
import org.imperial.mrc.hint.controllers.HintrController
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.AdrException
import org.imperial.mrc.hint.helpers.TranslationAssert
import org.imperial.mrc.hint.md5sum
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.imperial.mrc.hint.service.ADRService
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.File
import java.lang.reflect.InvocationTargetException
import java.nio.file.Files
import javax.servlet.http.HttpServletRequest
import kotlin.reflect.full.memberFunctions
import kotlin.reflect.jvm.isAccessible

class ADRControllerTests : HintrControllerTests()
{
    companion object
    {
        private var tmpTestDir: File? = null

        @BeforeAll
        @JvmStatic
        fun setUp()
        {
            tmpTestDir = Files.createTempDirectory("adrTest").toFile()
        }

        @AfterAll
        @JvmStatic
        fun `delete tmpdir for test files`()
        {
            tmpTestDir?.deleteRecursively()
        }
    }

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
        on { adrVmmcSchema } doReturn "adr-vmmc"
        on { adrOutputZipSchema } doReturn "adr-output-zip"
        on { adrOutputSummarySchema } doReturn "adr-output-summary"
        on { adrOutputComparisonSchema } doReturn "adr-output-comparison"
        on { fileTypeMappings } doReturn mapOf(
            "baseUrl" to "adr-url",
            "anc" to "adr-anc",
            "programme" to "adr-art",
            "pjnz" to "adr-pjnz",
            "population" to "adr-pop",
            "shape" to "adr-shape",
            "survey" to "adr-survey",
            "vmmc" to "adr-vmmc",
            "outputZip" to "adr-output-zip",
            "outputSummary" to "adr-output-summary",
            "outputComparison" to "adr-output-comparison")
    }

    private val objectMapper = ObjectMapper()

    private val mockUserRepo = mock<UserRepository> {
        on { getADRKey("test") } doReturn "encrypted".toByteArray()
    }

    private val mockSession = mock<Session> {
        on { getUserProfile() } doReturn CommonProfile().apply { id = "test" }
    }

    @Test
    fun `encrypts key before saving it`()
    {
        val mockRepo = mock<UserRepository>()
        val sut = ADRController(mockEncryption, mockRepo, mock(), mock(), mock(), mock(), mock(),
                mockSession, mock(), mock())
        sut.saveAPIKey("plainText")
        verify(mockRepo).saveADRKey("test", "encrypted".toByteArray())
    }

    @Test
    fun `decrypts key before returning it`()
    {

        val sut = ADRController(mockEncryption, mockUserRepo, mock(), mock(), mock(), mock(), mock(),
                mockSession, mock(), mock())
        val result = sut.getAPIKey()
        val data = objectMapper.readTree(result.body!!)["data"].asText()
        assertThat(data).isEqualTo("decrypted")
    }

    @Test
    fun `returns null if key does not exist`()
    {
        val sut = ADRController(mock(), mock(), mock(), mock(), mock(), mock(), mock(),
                mockSession, mock(), mock())
        val result = sut.getAPIKey()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isNull).isTrue
    }

    @Test
    fun `gets datasets without inaccessible resources by default`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&include_private=true&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getDatasets()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `gets datasets including inaccessible resources if flag is passed`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&include_private=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getDatasets(true)
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue
        assertThat(data.count()).isEqualTo(2)
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `filters datasets to only those with resources`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&include_private=true&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getDatasets()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue
        assertThat(data.count()).isEqualTo(2)
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `can get datasets with a specific resource type`()
    {
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&include_private=true&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn makeFakeSuccessResponse()
        }
        val mockBuilder = mock<ADRService> {
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
            mock(),
            mock())
        val result = sut.getDatasetsWithResource("outputZip")
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["resources"].count()).isEqualTo(2)
    }

    @Test
    fun `throws generic error message if unexpected error`()
    {
        val badResponse = ResponseEntity<String>(HttpStatus.BAD_REQUEST)
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&include_private=true&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn badResponse
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        TranslationAssert.assertThatThrownBy { sut.getDatasets() }
            .isInstanceOf(AdrException::class.java)
            .matches { (it as AdrException).httpStatus == HttpStatus.BAD_REQUEST }
            .hasTranslatedMessage("There was an error fetching datasets from ADR.")
    }

    @Test
    fun `returns more specific error message if cause known`()
    {
        val badResponse = ResponseEntity<String>(
            "User 'auth0|6502e7f40954910c0ee93263' has not yet logged into ADR",
            HttpStatus.BAD_REQUEST)
        val expectedUrl = "package_search?q=type:adr-schema&rows=1000&include_private=true&hide_inaccessible_resources=true"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn badResponse
        }
        val mockBuilder = mock<ADRService> {
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
            mock(),
            mock())
        TranslationAssert.assertThatThrownBy { sut.getDatasets() }
            .isInstanceOf(AdrException::class.java)
            .matches { (it as AdrException).httpStatus == HttpStatus.BAD_REQUEST }
            .hasTranslatedMessage("Cannot fetch datasets from the ADR as you do not yet have an " +
                    "account. Please login to the ADR with your Auth0 credentials and then return here and try again.")
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
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getDataset("1234")
        assertThat(result.body!!).isEqualTo("whatever")
    }

    @Test
    fun `gets releases by id`()
    {
        val expectedUrl = "/dataset_version_list?dataset_id=1234"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn ResponseEntity
                    .ok()
                    .body("whatever")
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getReleases("1234")
        assertThat(result.body!!).isEqualTo("whatever")
    }

    @Test
    fun `get releases with a specific resource by id`()
    {
        val shapeResource = makeFakeResource("adr-shape")
        val ancResource = makeFakeResource("adr-anc")
        val vmmcResource = makeFakeResource("adr-output-zip")
        val getDatasetRes1 = objectMapper.writeValueAsString(mapOf("data" to mapOf(
                "resources" to listOf(shapeResource, ancResource))))
        val getDatasetRes2 = objectMapper.writeValueAsString(mapOf("data" to mapOf(
                "resources" to listOf(shapeResource, vmmcResource))))
        val getReleasesResponse = objectMapper.writeValueAsString(mapOf("data" to listOf(
                mapOf("id" to "rel1", "package_id" to "1234"),
                mapOf("id" to "rel2", "package_id" to "1234"))))

        val getReleasesUrl = "/dataset_version_list?dataset_id=1234"
        val getDatasetUrl1 = "package_show?id=1234&release=rel1"
        val getDatasetUrl2 = "package_show?id=1234&release=rel2"

        val mockClient = mock<ADRClient> {
            on { get(getReleasesUrl) } doReturn ResponseEntity
                .ok()
                .body(getReleasesResponse)
            on { get(getDatasetUrl1) } doReturn ResponseEntity
                .ok()
                .body(getDatasetRes1)
            on { get(getDatasetUrl2) } doReturn ResponseEntity
                .ok()
                .body(getDatasetRes2)
        }
        val mockBuilder = mock<ADRService> {
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
            mock(),
            mock())
        val result = sut.getReleasesWithResource("1234", "outputZip")
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data.isArray).isTrue
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["id"].asText()).isEqualTo("rel2")
        assertThat(data[0]["package_id"].asText()).isEqualTo("1234")
    }

    @Test
    fun `gets dataset by id and version`()
    {
        val expectedUrl = "package_show?id=1234&release=1.0"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn ResponseEntity
                    .ok()
                    .body("whatever")
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getDataset("1234", "1.0")
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
                mock(),
                mock())
        val result = sut.getFileTypeMappings()
        val data = objectMapper.readTree(result.body!!)["data"]
        assertThat(data["pjnz"].textValue()).isEqualTo("adr-pjnz")
        assertThat(data["population"].textValue()).isEqualTo("adr-pop")
        assertThat(data["programme"].textValue()).isEqualTo("adr-art")
        assertThat(data["anc"].textValue()).isEqualTo("adr-anc")
        assertThat(data["shape"].textValue()).isEqualTo("adr-shape")
        assertThat(data["survey"].textValue()).isEqualTo("adr-survey")
        assertThat(data["vmmc"].textValue()).isEqualTo("adr-vmmc")
        assertThat(data["outputZip"].textValue()).isEqualTo("adr-output-zip")
        assertThat(data["outputSummary"].textValue()).isEqualTo("adr-output-summary")
        assertThat(data["baseUrl"].textValue()).isEqualTo("adr-url")
        assertThat(data["outputComparison"].textValue()).isEqualTo("adr-output-comparison")
    }

    // used for the import{FileType} tests below
    override fun getSut(mockFileManager: FileManager,
                        mockAPIClient: HintrAPIClient,
                        mockSession: Session,
                        mockVersionRepository: VersionRepository,
                        mockRequest: HttpServletRequest): HintrController
    {
        return ADRController(mockEncryption,
                mockUserRepo,
                mock(),
                objectMapper,
                mockProperties,
                mockFileManager,
                mockAPIClient,
                mockSession,
                mockVersionRepository,
                mockRequest)
    }

    @Test
    fun `imports anc`()
    {
        assertSavesAndValidatesUrl(FileType.ANC) { sut ->
            (sut as ADRController).importANC(adrResource)
        }
    }

    @Test
    fun `imports pjnz`()
    {
        assertSavesAndValidatesUrl(FileType.PJNZ) { sut ->
            (sut as ADRController).importPJNZ(adrResource)
        }
    }

    @Test
    fun `imports programme`()
    {
        assertSavesAndValidatesUrl(FileType.Programme) { sut ->
            (sut as ADRController).importProgramme(adrResource)
        }
    }

    @Test
    fun `imports population`()
    {
        assertSavesAndValidatesUrl(FileType.Population) { sut ->
            (sut as ADRController).importPopulation(adrResource)
        }
    }

    @Test
    fun `imports shape file`()
    {
        assertSavesAndValidatesUrl(FileType.Shape) { sut ->
            (sut as ADRController).importShape(adrResource)
        }
    }

    @Test
    fun `imports survey`()
    {
        assertSavesAndValidatesUrl(FileType.Survey) { sut ->
            (sut as ADRController).importSurvey(adrResource)
        }
    }

    @Test
    fun `imports vmmc`()
    {
        assertSavesAndValidatesUrl(FileType.Vmmc) { sut ->
            (sut as ADRController).importVmmc(adrResource)
        }
    }

    @Test
    fun `imports output zip`()
    {
        assertSavesAndValidatesUrl(FileType.OutputZip) { sut ->
            (sut as ADRController).importOutputZip(adrResource)
        }
    }

    @Test
    fun `requests strict validation by default`()
    {
        val mockApiClient = getMockAPIClient(FileType.Survey)
        val mockRequest = mock<HttpServletRequest>()
        val mockFileManager = getMockFileManager(FileType.Survey)
        val sut = getSut(mockFileManager, mockApiClient, mock(), mock(), mockRequest) as ADRController
        sut.importSurvey(adrResource)
        verify(mockApiClient)
                .validateSurveyAndProgramme(
                        VersionFileWithPath("test-path", "hash", "some-file-name.csv", false),
                        "shape-path", FileType.Survey, true)
    }

    @Test
    fun `requests lax validation when query param is false`()
    {
        val mockApiClient = getMockAPIClient(FileType.Survey)
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("strict") } doReturn "false"
        }
        val mockFileManager = getMockFileManager(FileType.Survey)
        val sut = getSut(mockFileManager, mockApiClient, mock(), mock(), mockRequest) as ADRController
        sut.importSurvey(adrResource)
        verify(mockApiClient)
                .validateSurveyAndProgramme(
                        VersionFileWithPath("test-path", "hash", "some-file-name.csv", false),
                        "shape-path", FileType.Survey, false)
    }

    @Test
    fun `requests strict validation when query param is true`()
    {
        val mockApiClient = getMockAPIClient(FileType.Survey)
        val mockRequest = mock<HttpServletRequest> {
            on { getParameter("strict") } doReturn "true"
        }
        val mockFileManager = getMockFileManager(FileType.Survey)
        val sut = getSut(mockFileManager, mockApiClient, mock(), mock(), mockRequest) as ADRController
        sut.importSurvey(adrResource)
        verify(mockApiClient)
                .validateSurveyAndProgramme(
                        VersionFileWithPath("test-path", "hash", "some-file-name.csv", false),
                        "shape-path", FileType.Survey, true)
    }

    @Test
    fun `gets orgs with permission`()
    {
        val expectedUrl = "organization_list_for_user?permission=test_perm"
        val mockClient = mock<ADRClient> {
            on { get(expectedUrl) } doReturn ResponseEntity
                    .ok()
                    .body("whatever")
        }
        val mockBuilder = mock<ADRService> {
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
                mock(),
                mock())
        val result = sut.getOrgsWithPermission("test_perm")
        assertThat(result.body!!).isEqualTo("whatever")
    }

    private fun makeFakeSuccessResponse(): ResponseEntity<String>
    {
        val resultWithResources = mapOf("resources" to listOf(makeFakeResource("adr-anc"),
            makeFakeResource("adr-shape")))
        val resultWithoutResources = mapOf("resources" to listOf<Any>())
        val resultWithOutput = mapOf("resources" to listOf(makeFakeResource("adr-anc"),
            makeFakeResource("adr-output-zip")))
        val data = mapOf("results" to listOf(resultWithResources, resultWithoutResources, resultWithOutput))
        val body = mapOf("data" to data)
        return ResponseEntity
                .ok()
                .body(objectMapper.writeValueAsString(body))
    }

    private fun makeFakeResource(type: String): Map<String, String>
    {
        return mapOf(
            "resource_type" to type,
            "url" to "https://example.com/$type")
    }

}
