package com.ttng.pumpster.service

import com.ttng.pumpster.domain.ImportJob
import com.ttng.pumpster.repository.ImportJobRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import tools.jackson.databind.ObjectMapper
import java.time.OffsetDateTime
import java.util.UUID
import javax.sql.DataSource
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ImportJobServiceListTest {

    private val importJobRepository = mockk<ImportJobRepository>()
    private val dataSource = mockk<DataSource>()
    private val objectMapper = mockk<ObjectMapper>()
    private val applicationScope = mockk<kotlinx.coroutines.CoroutineScope>()
    private val progressService = mockk<ProgressService>()

    private val service = ImportJobService(
        importJobRepository, dataSource, objectMapper, applicationScope, progressService,
    )

    @Test
    fun `listJobs returns jobs mapped to ImportJobSummary sorted by repository order`() = runTest {
        val id1 = UUID.randomUUID()
        val id2 = UUID.randomUUID()
        val now = OffsetDateTime.now()

        val job1 = ImportJob(
            id = id1,
            status = "completed",
            totalRows = 100,
            insertedRows = 90,
            skippedRows = 10,
            startedAt = now,
            completedAt = now.plusSeconds(30),
        )
        val job2 = ImportJob(
            id = id2,
            status = "failed",
            totalRows = 50,
            errorDescription = "COPY failed",
            startedAt = now.minusHours(1),
            completedAt = now.minusHours(1).plusSeconds(5),
        )

        every { importJobRepository.findAllByOrderByStartedAtDesc() } returns listOf(job1, job2)

        val result = service.listJobs()

        assertEquals(2, result.size)

        assertEquals(id1, result[0].id)
        assertEquals("completed", result[0].status)
        assertEquals(100, result[0].totalRows)
        assertEquals(90, result[0].insertedRows)
        assertEquals(10, result[0].skippedRows)
        assertNull(result[0].errorDescription)

        assertEquals(id2, result[1].id)
        assertEquals("failed", result[1].status)
        assertEquals("COPY failed", result[1].errorDescription)

        verify(exactly = 1) { importJobRepository.findAllByOrderByStartedAtDesc() }
    }

    @Test
    fun `listJobs returns empty list when no jobs exist`() = runTest {
        every { importJobRepository.findAllByOrderByStartedAtDesc() } returns emptyList()

        val result = service.listJobs()

        assertEquals(0, result.size)
    }

    @Test
    fun `listJobs maps nullable fields correctly`() = runTest {
        val job = ImportJob(
            status = "processing",
            totalRows = null,
            errorDescription = null,
            completedAt = null,
        )
        every { importJobRepository.findAllByOrderByStartedAtDesc() } returns listOf(job)

        val result = service.listJobs()

        assertNull(result[0].totalRows)
        assertNull(result[0].errorDescription)
        assertNull(result[0].completedAt)
    }
}
