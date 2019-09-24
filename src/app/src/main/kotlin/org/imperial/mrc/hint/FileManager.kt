package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.imperial.mrc.hint.db.StateRepository
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.security.DigestInputStream
import java.security.MessageDigest
import javax.xml.bind.DatatypeConverter

enum class FileType {

    ANC,
    PJNZ,
    Population,
    Programme,
    Shape,
    Survey;

    override fun toString(): String {
        return this.name.toLowerCase()
    }
}

interface FileManager {
    fun saveFile(file: MultipartFile, type: FileType): String
    fun getFile(type: FileType): File?
    fun getAllFiles(): Map<String, String>
}

@Component
class LocalFileManager(
        private val session: Session,
        private val stateRepository: StateRepository,
        private val appProperties: AppProperties) : FileManager {

    override fun saveFile(file: MultipartFile, type: FileType): String {
        val md = MessageDigest.getInstance("MD5")
        val bytes = file.inputStream.use {
            DigestInputStream(it, md).readBytes()
        }

        val extension = file.originalFilename!!.split(".").last()
        val hash = "${DatatypeConverter.printHexBinary(md.digest())}.${extension}"
        val path = "${appProperties.uploadDirectory}/$hash"
        if (stateRepository.saveNewHash(hash)) {
            val localFile = File(path)
            FileUtils.forceMkdirParent(localFile)
            localFile.writeBytes(bytes)
        }

        stateRepository.saveSessionFile(session.getId(), type, hash, file.originalFilename!!)
        return path
    }

    override fun getFile(type: FileType): File? {
        val hash = stateRepository.getSessionFileHash(session.getId(), type)
        return if (hash != null) {
            File("${appProperties.uploadDirectory}/$hash")
        } else {
            null
        }
    }

    override fun getAllFiles(): Map<String, String> {
        val hashes = stateRepository.getFilesForSession(session.getId())
        return hashes.associate { it.type to "${appProperties.uploadDirectory}/${it.hash}" }
    }
}

