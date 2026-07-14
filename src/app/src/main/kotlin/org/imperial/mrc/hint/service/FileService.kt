package org.imperial.mrc.hint.service
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.nio.file.*

@Service
class FileService(private val tempDirectory: Path) {

    companion object {
        private val logger = LoggerFactory.getLogger(FileService::class.java);
    }

    fun copyToTempDir(sourcePath: Path): Path {
        val targetPath = tempDirectory.resolve(sourcePath.fileName)
        Files.copy(sourcePath, targetPath, StandardCopyOption.REPLACE_EXISTING)
        logger.info("File copied to: $targetPath")
        return targetPath
    }
}
