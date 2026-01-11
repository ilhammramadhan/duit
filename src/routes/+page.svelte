<script lang="ts">
	import QuickInput from '$lib/components/QuickInput.svelte';

	function handleQuickInputSubmit(event: CustomEvent<string>) {
		const input = event.detail;
		// TODO: Parse input and show confirmation modal (US-005, US-008)
		console.log('Quick input submitted:', input);
	}
</script>

<div class="p-4 pb-20">
	<h1 class="text-2xl font-bold text-text">Duit</h1>
	<p class="text-gray-500 mt-2">Simple Financial Tracker</p>

	<!-- Transaction list will go here in future stories -->
</div>

<QuickInput on:submit={handleQuickInputSubmit} />
