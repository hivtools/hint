package org.imperial.mrc.hint

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
}

@Component
class LocalFileManager(
        private val session: Session,
        private val stateRepository: StateRepository,
        private val appProperties: AppProperties) : FileManager {

    override fun saveFile(file: MultipartFile, type: FileType): String {
        val md = MessageDigest.getInstance("MD5")
        file.inputStream.use {
            DigestInputStream(it, md)
        }

        val hash = DatatypeConverter.printHexBinary(md.digest())
        if (stateRepository.saveNewHash(hash)) {
            File("${appProperties.uploadDirectory}/$hash").writeBytes(file.bytes)
        }

        stateRepository.saveSessionFile(session.getId(), type, hash, file.originalFilename!!)
        return hash
    }

    override fun getFile(type: FileType): File? {

        val hash = stateRepository.getSessionFileHash(session.getId(), type)
        return if (hash == null) {
            File("${appProperties.uploadDirectory}/$hash")
        } else {
            null
        }
    }
}

