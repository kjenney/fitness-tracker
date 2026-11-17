package com.ken.fittrack.widget

/**
 * Snapshot of workout data for widget rendering. RemoteViews adapters must be
 * synchronous (getViewAt cannot await), so data is prefetched here and the
 * adapters simply read it.
 */
object WidgetCache {
    @Volatile var exercises: List<WidgetEntry> = emptyList()
    @Volatile var lastSet: WidgetEntry? = null
    @Volatile var todaySets: Int = 0
}
