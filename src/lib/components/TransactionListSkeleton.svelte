<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 3 }: Props = $props();
</script>

<div class="space-y-2">
	{#each Array(count) as _, i (i)}
		<div class="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
			<!-- Icon skeleton -->
			<div class="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

			<!-- Details skeleton -->
			<div class="flex-1 min-w-0 space-y-2">
				<!-- Title line -->
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
				<!-- Subtitle line -->
				<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
			</div>

			<!-- Amount skeleton -->
			<div class="flex-shrink-0">
				<div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
			</div>
		</div>
	{/each}
</div>
