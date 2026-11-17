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

class BodyCompFragment : Fragment() {

    private var readings: List<BodyComp> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: android.view.ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_bodycomp, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val dp = view.findViewById<DatePicker>(R.id.datePicker)
        dp.init(LocalDate.now().year, LocalDate.now().monthValue - 1, LocalDate.now().dayOfMonth) { _, _, _, _ -> }
        view.findViewById<Button>(R.id.btnSave).setOnClickListener { submit(view, dp) }
        load()
    }

    private fun load() {
        viewLifecycleOwner.lifecycleScope.launch {
            val list = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.getBodyComp()
                    if (resp.isSuccessful) resp.body() ?: emptyList() else emptyList()
                } catch (e: Exception) { emptyList() }
            }
            readings = list
            view?.post { renderList() }
        }
    }

    private fun renderList() {
        val rv = view?.findViewById<RecyclerView>(R.id.recyclerBodyComp) ?: return
        rv.layoutManager = LinearLayoutManager(requireContext())
        rv.adapter = BodyCompAdapter(readings) { id ->
            viewLifecycleOwner.lifecycleScope.launch {
                withContext(Dispatchers.IO) {
                    try { Net.api.deleteBodyComp(id) } catch (e: Exception) {}
                }
                load()
            }
        }
        view?.findViewById<TextView>(R.id.txtEmpty)?.visibility = if (readings.isEmpty()) View.VISIBLE else View.GONE
        rv.visibility = if (readings.isEmpty()) View.GONE else View.VISIBLE
    }

    private fun submit(root: View, dp: DatePicker) {
        val weight = root.findViewById<EditText>(R.id.editWeight).text.toString().toDoubleOrNull()
        if (weight == null) {
            Toast.makeText(requireContext(), "Enter weight", Toast.LENGTH_SHORT).show()
            return
        }
        val bf = root.findViewById<EditText>(R.id.editBF).text.toString().toDoubleOrNull()
        val date = LocalDate.of(dp.year, dp.month + 1, dp.dayOfMonth)
        val body = BodyCompCreate(date.toString(), weight, bf, "")
        viewLifecycleOwner.lifecycleScope.launch {
            val err = withContext(Dispatchers.IO) {
                try {
                    val resp = Net.api.createBodyComp(body)
                    if (resp.isSuccessful) null else "HTTP ${resp.code()}"
                } catch (e: Exception) { e.message }
            }
            if (err != null) {
                Toast.makeText(requireContext(), "Error: $err", Toast.LENGTH_LONG).show()
            } else {
                root.findViewById<EditText>(R.id.editWeight).text = null
                root.findViewById<EditText>(R.id.editBF).text = null
                load()
            }
        }
    }
}

class BodyCompAdapter(
    private val items: List<BodyComp>,
    private val onDelete: (Int) -> Unit
) : RecyclerView.Adapter<BodyCompAdapter.VH>() {

    inner class VH(view: View) : RecyclerView.ViewHolder(view) {
        val txt: TextView = view.findViewById(R.id.txtRow)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.row_entry, parent, false)
        return VH(v)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val b = items[position]
        holder.txt.text = buildString {
            append(b.date)
            append(" · ${b.weightLb} lb")
            if (b.bodyFatPct != null) append(" · ${b.bodyFatPct}% BF")
        }
        holder.itemView.setOnClickListener { onDelete(b.id) }
    }

    override fun getItemCount() = items.size
}
