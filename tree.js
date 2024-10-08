// Beefed up tree node
class Node {
    constructor(val, group, left) {
        this.val = val
        this.group = group
        this.elt = left
        this.nexts = []
        this.expanded = false
    }

    static root;

    // "Factory" for node DOM elements
    static createNodeElt(text) {
        const group = document.createElement("div")
        group.classList.add("group")

        const left = document.createElement("div")
        left.classList.add("left")
        left.innerText = text

        group.appendChild(left)

        const rights = document.createElement("div")
        rights.classList.add("rights")

        group.appendChild(rights)

        return group
    }

    // Absolute position helpers
    lx() {
        const offset = document.body.getBoundingClientRect().left
        return Math.floor(this.elt.getBoundingClientRect().left - offset) + 0.5
    }

    rx() {
        const offset = document.body.getBoundingClientRect().left
        return Math.floor(this.elt.getBoundingClientRect().right - offset) + 0.5
    }

    y() {
        const offset = document.body.getBoundingClientRect().top
        const halfWidth = this.elt.getBoundingClientRect().height/2
        return Math.floor(this.elt.getBoundingClientRect().top - offset + halfWidth) + 0.5
    }

    // Draw path to all child Nodes (does not clear screen)
    drawBetween(ctx) {
        for (const other of this.nexts) {
            // Line thickness grows (exponentially) with probability of next token
            ctx.lineWidth = Math.pow(10, other.val)

            // Coordinates
            const x1 = this.rx()
            const y1 = this.y()
            const x2 = other.lx()
            const y2 = other.y()

            const xMid = (x1 + x2)/2

            // Draw smooth curve ( Bezier curves :D )
            ctx.beginPath()
            ctx.moveTo(x1, y1)

            ctx.bezierCurveTo(xMid, y1, xMid, y2, x2, y2)
            ctx.stroke()

            other.drawBetween(ctx)
        }
    }

    // Expand
    async expand() {
        // Do not expand if already expanded
        if (this.expanded) return
        this.expanded = true

        // Generate child node content
        const bestTokenProbPairs = await forward(this.elt.innerText, NODE_DEGREE)

        // Produce pairs
        for (const pair of bestTokenProbPairs) {
            // Create node and elts
            const group = Node.createNodeElt(this.elt.innerText + pair["token"])
            const left = group.children[0]
            const node = new Node(pair["prob"], group, left)

            // Register as child of current node
            this.nexts.push(node)

            this.group.children[1].appendChild(group)

            // Expand again on click
            left.onclick = () => { Node.expandAndRedraw(node, ctx) }
        }
    }

    // Expand again implementation
    static async expandAndRedraw(node, ctx) {
        // Create new nodes
        await node.expand()
    
        // Update interface
        window.requestAnimationFrame(() => {
            updateCanvasSize()

            Node.root.drawBetween(ctx)

            setStatusGreen("Done!")
        })
    }
}
