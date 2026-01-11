<script lang="ts">
	import MonthSelector from '$lib/components/MonthSelector.svelte';
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

	<!-- Placeholder for other monthly components -->
	<div class="bg-white rounded-xl p-4 shadow-sm border border-border">
		<p class="text-gray-500">Your monthly spending breakdown will appear here.</p>
	</div>
</div>
