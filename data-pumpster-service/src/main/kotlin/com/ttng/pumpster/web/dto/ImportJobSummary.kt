package com.ttng.pumpster.web.dto

import java.time.OffsetDateTime
import java.util.UUID

data class ImportJobSummary(
    val id: UUID,
    val status: String,
    val totalRows: Int?,
    val insertedRows: Int,
    val skippedRows: Int,
    val errorDescription: String?,
    val startedAt: OffsetDateTime,
    val completedAt: OffsetDateTime?,
)
