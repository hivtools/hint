package org.imperial.mrc.hint.unit

import org.assertj.core.api.Assertions.assertThat
import org.imperial.mrc.hint.MvcConfig
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.pac4j.core.config.Config
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.mock.web.MockServletContext
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.content
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext
import java.io.File
import java.util.UUID

class MvcConfigTests
{
    @Configuration
    class TestConfig
    {
        @Bean
        fun pac4jConfig() = Config()
    }

    // MvcConfig serves the files in static/public. The tests run in src/app, so the tests write their files there.
    private val testFiles = mutableListOf<File>()
    private val testFolders = mutableListOf<File>()

    @AfterEach
    fun cleanUp()
    {
        testFiles.forEach { it.delete() }
        testFolders.reversed().forEach { it.delete() }
    }

    @Test
    fun `hashed assets can be cached for a year`()
    {
        val name = writePublicFile("assets", "js", "console.log(1);")

        mockMvc().perform(get("/public/assets/$name"))
                .andExpect(status().isOk)
                .andExpect(content().string("console.log(1);"))
                .andExpect(header().string("Cache-Control", "public, max-age=31536000, immutable"))
    }

    @Test
    fun `other public files have no Cache-Control header`()
    {
        val name = writePublicFile("css", "css", ".a {}")

        mockMvc().perform(get("/public/css/$name"))
                .andExpect(status().isOk)
                .andExpect(content().string(".a {}"))
                .andExpect(header().doesNotExist("Cache-Control"))
    }

    private fun mockMvc(): MockMvc
    {
        val context = AnnotationConfigWebApplicationContext()
        context.servletContext = MockServletContext()
        context.register(TestConfig::class.java, MvcConfig::class.java)
        context.refresh()
        return MockMvcBuilders.webAppContextSetup(context).build()
    }

    private fun writePublicFile(folder: String, extension: String, text: String): String
    {
        val dir = File("static/public/$folder")
        val missing = generateSequence(dir) { it.parentFile }.takeWhile { !it.exists() }.toList()
        testFolders.addAll(missing.reversed())
        dir.mkdirs()
        val file = File(dir, "test-${UUID.randomUUID()}.$extension")
        file.writeText(text)
        testFiles.add(file)
        return file.name
    }
}
