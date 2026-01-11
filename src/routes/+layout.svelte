<script>
    import favicon from '$lib/assets/favicon.svg';
    import { page } from '$app/stores';

    const navItems = [
        { name: 'Inventar', path: '/inventar' },
        { name: 'Statistiken', path: '/statistiken' },
        { name: 'Meine Produktvorlagen', path: '/vorlagen' },
        { name: 'Lagerorte', path: '/lagerorte' },
        { name: 'Admin Reset', path: '/admin/reset' },



    ];
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<style>
    nav {
        display: flex;
        align-items: center;
        gap: 2rem;
        padding: 1rem 2rem;
        border-bottom: 1px solid #e5e5e5;
        background: white;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    a {
        text-decoration: none;
        color: #333;
        font-weight: 500;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        transition: background 0.15s, color 0.15s;
    }

    a.active {
        background: #0f766e;
        color: white;
    }

    main {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }
</style>

<nav>
    {#each navItems as item}
        <a 
            href={item.path}
            class:active={$page.url.pathname.startsWith(item.path)}
        >
            {item.name}
        </a>
    {/each}
</nav>

<main>
    <slot />
</main>
