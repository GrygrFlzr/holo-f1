<script lang="ts">
    import ogImage from "$lib/suzuka.png?no-inline";
</script>

<svelte:head>
    <meta property="og:title" content="Season 3 Race 3 Prediction Form" />
    <title>Season 3 Race 3 Prediction Form | Holocord F1 Watchalong Prediction Championship</title>
    <meta property="og:description" content="Submit predictions for Suzuka, Japan" />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="240" />
    <meta property="og:image:height" content="180" />
    <meta property="twitter:card" content="summary" />
</svelte:head>

<div class="container">
    <a class="interactive-button" href="/">
        <span>Return to S3 Standings</span>
    </a>
    <h2>Race 3: Suzuka, Japan</h2>
    <iframe
        title="Season 3 Race 3 Submission"
        src="https://docs.google.com/forms/d/e/1FAIpQLSfWEiA8bHgdAdyP9iUZBgZm1z4BRvy9iPEJU8NKZDXjSYPlPw/viewform?embedded=true"
        frameborder="0"
        marginheight="0"
        marginwidth="0">
        Loading…
    </iframe
    >
</div>

<style>
    .interactive-button {
        text-align: center;
        max-width: 30ch;
        display: flex;
        justify-content: center;
        font-size: 2rem;
        text-decoration: none;
        border-radius: 2rem;
        background-color: var(--f1-red);
        margin: 2rem auto;
        padding: .5rem 2rem;
        color: var(--f1-white);
        box-shadow: 0 4px 6px -1px hsl(from var(--f1-red) h s 30%),
                    0 2px 4px -2px hsl(from var(--f1-red) h s 30%);
    }
    .interactive-button span {
        display: block;
        font-style: oblique 10deg;
    }
    .interactive-button:hover {
        background-color: hsl(from var(--f1-red) h s 50%);
        box-shadow: 0 4px 6px -1px hsl(from var(--f1-red) h s 30%),
                    0 2px 4px -2px hsl(from var(--f1-red) h s 30%);
    }
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