let tokenizer = null
let session = null

async function tokenize(text) {
    if (!tokenizer) {
        setStatusYellow("Loading Tokenizer...")
        tokenizer = await loadTokenizer()
    }

    const tokenized = await tokenizer(text, options = {
        "truncation": true,
        "max_length": INPUT_SIZE
    })

    let inputIds = Array.from(tokenized["input_ids"].data).map(x => parseInt(x))
    let attentionMask = Array.from(tokenized["attention_mask"].data).map(x => parseInt(x))

    const paddingIds = Array(INPUT_SIZE - inputIds.length).fill(50256)
    const paddingMask = Array(INPUT_SIZE - attentionMask.length).fill(0)

    inputIds = inputIds.concat(paddingIds)
    attentionMask = attentionMask.concat(paddingMask)

    return [createInt64Tensor(inputIds), createInt64Tensor(attentionMask)]
}

async function decode(tokens) {
    if (!tokenizer) {
        setStatusYellow("Loading Tokenizer...")
        tokenizer = await loadTokenizer()
    }

    const decoded = await tokenizer.decode(tokens)

    return decoded
}

async function getProbabilities(inputIds, attentionMask) {
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
    const probabilities = await output["probabilities"].getData()

    return probabilities
}

async function nBestNextTokens(probabilities, n) {
    setStatusYellow("Organizing Results...")

    const bestTokens = nLargestIndices(probabilities, n)
    let bestTokensDecoded = []

    for (let i = 0; i < bestTokens.length; i++) {
        bestTokensDecoded.push(decode([bestTokens[i]]))
    }

    bestTokensDecoded = await Promise.all(bestTokensDecoded)

    out = {}
    for (let i = 0; i < bestTokens.length; i++) {
        out[bestTokensDecoded[i]] = probabilities[bestTokens[i]]
    }
    return out
}

async function nextNTokenProbs(text, n) {
    let [inputIds, attentionMask] = await tokenize(text)

    const probabilities = await getProbabilities(inputIds, attentionMask)

    const probMap = await nBestNextTokens(probabilities, n)

    return probMap
}

// Interface

const body = document.body
const main = document.getElementById("main")
const input = document.getElementById("input")

const TREE_DEPTH = 2
const TREE_RATE = 3

let globalRoot = null

function updateCanvasSize() {
    // const width = body.getBoundingClientRect().width
    // const height = body.getBoundingClientRect().top + body.getBoundingClientRect().height
    const width = body.scrollWidth
    const height = body.scrollHeight
    c.width = width
    c.height = height
}

input.addEventListener("keyup", async e => {
    if (e.key != "Enter") return

    main.innerHTML = ""

    let cleanedVal = input.value.trim()

    const rootGroup = Node.createNodeElt(cleanedVal)
    const rootLeft = rootGroup.children[0]
    const root = new Node(1, rootGroup, rootLeft)

    await root.expand(root)

    main.appendChild(rootGroup)

    window.requestAnimationFrame(() => {
        updateCanvasSize()

        root.drawBetween(ctx)

        setStatusGreen("Done!")
    })

    globalRoot = root
})

window.addEventListener("resize", () => {
    if (!globalRoot) return

    updateCanvasSize()

    globalRoot.drawBetween(ctx)
})
