<script lang="ts">
	import { ChevronLeft, Sun, Moon, Monitor } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import {
		getThemePreference,
		setThemePreference,
		getAppliedTheme,
		type ThemeOption,
		type AppliedTheme
	} from '$lib/stores/theme';

	let selectedTheme = $state<ThemeOption>('system');
	let appliedTheme = $state<AppliedTheme>('light');

	const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];

	function handleThemeChange(theme: ThemeOption) {
		selectedTheme = theme;
		setThemePreference(theme);
		appliedTheme = getAppliedTheme(theme);
	}

	onMount(() => {
		selectedTheme = getThemePreference();
		appliedTheme = getAppliedTheme(selectedTheme);

		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = () => {
			if (selectedTheme === 'system') {
				appliedTheme = getAppliedTheme('system');
			}
		};
		mediaQuery.addEventListener('change', handleChange);

		return () => {
			mediaQuery.removeEventListener('change', handleChange);
		};
	});
</script>

<div class="min-h-screen bg-background dark:bg-gray-900 pb-20">
	<!-- Header -->
	<div class="p-4 border-b border-border dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3">
		<a href="/settings" class="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
			<ChevronLeft size={24} class="text-text dark:text-gray-100" />
		</a>
		<h1 class="text-xl font-bold text-text dark:text-gray-100">Theme</h1>
	</div>

	<!-- Content -->
	<div class="p-4 space-y-6">
		<!-- Theme Selection -->
		<div class="bg-white dark:bg-gray-800 rounded-xl p-4">
			<h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">Appearance</h2>

			<!-- Segmented Button -->
			<div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
				{#each themeOptions as option}
					{@const Icon = option.icon}
					<button
						onclick={() => handleThemeChange(option.value)}
						class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all
							{selectedTheme === option.value
								? 'bg-white dark:bg-gray-600 text-primary dark:text-secondary shadow-sm'
								: 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'}"
					>
						<Icon size={18} />
						<span>{option.label}</span>
					</button>
				{/each}
			</div>

			<!-- Preview -->
			<div class="mt-6">
				<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Preview</p>
				<div
					class="rounded-lg overflow-hidden border border-border dark:border-gray-700 {appliedTheme === 'dark'
						? 'bg-gray-900'
						: 'bg-background'}"
				>
					<!-- Preview Header -->
					<div
						class="p-3 border-b {appliedTheme === 'dark'
							? 'border-gray-700 bg-gray-800'
							: 'border-border bg-white'}"
					>
						<div
							class="h-3 w-20 rounded {appliedTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'}"
						></div>
					</div>
					<!-- Preview Content -->
					<div class="p-3 space-y-2">
						<div
							class="h-12 rounded-lg {appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}"
						></div>
						<div
							class="h-12 rounded-lg {appliedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}"
						></div>
					</div>
				</div>
			</div>
		</div>

		<!-- Info Card -->
		<div class="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 flex gap-3">
			<div class="flex-shrink-0">
				<Monitor size={20} class="text-blue-600 dark:text-blue-400" />
			</div>
			<div>
				<p class="text-sm text-blue-800 dark:text-blue-200">
					<strong>System</strong> follows your device's appearance settings. The app will automatically switch between light and dark modes.
				</p>
			</div>
		</div>
	</div>
</div>
