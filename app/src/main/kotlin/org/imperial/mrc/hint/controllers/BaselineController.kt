package org.imperial.mrc.hint.controllers

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.imperial.mrc.hint.AppProperties
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.io.File

@RestController
@RequestMapping("/baseline")
class BaselineController(val context: WebContext,
                         val pac4jConfig: Config,
                         val appProperties: AppProperties) {

    @PostMapping("/pjnz/upload")
    @ResponseBody
    fun upload(@RequestParam("file") file: MultipartFile): String {

        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)
        val fileName = file.originalFilename!!
        val pjnzFile = File("${appProperties.uploadDirectory}/$id/pjnz/$fileName")

        if (pjnzFile.parentFile.exists()) {
            FileUtils.cleanDirectory(pjnzFile.parentFile)
        } else {
            FileUtils.forceMkdirParent(pjnzFile)
        }

        pjnzFile.writeBytes(file.bytes)

        // TODO request validation from R API and get back JSON
        // for now just read country name from file
        val countryName = fileName.split("_").first()
        return "{\"filename\": \"$fileName\", \"country\": \"$countryName\"}"
    }

    @GetMapping("/")
    @ResponseBody
    fun get(): String {

        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)

        // TODO request serialised data for this id from the R API
        // for now just read basic file info from upload dir
        val pjnzFiles = File("${appProperties.uploadDirectory}/$id/pjnz")
                .listFiles()

        return if (pjnzFiles != null && pjnzFiles.any()) {
            val fileName = pjnzFiles.first().name
            val countryName = fileName.split("_").first()
            "{\"pjnz\": { \"filename\": \"$fileName\", \"country\": \"$countryName\"}}"
        } else {
            "{\"pjnz\": null}"
        }

    }

}
