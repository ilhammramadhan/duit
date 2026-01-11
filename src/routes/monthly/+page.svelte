<script lang="ts">
	import MonthSelector from '$lib/components/MonthSelector.svelte';
	import MonthlySummary from '$lib/components/MonthlySummary.svelte';
	import CategoryBreakdown from '$lib/components/CategoryBreakdown.svelte';
	import { startOfMonth } from 'date-fns';

	// Selected month state - defaults to current month
	let selectedDate = $state(startOfMonth(new Date()));

	function handleMonthChange(newDate: Date) {
		selectedDate = newDate;
	}
</script>

<div class="p-4 pb-20 space-y-4">
	<!-- Month Selector -->
	<MonthSelector {selectedDate} onMonthChange={handleMonthChange} />

	<!-- Income vs Expenses Summary -->
	<MonthlySummary {selectedDate} />

	<!-- Category Breakdown -->
	<CategoryBreakdown {selectedDate} />
</div>
