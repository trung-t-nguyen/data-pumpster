package com.ttng.data_pumpster_server.web

import com.ttng.data_pumpster_server.service.ImportJobService
import kotlinx.coroutines.reactor.awaitSingle
import org.springframework.core.io.buffer.DataBufferUtils
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.multipart.FilePart
import org.springframework.http.codec.multipart.FormFieldPart
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.server.ResponseStatusException
import org.springframework.web.server.ServerWebExchange

@RestController
@RequestMapping("/api/v1")
class ImportController(private val importJobService: ImportJobService) {

    @PostMapping("/import/jobs", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    suspend fun submitJob(exchange: ServerWebExchange): ResponseEntity<Map<String, String>> {
        val multipartData = exchange.multipartData.awaitSingle()

        val filePart = multipartData["file"]?.firstOrNull() as? FilePart
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required part: 'file'")
        val mappingPart = multipartData["mapping"]?.firstOrNull() as? FormFieldPart
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required part: 'mapping'")
        val totalRowsPart = multipartData["totalRows"]?.firstOrNull() as? FormFieldPart

        val mappingJson = mappingPart.value()
        val totalRows = totalRowsPart?.value()?.toIntOrNull()

        val dataBuffer = DataBufferUtils.join(filePart.content()).awaitSingle()
        val fileBytes = ByteArray(dataBuffer.readableByteCount())
        dataBuffer.read(fileBytes)
        DataBufferUtils.release(dataBuffer)

        val jobId = importJobService.submitJob(fileBytes, mappingJson, totalRows)

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(mapOf("jobId" to jobId.toString()))
    }
}
