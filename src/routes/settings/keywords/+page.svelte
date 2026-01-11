<script lang="ts">
	import { ChevronLeft, Sparkles, Trash2, ChevronDown, X } from 'lucide-svelte';
	import { liveQuery } from 'dexie';
	import { db, type Category, type CategoryMapping, updateCategoryMapping, deleteCategoryMapping } from '$lib/db';
	import CategoryPill from '$lib/components/CategoryPill.svelte';
	import { getCategoryDisplayName } from '$lib/stores/categoryNames';

	// All available categories for the dropdown
	const ALL_CATEGORIES: Category[] = ['food', 'transport', 'bills', 'shopping', 'entertainment', 'income', 'other'];

	// State for mappings list
	let mappings = $state<CategoryMapping[]>([]);

	// Editing state
	let editingKeyword = $state<string | null>(null);

	// Swipe state
	let swipeStates = $state<Record<string, number>>({});
	let touchStartX = 0;

	// Delete confirmation state
	let deleteConfirmKeyword = $state<string | null>(null);

	// Toast state
	let toastMessage = $state<string | null>(null);
	let toastTimeout: ReturnType<typeof setTimeout> | null = null;

	// Subscribe to category mappings (sorted by count descending)
	$effect(() => {
		const subscription = liveQuery(() =>
			db.categoryMappings.orderBy('count').reverse().toArray()
		).subscribe((result) => {
			mappings = result;
		});

		return () => subscription.unsubscribe();
	});

	// Show toast notification
	function showToast(message: string) {
		if (toastTimeout) clearTimeout(toastTimeout);
		toastMessage = message;
		toastTimeout = setTimeout(() => {
			toastMessage = null;
		}, 3000);
	}

	// Handle category change
	async function handleCategoryChange(keyword: string, newCategory: Category) {
		await updateCategoryMapping(keyword, newCategory);
		editingKeyword = null;
		showToast(`Updated "${keyword}" to ${getCategoryDisplayName(newCategory)}`);
	}

	// Touch handlers for swipe
	function handleTouchStart(e: TouchEvent, keyword: string) {
		touchStartX = e.touches[0].clientX;
		// Reset other swipe states
		const newStates: Record<string, number> = {};
		newStates[keyword] = swipeStates[keyword] || 0;
		swipeStates = newStates;
	}

	function handleTouchMove(e: TouchEvent, keyword: string) {
		const diff = touchStartX - e.touches[0].clientX;
		// Only allow left swipe (positive diff), max 80px
		swipeStates[keyword] = Math.max(0, Math.min(diff, 80));
	}

	function handleTouchEnd(keyword: string) {
		// If swiped more than 60px, show delete confirmation
		if ((swipeStates[keyword] || 0) > 60) {
			deleteConfirmKeyword = keyword;
		}
		// Reset swipe state
		swipeStates[keyword] = 0;
	}

	// Handle delete confirmation
	async function confirmDelete() {
		if (deleteConfirmKeyword) {
			await deleteCategoryMapping(deleteConfirmKeyword);
			showToast(`Deleted mapping for "${deleteConfirmKeyword}"`);
			deleteConfirmKeyword = null;
		}
	}

	function cancelDelete() {
		deleteConfirmKeyword = null;
	}
</script>

<div class="min-h-screen bg-background pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border bg-white flex items-center gap-3">
		<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
			<ChevronLeft size={24} class="text-text" />
		</a>
		<h1 class="text-xl font-bold text-text">AI Keywords</h1>
	</div>

	<!-- Toast Notification -->
	{#if toastMessage}
		<div class="fixed top-4 left-4 right-4 z-50 animate-slide-down">
			<div class="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
				<span>{toastMessage}</span>
				<button onclick={() => (toastMessage = null)} class="p-1 hover:bg-green-700 rounded-full transition-colors">
					<X size={16} />
				</button>
			</div>
		</div>
	{/if}

	<!-- Content -->
	<div class="p-4">
		<!-- Info Card -->
		<div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-4">
			<div class="flex items-start gap-3">
				<div class="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
					<Sparkles size={20} class="text-pink-600" />
				</div>
				<div>
					<h3 class="font-semibold text-text mb-1">Learned Keywords</h3>
					<p class="text-sm text-gray-600">
						These are keywords that Duit has learned to categorize automatically. You can edit the category or delete a mapping if it's incorrect.
					</p>
				</div>
			</div>
		</div>

		{#if mappings.length === 0}
			<!-- Empty State -->
			<div class="bg-white rounded-xl p-6 text-center">
				<div class="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
					<Sparkles size={32} class="text-pink-600" />
				</div>
				<h3 class="font-semibold text-text mb-2">No keywords learned yet</h3>
				<p class="text-gray-500 text-sm">
					As you add transactions, Duit will learn and remember how to categorize new keywords.
				</p>
			</div>
		{:else}
			<!-- Mappings List -->
			<div class="bg-white rounded-xl overflow-hidden divide-y divide-border">
				{#each mappings as mapping (mapping.keyword)}
					<div class="relative overflow-hidden">
						<!-- Delete background -->
						<div class="absolute inset-y-0 right-0 w-20 bg-danger flex items-center justify-center">
							<Trash2 size={20} class="text-white" />
						</div>

						<!-- Main content -->
						<div
							class="relative bg-white p-4 transition-transform"
							style="transform: translateX(-{swipeStates[mapping.keyword] || 0}px)"
							ontouchstart={(e) => handleTouchStart(e, mapping.keyword)}
							ontouchmove={(e) => handleTouchMove(e, mapping.keyword)}
							ontouchend={() => handleTouchEnd(mapping.keyword)}
							role="listitem"
						>
							<div class="flex items-center justify-between gap-3">
								<!-- Keyword and Count -->
								<div class="flex-1 min-w-0">
									<span class="font-medium text-text block truncate">{mapping.keyword}</span>
									<span class="text-xs text-gray-500">Used {mapping.count} time{mapping.count !== 1 ? 's' : ''}</span>
								</div>

								<!-- Category Pill or Dropdown -->
								{#if editingKeyword === mapping.keyword}
									<!-- Category Dropdown -->
									<div class="relative">
										<select
											class="appearance-none bg-gray-100 border border-border rounded-lg px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
											value={mapping.category}
											onchange={(e) => handleCategoryChange(mapping.keyword, e.currentTarget.value as Category)}
											onblur={() => (editingKeyword = null)}
										>
											{#each ALL_CATEGORIES as cat}
												<option value={cat}>{getCategoryDisplayName(cat)}</option>
											{/each}
										</select>
										<ChevronDown size={16} class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
									</div>
								{:else}
									<!-- Category Pill (tap to edit) -->
									<button
										onclick={() => (editingKeyword = mapping.keyword)}
										class="flex items-center gap-1 hover:opacity-80 transition-opacity"
										title="Tap to change category"
									>
										<CategoryPill category={mapping.category} size="sm" />
										<ChevronDown size={14} class="text-gray-400" />
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Hint -->
			<p class="text-xs text-gray-500 text-center mt-4">
				Tap category to change. Swipe left to delete.
			</p>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Dialog -->
{#if deleteConfirmKeyword}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={cancelDelete}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="bg-white rounded-2xl p-6 w-full max-w-sm"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-bold text-text mb-2">Delete Keyword Mapping?</h3>
			<p class="text-gray-600 mb-4">
				Remove the mapping for "<span class="font-medium">{deleteConfirmKeyword}</span>"? Duit will need to re-learn this keyword next time.
			</p>
			<div class="flex gap-3">
				<button
					onclick={cancelDelete}
					class="flex-1 px-4 py-3 rounded-xl border border-border text-text font-medium hover:bg-gray-50 transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={confirmDelete}
					class="flex-1 px-4 py-3 rounded-xl bg-danger text-white font-medium hover:bg-red-600 transition-colors"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-down {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-slide-down {
		animation: slide-down 0.3s ease-out;
	}
</style>
