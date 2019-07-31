package org.imperial.mrc.hint

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication

@SpringBootApplication
class Hint

fun main(args: Array<String>) {
    SpringApplication.run(Hint::class.java, *args)
}
