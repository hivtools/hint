package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.node.ObjectNode
import com.fasterxml.jackson.databind.node.TextNode
import com.fasterxml.jackson.module.kotlin.readValue
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.exceptions.HintException
import org.springframework.http.ResponseEntity
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/meta")
class MetadataController(val apiClient: HintrAPIClient,
                         private val classLoader: ClassLoader = MetadataController::class.java.classLoader,
                         val fileManager: FileManager)
{
    @GetMapping("/hintr/version")
    @ResponseBody
    fun version(): ResponseEntity<String>
    {
        return apiClient.getVersion()
    }

    @GetMapping("/adr/{id}")
    @ResponseBody
    fun uploadMetadata(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getUploadMetadata(id)
    }

    data class TypesPayload(val types: Array<String>)

    @PostMapping("/review-inputs/{iso3}")
    @ResponseBody
    fun reviewInputMetadata(@PathVariable("iso3") iso3: String,
                            @RequestBody req: TypesPayload): ResponseEntity<String>
    {
        val files = req.types.map {
            val fileType = when(it.lowercase()) {
                "anc" -> FileType.ANC
                "programme" -> FileType.Programme
                "survey" -> FileType.Survey
                "shape" -> FileType.Shape
                else -> throw HintException("unknownReviewInputFileType", HttpStatus.BAD_REQUEST)
            }
            it to fileManager.getFile(fileType)
        }.toMap()
        return apiClient.getReviewInputMetadata(iso3, files)
    }
}
