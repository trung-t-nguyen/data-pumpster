package com.ttng.pumpster.web

import com.ttng.pumpster.service.ImportJobService
import com.ttng.pumpster.web.dto.ImportJobSummary
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.test.assertEquals

class ImportControllerListTest {

    private val importJobService = mockk<ImportJobService>()
    private val controller = ImportController(importJobService)

    @Test
    fun `listJobs returns summaries from service`() = runTest {
        val id = UUID.randomUUID()
        val now = OffsetDateTime.now()
        val summary = ImportJobSummary(
            id = id,
            status = "completed",
            totalRows = 200,
            insertedRows = 195,
            skippedRows = 5,
            errorDescription = null,
            startedAt = now,
            completedAt = now.plusSeconds(10),
        )
        coEvery { importJobService.listJobs() } returns listOf(summary)

        val result = controller.listJobs()

        assertEquals(1, result.size)
        assertEquals(id, result[0].id)
        assertEquals("completed", result[0].status)
        assertEquals(195, result[0].insertedRows)
    }

    @Test
    fun `listJobs returns empty list when service returns no jobs`() = runTest {
        coEvery { importJobService.listJobs() } returns emptyList()

        val result = controller.listJobs()

        assertEquals(0, result.size)
    }
}
