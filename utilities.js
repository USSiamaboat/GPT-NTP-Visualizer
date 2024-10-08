function createInt64Tensor(arr) {
    return new ort.Tensor("int64", arr, [1, arr.length]);
}

function objectToArray(obj) {
    let out = new Array(obj.length)

    for (const key of Object.keys(obj)) {
        out[obj[key]] = key
    }

    return out
}

function nLargestIndices(arr, n) {
    let newArr = []

    for (let i = 0; i < arr.length; i++) {
        newArr.push([i, arr[i]])
    }

    newArr.sort((a, b) => b[1] - a[1])

    let out = []

    for (let i = 0; i < n; i++) {
        out.push(newArr[i][0])
    }

    return out
}

