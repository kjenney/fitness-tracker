package com.ken.fittrack.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.ken.fittrack.MainActivity
import com.ken.fittrack.R

/**
 * Home-screen "Quick Log" widget. Shows the user's most recently used
 * exercises; tapping a row logs one set (last-used weight/reps/sets) against
 * today's date via the backend. The header opens the full app.
 */
class WorkoutQuickLogWidget : AppWidgetProvider() {

    companion object {
        const val ACTION_LOG_SET = "com.ken.fittrack.widget.ACTION_LOG_SET"
        const val EXTRA_EXERCISE = "extra_exercise"
        const val EXTRA_WEIGHT = "extra_weight"
        const val EXTRA_REPS = "extra_reps"
        const val EXTRA_SETS = "extra_sets"

        private const val WEIGHT_NONE = -1.0
        private const val REPS_NONE = -1

        fun refreshAndRender(context: Context) {
            WidgetData.refresh()
            render(context)
        }

        fun render(context: Context) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(
                ComponentName(context, WorkoutQuickLogWidget::class.java)
            )
            mgr.updateAppWidget(ids, buildViews(context))
        }

        fun buildViews(context: Context): RemoteViews {
            val rv = RemoteViews(context.packageName, R.layout.widget_quick_log)

            val appIntent = Intent(context, MainActivity::class.java)
            val appPi = PendingIntent.getActivity(
                context, 0, appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            rv.setOnClickPendingIntent(R.id.widget_header, appPi)

            val serviceIntent = Intent(context, WidgetAdapterService::class.java)
            rv.setRemoteAdapter(R.id.widget_list, serviceIntent)
            rv.setEmptyView(R.id.widget_list, R.id.widget_empty)
            return rv
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // First install (empty cache): load data so the widget is useful on first add.
        if (WidgetCache.exercises.isEmpty()) WidgetData.refresh()
        appWidgetManager.updateAppWidget(appWidgetIds, buildViews(context))
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_LOG_SET) {
            val exercise = intent.getStringExtra(EXTRA_EXERCISE) ?: return
            val weight = intent.getDoubleExtra(EXTRA_WEIGHT, WEIGHT_NONE)
            val reps = intent.getIntExtra(EXTRA_REPS, REPS_NONE)
            val sets = intent.getIntExtra(EXTRA_SETS, 1)
            val w = if (weight == WEIGHT_NONE) null else weight
            val r = if (reps == REPS_NONE) null else reps

            val appContext = context.applicationContext
            // Do the network log off the main thread, then refresh + re-render.
            Thread {
                WidgetData.logSet(exercise, w, r, sets)
                refreshAndRender(appContext)
            }.start()
        }
    }
}
