package org.imperial.mrc.modelserver

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.EnableWebMvc
import org.springframework.web.servlet.config.annotation.ViewResolverRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.web.servlet.view.freemarker.FreeMarkerConfigurer
import java.io.File

@SpringBootApplication
class ModelServerApplication

fun main(args: Array<String>) {
    SpringApplication.run(ModelServerApplication::class.java, *args)
}

//@Configuration
//@EnableWebMvc
//class WebConfig : WebMvcConfigurer {
//
//    override fun configureViewResolvers(registry: ViewResolverRegistry) {
//        registry.freeMarker()
//    }
//
//    @Bean
//    fun freemarkerConfig(): FreeMarkerConfigurer {
//        val freeMarkerConfigurer = FreeMarkerConfigurer();
//        freeMarkerConfigurer.setTemplateLoaderPath(File("templates").absolutePath)
//        return freeMarkerConfigurer;
//    }
//}
