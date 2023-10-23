package org.imperial.mrc.hint.controllers

import org.springframework.web.bind.annotation.*
import org.springframework.http.ResponseEntity
import org.imperial.mrc.hint.db.CalibrateDataRepository
import org.imperial.mrc.hint.clients.HintrAPIClient
import org.imperial.mrc.hint.models.ModelOptions
import org.imperial.mrc.hint.models.SuccessResponse
import org.imperial.mrc.hint.models.asResponseEntity
import org.imperial.mrc.hint.exceptions.CalibrateDataException
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.HttpStatus

@RestController
@RequestMapping("/calibrate")
class CalibrateController(val apiClient: HintrAPIClient, val calibrateDataRepository: CalibrateDataRepository)
{
    @GetMapping("/options/{iso3}")
    @ResponseBody
    fun calibrationOptions(@PathVariable("iso3") iso3: String): ResponseEntity<String>
    {
        return apiClient.getModelCalibrationOptions(iso3)
    }

    @PostMapping("/submit/{id}")
    @ResponseBody
    fun calibrateSubmit(@PathVariable("id") runId: String, @RequestBody modelCalibrateOptions: ModelOptions):
            ResponseEntity<String>
    {
        return apiClient.calibrateSubmit(runId, modelCalibrateOptions)
    }

    @GetMapping("/status/{id}")
    @ResponseBody
    fun calibrateStatus(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getCalibrateStatus(id)
    }

    @GetMapping("/result/metadata/{id}")
    @ResponseBody
    fun calibrateResultMetadata(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getCalibrateResultMetadata(id)
    }

    @GetMapping("/result/data/{id}")
    @ResponseBody
    fun calibrateResultData(@PathVariable("id") id: String): ResponseEntity<String>
    {
        val res = apiClient.getCalibrateResultData(id)
        if (res.statusCode != HttpStatus.OK) {
            throw CalibrateDataException("Failed to fetch result")
        }
        val jsonBody = ObjectMapper().readTree(res.body?.toString())
        val path = jsonBody.get("data").get("path").textValue()
        val resObj = calibrateDataRepository.getDataFromPath(path)
        return SuccessResponse(resObj).asResponseEntity()
    }

    @GetMapping("/plot/{id}")
    @ResponseBody
    fun calibratePlot(@PathVariable("id") id: String): ResponseEntity<String>
    {
        return apiClient.getCalibratePlot(id)
    }
}
