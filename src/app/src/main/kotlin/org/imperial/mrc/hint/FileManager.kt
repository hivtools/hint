package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.imperial.mrc.hint.db.SessionRepository
import org.imperial.mrc.hint.models.SessionFile
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
    fun getAllHashes(): Map<String, String>
    fun getFiles(vararg include: FileType): Map<String, SessionFileWithPath>
    fun setAllFiles(files: Map<String, SessionFile?>)
}

@Component
class LocalFileManager(
        private val session: Session,
        private val sessionRepository: SessionRepository,
        private val appProperties: AppProperties) : FileManager {

    private val uploadPath = appProperties.uploadDirectory

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
                ?.toSessionFileWithPath(uploadPath)
    }

    override fun getAllHashes(): Map<String, String> {
        val hashes = sessionRepository.getHashesForSession(session.getId())
        return hashes.mapValues { "$uploadPath/${it.value}" }
    }

    override fun getFiles(vararg include: FileType): Map<String, SessionFileWithPath> {
        val files = sessionRepository.getSessionFiles(session.getId())
        val includeKeys = include.map { it.toString() }
        return files.filterKeys { includeKeys.count() == 0 || includeKeys.contains(it) }
                .mapValues { it.value.toSessionFileWithPath(uploadPath) }
    }

    override fun setAllFiles(files: Map<String, SessionFile?>) {
        sessionRepository.setFilesForSession(session.getId(), files);
    }
}

