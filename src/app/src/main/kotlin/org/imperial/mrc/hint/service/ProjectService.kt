package org.imperial.mrc.hint.service

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logging.GenericLoggerImpl
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.security.Session
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service


@Service
class ProjectService (
    private val session: Session,
    private val versionRepository: VersionRepository,
    private val projectRepository: ProjectRepository,
    private val userLogic: UserLogic,
    private val properties: AppProperties
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
}
