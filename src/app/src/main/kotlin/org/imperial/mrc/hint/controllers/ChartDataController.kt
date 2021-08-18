package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.springframework.http.ResponseEntity
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/chart-data")
class ChartDataController(val fileManager: FileManager, val apiClient: HintrAPIClient)
{
    @GetMapping("/input-time-series/{type}")
    fun inputTimeSeries(@PathVariable("type") type: String): ResponseEntity<String>
    {
        val inputFileType = if (type.toLowerCase() == "anc") FileType.ANC else FileType.Programme
        val files = fileManager.getFiles(FileType.Shape, inputFileType)
        return apiClient.getInputTimeSeriesChartData(type, files)
    }
}
