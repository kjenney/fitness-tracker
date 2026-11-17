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

class WorkoutFragment : Fragment() {

    private var exercises: List<Exercise> = emptyList()
    private var entries: List<WorkoutSet> = emptyList()
    private var date: LocalDate = LocalDate.now()

    override fun onCreateView(inflater: LayoutInflater, container: android.view.ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_workout, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val dp = view.findViewById<DatePicker>(R.id.datePicker)
        dp.init(date.year, date.monthValue - 1, date.dayOfMonth) { _, y, m, d ->
            date = LocalDate.of(y, m + 1, d)
            loadEntries()
        }
        view.findViewById<Button>(R.id.btnAdd).setOnClickListener { submit(view) }
        view.findViewById<TextView>(R.id.txtListTitle).text = "Logs for ${date.toString()}"
        loadExercises()
        loadEntries()
    }

    private fun loadExercises() {
        viewLifecycleOwner.lifecycleScope.launch {
            val list = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.getExercises()
                    if (resp.isSuccessful) resp.body() ?: emptyList() else emptyList()
                } catch (e: Exception) { emptyList() }
            }
            exercises = list
            view?.post {
                val spinner = view?.findViewById<Spinner>(R.id.spinnerExercise) ?: return@post
                val names = mutableListOf("Select exercise…")
                names.addAll(list.map { it.name })
                spinner.adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, names)
            }
        }
    }

    private fun loadEntries() {
        viewLifecycleOwner.lifecycleScope.launch {
            val list = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.getWorkouts(date.toString())
                    if (resp.isSuccessful) resp.body() ?: emptyList() else emptyList()
                } catch (e: Exception) { emptyList() }
            }
            entries = list
            view?.post { renderList() }
        }
    }

    private fun renderList() {
        val rv = view?.findViewById<RecyclerView>(R.id.recyclerWorkouts) ?: return
        rv.layoutManager = LinearLayoutManager(requireContext())
        rv.adapter = WorkoutAdapter(entries) { id ->
            viewLifecycleOwner.lifecycleScope.launch {
                withContext(Dispatchers.IO) {
                    try { Net.api.deleteWorkout(id) } catch (e: Exception) {}
                }
                loadEntries()
            }
        }
        view?.findViewById<TextView>(R.id.txtEmpty)?.visibility = if (entries.isEmpty()) View.VISIBLE else View.GONE
        rv.visibility = if (entries.isEmpty()) View.GONE else View.VISIBLE
    }

    private fun submit(root: View) {
        val spinner = root.findViewById<Spinner>(R.id.spinnerExercise)
        val name = spinner.selectedItem?.toString() ?: ""
        if (name == "Select exercise…" || name.isEmpty()) {
            Toast.makeText(requireContext(), "Pick an exercise", Toast.LENGTH_SHORT).show()
            return
        }
        val weight = root.findViewById<EditText>(R.id.editWeight).text.toString().toDoubleOrNull()
        val reps = root.findViewById<EditText>(R.id.editReps).text.toString().toIntOrNull()
        val sets = root.findViewById<EditText>(R.id.editSets).text.toString().toIntOrNull() ?: 1
        val notes = root.findViewById<EditText>(R.id.editNotes).text.toString()
        val body = WorkoutCreate(date.toString(), name, weight, reps, sets, notes)
        viewLifecycleOwner.lifecycleScope.launch {
            val err = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.createWorkout(body)
                    if (resp.isSuccessful) null else "HTTP ${resp.code()}"
                } catch (e: Exception) { e.message }
            }
            if (err != null) {
                Toast.makeText(requireContext(), "Error: $err", Toast.LENGTH_LONG).show()
            } else {
                root.findViewById<EditText>(R.id.editWeight).text = null
                root.findViewById<EditText>(R.id.editReps).text = null
                loadEntries()
            }
        }
    }
}

class WorkoutAdapter(
    private val items: List<WorkoutSet>,
    private val onDelete: (Int) -> Unit
) : RecyclerView.Adapter<WorkoutAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val txt: TextView = view.findViewById(R.id.txtRow)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.row_entry, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val w = items[position]
        holder.txt.text = buildString {
            append(w.exercise)
            if (w.weight != null) append(" · ${w.weight} lb")
            if (w.reps != null) append(" x ${w.reps}")
            append(" (x${w.sets} sets)")
            if (!w.notes.isNullOrEmpty()) append(" — ${w.notes}")
        }
        holder.itemView.setOnClickListener { onDelete(w.id) }
    }

    override fun getItemCount() = items.size
}
