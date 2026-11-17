package com.ken.fittrack

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.fragment.app.Fragment
import com.ken.fittrack.ui.DashboardFragment
import com.ken.fittrack.ui.FoodFragment
import com.ken.fittrack.ui.WorkoutFragment
import com.ken.fittrack.ui.BodyCompFragment
import com.google.android.material.bottomnavigation.BottomNavigationView

class MainActivity : AppCompatActivity() {

    private lateinit var binding: com.ken.fittrack.databinding.ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = com.ken.fittrack.databinding.ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Edge-to-edge is enforced from Android 15 (API 35) onward — apply
        // system window insets so content sits below the status bar and above
        // the navigation bar instead of drawing behind them.
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.updatePadding(top = bars.top, bottom = bars.bottom)
            WindowInsetsCompat.CONSUMED
        }

        val nav = binding.bottomNav
        nav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_dashboard -> show(DashboardFragment())
                R.id.nav_workout -> show(WorkoutFragment())
                R.id.nav_food -> show(FoodFragment())
                R.id.nav_bodycomp -> show(BodyCompFragment())
                else -> {}
            }
            true
        }
        if (savedInstanceState == null) nav.selectedItemId = R.id.nav_dashboard
    }

    private fun show(fragment: Fragment) {
        supportFragmentManager.beginTransaction()
            .replace(R.id.fragmentContainer, fragment)
            .commit()
    }
}
