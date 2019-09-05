package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.pac4j.core.config.Config
import org.pac4j.core.context.WebContext
import org.springframework.stereotype.Component
import org.springframework.util.StreamUtils
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.IOException
import java.security.DigestInputStream
import java.security.MessageDigest
import javax.xml.bind.DatatypeConverter

enum class FileType {

    ANC,
    Program,
    PJNZ,
    Shape,
    Survey;

    override fun toString(): String {
        return this.name.toLowerCase()
    }
}

interface FileManager {
    fun saveFile(file: MultipartFile, type: FileType): String
    fun getFile(type: FileType): File?
}

@Component
class LocalFileManager(
        private val context: WebContext,
        private val pac4jConfig: Config,
        private val appProperties: AppProperties) : FileManager {

    override fun saveFile(file: MultipartFile, type: FileType): String {
        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)
        val fileName = file.originalFilename!!
        val path = "$id/$type/$fileName"
        val localFile = File("${appProperties.uploadDirectory}/$path")

        if (localFile.parentFile.exists()) {
            FileUtils.cleanDirectory(localFile.parentFile)
        } else {
            FileUtils.forceMkdirParent(localFile)
        }

        val md = MessageDigest.getInstance("MD5")
        localFile.outputStream().use { out ->
            file.inputStream.use {
                DigestInputStream(it, md).use { dis ->
                    StreamUtils.copy(dis, out)
                }
            }
        }

        val name = "$id/$type/${DatatypeConverter.printHexBinary(md.digest())}"
        if (!localFile.renameTo(File("${appProperties.uploadDirectory}/$name"))) {
            throw IOException("Failed to rename file")
        }

        return name
    }

    override fun getFile(type: FileType): File? {

        val id = pac4jConfig.sessionStore.getOrCreateSessionId(context)

        val files = File("${appProperties.uploadDirectory}/$id/$type")
                .listFiles()

        return files?.first()
    }
}

