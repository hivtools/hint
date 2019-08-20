package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.springframework.context.annotation.Configuration
import org.springframework.web.multipart.MultipartFile
import java.io.File

interface FileManager {
    fun saveFile(file: MultipartFile, type: String): String
    fun getFile(type: String): File?
}

@Configuration
open class LocalFileManager(
        private val context: WebContext,
        private val pac4jConfig: Config,
        private val appProperties: AppProperties) : FileManager {

    override fun saveFile(file: MultipartFile, type: String): String {
        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)
        val fileName = file.originalFilename!!
        val path = "$id/$type/$fileName"
        val localFile = File("${appProperties.uploadDirectory}/$path")

        if (localFile.parentFile.exists()) {
            FileUtils.cleanDirectory(localFile.parentFile)
        } else {
            FileUtils.forceMkdirParent(localFile)
        }

        localFile.writeBytes(file.bytes)

        return path
    }

    override fun getFile(type: String): File? {

        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)

        val pjnzFiles = File("${appProperties.uploadDirectory}/$id/$type")
                .listFiles()

        return pjnzFiles?.first()
    }
}

