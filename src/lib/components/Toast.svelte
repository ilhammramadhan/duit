<script lang="ts">
	import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-svelte';
	import {
		subscribeToasts,
		dismissToast,
		type Toast as ToastType,
		type ToastVariant
	} from '$lib/stores/toast';

	// Local state for toasts
	let toasts = $state<ToastType[]>([]);

	// Subscribe to toast store
	$effect(() => {
		const unsubscribe = subscribeToasts((newToasts) => {
			toasts = newToasts;
		});

		return unsubscribe;
	});

	// Icon components for each variant
	const variantIcons: Record<ToastVariant, typeof CheckCircle> = {
		success: CheckCircle,
		warning: AlertTriangle,
		error: AlertCircle,
		info: Info
	};

	// Variant color classes
	const variantClasses: Record<ToastVariant, string> = {
		success: 'bg-success',
		warning: 'bg-warning',
		error: 'bg-danger',
		info: 'bg-primary'
	};

	// Get icon component for a variant
	function getIcon(variant: ToastVariant) {
		return variantIcons[variant];
	}
</script>

{#if toasts.length > 0}
	<!-- Toast container - positioned at top of screen with safe area padding -->
	<div
		class="fixed top-0 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pt-safe pointer-events-none"
		style="padding-top: max(1rem, env(safe-area-inset-top));"
	>
		{#each toasts as toast (toast.id)}
			{@const IconComponent = getIcon(toast.variant)}
			<div
				class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm w-full {variantClasses[
					toast.variant
				]} text-white pointer-events-auto animate-slide-down"
			>
				<IconComponent size={20} class="flex-shrink-0" />
				<span class="text-sm font-medium flex-1">{toast.message}</span>
				<button
					type="button"
					onclick={() => dismissToast(toast.id)}
					class="p-1 hover:bg-white/20 rounded transition-colors flex-shrink-0"
					aria-label="Dismiss notification"
				>
					<X size={16} />
				</button>
			</div>
		{/each}
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
