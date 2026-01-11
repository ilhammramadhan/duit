<script lang="ts">
	import QuickInput from '$lib/components/QuickInput.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { parseInput } from '$lib/services/parser';
	import { categorizeWithFallback } from '$lib/services/categorizer';
	import type { Category } from '$lib/db';

	// Modal state
	let showModal = $state(false);
	let parsedDescription = $state('');
	let parsedAmount = $state(0);
	let suggestedCategory = $state<Category>('other');

	async function handleQuickInputSubmit(event: CustomEvent<string>) {
		const input = event.detail;

		// Parse the input
		const parsed = parseInput(input);

		if (!parsed) {
			// TODO: Show error toast when toast system is implemented (US-029)
			console.error('Could not parse input:', input);
			return;
		}

		// Get suggested category
		const category = await categorizeWithFallback(parsed.description);

		// Set modal data
		parsedDescription = parsed.description;
		parsedAmount = parsed.amount;
		suggestedCategory = category;

		// Show the modal
		showModal = true;
	}

	function handleConfirm() {
		// Transaction was saved successfully
		console.log('Transaction saved');
	}

	function handleCancel() {
		// Modal was cancelled
		console.log('Transaction cancelled');
	}
</script>

<div class="p-4 pb-20">
	<h1 class="text-2xl font-bold text-text">Duit</h1>
	<p class="text-gray-500 mt-2">Simple Financial Tracker</p>

	<!-- Transaction list will go here in future stories -->
</div>

<QuickInput on:submit={handleQuickInputSubmit} />

<ConfirmationModal
	bind:show={showModal}
	description={parsedDescription}
	amount={parsedAmount}
	{suggestedCategory}
	on:confirm={handleConfirm}
	on:cancel={handleCancel}
/>
