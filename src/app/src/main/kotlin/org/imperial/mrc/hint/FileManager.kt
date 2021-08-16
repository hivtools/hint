package org.imperial.mrc.hint

import org.apache.tomcat.util.http.fileupload.FileUtils
import org.imperial.mrc.hint.clients.ADRClientBuilder
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.models.VersionFile
import org.imperial.mrc.hint.models.VersionFileWithPath
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.io.File
import java.io.InputStream
import java.security.DigestInputStream
import java.security.MessageDigest
import javax.xml.bind.DatatypeConverter

enum class FileType
{

    ANC,
    PJNZ,
    Population,
    Programme,
    Shape,
    Survey;

    override fun toString(): String
    {
        return this.name.toLowerCase()
    }
}

interface FileManager
{
    fun saveFile(file: MultipartFile, type: FileType): VersionFileWithPath
    fun saveFile(url: String, type: FileType): VersionFileWithPath
    fun getFile(type: FileType): VersionFileWithPath?
    fun getAllHashes(): Map<String, String>
    fun getFiles(vararg include: FileType): Map<String, VersionFileWithPath>
    fun setAllFiles(files: Map<String, VersionFile?>)
}

@Component
class LocalFileManager(
        private val session: Session,
        private val versionRepository: VersionRepository,
        private val appProperties: AppProperties,
        private val adrClientBuilder: ADRClientBuilder) : FileManager
{

    private val uploadPath = appProperties.uploadDirectory

    override fun saveFile(file: MultipartFile, type: FileType): VersionFileWithPath
    {
        return saveFile(file.inputStream, file.originalFilename!!, type, false)
    }

    override fun saveFile(url: String, type: FileType): VersionFileWithPath
    {
        val originalFilename = url.split("/").last().split("?").first()
        val adr = adrClientBuilder.build()
        return saveFile(adr.getInputStream(url), originalFilename, type, true)
    }

    private fun saveFile(inputStream: InputStream,
                         originalFilename: String,
                         type: FileType,
                         fromADR: Boolean): VersionFileWithPath
    {

        val md = MessageDigest.getInstance("MD5")
        val bytes = inputStream.use {
            DigestInputStream(it, md).readBytes()
        }
        val extension = originalFilename.split(".").last()
        val hash = "${DatatypeConverter.printHexBinary(md.digest())}.${extension}"
        val path = "${appProperties.uploadDirectory}/$hash"
        if (versionRepository.saveNewHash(hash))
        {
            val localFile = File(path)
            FileUtils.forceMkdirParent(localFile)
            localFile.writeBytes(bytes)
        }

        versionRepository.saveVersionFile(session.getVersionId(), type, hash, originalFilename, fromADR)
        return VersionFileWithPath(path, hash, originalFilename, fromADR)

    }

    override fun getFile(type: FileType): VersionFileWithPath?
    {
        return versionRepository.getVersionFile(session.getVersionId(), type)
                ?.toVersionFileWithPath(uploadPath)
    }

    override fun getAllHashes(): Map<String, String>
    {
        val hashes = versionRepository.getHashesForVersion(session.getVersionId())
        return hashes.mapValues { "$uploadPath/${it.value}" }
    }

    override fun getFiles(vararg include: FileType): Map<String, VersionFileWithPath>
    {
        val files = versionRepository.getVersionFiles(session.getVersionId())
        val includeKeys = include.map { it.toString() }
        return files.filterKeys { includeKeys.count() == 0 || includeKeys.contains(it) }
                .mapValues { it.value.toVersionFileWithPath(uploadPath) }
    }

    override fun setAllFiles(files: Map<String, VersionFile?>)
    {
        versionRepository.setFilesForVersion(session.getVersionId(), files);
    }
}
