package com.ken.fittrack.ui

import android.os.Bundle
import android.view.*
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.ken.fittrack.R
import com.ken.fittrack.Net
import com.ken.fittrack.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.LocalDate

class FoodFragment : Fragment() {

    private var entries: List<FoodEntry> = emptyList()
    private var date: LocalDate = LocalDate.now()
    private var target: Double = 2250.0

    override fun onCreateView(inflater: LayoutInflater, container: android.view.ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_food, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val dp = view.findViewById<DatePicker>(R.id.datePicker)
        dp.init(date.year, date.monthValue - 1, date.dayOfMonth) { _, y, m, d ->
            date = LocalDate.of(y, m + 1, d)
            loadEntries()
        }
        val mealSpinner = view.findViewById<Spinner>(R.id.spinnerMeal)
        mealSpinner.adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item,
            listOf("Meal…", "Breakfast", "Lunch", "Snack", "Dinner"))
        view.findViewById<Button>(R.id.btnAdd).setOnClickListener { submit(view) }
        view.findViewById<TextView>(R.id.txtListTitle).text = "Logs for ${date.toString()}"
        loadTarget()
        loadEntries()
    }

    private fun loadTarget() {
        viewLifecycleOwner.lifecycleScope.launch {
            withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.getSummary()
                    if (resp.isSuccessful) target = resp.body()?.today?.calorieTarget ?: 2250.0
                } catch (e: Exception) {}
            }
        }
    }

    private fun loadEntries() {
        viewLifecycleOwner.lifecycleScope.launch {
            val list = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.getFood(date.toString())
                    if (resp.isSuccessful) resp.body() ?: emptyList() else emptyList()
                } catch (e: Exception) { emptyList() }
            }
            entries = list
            view?.post { renderList() }
        }
    }

    private fun renderList() {
        val rv = view?.findViewById<RecyclerView>(R.id.recyclerFood) ?: return
        rv.layoutManager = LinearLayoutManager(requireContext())
        rv.adapter = FoodAdapter(entries) { id ->
            viewLifecycleOwner.lifecycleScope.launch {
                withContext(Dispatchers.IO) {
                    try { Net.api.deleteFood(id) } catch (e: Exception) {}
                }
                loadEntries()
            }
        }
        view?.findViewById<TextView>(R.id.txtEmpty)?.visibility = if (entries.isEmpty()) View.VISIBLE else View.GONE
        rv.visibility = if (entries.isEmpty()) View.GONE else View.VISIBLE

        val dayCals = entries.sumOf { it.calories }
        val pct = if (target > 0) (dayCals / target * 100).toInt().coerceAtMost(100) else 0
        view?.findViewById<TextView>(R.id.txtDayCals)?.text =
            "${dayCals.toInt()} / ${target.toInt()} kcal (${pct}%)"
        view?.findViewById<ProgressBar>(R.id.progressFood)?.progress = pct
    }

    private fun submit(root: View) {
        val name = root.findViewById<EditText>(R.id.editName).text.toString()
        if (name.isEmpty()) {
            Toast.makeText(requireContext(), "Enter a food name", Toast.LENGTH_SHORT).show()
            return
        }
        val cals = root.findViewById<EditText>(R.id.editCalories).text.toString().toDoubleOrNull() ?: 0.0
        val meal = root.findViewById<Spinner>(R.id.spinnerMeal).selectedItem?.toString() ?: ""
        val mealKey = when (meal) {
            "Breakfast" -> "breakfast"; "Lunch" -> "lunch"; "Snack" -> "snack"; "Dinner" -> "dinner"; else -> ""
        }
        val protein = root.findViewById<EditText>(R.id.editProtein).text.toString().toDoubleOrNull()
        val body = FoodCreate(date.toString(), name, cals, mealKey, protein, "")
        viewLifecycleOwner.lifecycleScope.launch {
            val err = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.createFood(body)
                    if (resp.isSuccessful) null else "HTTP ${resp.code()}"
                } catch (e: Exception) { e.message }
            }
            if (err != null) {
                Toast.makeText(requireContext(), "Error: $err", Toast.LENGTH_LONG).show()
            } else {
                root.findViewById<EditText>(R.id.editName).text = null
                root.findViewById<EditText>(R.id.editCalories).text = null
                root.findViewById<EditText>(R.id.editProtein).text = null
                loadEntries()
            }
        }
    }
}

class FoodAdapter(
    private val items: List<FoodEntry>,
    private val onDelete: (Int) -> Unit
) : RecyclerView.Adapter<FoodAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val txt: TextView = view.findViewById(R.id.txtRow)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.row_entry, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val f = items[position]
        holder.txt.text = buildString {
            append(f.name)
            if (!f.meal_slot.isNullOrEmpty()) append(" · ${f.meal_slot}")
            append(" · ${f.calories.toInt()} kcal")
            if (f.proteinG != null) append(" · ${f.proteinG}g protein")
        }
        holder.itemView.setOnClickListener { onDelete(f.id) }
    }

    override fun getItemCount() = items.size
}
