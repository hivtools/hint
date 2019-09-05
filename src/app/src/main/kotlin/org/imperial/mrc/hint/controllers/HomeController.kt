package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.AppProperties
import org.imperial.mrc.hint.db.StateRepository
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.GetMapping

@Controller
class HomeController(private val appProperties: AppProperties,
                     private val stateRepository: StateRepository) {

    @GetMapping("/")
    fun index(model: Model): String {
        model["title"] = appProperties.applicationTitle
        stateRepository.saveSession()
        return "index"
    }
}
