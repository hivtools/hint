package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.SnapshotRepository
import org.imperial.mrc.hint.security.Session
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HomeController(
        private val snapshotRepository: SnapshotRepository,
        private val session: Session,
        private val appProperties: AppProperties) {

    @GetMapping("/")
    fun index(model: Model): String {
        val userProfile = session.getUserProfile()
        snapshotRepository.saveSnapshot(session.getSnapshotId(), null)
        model["title"] = appProperties.applicationTitle
        model["user"] = userProfile.id
        return "index"
    }
}
