package com.ttng.pumpster.service

import org.junit.jupiter.api.Test
import reactor.test.StepVerifier
import java.util.UUID
import kotlin.test.assertNull

class ProgressServiceTest {

    private val service = ProgressService()

    @Test
    fun `emit processing event is replayed to new subscriber`() {
        val jobId = UUID.randomUUID()
        service.createStream(jobId)
        service.emit(jobId, "processing", totalRows = 100)

        StepVerifier.create(service.streamFrom(jobId, null)!!.take(1))
            .expectNextMatches { it.status == "processing" && it.eventId == 1L && it.totalRows == 100 }
            .verifyComplete()
    }

    @Test
    fun `stream completes after completed terminal event`() {
        val jobId = UUID.randomUUID()
        service.createStream(jobId)
        service.emit(jobId, "processing", totalRows = 10)
        service.emit(jobId, "completed", insertedRows = 8, skippedRows = 2, totalRows = 10)

        StepVerifier.create(service.streamFrom(jobId, null)!!)
            .expectNextMatches { it.status == "processing" && it.eventId == 1L }
            .expectNextMatches { it.status == "completed" && it.insertedRows == 8 && it.skippedRows == 2 }
            .verifyComplete()
    }

    @Test
    fun `stream completes after failed terminal event`() {
        val jobId = UUID.randomUUID()
        service.createStream(jobId)
        service.emit(jobId, "processing")
        service.emit(jobId, "failed", errorDescription = "COPY error")

        StepVerifier.create(service.streamFrom(jobId, null)!!)
            .expectNextMatches { it.status == "processing" }
            .expectNextMatches { it.status == "failed" && it.errorDescription == "COPY error" }
            .verifyComplete()
    }

    @Test
    fun `Last-Event-ID replay filters to events after given id`() {
        val jobId = UUID.randomUUID()
        service.createStream(jobId)
        service.emit(jobId, "processing", totalRows = 5)
        service.emit(jobId, "completed", insertedRows = 5, totalRows = 5)

        StepVerifier.create(service.streamFrom(jobId, afterEventId = 1L)!!)
            .expectNextMatches { it.status == "completed" && it.eventId == 2L }
            .verifyComplete()
    }

    @Test
    fun `unknown job returns null`() {
        assertNull(service.streamFrom(UUID.randomUUID(), null))
    }

    @Test
    fun `emit to unknown job is a no-op`() {
        service.emit(UUID.randomUUID(), "processing")
    }

    @Test
    fun `event IDs are sequential`() {
        val jobId = UUID.randomUUID()
        service.createStream(jobId)
        service.emit(jobId, "processing")
        service.emit(jobId, "completed")

        StepVerifier.create(service.streamFrom(jobId, null)!!)
            .expectNextMatches { it.eventId == 1L }
            .expectNextMatches { it.eventId == 2L }
            .verifyComplete()
    }
}
