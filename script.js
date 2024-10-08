let tokenizer = null
let session = null

async function tokenize(text) {
    if (!tokenizer) {
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
        tokenizer = await loadTokenizer()
    }

    const decoded = await tokenizer.decode(tokens)

    return decoded
}

async function getProbabilities(inputIds, attentionMask) {
    if (!session) {
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

document.addEventListener("mousemove", e => {
    // ctx.moveTo(0, 0)
    // // ctx.lineTo(e.clientX, e.clientY)
    // ctx.stroke()
})

// Interface

const main = document.getElementById("main")
const input = document.getElementById("input")

const TREE_DEPTH = 2
const TREE_RATE = 3

let asdf;

async function expand(n) {
    const thing = await nextNTokenProbs(n.elt.innerText, 3)

    for (const key of Object.keys(thing)) {
        const group = Node.createNodeElt(n.elt.innerText + key)
        const left = group.children[0]
        const node = new Node(thing[key], group, left)

        n.nexts.push(node)

        n.group.children[1].appendChild(group)
    }
}

input.addEventListener("keyup", async e => {
    if (e.key != "Enter") return

    main.innerHTML = ""
    c.width = c.clientWidth;
    c.height = c.clientHeight;

    let cleanedVal = input.value.trim()

    const rootGroup = Node.createNodeElt(cleanedVal)
    const rootLeft = rootGroup.children[0]
    const root = new Node(1, rootGroup, rootLeft)

    main.appendChild(rootGroup)

    const thing = await nextNTokenProbs(cleanedVal, 3)

    for (const key of Object.keys(thing)) {
        const group = Node.createNodeElt(cleanedVal + key)
        const left = group.children[0]
        const node = new Node(thing[key], group, left)

        root.nexts.push(node)

        root.group.children[1].appendChild(group)
    }

    for (const next of root.nexts) {
        expand(next)
    }

    window.requestAnimationFrame(() => {
        root.drawBetween()

        for (const x of root.nexts) {
            x.drawBetween()
        }
    })

    asdf = root
})
