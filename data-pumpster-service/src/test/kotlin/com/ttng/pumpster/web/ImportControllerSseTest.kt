package com.ttng.pumpster.web

import com.ttng.pumpster.domain.ProgressEvent
import com.ttng.pumpster.service.ImportJobService
import io.mockk.coEvery
import io.mockk.mockk
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.codec.ServerSentEvent
import org.springframework.web.server.ResponseStatusException
import reactor.core.publisher.Flux
import reactor.test.StepVerifier
import java.util.UUID
import kotlin.test.assertEquals

class ImportControllerSseTest {

    private val importJobService = mockk<ImportJobService>()
    private val controller = ImportController(importJobService)

    @Test
    fun `streamJobEvents emits SSE frames for each progress event`() {
        val jobId = UUID.randomUUID()
        val events = Flux.just(
            ProgressEvent(1L, "processing", totalRows = 100),
            ProgressEvent(2L, "completed", insertedRows = 90, skippedRows = 10, totalRows = 100),
        )
        coEvery { importJobService.streamJobEvents(jobId, null) } returns events

        StepVerifier.create(controller.streamJobEvents(jobId, null))
            .expectNextMatches { sse ->
                sse.id() == "1" && sse.data()?.status == "processing"
            }
            .expectNextMatches { sse ->
                sse.id() == "2" && sse.data()?.status == "completed" &&
                    sse.data()?.insertedRows == 90
            }
            .verifyComplete()
    }

    @Test
    fun `streamJobEvents errors with 404 when job not found`() {
        val jobId = UUID.randomUUID()
        coEvery { importJobService.streamJobEvents(jobId, null) } returns null

        StepVerifier.create(controller.streamJobEvents(jobId, null))
            .expectErrorMatches { err ->
                err is ResponseStatusException &&
                    err.statusCode == HttpStatus.NOT_FOUND
            }
            .verify()
    }

    @Test
    fun `streamJobEvents passes Last-Event-ID to service`() {
        val jobId = UUID.randomUUID()
        val events = Flux.just(
            ProgressEvent(2L, "completed", insertedRows = 5, totalRows = 5),
        )
        coEvery { importJobService.streamJobEvents(jobId, 1L) } returns events

        StepVerifier.create(controller.streamJobEvents(jobId, 1L))
            .expectNextMatches { sse -> sse.id() == "2" }
            .verifyComplete()
    }

    @Test
    fun `streamJobEvents builds SSE frame with correct event ID`() {
        val jobId = UUID.randomUUID()
        coEvery { importJobService.streamJobEvents(jobId, null) } returns
            Flux.just(ProgressEvent(42L, "completed"))

        val frame: ServerSentEvent<ProgressEvent> =
            controller.streamJobEvents(jobId, null).blockFirst()!!

        assertEquals("42", frame.id())
        assertEquals("completed", frame.data()?.status)
    }
}
