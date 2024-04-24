package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.UserRepository
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.exceptions.AdrException
import org.imperial.mrc.hint.models.AdrResource
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.security.Encryption
import org.imperial.mrc.hint.security.Session
import org.imperial.mrc.hint.service.ADRService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import javax.servlet.http.HttpServletRequest

@RestController
@RequestMapping("/adr")
@Suppress("LongParameterList")
class ADRController(private val encryption: Encryption,
                    private val userRepository: UserRepository,
                    private val adrService: ADRService,
                    private val objectMapper: ObjectMapper,
                    private val appProperties: AppProperties,
                    fileManager: FileManager,
                    apiClient: HintrAPIClient,
                    session: Session,
                    versionRepository: VersionRepository,
                    request: HttpServletRequest) :
        HintrController(fileManager, apiClient, session, versionRepository, request)
{

    private val logger = LoggerFactory.getLogger(ADRController::class.java);

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
        return SuccessResponse(listDatasets(showInaccessible).filter { it["resources"].count() > 0 }).asResponseEntity()
    }

    @GetMapping("/datasetsWithResource")
    fun getDatasetsWithResource(@RequestParam resourceType: String,
                                @RequestParam showInaccessible: Boolean = false): ResponseEntity<String>
    {
        val data = listDatasets(showInaccessible)
        val filteredData = data.filter { dataset ->
            datasetHasResourceOfType(dataset["resources"], resourceType)
        }

        return SuccessResponse(filteredData).asResponseEntity()
    }

    private fun listDatasets(showInaccessible: Boolean): JsonNode {
        val adr = adrService.build()

        var url = "package_search?q=type:${appProperties.adrDatasetSchema}&rows=$MAX_DATASETS&include_private=true"
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
        if (response.statusCode != HttpStatus.OK)
        {
            var errorKey = "adrFetchingDatasetsError"
            if (response.body?.contains("has not yet logged into ADR") == true)
            {
                errorKey = "adrFetchingDatasetsNoAccountError"
            }
            val message = response.body
            logger.error(message)
            throw AdrException(
                errorKey,
                response.statusCode,
                url
            )
        }

        return objectMapper.readTree(response.body!!)["data"]["results"]
    }

    @GetMapping("/datasets/{id}")
    fun getDataset(@PathVariable id: String, @RequestParam release: String? = null): ResponseEntity<String>
    {
        val adr = adrService.build()
        var url = "package_show?id=${id}"
        if (release != null) {
            url = "$url&release=${release}"
        }
        return adr.get(url)
    }

    @GetMapping("/datasets/{id}/releases")
    fun getReleases(@PathVariable id: String): ResponseEntity<String>
    {
        val adr = adrService.build()
        return adr.get("/dataset_version_list?dataset_id=${id}")
    }

    @GetMapping("/datasets/{id}/releasesWithResource")
    fun getReleasesWithResource(@PathVariable id: String, @RequestParam resourceType: String): ResponseEntity<String>
    {
        val releases = objectMapper.readTree(getReleases(id).body!!)["data"]
        val filteredReleases = releases?.filter { release ->
            val dataset = getDataset(id, release["id"].asText())
            val resources = objectMapper.readTree(dataset.body!!)["data"]["resources"]
            datasetHasResourceOfType(resources, resourceType)
        }

        return SuccessResponse(filteredReleases).asResponseEntity()
    }

    @GetMapping("/schemas")
    fun getFileTypeMappings(): ResponseEntity<String>
    {
        return SuccessResponse(appProperties.fileTypeMappings).asResponseEntity()
    }

    @GetMapping("/orgs")
    fun getOrgsWithPermission(@RequestParam permission: String): ResponseEntity<String>
    {
        val adr = adrService.build()
        return adr.get("organization_list_for_user?permission=${permission}")
    }

    @PostMapping("/pjnz")
    fun importPJNZ(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.PJNZ)
    }

    @PostMapping("/shape")
    fun importShape(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.Shape)
    }

    @PostMapping("/population")
    fun importPopulation(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.Population)
    }

    @PostMapping("/survey")
    fun importSurvey(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.Survey)
    }

    @PostMapping("/programme")
    fun importProgramme(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.Programme)
    }

    @PostMapping("/anc")
    fun importANC(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.ANC)
    }

    @PostMapping("/vmmc")
    fun importVmmc(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return saveAndValidate(data, FileType.Vmmc)
    }

    @PostMapping("/output")
    fun importOutputZip(@RequestBody data: AdrResource): ResponseEntity<String>
    {
        return SuccessResponse(fileManager.saveFile(data, FileType.OutputZip)).asResponseEntity()
    }

    private fun datasetHasResourceOfType(resources: JsonNode, resourceType: String): Boolean {
        return resources.any { resource ->
            resource["resource_type"]?.asText() == appProperties.fileTypeMappings[resourceType]
        }
    }
}
