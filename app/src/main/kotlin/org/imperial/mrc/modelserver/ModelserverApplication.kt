package org.imperial.mrc.modelserver

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class ModelserverApplication

fun main(args: Array<String>) {
    runApplication<ModelserverApplication>(*args)
}
