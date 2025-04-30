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
        val inputFileType = when (type.lowercase()) {
            "anc" -> FileType.ANC
            "programme" -> FileType.Programme
            else -> throw HintException("unknownInputTimeSeriesType", HttpStatus.BAD_REQUEST)
        }

        val files = fileManager.getFiles(FileType.Shape, FileType.PJNZ, inputFileType)
        return apiClient.getInputTimeSeriesChartData(inputFileType.toString(), files)
    }

    @GetMapping("/input-comparison")
    fun inputComparison(): ResponseEntity<String>
    {
        val files = fileManager.getFiles(FileType.Shape, FileType.PJNZ, FileType.ANC, FileType.Programme)
        return apiClient.getInputComparisonChartData(files)
    }

    @GetMapping("/input-population")
    fun inputPopulation(): ResponseEntity<String>
    {
        val files = fileManager.getFiles(FileType.Population)
        return apiClient.getInputPopulationMetadata(files)
    }
}
