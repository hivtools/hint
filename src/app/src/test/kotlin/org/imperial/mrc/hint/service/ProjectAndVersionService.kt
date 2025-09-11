package org.imperial.mrc.hint.service

import com.fasterxml.jackson.databind.ObjectMapper
import com.nhaarman.mockito_kotlin.any
import com.nhaarman.mockito_kotlin.doReturn
import com.nhaarman.mockito_kotlin.mock
import com.nhaarman.mockito_kotlin.verify
import org.assertj.core.api.Assertions
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.helpers.tmpUploadDirectory
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.models.Project
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.security.Session
import org.junit.jupiter.api.*
import org.junit.jupiter.api.Assertions.*
import org.mockito.internal.verification.Times
import org.pac4j.core.profile.CommonProfile
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Paths
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class ProjectServiceTest
{
    companion object {
        @JvmStatic
        @AfterAll
        fun tearDown(): Unit {
            File(tmpUploadDirectory).deleteRecursively()
        }

        @JvmStatic
        @BeforeAll
        fun setUp(): Unit {
            File(tmpUploadDirectory).mkdir()
        }
    }

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

    private val mockProperties = mock<AppProperties> {
        on { uploadDirectory } doReturn tmpUploadDirectory
    }

    private val objectMapper = ObjectMapper()

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
        val sut = ProjectService(mockSession, mockVersionRepo, mockProjectRepo, mockLogic, mock(), mock(), mock())
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
        val sut = ProjectService(mockSession, mockVersionRepo, mockProjectRepo, mockLogic, mock(), loginMethod, mock())
        sut.cloneProjectToUser(1, listOf("new.user@email.com", "a.user@email.com"))

        verify(mockVersionRepo).cloneVersion("v1", "testVersion", 2)
        verify(mockVersionRepo).cloneVersion("v2", "testVersion", 2)

        verify(mockVersionRepo).cloneVersion("v1", "testVersion", 3)
        verify(mockVersionRepo).cloneVersion("v2", "testVersion", 3)
    }

    private fun createZip(entries: Map<String, String>): ByteArrayInputStream {
        val baos = ByteArrayOutputStream()
        ZipOutputStream(baos).use { zipOut ->
            entries.forEach { (path, content) ->
                val entry = ZipEntry(path)
                zipOut.putNextEntry(entry)
                zipOut.write(content.toByteArray())
                zipOut.closeEntry()
            }
        }
        return ByteArrayInputStream(baos.toByteArray())
    }

    private fun createStateJson(modelFitId: String, calibrateId: String, datasetPath: String): String {
        return """
            {
              "datasets": {
                "dataset1": {
                  "path": "$datasetPath"
                }
              },
              "model_fit": { "id": "$modelFitId" },
              "calibrate": { "id": "$calibrateId" }
            }
        """.trimIndent()
    }

    private val mockHintrAPIClient = mock<HintrAPIClient> {
        on { taskExists("fit123") } doReturn ResponseEntity("""{"data": {"id":"fit123","exists":true}}""", HttpStatus.OK)
        on { taskExists("cal123") } doReturn ResponseEntity("""{"data": {"id":"cal123","exists":true}}""", HttpStatus.OK)
    }

    @Test
    fun `rehydrateProject reads state and notes`()
    {
        val datasetFile = Paths.get(mockProperties.uploadDirectory, "file.csv").toFile()
        datasetFile.writeText("csv-data")

        val state = createStateJson("fit123", "cal123", datasetFile.path)
        val zip = createZip(
            mapOf(
                "info/project_state.json" to state,
                "notes.txt" to "some notes"
            )
        )

        val sut = ProjectService(mock(), mock(), mock(), mock(), mockHintrAPIClient, mockProperties, objectMapper)
        val result = sut.rehydrateProject(zip)

        assertEquals("some notes", result.notes)
        assertEquals(objectMapper.readTree(state), result.state)
    }

    @Test
    fun `rehydrateProject works without notes`() {
        val datasetFile = Paths.get(mockProperties.uploadDirectory, "file.csv").toFile()
        datasetFile.writeText("csv-data")

        val state = createStateJson("fit123", "cal123", datasetFile.path)
        val zip = createZip(
            mapOf(
                "info/project_state.json" to state,
            )
        )

        val sut = ProjectService(mock(), mock(), mock(), mock(), mockHintrAPIClient, mockProperties, objectMapper)
        val result = sut.rehydrateProject(zip)

        assertNull(result.notes)
        assertEquals(objectMapper.readTree(state), result.state)
    }

    @Test
    fun `rehydrateProject fails if project_state json missing`() {
        val zip = createZip(
            mapOf(
                "notes.txt" to "some notes"
            )
        )
        val sut = ProjectService(mock(), mock(), mock(), mock(), mockHintrAPIClient, mockProperties, objectMapper)

        val ex = assertThrows<HintException> { sut.rehydrateProject(zip) }
        assertEquals("failedZipRehydrate", ex.key)
    }

    @Test
    fun `rehydrateProject fails if dataset file missing`() {
        val state = createStateJson("fit123", "cal123", "tmp/missing.csv")
        val zip = createZip(
            mapOf(
                "info/project_state.json" to state,
                "notes.txt" to "some notes"
            )
        )
        val sut = ProjectService(mock(), mock(), mock(), mock(), mockHintrAPIClient, mockProperties, objectMapper)

        val ex = assertThrows<HintException> { sut.rehydrateProject(zip) }
        assertEquals("rehydrateMissingInputFile", ex.key)
    }

    @Test
    fun `rehydrateProject fails if modelFit id missing`() {
        val mockHintrAPIClient = mock<HintrAPIClient> {
            on { taskExists("fit123") } doReturn ResponseEntity("""{"data": {"id":"fit123","exists":false}}""", HttpStatus.OK)
            on { taskExists("cal123") } doReturn ResponseEntity("""{"data": {"id":"cal123","exists":true}}""", HttpStatus.OK)
        }

        val datasetFile = Paths.get(mockProperties.uploadDirectory, "file.csv").toFile()
        datasetFile.writeText("csv-data")

        val state = createStateJson("fit123", "cal123", datasetFile.path)
        val zip = createZip(
            mapOf(
                "info/project_state.json" to state,
                "notes.txt" to "some notes"
            )
        )
        val sut = ProjectService(mock(), mock(), mock(), mock(), mockHintrAPIClient, mockProperties, objectMapper)

        val ex = assertThrows<HintException> { sut.rehydrateProject(zip) }
        assertEquals("rehydrateModelFitIdUnknown", ex.key)
    }

    @Test
    fun `rehydrateProject fails if calibrate id missing`() {
        val mockHintrAPIClient = mock<HintrAPIClient> {
            on { taskExists("fit123") } doReturn ResponseEntity("""{"data": {"id":"fit123","exists":true}}""", HttpStatus.OK)
            on { taskExists("cal123") } doReturn ResponseEntity("""{"data": {"id":"cal123","exists":false}}""", HttpStatus.OK)
        }

        val datasetFile = Paths.get(mockProperties.uploadDirectory, "file.csv").toFile()
        datasetFile.writeText("csv-data")

        val state = createStateJson("fit123", "cal123", datasetFile.path)
        val zip = createZip(
            mapOf(
                "info/project_state.json" to state,
                "notes.txt" to "some notes"
            )
        )
        val sut = ProjectService(mock(), mock(), mock(), mock(), mockHintrAPIClient, mockProperties, objectMapper)

        val ex = assertThrows<HintException> { sut.rehydrateProject(zip) }
        assertEquals("rehydrateCalibrateIdUnknown", ex.key)
    }
}
