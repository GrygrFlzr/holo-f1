<script lang="ts">
    import ogImage from "$lib/spain.png?no-inline";
    const raceCount = 9;
    const raceName = "Spain";
</script>

<svelte:head>
    <meta property="og:title" content="Season 3 Race {raceCount} Prediction Form" />
    <title>Season 3 Race {raceCount} Prediction Form | Holocord F1 Watchalong Prediction Championship</title>
    <meta property="og:description" content="Submit predictions for {raceName}" />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="240" />
    <meta property="og:image:height" content="180" />
    <meta property="twitter:card" content="summary" />
</svelte:head>

<div class="container">
    <h2>Race {raceCount}: {raceName}</h2>
    <iframe
        title="Season 3 Race {raceCount} Submission"
        src="https://docs.google.com/forms/d/e/1FAIpQLSeSLWahnBIL2PFCB3UNlwD0CbdC6g7s5pkPTmaw1tvFJYYNJQ/viewform?embedded=true"
        frameborder="0"
        marginheight="0"
        marginwidth="0">
        Loading…
    </iframe
    >
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        height: calc(100dvh);
    }
    iframe {
        flex-grow: 1;
        width: 100%;
    }
</style>