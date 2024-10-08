let tokenizer = null
let session = null

async function tokenize(text) {
    // Load tokenizer if not loaded
    if (!tokenizer) {
        setStatusYellow("Loading Tokenizer...")
        tokenizer = await loadTokenizer()
    }

    // Pass text input into tokenizer with truncation
    const tokenized = await tokenizer(text, options = {
        "truncation": true,
        "max_length": INPUT_SIZE
    })

    // Manually pad input ids and attention mask with pad token
    let inputIds = Array.from(tokenized["input_ids"].data).map(x => parseInt(x))
    let attentionMask = Array.from(tokenized["attention_mask"].data).map(x => parseInt(x))

    const paddingIds = Array(INPUT_SIZE - inputIds.length).fill(50256)
    const paddingMask = Array(INPUT_SIZE - attentionMask.length).fill(0)

    inputIds = inputIds.concat(paddingIds)
    attentionMask = attentionMask.concat(paddingMask)

    // Return tensors of input ids and attention mask
    return [createInt64Tensor(inputIds), createInt64Tensor(attentionMask)]
}

async function decode(tokens) {
    // Load tokenizer if not loaded
    if (!tokenizer) {
        setStatusYellow("Loading Tokenizer...")
        tokenizer = await loadTokenizer()
    }

    const decoded = await tokenizer.decode(tokens)

    return decoded
}

async function getProbabilities(inputIds, attentionMask) {
    // Load model if not loaded
    if (!session) {
        setStatusYellow("Loading Model...")
        session = await ort.InferenceSession.create(MODEL_FILE_NAME, {
            executionProviders: ["wasm", "webgpu"]
        })
    }

    // Run inference
    const output = await session.run({
        "input-ids": inputIds,
        "attention-mask": attentionMask
    })

    // Extract output
    const probabilities = await output["probabilities"].getData()

    return probabilities
}

async function nBestNextTokens(probabilities, n) {
    setStatusYellow("Organizing Results...")

    // Extract tokens that maximize probability
    const bestTokens = nLargestIndices(probabilities, n)

    // Convert numerical ids to text tokens
    let bestTokensDecoded = []

    for (let i = 0; i < bestTokens.length; i++) {
        bestTokensDecoded.push(decode([bestTokens[i]]))
    }

    bestTokensDecoded = await Promise.all(bestTokensDecoded)

    // Generate (token, probability) pairs
    out = []

    for (let i = 0; i < bestTokens.length; i++) {
        out.push({
            "token": bestTokensDecoded[i],
            "prob": probabilities[bestTokens[i]]
        })
    }

    // Sort output by descending probability
    out.sort((a, b) => b["prob"] - a["prob"])

    return out
}

async function forward(text, n) {
    // Tokenize
    let [inputIds, attentionMask] = await tokenize(text)

    // Inference
    const probabilities = await getProbabilities(inputIds, attentionMask)

    // Reformat
    const probMap = await nBestNextTokens(probabilities, n)

    return probMap
}
