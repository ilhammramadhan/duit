<script lang="ts">
	interface Props {
		count?: number;
	}

	let { count = 2 }: Props = $props();
</script>

<div class="mt-4 space-y-3">
	<!-- Header skeleton -->
	<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>

	{#each Array(count) as _, i (i)}
		<div class="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-border dark:border-gray-700">
			<!-- Header: Icon, Category Name, Amount / Limit -->
			<div class="flex items-center gap-3 mb-2">
				<!-- Category Icon skeleton -->
				<div class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

				<!-- Category Name skeleton -->
				<div class="flex-1 min-w-0">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
				</div>

				<!-- Amount / Limit skeleton -->
				<div class="flex-shrink-0 text-right space-y-1">
					<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
					<div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto animate-pulse"></div>
				</div>
			</div>

			<!-- Progress Bar skeleton -->
			<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
		</div>
	{/each}
</div>
