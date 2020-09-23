package org.imperial.mrc.hint.db

import org.jooq.DSLContext
import org.imperial.mrc.hint.db.Tables.PROJECT
import org.imperial.mrc.hint.db.Tables.PROJECT_VERSION
import org.imperial.mrc.hint.exceptions.ProjectException
import org.imperial.mrc.hint.models.Version
import org.imperial.mrc.hint.models.Project
import org.jooq.Record
import org.springframework.stereotype.Component

interface ProjectRepository
{
    fun saveNewProject(userId: String, projectName: String): Int
    fun getProjects(userId: String): List<Project>
    fun deleteProject(projectId: Int, userId: String)
}

@Component
class JooqProjectRepository(private val dsl: DSLContext) : ProjectRepository {

    override fun saveNewProject(userId: String, projectName: String): Int
    {
        if (getProject(projectName, userId) != null) {
            throw ProjectException("projectNameAlreadyExists")
        }
        val result = dsl.insertInto(PROJECT, PROJECT.USER_ID, PROJECT.NAME)
                .values(userId, projectName)
                .returning(PROJECT.ID)
                .fetchOne();

        return result[PROJECT.ID]
    }

    override fun getProjects(userId: String): List<Project> {
        val result =
                dsl.select(
                        PROJECT.ID,
                        PROJECT.NAME,
                        PROJECT_VERSION.ID,
                        PROJECT_VERSION.CREATED,
                        PROJECT_VERSION.UPDATED,
                        PROJECT_VERSION.VERSION_NUMBER)
                        .from(PROJECT)
                        .join(PROJECT_VERSION)
                        .on(PROJECT.ID.eq(PROJECT_VERSION.PROJECT_ID))
                        .where(PROJECT.USER_ID.eq(userId))
                        .and(PROJECT_VERSION.DELETED.eq(false))
                        .orderBy(PROJECT_VERSION.UPDATED.desc())
                        .fetch()

        return result.groupBy { it[PROJECT.ID] }
                .map { v ->
                    Project(v.key, v.value[0][PROJECT.NAME],
                            v.value.map { s ->
                                Version(s[PROJECT_VERSION.ID], s[PROJECT_VERSION.CREATED],
                                        s[PROJECT_VERSION.UPDATED], s[PROJECT_VERSION.VERSION_NUMBER])
                            })
                }
                .sortedByDescending { it.versions[0].updated }
    }

    override fun deleteProject(projectId: Int, userId: String)
    {
        checkProjectExists(projectId, userId)
        dsl.update(PROJECT_VERSION)
                .set(PROJECT_VERSION.DELETED, true)
                .where(PROJECT_VERSION.PROJECT_ID.eq(projectId))
                .execute()
    }

    private fun checkProjectExists(projectId: Int, userId: String)
    {
        dsl.select(PROJECT.ID)
                .from(PROJECT)
                .where(PROJECT.ID.eq(projectId))
                .and(PROJECT.USER_ID.eq(userId))
                .fetchAny() ?: throw ProjectException("projectDoesNotExist")
    }

    private fun getProject(projectName: String, userId: String): Record? {
        return dsl.select(PROJECT.ID)
                .from(PROJECT)
                .where(PROJECT.NAME.eq(projectName))
                .and(PROJECT.USER_ID.eq(userId))
                .fetchAny()
    }
}
