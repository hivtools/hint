package org.imperial.mrc.hint.controllers

import com.fasterxml.jackson.databind.ObjectMapper
import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.db.VersionRepository
import org.imperial.mrc.hint.security.Session
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HomeController(
        private val versionRepository: VersionRepository,
        private val session: Session,
        private val appProperties: AppProperties,
        private val hintrAPIClient: HintrAPIClient)
{
    private val objectMapper = ObjectMapper()

    @GetMapping(value = ["/", "/projects", "accessibility", "privacy"])
    fun index(model: Model): String
    {
        val userProfile = session.getUserProfile()
        versionRepository.saveVersion(session.getVersionId(), null)
        model["title"] = appProperties.applicationTitle
        model["user"] = userProfile.id
        return "index"
    }


    @GetMapping("/metrics", produces = ["text/plain"])
    fun metrics(): ResponseEntity<String>
    {
        val workerStatus = hintrAPIClient.get("hintr/worker/status").body
        val data = objectMapper.readTree(workerStatus)["data"]
        val statuses = mutableMapOf("busy" to 0, "idle" to 0, "paused" to 0, "exited" to 0, "lost" to 0)
        data.fields().forEach {
            val s = it.value.asText().lowercase()
            statuses[s] = statuses.valueOrZero(s) + 1
        }
        statuses["live"] = statuses.valueOrZero("busy") + statuses.valueOrZero("idle") + statuses.valueOrZero("paused")
        val statusNums = statuses.map { "${it.key}_workers ${it.value}" }.joinToString("\n")
        return ResponseEntity("running 1\n$statusNums", HttpStatus.OK)
    }
}

fun Map<String, Int>.valueOrZero(key: String): Int
{
    return this[key] ?: 0
}
