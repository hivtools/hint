package org.imperial.mrc.hint

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
open class HintApplication

fun main(args: Array<String>) {
    SpringApplication.run(HintApplication::class.java, *args)
}
