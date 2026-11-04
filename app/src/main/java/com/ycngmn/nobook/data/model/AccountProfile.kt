package com.ycngmn.nobook.data.model

data class AccountProfile(
    val id: String,
    val name: String,
    val cookies: String,
    val lastActive: Long = System.currentTimeMillis()
)
