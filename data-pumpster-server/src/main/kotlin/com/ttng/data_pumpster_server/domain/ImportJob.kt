package com.ttng.data_pumpster_server.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "import_jobs")
class ImportJob(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false)
    var status: String = "pending",

    @Column(name = "total_rows")
    var totalRows: Int? = null,

    @Column(name = "inserted_rows", nullable = false)
    var insertedRows: Int = 0,

    @Column(name = "skipped_rows", nullable = false)
    var skippedRows: Int = 0,

    @Column(name = "error_description", columnDefinition = "text")
    var errorDescription: String? = null,

    @Column(name = "started_at", nullable = false)
    val startedAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "completed_at")
    var completedAt: OffsetDateTime? = null,
)
