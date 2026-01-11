<script lang="ts">
	import type { Category } from '$lib/db';
	import { getCategoryDisplayName } from '$lib/stores/categoryNames';

	interface Props {
		category: Category;
		size?: 'sm' | 'md';
	}

	let { category, size = 'md' }: Props = $props();

	// Get the display name for this category (supports custom renamed categories)
	const displayName = $derived(getCategoryDisplayName(category));

	// Category background colors (using Tailwind classes)
	const CATEGORY_COLORS: Record<Category, string> = {
		food: 'bg-orange-100 text-orange-700',
		transport: 'bg-blue-100 text-blue-700',
		bills: 'bg-yellow-100 text-yellow-700',
		shopping: 'bg-pink-100 text-pink-700',
		entertainment: 'bg-purple-100 text-purple-700',
		income: 'bg-green-100 text-green-700',
		other: 'bg-gray-100 text-gray-700'
	};

	// Size classes
	const SIZE_CLASSES = {
		sm: 'px-2 py-0.5 text-xs',
		md: 'px-3 py-1 text-sm'
	};
</script>

<span class="inline-flex items-center rounded-full font-medium {CATEGORY_COLORS[category]} {SIZE_CLASSES[size]}">
	{displayName}
</span>
