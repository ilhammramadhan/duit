<script lang="ts">
	import { page } from '$app/state';
	import { Home, Calendar, Settings } from 'lucide-svelte';

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/monthly', label: 'Monthly', icon: Calendar },
		{ href: '/settings', label: 'Settings', icon: Settings }
	] as const;
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
	<div class="flex justify-around items-center h-16">
		{#each navItems as item}
			{@const isActive = page.url.pathname === item.href ||
				(item.href !== '/' && page.url.pathname.startsWith(item.href))}
			<a
				href={item.href}
				class="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-4 py-2 transition-colors"
				class:text-primary={isActive}
				class:text-gray-500={!isActive}
			>
				<item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
				<span class="text-xs mt-1 font-medium">{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
