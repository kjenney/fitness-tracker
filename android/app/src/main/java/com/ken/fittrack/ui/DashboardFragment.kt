package com.ken.fittrack.ui

import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.ken.fittrack.R
import com.ken.fittrack.Net
import com.ken.fittrack.model.Summary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DashboardFragment : Fragment() {

    override fun onCreateView(inflater: LayoutInflater, container: android.view.ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_dashboard, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        load()
    }

    private fun load() {
        viewLifecycleOwner.lifecycleScope.launch {
            val s: Summary? = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.getSummary()
                    if (resp.isSuccessful) resp.body() else null
                } catch (e: Exception) { null }
            }
            s?.let { render(it) }
        }
    }

    private fun render(s: Summary) {
        val v = view ?: return
        val today = s.today
        v.findViewById<TextView>(R.id.txtCalories).text =
            "${today.calories.toInt()} / ${today.calorieTarget.toInt()} kcal"
        val pct = if (today.calorieTarget > 0) (today.calories / today.calorieTarget * 100).toInt().coerceAtMost(100) else 0
        v.findViewById<ProgressBar>(R.id.progressCalories).progress = pct
        v.findViewById<TextView>(R.id.txtProtein).text =
            "${today.proteinG}g protein (target ${today.proteinTarget}g)"

        s.bodycompLatest?.let { bc ->
            v.findViewById<TextView>(R.id.txtBodyComp).text =
                "${bc.weightLb} lb · BF ${bc.bodyFatPct?.toString() ?: "—"}%"
            s.weightDelta?.let {
                v.findViewById<TextView>(R.id.txtWeightDelta).text =
                    "Total: ${if (it >= 0) "+" else ""}$it lb since baseline"
            }
        } ?: run {
            v.findViewById<TextView>(R.id.txtBodyComp).text = "No readings yet"
        }

        v.findViewById<TextView>(R.id.txtWorkouts).text =
            "${s.workouts7d.distinctDays} days · ${s.workouts7d.entries} entries · ${s.workouts7d.volumeLbs.toInt()} lb volume"

        val chart = v.findViewById<LinearLayout>(R.id.barChart)
        chart.removeAllViews()
        val maxCal = s.calories7d.maxOfOrNull { it.calories } ?: 1.0
        for (d in s.calories7d) {
            val col = LinearLayout(v.context).apply {
                orientation = LinearLayout.VERTICAL
                gravity = android.view.Gravity.BOTTOM
            }
            val heightPct = (d.calories / (maxCal * 1.1) * 100).toInt().coerceIn(4, 100)
            val bar = View(v.context).apply {
                setBackgroundColor(0xFF2E7D32.toInt())
            }
            col.addView(bar, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                (120 * heightPct / 100).coerceAtLeast(12)
            ).apply { setMargins(4, 0, 4, 0) })
            val label = TextView(v.context).apply {
                text = d.label
                textSize = 10f
                gravity = android.view.Gravity.CENTER
                setPadding(0, 4, 0, 0)
            }
            col.addView(label)
            chart.addView(col, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f))
        }
    }
}
