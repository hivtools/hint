package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.db.ProjectRepository
import org.imperial.mrc.hint.models.*
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.Project
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Session
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.bind.annotation.PostMapping

@RestController
class ProjectsController(private val session: Session,
                         private val versionRepository: VersionRepository,
                         private val projectRepository: ProjectRepository)
{
    @PostMapping("/project/")
    @ResponseBody
    fun newProject(@RequestParam("name") name: String): ResponseEntity<String>
    {
        val projectId = projectRepository.saveNewProject(userId(), name)

        //Generate new version id and set it as the session variable, and save new version to db
        val newVersionId = session.generateNewVersionId()
        versionRepository.saveVersion(newVersionId, projectId)

        val version = versionRepository.getVersion(newVersionId)
        val project = Project(projectId, name, listOf(version))
        return SuccessResponse(project).asResponseEntity()
    }

    @PostMapping("/project/{projectId}/version/")
    fun newVersion(@PathVariable("projectId") projectId: Int,
                   @RequestParam("parent") parentVersionId: String): ResponseEntity<String>
    {
        val newVersionId = session.generateNewVersionId()
        versionRepository.copyVersion(parentVersionId, newVersionId,projectId, userId())
        val newVersion = versionRepository.getVersion(newVersionId)
        return SuccessResponse(newVersion).asResponseEntity();
    }

    @PostMapping("/project/{projectId}/version/{versionId}/state")
    @ResponseBody
    fun uploadState(@PathVariable("projectId") projectId: Int,
                    @PathVariable("versionId") versionId: String,
                    @RequestBody state: String): ResponseEntity<String>
    {
        versionRepository.saveVersionState(versionId, projectId, userId(), state)
        return EmptySuccessResponse.asResponseEntity()
    }

    @PostMapping("/project/{projectId}/version/{versionId}/promoteversion")
    @ResponseBody
    fun promoteVersion(
        @PathVariable("projectId") projectId: Int,
        @PathVariable("versionId") versionId: String,
        @RequestParam("name") name: String): ResponseEntity<String>
    {
        val newProjectId = projectRepository.saveNewProject(userId(), name)
        val newVersionId = session.generateNewVersionId()
        versionRepository.copyVersion(versionId, newVersionId, newProjectId, userId())

        val version = versionRepository.getVersion(newVersionId)
        val project = Project(newProjectId, name, listOf(version))
        return SuccessResponse(project).asResponseEntity()
    }

    @GetMapping("project/{projectId}/version/{versionId}")
    @ResponseBody
    fun loadVersionDetails(@PathVariable("projectId") projectId: Int,
                           @PathVariable("versionId") versionId: String): ResponseEntity<String>
    {
        val versionDetails = versionRepository.getVersionDetails(versionId, projectId, userId())
        session.setVersionId(versionId)
        return SuccessResponse(versionDetails).asResponseEntity();
    }

    @GetMapping("/projects/")
    @ResponseBody
    fun getProjects(): ResponseEntity<String>
    {
        val projects =
                if (session.userIsGuest()) {
                    listOf<Project>()
                } else {
                    projectRepository.getProjects(userId())
                }
        return SuccessResponse(projects).asResponseEntity()
    }

    @DeleteMapping("/project/{projectId}/version/{versionId}")
    @ResponseBody
    fun deleteVersion(@PathVariable("projectId") projectId: Int,
                      @PathVariable("versionId") versionId: String): ResponseEntity<String>
    {
        versionRepository.deleteVersion(versionId, projectId, userId())
        return EmptySuccessResponse.asResponseEntity()
    }

    @DeleteMapping("/project/{projectId}")
    @ResponseBody
    fun deleteProject(@PathVariable("projectId") projectId: Int): ResponseEntity<String>
    {
        projectRepository.deleteProject(projectId, userId())
        return EmptySuccessResponse.asResponseEntity()
    }

    private fun userId(): String
    {
        return session.getUserProfile().id
    }
}
