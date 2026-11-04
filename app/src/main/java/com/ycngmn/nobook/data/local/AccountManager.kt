package com.ycngmn.nobook.data.local

import android.content.Context
import android.webkit.CookieManager
import com.ycngmn.nobook.data.model.AccountProfile
import org.json.JSONArray
import org.json.JSONObject

class AccountManager(context: Context) {
    private val prefs = context.getSharedPreferences("facebook_n_accounts", Context.MODE_PRIVATE)

    fun getAccounts(): List<AccountProfile> {
        val jsonStr = prefs.getString("accounts_list", "[]") ?: "[]"
        val list = mutableListOf<AccountProfile>()
        try {
            val arr = JSONArray(jsonStr)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    AccountProfile(
                        id = obj.getString("id"),
                        name = obj.getString("name"),
                        cookies = obj.getString("cookies"),
                        lastActive = obj.optLong("lastActive", System.currentTimeMillis())
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return list
    }

    fun getActiveAccountId(): String? {
        return prefs.getString("active_account_id", null)
    }

    fun setActiveAccountId(id: String?) {
        prefs.edit().putString("active_account_id", id).apply()
    }

    fun saveAccount(account: AccountProfile) {
        val current = getAccounts().toMutableList()
        val index = current.indexOfFirst { it.id == account.id }
        if (index != -1) {
            current[index] = account
        } else {
            current.add(account)
        }
        saveAccountsList(current)
    }

    fun deleteAccount(accountId: String) {
        val current = getAccounts().filter { it.id != accountId }
        saveAccountsList(current)
        if (getActiveAccountId() == accountId) {
            setActiveAccountId(current.firstOrNull()?.id)
        }
    }

    private fun saveAccountsList(accounts: List<AccountProfile>) {
        val arr = JSONArray()
        accounts.forEach { acc ->
            val obj = JSONObject().apply {
                put("id", acc.id)
                put("name", acc.name)
                put("cookies", acc.cookies)
                put("lastActive", acc.lastActive)
            }
            arr.put(obj)
        }
        prefs.edit().putString("accounts_list", arr.toString()).apply()
    }

    /**
     * Extracts full combined cookies from CookieManager across facebook domains.
     */
    fun getAllCookies(): String {
        val cookieManager = CookieManager.getInstance()
        val c1 = cookieManager.getCookie("https://facebook.com") ?: ""
        val c2 = cookieManager.getCookie("https://m.facebook.com") ?: ""
        val c3 = cookieManager.getCookie("https://.facebook.com") ?: ""
        val set = linkedSetOf<String>()
        (c1.split(";") + c2.split(";") + c3.split(";")).forEach {
            val trimmed = it.trim()
            if (trimmed.isNotEmpty()) set.add(trimmed)
        }
        return set.joinToString("; ")
    }

    /**
     * Extracts user ID (c_user) from CookieManager if available
     */
    fun getCurrentUserId(): String? {
        val cookies = getAllCookies()
        return cookies.split(";")
            .map { it.trim() }
            .firstOrNull { it.startsWith("c_user=") }
            ?.substringAfter("c_user=")
    }

    /**
     * Injects cookies into CookieManager and flushes them to disk.
     */
    fun restoreCookies(cookiesStr: String) {
        val cookieManager = CookieManager.getInstance()
        val list = cookiesStr.split(";")
        for (c in list) {
            val trimmed = c.trim()
            if (trimmed.isNotEmpty()) {
                cookieManager.setCookie("https://facebook.com", "$trimmed; Domain=.facebook.com; Path=/; Secure")
                cookieManager.setCookie("https://m.facebook.com", "$trimmed; Domain=.facebook.com; Path=/; Secure")
            }
        }
        cookieManager.flush()
    }

    /**
     * Captures current active session from CookieManager and saves it.
     */
    fun saveCurrentSession(customName: String? = null): AccountProfile? {
        val cookies = getAllCookies()
        if (cookies.isBlank()) return null

        val cUser = getCurrentUserId() ?: return null

        val accounts = getAccounts()
        val existing = accounts.firstOrNull { it.id == cUser }
        val name = customName?.takeIf { it.isNotBlank() }
            ?: existing?.name
            ?: "Profile (${cUser.takeLast(4)})"

        val profile = AccountProfile(
            id = cUser,
            name = name,
            cookies = cookies,
            lastActive = System.currentTimeMillis()
        )
        saveAccount(profile)
        setActiveAccountId(cUser)
        CookieManager.getInstance().flush()
        return profile
    }

    /**
     * Switches to the given account by restoring its cookies into CookieManager.
     */
    fun switchToAccount(account: AccountProfile, onComplete: () -> Unit) {
        saveCurrentSession()

        val cookieManager = CookieManager.getInstance()
        cookieManager.removeAllCookies {
            restoreCookies(account.cookies)
            setActiveAccountId(account.id)
            onComplete()
        }
    }

    /**
     * Prepares for adding a new account: saves current session, clears cookies.
     */
    fun prepareForNewAccount(onComplete: () -> Unit) {
        saveCurrentSession()
        val cookieManager = CookieManager.getInstance()
        cookieManager.removeAllCookies {
            cookieManager.flush()
            setActiveAccountId(null)
            onComplete()
        }
    }
}
