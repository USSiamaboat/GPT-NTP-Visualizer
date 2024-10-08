async function parseJSON(path) {
    const raw = await fetch(path)
    const blob = await raw.blob()
    const text = await blob.text()

    return JSON.parse(text)
}

async function loadTokenizer() {
    const Transformers = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0")

    const tokenizerJSON = await parseJSON(TOKENIZER_FILE_NAME)
    const configJSON = await parseJSON(TOKENIZER_CONFIG_FILE_NAME)
    const tokenizer = new Transformers.PreTrainedTokenizer(tokenizerJSON, configJSON)

    return tokenizer;
}
