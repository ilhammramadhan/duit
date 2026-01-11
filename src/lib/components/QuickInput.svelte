<script lang="ts">
	import { Send } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ submit: string }>();

	let inputValue = $state('');
	let inputElement: HTMLInputElement | null = $state(null);

	function handleSubmit() {
		const value = inputValue.trim();
		if (value) {
			dispatch('submit', value);
			inputValue = '';
			inputElement?.focus();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSubmit();
		}
	}
</script>

<div class="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-border dark:border-gray-700 px-4 py-2 z-40">
	<div class="flex items-center gap-2">
		<input
			type="text"
			bind:value={inputValue}
			bind:this={inputElement}
			onkeydown={handleKeydown}
			placeholder="bakso 15rb..."
			class="flex-1 min-h-[44px] px-4 py-2 rounded-lg bg-background dark:bg-gray-700 border border-border dark:border-gray-600 text-text dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary focus:border-transparent"
		/>
		<button
			type="button"
			onclick={handleSubmit}
			disabled={!inputValue.trim()}
			class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			<Send size={20} />
		</button>
	</div>
</div>
