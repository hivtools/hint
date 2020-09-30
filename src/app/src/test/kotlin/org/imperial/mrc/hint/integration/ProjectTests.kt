package org.imperial.mrc.hint.integration

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ArrayNode
import com.fasterxml.jackson.databind.node.ObjectNode
import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.db.Tables.PROJECT
import org.imperial.mrc.hint.db.Tables.PROJECT_VERSION
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.boot.test.web.client.exchange
import org.springframework.boot.test.web.client.getForEntity
import org.springframework.boot.test.web.client.postForEntity
import org.springframework.http.*
import org.springframework.util.LinkedMultiValueMap
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.*

class ProjectTests : VersionFileTests()
{

    @BeforeEach
    fun setup()
    {
        authorize()
        testRestTemplate.getForEntity<String>("/")
    }

    private val testState = "{\"state\": \"test\"}"

    @Test
    fun `can create new project`()
    {
        val result = createProject()
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)
        val data = getResponseData(result)

        assertThat(data["id"].asInt()).isGreaterThan(0)
        assertThat(data["name"].asText()).isEqualTo("testProject")
        val versions = data["versions"] as ArrayNode
        assertThat(versions.count()).isEqualTo(1)
        assertThat(versions[0]["id"].asText().count()).isGreaterThan(0)
        assertThat(versions[0]["versionNumber"].asInt()).isEqualTo(1)
        LocalDateTime.parse(versions[0]["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(versions[0]["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
    }

    @Test
    fun `can create new version from parent`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        val versions = createProjectData["versions"] as ArrayNode
        val versionId = versions[0]["id"].asText()
        getUpdateVersionStateResult(projectId, versionId, testState)

        val result = getNewVersionResult(projectId, versionId)
        val data = getResponseData(result)

        val newVersionId = data["id"].asText()
        assertThat(newVersionId.count()).isGreaterThan(0)
        assertThat(data["versionNumber"].asInt()).isEqualTo(2)
        LocalDateTime.parse(data["created"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        LocalDateTime.parse(data["updated"].asText(), DateTimeFormatter.ISO_LOCAL_DATE_TIME)

        val savedProject = dsl.select(PROJECT_VERSION.STATE,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(newVersionId))
                .fetchOne()

        assertThat(savedProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
        assertThat(savedProject[PROJECT_VERSION.UPDATED]).isEqualTo(savedProject[PROJECT_VERSION.CREATED])
    }

    @Test
    fun `can return expected English error when copy nonexistent version`()
    {
        val result = getNewVersionResult(1, "nonExistent")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Version does not exist.")
    }

    @Test
    fun `can return expected French error when copy nonexistent version`()
    {
        val result = getNewVersionResult(1, "nonExistent", "fr")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("La version n'existe pas.")
    }

    @Test
    fun `can update version state`()
    {
        val createResult = createProject()
        val data = getResponseData(createResult)
        val projectId = data["id"].asInt()
        val versions = data["versions"] as ArrayNode
        val versionId = versions[0]["id"].asText()

        val result = getUpdateVersionStateResult(projectId, versionId, testState)
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val savedProject = dsl.select(PROJECT_VERSION.STATE,
                PROJECT_VERSION.CREATED,
                PROJECT_VERSION.UPDATED)
                .from(PROJECT_VERSION)
                .where(PROJECT_VERSION.ID.eq(versionId))
                .fetchOne()

        assertThat(savedProject[PROJECT_VERSION.STATE]).isEqualTo(testState)
        assertThat(savedProject[PROJECT_VERSION.UPDATED]).isAfter(savedProject[PROJECT_VERSION.CREATED])
    }

    @Test
    fun `can return expected English error when update nonexistent version state`()
    {
        val result = getUpdateVersionStateResult(1, "nonExistent", "testState")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Version does not exist.")
    }

    @Test
    fun `can return expected French error when update nonexistent version state`()
    {
        val result = getUpdateVersionStateResult(1, "nonExistent", "testState",
                "fr")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("La version n'existe pas.")
    }

    @Test
    fun `can get projects`()
    {
        val createResult = createProject()

        val result = testRestTemplate.getForEntity<String>("/projects/")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val data = getResponseData(result) as ArrayNode
        val createData = getResponseData(createResult) as ObjectNode
        assertThat(data.count()).isEqualTo(1)
        assertThat(data[0]["id"]).isEqualTo(createData["id"])
        assertThat(data[0]["name"].asText()).isEqualTo("testProject")
        val versions = data[0]["versions"] as ArrayNode
        assertThat(versions.count()).isEqualTo(1)
        val createVersions = createData["versions"] as ArrayNode
        assertThat(versions[0]["id"]).isEqualTo(createVersions[0]["id"])
        assertThat(versions[0]["versionNumber"].asInt()).isEqualTo(1)
        assertThat(versions[0]["created"]).isEqualTo(createVersions[0]["created"])
        assertThat(versions[0]["updated"]).isEqualTo(createVersions[0]["updated"])
    }

    @Test
    fun `can get version details`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        val versions = createProjectData["versions"] as ArrayNode
        val versionId = versions[0]["id"].asText()
        getUpdateVersionStateResult(projectId, versionId, "TEST STATE")

        val pjnzHash = setUpVersionFileAndGetHash("Botswana2018.PJNZ", "/baseline/pjnz/")

        val result = testRestTemplate.getForEntity<String>("/project/$projectId/version/$versionId")
        assertThat(result.statusCode).isEqualTo(HttpStatus.OK)

        val data = getResponseData(result)
        assertThat(data["state"].asText()).isEqualTo("TEST STATE")
        assertThat(data["files"]["pjnz"]["hash"].asText()).isEqualTo(pjnzHash)
        assertThat(data["files"]["pjnz"]["filename"].asText()).isEqualTo("Botswana2018.PJNZ")
    }

    @Test
    fun `can return expected English error when get nonexistent version details`()
    {
        val result = testRestTemplate.getForEntity<String>("/project/99/version/noversion")
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Version does not exist.")
    }

    @Test
    fun `can return expected French error when get nonexistent version details`()
    {
        val headers = getStandardHeaders("fr")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/version/noversion", HttpMethod.GET, httpEntity)
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("La version n'existe pas.")
    }

    @Test
    fun `can delete project`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        createProjectData["versions"] as ArrayNode

        var result = testRestTemplate.getForEntity<String>("/projects/")
        var data = getResponseData(result) as ArrayNode
        assertThat(data.count()).isEqualTo(1)

        testRestTemplate.delete("/project/$projectId")

        result = testRestTemplate.getForEntity<String>("/projects/")
        data = getResponseData(result) as ArrayNode
        assertThat(data.count()).isEqualTo(0)
    }

    @Test
    fun `can return expected English error when delete nonexistent project`()
    {
        val headers = getStandardHeaders("en")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/", HttpMethod.DELETE, httpEntity)
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Project does not exist.")
    }

    @Test
    fun `can return expected French error when delete nonexistent project`()
    {
        val headers = getStandardHeaders("fr")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99", HttpMethod.DELETE, httpEntity)
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Le projet n'existe pas.")
    }

    @Test
    fun `can delete version`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        val versions = createProjectData["versions"] as ArrayNode
        val versionId1 = versions[0]["id"].asText()
        val newVersionResult = getNewVersionResult(projectId, versionId1)
        val newVersionData = getResponseData(newVersionResult)
        val versionId2 = newVersionData["id"].asText()

        testRestTemplate.delete("/project/$projectId/version/$versionId1")

        val result = testRestTemplate.getForEntity<String>("/projects/")
        val data = getResponseData(result) as ArrayNode
        assertThat(data.count()).isEqualTo(1)
        val versionsData = data[0]["versions"] as ArrayNode
        assertThat(versionsData.count()).isEqualTo(1)
        assertThat(versionsData[0]["id"].asText()).isEqualTo(versionId2)
    }

    @Test
    fun `can return expected English error when delete nonexistent version`()
    {
        val headers = getStandardHeaders("en")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/version/nonexistent", HttpMethod.DELETE, httpEntity)
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("Version does not exist.")
    }

    @Test
    fun `can return expected French error when delete nonexistent version`()
    {
        val headers = getStandardHeaders("fr")
        val httpEntity = HttpEntity<String>(headers)

        val result = testRestTemplate.exchange<String>("/project/99/version/nonexistent", HttpMethod.DELETE, httpEntity)
        assertThat(result.statusCode).isEqualTo(HttpStatus.BAD_REQUEST)

        val errors = ObjectMapper().readTree(result.body)["errors"] as ArrayNode
        val msg = errors[0]["detail"].asText()
        assertThat(msg).isEqualTo("La version n'existe pas.")
    }

    @Test
    fun `can clone project`()
    {
        val createResult = createProject()
        val createProjectData = getResponseData(createResult)
        val projectId = createProjectData["id"].asInt()
        val versions = createProjectData["versions"] as ArrayNode
        val versionId = versions[0]["id"].asText()
        getUpdateVersionStateResult(projectId, versionId, testState)

        val email = "user@email.com"
        val email2 = "another.user@email.com"
        userRepo.addUser(email, "password")
        userRepo.addUser(email2, "password")

        testRestTemplate.postForEntity<String>("/project/$projectId/clone/",
                getCloneProjectEntity(listOf(email, email2)))

        val newProjects = dsl.selectFrom(PROJECT)
                .where(PROJECT.USER_ID.eq(email))
                .or(PROJECT.USER_ID.eq(email2))
                .fetch()
                .map {
                    it[PROJECT.ID]
                }

        assertThat(newProjects.count()).isEqualTo(2)

        val oldVersions = dsl.selectFrom(PROJECT_VERSION)
                .where(PROJECT_VERSION.PROJECT_ID.eq(projectId))
                .fetch()

        newProjects.forEach {
            val newVersions = dsl.selectFrom(PROJECT_VERSION)
                    .where(PROJECT_VERSION.PROJECT_ID.eq(it))
                    .fetch()

            assertThat(newVersions.count()).isEqualTo(1)
            assertThat(newVersions[0].state).isEqualTo(oldVersions[0].state)
            assertThat(newVersions[0].versionNumber).isEqualTo(oldVersions[0].versionNumber)
            assertThat(newVersions[0].created).isEqualTo(oldVersions[0].created)
            assertThat(newVersions[0].updated).isEqualTo(oldVersions[0].updated)
            assertThat(newVersions[0].deleted).isEqualTo(oldVersions[0].deleted)
        }
    }

    private fun createProject(): ResponseEntity<String>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("name", "testProject")
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        val httpEntity = HttpEntity(map, headers)
        return testRestTemplate.postForEntity<String>("/project/", httpEntity)
    }

    private fun getCloneProjectEntity(emails: List<String>): HttpEntity<Any>
    {
        val map = LinkedMultiValueMap<String, String>()
        map.add("emails", emails.joinToString(","))
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_FORM_URLENCODED
        return HttpEntity(map, headers)
    }

    private fun getUpdateVersionStateResult(projectId: Int, versionId: String, state: String,
                                            language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)

        val httpEntity = HttpEntity(state, headers)
        val url = "/project/$projectId/version/$versionId/state/"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getNewVersionResult(projectId: Int, versionId: String, language: String? = null): ResponseEntity<String>
    {
        val headers = getStandardHeaders(language)
        val httpEntity = HttpEntity(null, headers)
        val url = "/project/$projectId/version/?parent=$versionId"
        return testRestTemplate.postForEntity<String>(url, httpEntity)
    }

    private fun getStandardHeaders(language: String?): HttpHeaders
    {
        val headers = HttpHeaders()
        headers.contentType = MediaType.APPLICATION_JSON
        if (language != null)
        {
            headers.acceptLanguage = mutableListOf(Locale.LanguageRange(language))
        }

        return headers
    }
}
