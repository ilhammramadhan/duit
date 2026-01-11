<script lang="ts">
	import {
		ChevronLeft,
		Pencil,
		Check,
		X,
		Utensils,
		Car,
		Receipt,
		ShoppingBag,
		Film,
		Wallet,
		HelpCircle
	} from 'lucide-svelte';
	import type { Category } from '$lib/db';
	import {
		DEFAULT_CATEGORY_NAMES,
		getCategoryDisplayName,
		setCategoryDisplayName
	} from '$lib/stores/categoryNames';

	// All categories
	const CATEGORIES: Category[] = [
		'food',
		'transport',
		'bills',
		'shopping',
		'entertainment',
		'income',
		'other'
	];

	// Category icons
	const CATEGORY_ICONS: Record<Category, typeof Utensils> = {
		food: Utensils,
		transport: Car,
		bills: Receipt,
		shopping: ShoppingBag,
		entertainment: Film,
		income: Wallet,
		other: HelpCircle
	};

	// Category icon background colors
	const CATEGORY_ICON_BG: Record<Category, string> = {
		food: 'bg-orange-100 text-orange-600',
		transport: 'bg-blue-100 text-blue-600',
		bills: 'bg-yellow-100 text-yellow-600',
		shopping: 'bg-pink-100 text-pink-600',
		entertainment: 'bg-purple-100 text-purple-600',
		income: 'bg-green-100 text-green-600',
		other: 'bg-gray-100 text-gray-600'
	};

	// Editing state
	let editingCategory = $state<Category | null>(null);
	let editValue = $state('');

	// Force reactivity trigger
	let updateTrigger = $state(0);

	// Get display names (reactive via updateTrigger)
	function getDisplayName(category: Category): string {
		// Reference updateTrigger to trigger reactivity
		void updateTrigger;
		return getCategoryDisplayName(category);
	}

	// Check if a category has been customized
	function isCustomized(category: Category): boolean {
		void updateTrigger;
		return getCategoryDisplayName(category) !== DEFAULT_CATEGORY_NAMES[category];
	}

	// Start editing a category
	function startEdit(category: Category) {
		editingCategory = category;
		editValue = getCategoryDisplayName(category);
	}

	// Cancel editing
	function cancelEdit() {
		editingCategory = null;
		editValue = '';
	}

	// Save the edit
	function saveEdit() {
		if (editingCategory && editValue.trim()) {
			setCategoryDisplayName(editingCategory, editValue.trim());
			updateTrigger += 1; // Trigger reactivity
			showToast = true;
			setTimeout(() => {
				showToast = false;
			}, 3000);
		}
		cancelEdit();
	}

	// Handle keyboard events in edit input
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveEdit();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	// Toast state
	let showToast = $state(false);
</script>

<div class="min-h-screen bg-background pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border bg-white flex items-center gap-3">
		<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
			<ChevronLeft size={24} class="text-text" />
		</a>
		<h1 class="text-xl font-bold text-text">Manage Categories</h1>
	</div>

	<!-- Info text -->
	<div class="p-4 pb-2">
		<p class="text-sm text-gray-500">
			Rename categories to match your preferences. Default categories cannot be deleted.
		</p>
	</div>

	<!-- Category List -->
	<div class="px-4">
		<div class="bg-white rounded-xl divide-y divide-border overflow-hidden">
			{#each CATEGORIES as category}
				{@const IconComponent = CATEGORY_ICONS[category]}
				<div class="flex items-center gap-3 p-4">
					<!-- Category Icon -->
					<div
						class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {CATEGORY_ICON_BG[
							category
						]}"
					>
						<IconComponent size={20} />
					</div>

					<!-- Category Name -->
					<div class="flex-1 min-w-0">
						{#if editingCategory === category}
							<!-- Edit Mode -->
							<input
								type="text"
								bind:value={editValue}
								onkeydown={handleKeydown}
								class="w-full px-3 py-1.5 border border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
								autofocus
							/>
						{:else}
							<!-- Display Mode -->
							<p class="font-medium text-text">{getDisplayName(category)}</p>
							{#if isCustomized(category)}
								<p class="text-xs text-gray-400">
									Default: {DEFAULT_CATEGORY_NAMES[category]}
								</p>
							{/if}
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex-shrink-0 flex items-center gap-1">
						{#if editingCategory === category}
							<!-- Save/Cancel buttons -->
							<button
								type="button"
								onclick={saveEdit}
								class="p-2 text-success hover:bg-green-50 rounded-full transition-colors"
								aria-label="Save"
							>
								<Check size={20} />
							</button>
							<button
								type="button"
								onclick={cancelEdit}
								class="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
								aria-label="Cancel"
							>
								<X size={20} />
							</button>
						{:else}
							<!-- Edit button -->
							<button
								type="button"
								onclick={() => startEdit(category)}
								class="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
								aria-label="Edit category name"
							>
								<Pencil size={18} />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Toast notification -->
	{#if showToast}
		<div
			class="fixed top-4 left-4 right-4 z-50 bg-success text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
		>
			<Check size={20} />
			<span class="font-medium">Category name updated</span>
		</div>
	{/if}
</div>
