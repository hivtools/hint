package org.imperial.mrc.hint.service

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.UserException
import org.imperial.mrc.hint.logic.UserLogic
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Service

interface ProjectVersionService
{
    fun cloneProjectToUser(projectId: Int, emails: List<String>)
}

@Service
class ProjectAndVersionService (
    private val session: Session,
    private val versionRepository: VersionRepository,
    private val projectRepository: ProjectRepository,
    private val userLogic: UserLogic,
    private val properties: AppProperties
) : ProjectVersionService
{

    override fun cloneProjectToUser(projectId: Int, emails: List<String>)
    {
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
