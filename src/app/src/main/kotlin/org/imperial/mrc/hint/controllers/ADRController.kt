package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.md5sum
import org.imperial.mrc.hint.models.ErrorDetail
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.file.Files

@RestController
@RequestMapping("/adr")
@Suppress("LongParameterList")
class ADRController(private val encryption: Encryption,
                    private val userRepository: UserRepository,
                    private val adrClientBuilder: ADRClientBuilder,
                    private val objectMapper: ObjectMapper,
                    private val appProperties: AppProperties,
                    fileManager: FileManager,
                    apiClient: HintrAPIClient,
                    session: Session,
                    versionRepository: VersionRepository) :
        HintrController(fileManager, apiClient, session, versionRepository)
{

    companion object
    {
        const val MAX_DATASETS = 1000
    }

    @GetMapping("/key")
    fun getAPIKey(): ResponseEntity<String>
    {
        val userId = session.getUserProfile().id
        val encryptedKey = userRepository.getADRKey(userId)
        val key = if (encryptedKey != null)
        {
            encryption.decrypt(encryptedKey)
        }
        else
        {
            null
        }
        return SuccessResponse(key).asResponseEntity()
    }

    @PostMapping("/key")
    fun saveAPIKey(@RequestParam("key") key: String): ResponseEntity<String>
    {
        val userId = session.getUserProfile().id
        val encryptedKey = encryption.encrypt(key)
        userRepository.saveADRKey(userId, encryptedKey)
        return SuccessResponse(key).asResponseEntity()
    }

    @DeleteMapping("/key")
    fun deleteAPIKey(): ResponseEntity<String>
    {
        val userId = session.getUserProfile().id
        userRepository.deleteADRKey(userId)
        return SuccessResponse(null).asResponseEntity()
    }

    @GetMapping("/datasets")
    fun getDatasets(@RequestParam showInaccessible: Boolean = false): ResponseEntity<String>
    {
        val adr = adrClientBuilder.build()
        var url = "package_search?q=type:${appProperties.adrDatasetSchema}&rows=$MAX_DATASETS"
        url = if (showInaccessible)
        {
            // this flag is used for testing but will never
            // actually be passed by the front-end
            url
        }
        else
        {
            "$url&hide_inaccessible_resources=true"
        }
        val response = adr.get(url)
        return if (response.statusCode != HttpStatus.OK)
        {
            response
        }
        else
        {
            val data = objectMapper.readTree(response.body!!)["data"]["results"]
            SuccessResponse(data.filter { it["resources"].count() > 0 }).asResponseEntity()
        }
    }

    @GetMapping("/datasets/{id}")
    fun getDataset(@PathVariable id: String): ResponseEntity<String>
    {
        val adr = adrClientBuilder.build()
        return adr.get("package_show?id=${id}")
    }

    @GetMapping("/schemas")
    fun getFileTypeMappings(): ResponseEntity<String>
    {
        return SuccessResponse(
                mapOf("baseUrl" to appProperties.adrUrl,
                        "anc" to appProperties.adrANCSchema,
                        "programme" to appProperties.adrARTSchema,
                        "pjnz" to appProperties.adrPJNZSchema,
                        "population" to appProperties.adrPopSchema,
                        "shape" to appProperties.adrShapeSchema,
                        "survey" to appProperties.adrSurveySchema,
                        "outputZip" to appProperties.adrOutputZipSchema,
                        "outputSummary" to appProperties.adrOutputSummarySchema)).asResponseEntity()
    }

    @GetMapping("/orgs")
    fun getOrgsWithPermission(@RequestParam permission: String): ResponseEntity<String>
    {
        val adr = adrClientBuilder.build()
        return adr.get("organization_list_for_user?permission=${permission}")
    }

    @PostMapping("/pjnz")
    fun importPJNZ(@RequestParam url: String): ResponseEntity<String>
    {
        return saveAndValidate(url, FileType.PJNZ)
    }

    @PostMapping("/shape")
    fun importShape(@RequestParam url: String): ResponseEntity<String>
    {
        return saveAndValidate(url, FileType.Shape)
    }

    @PostMapping("/population")
    fun importPopulation(@RequestParam url: String): ResponseEntity<String>
    {
        return saveAndValidate(url, FileType.Population)
    }

    @PostMapping("/survey")
    fun importSurvey(@RequestParam url: String): ResponseEntity<String>
    {
        return saveAndValidate(url, FileType.Survey)
    }

    @PostMapping("/programme")
    fun importProgramme(@RequestParam url: String): ResponseEntity<String>
    {
        return saveAndValidate(url, FileType.Programme)
    }

    @PostMapping("/anc")
    fun importANC(@RequestParam url: String): ResponseEntity<String>
    {
        return saveAndValidate(url, FileType.ANC)
    }

    @PostMapping("/datasets/{id}/resource/{resourceType}/{modelCalibrateId}")
    @Suppress("ReturnCount")
    fun pushFileToADR(@PathVariable id: String,
                      @PathVariable resourceType: String,
                      @PathVariable modelCalibrateId: String,
                      @RequestParam resourceFileName: String,
                      @RequestParam resourceName: String,
                      @RequestParam resourceId: String?): ResponseEntity<String>
    {
        // 1. If output file, download relevant artefact from hintr
        val artefact: Pair<ResponseEntity<StreamingResponseBody>, String>? = when (resourceType)
        {
            appProperties.adrOutputZipSchema -> Pair(apiClient.downloadSpectrum(modelCalibrateId),
                    "Naomi model outputs")
            appProperties.adrOutputSummarySchema -> Pair(apiClient.downloadSummary(modelCalibrateId),
                    "Naomi summary report")
            appProperties.adrPJNZSchema, appProperties.adrShapeSchema, appProperties.adrPopSchema,
            appProperties.adrSurveySchema, appProperties.adrARTSchema, appProperties.adrANCSchema -> null
            else -> return ErrorDetail(HttpStatus.BAD_REQUEST, "Invalid resourceType").toResponseEntity()
        }

        // 2. Get the file ready to upload
        val tmpDir = Files.createTempDirectory("adr").toFile()
        val (file, errorDetail) = if (artefact != null)
        {
            makeOutputFileToPushToADR(artefact, tmpDir, resourceFileName)
        }
        else
        {
            makeInputFileToPushToADR(resourceType, resourceId, tmpDir)
        }

        if (errorDetail != null)
        {
           return errorDetail.toResponseEntity()
        }

        // 3. Checksum file and upload with metadata to ADR
        @Suppress("UnsafeCallOnNullableType")
        val filePart = Pair("upload", file!!)
        val commonParameters =
                mutableListOf("name" to resourceName, "hash" to file.md5sum(), "resource_type" to resourceType)

        if (artefact != null)
        {
            commonParameters.add("description" to artefact.second)
        }

        val adr = adrClientBuilder.build()
        return try
        {
            when (resourceId)
            {
                null -> adr.postFile("resource_create", commonParameters + listOf("package_id" to id), filePart)
                else -> adr.postFile("resource_patch", commonParameters + listOf("id" to resourceId), filePart)
            }
        }
        finally
        {
            tmpDir.deleteRecursively()
        }
    }

    @Suppress("ReturnCount")
    private fun makeOutputFileToPushToADR(artefact: Pair<ResponseEntity<StreamingResponseBody>, String>,
                                          tmpDir: File,
                                          resourceFileName: String): Pair<File?, ErrorDetail?>
    {
        // Return error if artefact can't be retrieved
        if (!artefact.first.statusCode.is2xxSuccessful)
        {
            val baos = ByteArrayOutputStream()
            artefact.first.body?.writeTo(baos)
            return Pair(null, ErrorDetail(artefact.first.statusCode, baos.toString()))
        }

        // Stream artefact to file
        val file = File(tmpDir, resourceFileName)
        FileOutputStream(file).use { fis ->
            artefact.first.body!!.writeTo(fis)
        }
        return Pair(file, null)
    }

    @Suppress("ReturnCount")
    private fun makeInputFileToPushToADR(resourceType: String,
                                         resourceId: String?,
                                         tmpDir: File): Pair<File?, ErrorDetail?>
    {
        if (resourceId == null)
        {
            return Pair(null,
                    ErrorDetail(HttpStatus.BAD_REQUEST, "resourceId must be provided for input resourceType"))
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
            else -> throw IllegalArgumentException("$resourceType is not an input resource type")
        }

        //Find input file on disk and copy to tmp dir with original file name
        val versionFile = fileManager.getFile(fileType)
                ?: return Pair(null, ErrorDetail(HttpStatus.BAD_REQUEST, "File does not exist"))

        val file = File(tmpDir, versionFile.filename)
        File(versionFile.path).copyTo(file)
        return Pair(file, null)
    }
}


