package org.imperial.mrc.hint.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.HintException
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.security.Session
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.io.InputStream
import java.io.InputStreamReader
import java.nio.file.Paths
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

data class RehydratedProject(
    val notes: String?,
    val state: JsonNode
)

@Service
class ProjectService (
    private val session: Session,
    private val versionRepository: VersionRepository,
    private val projectRepository: ProjectRepository,
    private val userLogic: UserLogic,
    private val hintrAPIClient: HintrAPIClient,
    private val properties: AppProperties,
    private val objectMapper: ObjectMapper
)
{

    private val logger = GenericLoggerImpl(LoggerFactory.getLogger(ProjectService::class.java))
    fun cloneProjectToUser(projectId: Int, emails: List<String>)
    {
        logger.info("Cloning project to users", mapOf("projectId" to projectId, "emails" to emails))
        val userIds = emails.map {
            userLogic.getUser(it, properties.oauth2LoginMethod)?.id ?: throw UserException("userDoesNotExist")
        }
        val userId = session.getUserProfile().id
        val currentProject = projectRepository.getProject(projectId, userId)
        userIds.forEach {
            val newProjectId = projectRepository.saveNewProject(it, currentProject.name, userId)
            currentProject.versions.forEach {
                versionRepository.cloneVersion(it.id, session.generateVersionId(), newProjectId)
            }
        }
    }

    fun rehydrateProject(outputZip: InputStream): RehydratedProject
    {
        val PROJECT_STATE_PATH = "info/project_state.json"
        val NOTES_PATH = "notes.txt"
        val objectMapper = jacksonObjectMapper()

        var stateJson: JsonNode? = null
        var notes: String? = null

        ZipInputStream(outputZip).use { zip ->
            var entry: ZipEntry? = zip.nextEntry
            while (entry != null) {
                when (entry.name) {
                    PROJECT_STATE_PATH -> {
                        val text = InputStreamReader(zip).readText()
                        stateJson = objectMapper.readTree(text)
                    }
                    NOTES_PATH -> {
                        val text = InputStreamReader(zip).readText()
                        notes = text
                    }
                }
                zip.closeEntry()
                entry = zip.nextEntry
            }
        }

        validateRehydrateState(stateJson)

        return RehydratedProject(notes = notes, state = stateJson!!)
    }

    private fun taskExists(id: String): Boolean
    {
        val response = hintrAPIClient.taskExists(id)
        val body = response.body ?: return false

        val jsonNode = objectMapper.readTree(body)
        return jsonNode.path("data").path("exists").asBoolean(false)
    }

    private fun validateRehydrateState(state: JsonNode?) {
        // Think about errors here, if we no longer store all historic versions then
        //   we could end up in a situation where the outputs or inputs don't exist on
        //   disk anymore. In that case we should improve the error message, saying
        //   "this project is too old to rehydrate" or something.
        //   We can get the version number from the state JSON and use this.
        if (state == null) {
            throw HintException("failedZipRehydrate", HttpStatus.BAD_REQUEST)
        }

        val datasets = state.path("datasets")
        datasets.fieldNames().forEach { datasetName ->
            val datasetNode = datasets.get(datasetName)
            val pathNode = datasetNode.path("path")
            if (!pathNode.isMissingNode && !pathNode.isNull) {
                val origPath = pathNode.asText()
                // file names in state are using R specific mount location, really we should do them
                // relative to the mount path, for now, just capture the file name and build the full
                // path.
                val fileName = origPath
                    .substringAfterLast('/')
                val filePath = Paths.get(properties.uploadDirectory, fileName).toFile()

                if (!filePath.exists()) {
                    throw HintException("rehydrateMissingInputFile", HttpStatus.BAD_REQUEST)
                }
            } else {
                throw HintException("rehydrateMissingInputFile", HttpStatus.BAD_REQUEST)
            }
        }

        val modelFitId = state.path("model_fit").path("id").asText(null)
        if (modelFitId == null || !taskExists(modelFitId)) {
            throw HintException("rehydrateModelFitIdUnknown", HttpStatus.BAD_REQUEST)
        }

        val calibrateId = state.path("calibrate").path("id").asText(null)
        if (calibrateId == null || !taskExists(calibrateId)) {
            throw HintException("rehydrateCalibrateIdUnknown", HttpStatus.BAD_REQUEST)
        }
    }
}
