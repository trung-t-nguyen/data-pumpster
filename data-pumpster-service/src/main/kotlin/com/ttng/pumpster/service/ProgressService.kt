package com.ttng.pumpster.service

import com.ttng.pumpster.domain.ProgressEvent
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import reactor.core.publisher.Sinks
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

@Service
class ProgressService {

    private data class JobStream(
        val sink: Sinks.Many<ProgressEvent>,
        val counter: AtomicLong = AtomicLong(0),
    )

    private val streams = ConcurrentHashMap<UUID, JobStream>()

    fun createStream(jobId: UUID) {
        streams[jobId] = JobStream(sink = Sinks.many().replay().all())
    }

    fun emit(
        jobId: UUID,
        status: String,
        insertedRows: Int = 0,
        skippedRows: Int = 0,
        totalRows: Int? = null,
        errorDescription: String? = null,
    ) {
        val js = streams[jobId] ?: return
        val eventId = js.counter.incrementAndGet()
        val event = ProgressEvent(
            eventId = eventId,
            status = status,
            insertedRows = insertedRows,
            skippedRows = skippedRows,
            totalRows = totalRows,
            errorDescription = errorDescription,
        )
        js.sink.tryEmitNext(event)
        if (status == "completed" || status == "failed") {
            js.sink.tryEmitComplete()
        }
    }

    /** Returns null when no in-memory stream exists for this jobId (unknown or server restarted). */
    fun streamFrom(jobId: UUID, afterEventId: Long?): Flux<ProgressEvent>? {
        val js = streams[jobId] ?: return null
        val flux = js.sink.asFlux()
        return if (afterEventId != null) flux.filter { it.eventId > afterEventId } else flux
    }
}
