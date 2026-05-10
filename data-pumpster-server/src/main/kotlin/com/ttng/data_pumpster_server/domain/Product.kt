package com.ttng.data_pumpster_server.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "products")
class Product(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,

    @Column(nullable = false, unique = true)
    val sku: String,

    @Column(nullable = false)
    val name: String,

    @Column(nullable = false, precision = 12, scale = 2)
    val price: BigDecimal,

    @Column(columnDefinition = "text")
    val description: String? = null,

    @Column(length = 3)
    val currency: String? = null,

    @Column(name = "category_id")
    val categoryId: Long? = null,

    val brand: String? = null,

    @Column(name = "weight_kg", precision = 8, scale = 3)
    val weightKg: BigDecimal? = null,

    @Column(name = "is_active")
    val isActive: Boolean? = true,

    @Column(name = "job_id", nullable = false)
    val jobId: UUID,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now(),
)
