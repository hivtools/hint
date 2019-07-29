package org.imperial.mrc.modelserver.controllers

import org.pac4j.core.config.Config
import org.pac4j.core.context.J2EContext
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths

@Controller
@RequestMapping("/baseline")
class BaselineController(val context: J2EContext,
                         val pac4jConfig: Config) {

    private val UPLOAD_FOLDER = "uploads/"

    @PostMapping("/pjnz/upload")
    @ResponseBody
    fun upload(@RequestParam("file") file: MultipartFile): String {

        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)
        val pjnzFile = Paths.get(UPLOAD_FOLDER, id, "pjnz", file.originalFilename)
        try {
            Files.createDirectories(pjnzFile.parent)
        }
        catch(e: FileAlreadyExistsException){

        }
        Files.write(pjnzFile, file.bytes)

        // TODO request validation from R API and get back JSON
        return "{\"country\": \"Malawi\"}"
    }
}
