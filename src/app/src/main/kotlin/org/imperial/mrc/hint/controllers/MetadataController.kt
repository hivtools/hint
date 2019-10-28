package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.APIClient
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/meta")
class MetadataController(val apiClient: APIClient) {

    @GetMapping("/plotting/{country}")
    @ResponseBody
    fun plotting(@PathVariable("country") country: String): ResponseEntity<String> {
        return apiClient.get("meta/plotting/${country}");
    }
}