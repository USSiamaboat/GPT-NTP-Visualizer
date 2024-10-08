const body = document.body
const main = document.getElementById("main")
const input = document.getElementById("input")

const c = document.getElementById("canvas");
const ctx = c.getContext("2d");

const TREE_DEPTH = 2
const NODE_DEGREE = 3

let globalRoot = null

function updateCanvasSize() {
    c.width = body.scrollWidth
    c.height = body.scrollHeight
}

input.addEventListener("keyup", async e => {
    // Only process enter key
    if (e.key != "Enter") return

    // Clear graph
    main.innerHTML = ""

    // Preprocess
    let cleanedVal = input.value.trim()

    // Create root node and elts
    const rootGroup = Node.createNodeElt(cleanedVal)
    const rootLeft = rootGroup.children[0]
    const root = new Node(1, rootGroup, rootLeft)

    // Expand by 1 layer from root
    await root.expand()

    // Append AFTER awaiting expand to prevent a single root node waiting
    main.appendChild(rootGroup)

    // Draw connections after locations are computed
    window.requestAnimationFrame(() => {
        // Validate correct size (also a hacky "clear screen")
        updateCanvasSize()

        // Recursively draw connections
        root.drawBetween(ctx)

        // Report done
        setStatusGreen("Done!")
    })

    // Update global root
    globalRoot = root
    Node.root = root
})

window.addEventListener("resize", () => {
    // No global root => No source to redraw
    if (!globalRoot) return

    // Validate correct size (also a hacky "clear screen")
    updateCanvasSize()

    // Recursively draw connections
    globalRoot.drawBetween(ctx)
})
