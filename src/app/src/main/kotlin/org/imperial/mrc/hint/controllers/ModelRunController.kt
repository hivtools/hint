package org.imperial.mrc.hint.controllers

import org.imperial.mrc.hint.FileManager
import org.imperial.mrc.hint.FileType
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.models.ModelOptions
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/model")
class ModelRunController(val fileManager: FileManager, val apiClient: HintrAPIClient)
{

    @PostMapping("/run/")
    @ResponseBody
    fun run(@RequestBody modelRunOptions: ModelOptions): ResponseEntity<String>
    {
        val allFiles = fileManager.getFiles()
        return apiClient.submit(allFiles, modelRunOptions)
    }

    @PostMapping("/validate/options/")
    @ResponseBody
    fun validateModelOptions(@RequestBody modelRunOptions: ModelOptions): ResponseEntity<String>
    {
        val allFiles = fileManager.getFiles()
        return apiClient.validateModelOptions(allFiles, modelRunOptions)
    }

    @GetMapping("/status/{id}")
    @ResponseBody
    fun status(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getStatus(id)
    }

    @GetMapping("/result/{id}")
    @ResponseBody
    fun result(@PathVariable("id") id: String): ResponseEntity<String>
    {
        val lines = java.io.File("/home/emma/dev/hint/test_succeed.txt").readLines()
        val success = (lines.count() > 0) && (lines[0] == "1")

        if (!success) {
            throw Exception("BOOM")
        }
        return apiClient.getResult(id)
    }

    @PostMapping("/cancel/{id}")
    @ResponseBody
    fun cancel(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.cancelModelRun(id)
    }

    @GetMapping("/options/")
    @ResponseBody
    fun options(): ResponseEntity<String>
    {
        val allFiles = fileManager.getFiles(FileType.Shape, FileType.Survey, FileType.Programme, FileType.ANC)
        return apiClient.getModelRunOptions(allFiles)
    }

    @GetMapping("/calibrate/options/{iso3}")
    @ResponseBody
    fun calibrationOptions(@PathVariable("iso3") iso3: String): ResponseEntity<String>
    {
        return apiClient.getModelCalibrationOptions(iso3)
    }

    @PostMapping("/calibrate/submit/{id}")
    @ResponseBody
    fun calibrateSubmit(@PathVariable("id") runId: String, @RequestBody modelCalibrateOptions: ModelOptions):
            ResponseEntity<String>
    {
        return apiClient.calibrateSubmit(runId, modelCalibrateOptions)
    }

    @GetMapping("/calibrate/status/{id}")
    @ResponseBody
    fun calibrateStatus(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getCalibrateStatus(id)
    }

    @GetMapping("/calibrate/result/{id}")
    @ResponseBody
    fun calibrateResult(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getCalibrateResult(id)
    }

    @GetMapping("/calibrate/plot/{id}")
    @ResponseBody
    fun calibratePlot(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getCalibratePlot(id)
    }

    @GetMapping("/comparison/plot/{id}")
    @ResponseBody
    fun comparisonPlot(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getComparisonPlot(id)
    }
}
