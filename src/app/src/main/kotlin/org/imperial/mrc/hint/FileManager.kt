package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.models.SnapshotFile
import org.imperial.mrc.hint.models.SnapshotFileWithPath
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.InputStream
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
    fun saveFile(file: MultipartFile, type: FileType): SnapshotFileWithPath
    fun saveFile(url: String, type: FileType): SnapshotFileWithPath
    fun getFile(type: FileType): SnapshotFileWithPath?
    fun getAllHashes(): Map<String, String>
    fun getFiles(vararg include: FileType): Map<String, SnapshotFileWithPath>
    fun setAllFiles(files: Map<String, SnapshotFile?>)
}

@Component
class LocalFileManager(
        private val session: Session,
        private val snapshotRepository: SnapshotRepository,
        private val appProperties: AppProperties,
        private val adrClientBuilder: ADRClientBuilder) : FileManager {

    private val uploadPath = appProperties.uploadDirectory

    override fun saveFile(file: MultipartFile, type: FileType): SnapshotFileWithPath {
        return saveFile(file.inputStream, file.originalFilename!!, type)
    }

    override fun saveFile(url: String, type: FileType): SnapshotFileWithPath {
        val originalFilename = url.split("/").last()
        val adr = adrClientBuilder.build()
        return saveFile(adr.getInputStream(url), originalFilename, type)
    }

    private fun saveFile(inputStream: InputStream, originalFilename: String, type: FileType): SnapshotFileWithPath {
        val md = MessageDigest.getInstance("MD5")
        val bytes = inputStream.use {
            DigestInputStream(it, md).readBytes()
        }
        val extension = originalFilename.split(".").last()
        val hash = "${DatatypeConverter.printHexBinary(md.digest())}.${extension}"
        val path = "${appProperties.uploadDirectory}/$hash"
        if (snapshotRepository.saveNewHash(hash)) {
            val localFile = File(path)
            FileUtils.forceMkdirParent(localFile)
            localFile.writeBytes(bytes)
        }
        snapshotRepository.saveSnapshotFile(session.getSnapshotId(), type, hash, originalFilename)
        return SnapshotFileWithPath(path, hash, originalFilename)
    }

    override fun getFile(type: FileType): SnapshotFileWithPath? {
        return snapshotRepository.getSnapshotFile(session.getSnapshotId(), type)
                ?.toSnapshotFileWithPath(uploadPath)
    }

    override fun getAllHashes(): Map<String, String> {
        val hashes = snapshotRepository.getHashesForSnapshot(session.getSnapshotId())
        return hashes.mapValues { "$uploadPath/${it.value}" }
    }

    override fun getFiles(vararg include: FileType): Map<String, SnapshotFileWithPath> {
        val files = snapshotRepository.getSnapshotFiles(session.getSnapshotId())
        val includeKeys = include.map { it.toString() }
        return files.filterKeys { includeKeys.count() == 0 || includeKeys.contains(it) }
                .mapValues { it.value.toSnapshotFileWithPath(uploadPath) }
    }

    override fun setAllFiles(files: Map<String, SnapshotFile?>) {
        snapshotRepository.setFilesForSnapshot(session.getSnapshotId(), files);
    }
}

