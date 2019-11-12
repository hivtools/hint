package org.imperial.mrc.hint.userCLI

import org.imperial.mrc.hint.HintProperties
import org.imperial.mrc.hint.getResource

open class Environment {
    open fun get(name: String): String? {
        return System.getenv(name)
    }
}

class DatabaseProperties(private val environment: Environment = Environment()) {

    private val properties = HintProperties().apply {
        load(getResource("config.properties").openStream())
    }

    private fun fromEnvOrDefault(propName: String): String {
        return environment.get(propName) ?: properties[propName].toString()
    }

    val user: String get() {
        return fromEnvOrDefault("db_user")
    }

    val password: String get() {
        return fromEnvOrDefault("db_password")
    }

    val url: String get() {
        return fromEnvOrDefault("db_url")
    }
}
