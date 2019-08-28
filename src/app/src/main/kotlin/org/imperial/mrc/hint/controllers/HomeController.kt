package org.imperial.mrc.hint.controllers

import com.github.kittinunf.fuel.core.Headers
import com.github.kittinunf.fuel.httpGet
import com.github.kittinunf.fuel.httpPost
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.ui.set
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@Controller
class HomeController {

    @GetMapping("/")
    fun index(model: Model): String {
        model["title"] = "HINT"
        return "index"
    }
}
