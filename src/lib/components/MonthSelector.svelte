<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { format, subMonths, addMonths, isSameMonth, startOfMonth } from 'date-fns';
	import { id as idLocale } from 'date-fns/locale';

	interface Props {
		selectedDate: Date;
		onMonthChange: (date: Date) => void;
	}

	let { selectedDate, onMonthChange }: Props = $props();

	// Get the current month for comparison
	const currentMonth = startOfMonth(new Date());

	// Check if we can navigate to next month
	let canGoNext = $derived(!isSameMonth(selectedDate, currentMonth));

	// Format the month/year display
	let displayText = $derived(
		format(selectedDate, 'MMMM yyyy', { locale: idLocale })
			.replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter
	);

	function goToPreviousMonth() {
		onMonthChange(subMonths(selectedDate, 1));
	}

	function goToNextMonth() {
		if (canGoNext) {
			onMonthChange(addMonths(selectedDate, 1));
		}
	}
</script>

<div class="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-border">
	<!-- Previous month button -->
	<button
		type="button"
		onclick={goToPreviousMonth}
		class="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-text"
		aria-label="Previous month"
	>
		<ChevronLeft size={24} />
	</button>

	<!-- Current month/year display -->
	<h2 class="text-lg font-bold text-text">
		{displayText}
	</h2>

	<!-- Next month button -->
	<button
		type="button"
		onclick={goToNextMonth}
		class="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-colors"
		class:hover:bg-gray-100={canGoNext}
		class:active:bg-gray-200={canGoNext}
		class:text-text={canGoNext}
		class:text-gray-300={!canGoNext}
		class:cursor-not-allowed={!canGoNext}
		disabled={!canGoNext}
		aria-label="Next month"
	>
		<ChevronRight size={24} />
	</button>
</div>
