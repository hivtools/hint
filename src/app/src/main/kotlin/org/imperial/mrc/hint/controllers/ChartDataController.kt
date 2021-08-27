package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.springframework.http.ResponseEntity
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.exceptions.HintException
import org.springframework.http.HttpStatus
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
        val inputFileType = when (type.toLowerCase()) {
            "anc" -> FileType.ANC
            "programme" -> FileType.Programme
            else -> throw HintException("unknownInputTimeSeriesType", HttpStatus.BAD_REQUEST)
        }

        val files = fileManager.getFiles(FileType.Shape, inputFileType)
        return apiClient.getInputTimeSeriesChartData(type, files)
    }
}
