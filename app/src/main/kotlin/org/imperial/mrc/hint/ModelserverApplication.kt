package org.imperial.mrc.hint

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
class ModelServerApplication

fun main(args: Array<String>) {
    SpringApplication.run(ModelServerApplication::class.java, *args)
}
