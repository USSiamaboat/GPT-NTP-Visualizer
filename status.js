const statusElt = document.getElementById("status")

function setStatusYellow(text) {
    statusElt.className = ""

    statusElt.innerText = text
}

function setStatusGreen(text, fadeDelay=1000) {
    statusElt.className = "good"

    statusElt.innerText = text

    setTimeout(() => {
        if (statusElt.className == "good") {
            statusElt.className = "good fade-out"
        }
    }, fadeDelay)
}
