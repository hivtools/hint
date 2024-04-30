package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.md5sum
import org.imperial.mrc.hint.models.*
import org.imperial.mrc.hint.security.Session
import org.imperial.mrc.hint.service.ADRService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.file.Files
import javax.servlet.http.HttpServletRequest

@RestController
@RequestMapping("/adr")
@Suppress("LongParameterList")
class ADRPushController(private val adrService: ADRService,
                        private val objectMapper: ObjectMapper,
                        private val appProperties: AppProperties,
                        fileManager: FileManager,
                        apiClient: HintrAPIClient,
                        session: Session,
                        versionRepository: VersionRepository,
                        request: HttpServletRequest) :
    HintrController(fileManager, apiClient, session, versionRepository, request)
{

    @PostMapping("/datasets/{id}/releases")
    @Suppress("ReturnCount")
    fun createRelease(@PathVariable id: String, @RequestParam name: String): ResponseEntity<String>
    {
        val adr = adrService.build()
        // checks for existing releases on ADR with the same name as the release being created
        val releasesResponse = adr.get("/dataset_version_list?dataset_id=${id}")
        if (releasesResponse.statusCode != HttpStatus.OK)
        {
            return releasesResponse
        }
        val releases = objectMapper.readTree(releasesResponse.body!!)["data"]
        val duplicateRelease = releases.find { it["name"]?.asText() == name }
        if (duplicateRelease != null)
        {
            val duplicateReleaseId = duplicateRelease["id"].asText()
            // if a release of the same name exists on ADR, request that it is deleted
            val deleteResponse = adr.post("/version_delete", listOf("version_id" to duplicateReleaseId))
            if (deleteResponse.statusCode != HttpStatus.OK)
            {
                return deleteResponse
            }
        }
        return adr.post("/dataset_version_create", listOf("dataset_id" to id, "name" to name))
    }

    @PostMapping("/datasets/{id}/resource/{resourceType}/{downloadId}")
    @Suppress("ReturnCount", "LongParameterList", "UnsafeCallOnNullableType")
    fun pushFileToADR(@PathVariable id: String,
                      @PathVariable resourceType: String,
                      @PathVariable downloadId: String,
                      @RequestParam resourceFileName: String,
                      @RequestParam resourceId: String?,
                      @RequestParam resourceName: String,
                      @RequestParam description: String?) : ResponseEntity<String>
    {
        return when (resourceType)
        {
            appProperties.adrOutputSummarySchema,
            appProperties.adrOutputComparisonSchema,
            appProperties.adrOutputZipSchema ->
                pushOutputFileToADR(id, resourceType, downloadId, resourceFileName, resourceId, resourceName,
                    description)
            appProperties.adrPJNZSchema,
            appProperties.adrShapeSchema,
            appProperties.adrPopSchema,
            appProperties.adrSurveySchema,
            appProperties.adrARTSchema,
            appProperties.adrANCSchema,
            appProperties.adrVmmcSchema ->
                pushInputFileToADR(id, resourceType, resourceId, resourceName)
            else -> ErrorDetail(HttpStatus.BAD_REQUEST, "Invalid resourceType").toResponseEntity()

        }
    }

    private fun pushOutputFileToADR(datasetId: String,
                                    resourceType: String,
                                    downloadId: String,
                                    resourceFileName: String,
                                    resourceId: String?,
                                    resourceName: String,
                                    description: String?): ResponseEntity<String>
    {
        if (description == null)
        {
            return ErrorDetail(HttpStatus.BAD_REQUEST, "description must be provided for output resourceType")
                .toResponseEntity()
        }
        // 1. Download relevant artefact from hintr
        val artefact: ResponseEntity<StreamingResponseBody> = when (resourceType)
        {
            appProperties.adrOutputZipSchema -> apiClient.downloadOutputResult(downloadId)
            appProperties.adrOutputSummarySchema -> apiClient.downloadOutputResult(downloadId)
            appProperties.adrOutputComparisonSchema -> apiClient.downloadOutputResult(downloadId)
            else -> throw IllegalArgumentException("$resourceType is not an output resource type")
        }

        // 2. Return error if artefact can't be retrieved
        return if (!artefact.statusCode.is2xxSuccessful)
        {
            val baos = ByteArrayOutputStream()
            artefact.body?.writeTo(baos)
            ErrorDetail(artefact.statusCode, baos.toString()).toResponseEntity()
        }
        else
        {
            // 3. Stream artefact to file
            val tmpDir = Files.createTempDirectory("adr").toFile()
            val file = File(tmpDir, resourceFileName)
            FileOutputStream(file).use { fis ->
                artefact.body!!.writeTo(fis)
            }

            // 4. Checksum file and upload with metadata to ADR
            postFileToADR(file, datasetId, resourceType, resourceName, resourceId, description, tmpDir)
        }
    }

    private fun pushInputFileToADR(datasetId: String,
                                   resourceType: String,
                                   resourceId: String?,
                                   resourceName: String): ResponseEntity<String>
    {
        if (resourceId == null)
        {
            return ErrorDetail(HttpStatus.BAD_REQUEST, "resourceId must be provided for input resourceType")
                .toResponseEntity()
        }

        // Map adr schema to version file type
        val fileType = when (resourceType)
        {
            appProperties.adrPJNZSchema -> FileType.PJNZ
            appProperties.adrShapeSchema -> FileType.Shape
            appProperties.adrPopSchema -> FileType.Population
            appProperties.adrSurveySchema -> FileType.Survey
            appProperties.adrARTSchema -> FileType.Programme
            appProperties.adrANCSchema -> FileType.ANC
            appProperties.adrVmmcSchema -> FileType.Vmmc
            else -> throw IllegalArgumentException("$resourceType is not an input resource type")
        }

        //Find input file on disk and copy to tmp dir with original file name
        val versionFile = fileManager.getFile(fileType)
        return if (versionFile == null)
        {
            ErrorDetail(HttpStatus.BAD_REQUEST, "File does not exist").toResponseEntity()
        }
        else
        {
            val tmpDir = Files.createTempDirectory("adr").toFile()
            val file = File(tmpDir, versionFile.filename)
            File(versionFile.path).copyTo(file)

            postFileToADR(file, datasetId, resourceType, resourceName, resourceId, null, tmpDir)
        }
    }

    private fun postFileToADR(file: File,
                              datasetId: String,
                              resourceType: String,
                              resourceName: String,
                              resourceId: String?,
                              description: String?,
                              tmpDir: File): ResponseEntity<String>
    {
        val filePart = Pair("upload", file)
        val fileHash = file.md5sum()

        val commonParameters =
            mutableListOf("name" to resourceName, "hash" to fileHash,"resource_type" to resourceType)
        if (description != null)
        {
            commonParameters.add("description" to description)
        }

        val adr = adrService.build()
        return try
        {
            when (resourceId)
            {
                null -> adr.postFile("resource_create", commonParameters + listOf("restricted" to
                        "{\"allowed_organizations\":\"unaids\",\"allowed_users\":\"\",\"level\":\"restricted\"}",
                    "package_id" to datasetId), filePart)
                else ->
                {
                    if (uploadFileHasChanges(resourceId, fileHash))
                    {
                        adr.postFile("resource_patch", commonParameters + listOf("id" to resourceId), filePart)
                    }
                    else
                    {
                        EmptySuccessResponse.asResponseEntity()
                    }
                }
            }
        }
        catch (e: IOException)
        {
            ErrorDetail(HttpStatus.INTERNAL_SERVER_ERROR, e.message!!).toResponseEntity()
        }
        finally
        {
            tmpDir.deleteRecursively()
        }
    }

    fun uploadFileHasChanges(resourceId: String, newDatasetHash: String): Boolean
    {
        val adr = adrService.build()
        val response = adr.get("resource_show?id=${resourceId}")
        if (response.statusCode.isError)
        {
            throw IOException("Unable to retrieve hash from ADR")
        }
        val hash = objectMapper.readTree(response.body!!)["data"]["hash"].asText()
        return hash != newDatasetHash
    }
}
