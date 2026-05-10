package com.ttng.pumpster.domain

data class ProgressEvent(
    val eventId: Long,
    val status: String,
    val insertedRows: Int = 0,
    val skippedRows: Int = 0,
    val totalRows: Int? = null,
    val errorDescription: String? = null,
)
