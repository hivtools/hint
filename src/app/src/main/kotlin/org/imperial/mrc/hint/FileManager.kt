package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.SessionFileWithPath
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
    fun saveFile(file: MultipartFile, type: FileType): SessionFileWithPath
    fun getFile(type: FileType): SessionFileWithPath?
    fun getAllFiles(): Map<String, String>
}

@Component
class LocalFileManager(
        private val session: Session,
        private val sessionRepository: SessionRepository,
        private val appProperties: AppProperties) : FileManager {

    override fun saveFile(file: MultipartFile, type: FileType): SessionFileWithPath {
        val md = MessageDigest.getInstance("MD5")
        val bytes = file.inputStream.use {
            DigestInputStream(it, md).readBytes()
        }

        val extension = file.originalFilename!!.split(".").last()
        val hash = "${DatatypeConverter.printHexBinary(md.digest())}.${extension}"
        val path = "${appProperties.uploadDirectory}/$hash"
        val originalFilename = file.originalFilename!!
        if (sessionRepository.saveNewHash(hash)) {
            val localFile = File(path)
            FileUtils.forceMkdirParent(localFile)
            localFile.writeBytes(bytes)
        }

        sessionRepository.saveSessionFile(session.getId(), type, hash, originalFilename)
        return SessionFileWithPath(path, hash, originalFilename)
    }

    override fun getFile(type: FileType): SessionFileWithPath? {
        return sessionRepository.getSessionFile(session.getId(), type)
                ?.toSessionFileWithPath(appProperties.uploadDirectory)
    }

    override fun getAllFiles(): Map<String, String> {
        val hashes = sessionRepository.getHashesForSession(session.getId())
        return hashes.mapValues { "${appProperties.uploadDirectory}/${it.value}" }
    }
}

