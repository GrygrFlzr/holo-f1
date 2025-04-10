<script lang="ts">
    import "$lib/colors.css";
    import headerLogo from "$lib/logo.svg";
	let { children } = $props();
</script>

<svelte:head>
    <link href="/favicon.png" rel="apple-touch-icon" sizes="256x256">
    <meta property="theme-color" content="#e00700" />
    <meta property="og:site_name" content="Holocord F1 Watchalong Prediction Championship" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap" rel="stylesheet">
</svelte:head>

<div class="everything">
    <header class="header-container">
        <img class="header-logo" src={headerLogo} alt="holocord Formula 1 logo" />
    </header>
    <nav class="nav-list">
        <a class="nav-item" href="/season-3/teams">Team Standings</a>
        <a class="nav-item" href="/season-3/individuals">Individual Standings</a>
        <a class="nav-item" href="/season-3/submit">Prediction Form</a>
    </nav>
    
    <div class="main-content">
        {@render children()}
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        min-height: 100vh;
        background-color: var(--f1-white);
    }
    .everything {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }
    header {
        display: flex;
        justify-content: center;
        align-items: center;
        background: hsl(240, 13%, 9%);
        color: var(--f1-white);
        gap: .5rem;
    }
    .header-logo {
        height: 6rem;
        padding: 2rem;
    }
    .nav-list {
        width: 100vw;
        max-width: 840px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: .5rem;
    }
    .nav-item {
        display: block;
        background-color: hsl(from var(--f1-black) h s 10%);
        color: hsl(from var(--f1-black) h s 90%);
        text-decoration: none;
        text-align: center;
        font-size: 1.5rem;
        border-radius: 0 0 .25rem .25rem;
        padding: .5rem;
        font-weight: 400;
        box-shadow:
            0 4px 6px -1px hsl(from black h s 30%),
            0 2px 4px -2px hsl(from black h s 30%);
        border-bottom: 4px solid transparent;
    }
    .nav-item:hover {
        background-color: hsl(from var(--f1-red) h s 20%);
    }
    .main-content {
        flex-grow: 1;
        margin: 0 auto;
        width: 100vw;
        max-width: 840px;
        color: var(--f1-black);
    }
    @media (max-width: 640px) {
        .header-logo {
            height: 3rem;
            padding: .5rem;
        }
        .nav-list {
            width: 90vw;
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 8px 0;
        }
        .nav-item {
            border-radius: .5rem;
        }
    }

</style>