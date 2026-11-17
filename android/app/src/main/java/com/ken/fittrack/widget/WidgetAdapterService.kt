package com.ken.fittrack.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.ken.fittrack.R

/**
 * Backs the Quick Log widget's ListView. RemoteViewsCollection adapters run on
 * a binder thread and cannot suspend, so rows are read from the synchronous
 * [WidgetCache] that [WorkoutQuickLogWidget] keeps populated.
 */
class WidgetAdapterService : RemoteViewsService() {

    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory =
        EntryFactory(applicationContext)

    private class EntryFactory(private val context: Context) : RemoteViewsFactory {

        private var entries: List<WidgetEntry> = emptyList()

        override fun onCreate() {}

        override fun onDataSetChanged() {
            entries = WidgetCache.exercises
        }

        override fun onDestroy() {}

        override fun getViewAt(position: Int): RemoteViews {
            val e = entries.getOrNull(position)
            val rv = RemoteViews(context.packageName, R.layout.widget_row)
            if (e != null) {
                rv.setTextViewText(R.id.row_name, e.name)
                rv.setTextViewText(R.id.row_last, "last: ${e.lastLabel()}")

                val logIntent = Intent(context, WorkoutQuickLogWidget::class.java).apply {
                    action = WorkoutQuickLogWidget.ACTION_LOG_SET
                    putExtra(WorkoutQuickLogWidget.EXTRA_EXERCISE, e.name)
                    putExtra(WorkoutQuickLogWidget.EXTRA_WEIGHT, e.lastWeight ?: -1.0)
                    putExtra(WorkoutQuickLogWidget.EXTRA_REPS, e.lastReps ?: -1)
                    putExtra(WorkoutQuickLogWidget.EXTRA_SETS, e.lastSets)
                }
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                rv.setOnClickPendingIntent(
                    R.id.row_root,
                    PendingIntent.getBroadcast(context, position, logIntent, flags)
                )
            }
            return rv
        }

        override fun getLoadingView(): RemoteViews? = null
        override fun getCount() = entries.size
        override fun getViewTypeCount() = 1
        override fun getItemId(position: Int) = position.toLong()
        override fun hasStableIds() = true
    }
}
