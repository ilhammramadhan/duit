<script lang="ts">
	import { Utensils, Car, Receipt, ShoppingBag, Film, Wallet, HelpCircle } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { id as idLocale } from 'date-fns/locale';
	import type { Transaction, Category } from '$lib/db';
	import CategoryPill from './CategoryPill.svelte';

	interface Props {
		transaction: Transaction;
		onclick?: () => void;
	}

	let { transaction, onclick }: Props = $props();

	// Category icons mapping
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

	/**
	 * Format amount in Indonesian Rupiah format with sign indicator
	 */
	function formatRupiah(amount: number, type: string): string {
		const formatted = 'Rp ' + amount.toLocaleString('id-ID');
		return type === 'income' ? `+${formatted}` : `-${formatted}`;
	}

	/**
	 * Get relative time string (e.g., '2 hours ago', 'Yesterday')
	 */
	function getRelativeTime(date: Date): string {
		return formatDistanceToNow(date, { addSuffix: true, locale: idLocale });
	}

	// Get the icon component for this category (reactive to transaction changes)
	const IconComponent = $derived(CATEGORY_ICONS[transaction.category]);
</script>

<button
	type="button"
	class="w-full flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-gray-50 transition-colors text-left"
	onclick={onclick}
>
	<!-- Category Icon -->
	<div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {CATEGORY_ICON_BG[transaction.category]}">
		<IconComponent size={20} />
	</div>

	<!-- Transaction Details -->
	<div class="flex-1 min-w-0">
		<p class="font-medium text-text truncate capitalize">{transaction.description}</p>
		<div class="flex items-center gap-2 mt-1">
			<CategoryPill category={transaction.category} size="sm" />
			<span class="text-xs text-gray-400">{getRelativeTime(transaction.createdAt)}</span>
		</div>
	</div>

	<!-- Amount -->
	<div class="flex-shrink-0 text-right">
		<p class="font-semibold {transaction.type === 'income' ? 'text-success' : 'text-text'}">
			{formatRupiah(transaction.amount, transaction.type)}
		</p>
	</div>
</button>
