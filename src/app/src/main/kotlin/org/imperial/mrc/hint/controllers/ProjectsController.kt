package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.db.SnapshotRepository
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
                         private val snapshotRepository: SnapshotRepository,
                         private val projectRepository: ProjectRepository)
{
    @PostMapping("/project/")
    @ResponseBody
    fun newProject(@RequestParam("name") name: String): ResponseEntity<String>
    {
        val projectId = projectRepository.saveNewProject(userId(), name)

        //Generate new snapshot id and set it as the session variable, and save new snapshot to db
        val newSnapshotId = session.generateNewSnapshotId()
        snapshotRepository.saveSnapshot(newSnapshotId, projectId)

        val snapshot = snapshotRepository.getSnapshot(newSnapshotId)
        val project = Project(projectId, name, listOf(snapshot))
        return SuccessResponse(project).asResponseEntity()
    }

    @PostMapping("/project/{projectId}/snapshot/")
    fun newSnapshot(@PathVariable("projectId") projectId: Int,
                    @RequestParam("parent") parentSnapshotId: String): ResponseEntity<String>
    {
        val newSnapshotId = session.generateNewSnapshotId()
        snapshotRepository.copySnapshot(parentSnapshotId, newSnapshotId,projectId, userId())
        val newSnapshot = snapshotRepository.getSnapshot(newSnapshotId)
        return SuccessResponse(newSnapshot).asResponseEntity();
    }

    @PostMapping("/project/{projectId}/snapshot/{snapshotId}/state")
    @ResponseBody
    fun uploadState(@PathVariable("projectId") projectId: Int,
                    @PathVariable("snapshotId") snapshotId: String,
                    @RequestBody state: String): ResponseEntity<String>
    {
        snapshotRepository.saveSnapshotState(snapshotId, projectId, userId(), state)
        return EmptySuccessResponse.asResponseEntity()
    }

    @GetMapping("project/{projectId}/snapshot/{snapshotId}")
    @ResponseBody
    fun loadSnapshotDetails(@PathVariable("projectId") projectId: Int,
                            @PathVariable("snapshotId") snapshotId: String): ResponseEntity<String>
    {
        val snapshotDetails = snapshotRepository.getSnapshotDetails(snapshotId, projectId, userId())
        session.setSnapshotId(snapshotId)
        return SuccessResponse(snapshotDetails).asResponseEntity();
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

    private fun userId(): String
    {
        return session.getUserProfile().id
    }
}
