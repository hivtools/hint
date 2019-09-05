package org.imperial.mrc.hint

import org.imperial.mrc.hint.db.StateRepository
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Component
import org.springframework.util.StreamUtils
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.IOException
import java.security.DigestInputStream
import java.security.MessageDigest
import javax.xml.bind.DatatypeConverter
import java.util.UUID

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
        private val session: Session,
        private val appProperties: AppProperties,
        private val stateRepository: StateRepository) : FileManager {

    override fun saveFile(file: MultipartFile, type: FileType): String {
        val temp = UUID.randomUUID()
        val localFile = File("${appProperties.uploadDirectory}/$temp")
        val md = MessageDigest.getInstance("MD5")
        localFile.outputStream().use { out ->
            file.inputStream.use {
                DigestInputStream(it, md).use { dis ->
                    StreamUtils.copy(dis, out)
                }
            }
        }

        val hash = DatatypeConverter.printHexBinary(md.digest())
        if (!localFile.renameTo(File("${appProperties.uploadDirectory}/$hash"))) {
            throw IOException("Failed to rename file")
        }

        stateRepository.saveHash(type, hash)
        return hash
    }

    override fun getFile(type: FileType): File? {
        val hash = stateRepository.getHash(type)
        return if (hash != null) {
            File("${appProperties.uploadDirectory}/$hash")
        } else {
            null
        }
    }
}

