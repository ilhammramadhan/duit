<script lang="ts">
	interface Props {
		class?: string;
		variant?: 'text' | 'circular' | 'rectangular';
		width?: string;
		height?: string;
	}

	let { class: className = '', variant = 'text', width, height }: Props = $props();

	// Default dimensions based on variant
	const getDefaultStyles = () => {
		switch (variant) {
			case 'circular':
				return 'rounded-full';
			case 'rectangular':
				return 'rounded-lg';
			case 'text':
			default:
				return 'rounded h-4';
		}
	};

	const baseClasses = $derived(getDefaultStyles());
</script>

<div
	class="animate-pulse bg-gray-200 dark:bg-gray-700 {baseClasses} {className}"
	style="{width ? `width: ${width};` : ''}{height ? `height: ${height};` : ''}"
></div>
