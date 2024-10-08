const c = document.getElementById("canvas");
const ctx = c.getContext("2d");

c.width = c.clientWidth;
c.height = c.clientHeight;

class Node {
    constructor(val, group, left) {
        this.val = val
        this.group = group
        this.elt = left
        this.nexts = []
    }

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
        console.log(offset)
        return Math.floor(this.elt.getBoundingClientRect().top - offset) + Math.floor(this.elt.getBoundingClientRect().height/2) + 0.5
    }

    drawBetween(ctx) {
        for (const other of this.nexts) {
            ctx.lineWidth = Math.pow(10, other.val)

            const x1 = this.rx()
            const y1 = this.y()
            const x2 = other.lx()
            const y2 = other.y()

            const xMid = (x1 + x2)/2

            ctx.beginPath()
            ctx.moveTo(x1, y1)

            ctx.bezierCurveTo(xMid, y1, xMid, y2, x2, y2)
            // ctx.lineTo(x2, y2)
            ctx.stroke()

            other.drawBetween(ctx)
        }
    }

    async expand(root) {
        const thing = await nextNTokenProbs(this.elt.innerText, 3)

        for (const key of Object.keys(thing)) {
            const group = Node.createNodeElt(this.elt.innerText + key)
            const left = group.children[0]
            const node = new Node(thing[key], group, left)

            this.nexts.push(node)

            this.group.children[1].appendChild(group)

            left.onclick = async () => {
                await node.expand(root)
    
                window.requestAnimationFrame(() => {
                    updateCanvasSize()
    
                    root.drawBetween(ctx)
    
                    setStatusGreen("Done!")
                })
            }
        }
    }
}
