package org.imperial.mrc.hint.tempdir

import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.nio.file.Files
import java.nio.file.Path


@Configuration
class TempDirConfig {

    companion object {
        const val CALIBRATION_DIR: String = "calibrationData"
        private val logger = LoggerFactory.getLogger(TempDirConfig::class.java);
    }

    @Bean
    fun tempDirectory(): Path {
        val tempDir = Files.createTempDirectory(CALIBRATION_DIR)
        logger.info("created temp dir")
        Runtime.getRuntime().addShutdownHook(Thread {
            try {
                Files.walk(tempDir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(Files::delete)
                logger.info("Temporary directory cleaned up: $tempDir")
            } catch (e: Exception) {
                logger.error("Failed to clean up temporary directory: $e")
            }
        })
        return tempDir
    }
}
