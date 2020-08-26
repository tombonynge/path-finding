/* 
    startCost - distance from starting node
    targetCost - distance to target node
    totalCost - startCost + targetCost
*/
const nodes = [];
const pathNodeIndices = [];
let startIndex = null;
let targetIndex = null;

class Node {
    constructor(x, y, index) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.startCost = 0;
        this.targetCost = 0;
        this.totalCost = 0;
        this.parent = null;
        this.open = false;
        this.closed = false;
        this.path = false;
        this.blocked = false;
    }

    calculateTotalCost() {
        this.totalCost = this.startCost + this.targetCost;
    }

    reset() {
        this.startCost = 0;
        this.targetCost = 0;
        this.totalCost = 0;
        this.parent = null;
        this.open = false;
        this.closed = false;
        this.path = false;
        this.blocked = false;
    }

}

function calculateStartCost(parent, node) {
    let dist = Math.abs(parent.index - node.index);
    if (dist == GRIDROWS || dist == 1) {
        return 1;
    } else {
        return 1.41;
    }
}

function calculateTargetCost(node, targetNode) {
    // let xDist = Math.abs(node.x / GRIDCOLS - targetNode.x / GRIDCOLS);
    // let yDist = Math.abs(node.y / GRIDROWS - targetNode.y / GRIDROWS);
    // if (xDist > yDist) {
    //     return (14 * yDist + (10 * (xDist - yDist)));
    // } else {
    //     return (14 * xDist + (10 * (yDist - xDist)));
    // };
    let p = new THREE.Vector2(node.x, node.y);
    let q = new THREE.Vector2(targetNode.x, targetNode.y);
    return Math.abs(p.sub(q).length());
}


function getNodesFromGrid(grid) {

    // build a list of nodes from the three.js grid
    for (const [index, square] of grid.entries()) {

        let node = new Node(Math.floor(square.position.x), Math.floor(square.position.z), index)
        nodes.push(node);
        //if the square is our starting position, store it's index
        if (square.pathPosition == 'start') {
            startIndex = index;
        }
        //if the square is our target position, store it's index
        if (square.pathPosition == 'target') {
            targetIndex = index;
        }
        //if the square is blocked, flag it as closed
        //if the square is an edge, flag it as closed
        if (square.blocked || square.edge) {
            node.blocked = true;
        }



    }

    console.log(nodes);
    console.log(pathNodeIndices);
}

function ResetNodesFromGrid(grid) {

    startIndex = null;
    targetIndex = null;

    for (const node of nodes) {
        node.reset();
    }

    for (const [index, square] of grid.entries()) {
        if (square.pathPosition == 'start') {
            startIndex = index;
        }
        //if the square is our target position, store it's index
        if (square.pathPosition == 'target') {
            targetIndex = index;
        }
        //if the square is blocked, flag it as closed
        //if the square is an edge, flag it as closed
        if (square.blocked || square.edge) {
            nodes[index].blocked = true;
        }
    }

    console.log(nodes);
}

function updateGridFromNodes(nodes) {
    // update grid colors based on nodes
    for (let i = 0; i < nodes.length; i++) {
        gridSquares[i].material.color.set(getColorFromNode(nodes[i]));
    }

    function getColorFromNode(node) {
        let color;
        if (node.open) {
            color = 'lightgreen';
        }
        if (node.closed) {
            color = 'grey';
        }
        if (node.path) {
            color = 'yellow';
        }
        return color;
    }
}


function getNeighbourNodeIndices(nodeIndex) {

    const neighbourIndices = [];
    const validNeighbourIndices = [];
    neighbourIndices.push(nodeIndex - (GRIDROWS + 1));    // north west
    neighbourIndices.push(nodeIndex - GRIDROWS);          // west
    neighbourIndices.push(nodeIndex - (GRIDROWS - 1));    // south west
    neighbourIndices.push(nodeIndex - 1);                 // north
    neighbourIndices.push(nodeIndex + 1);                 // south
    neighbourIndices.push(nodeIndex + (GRIDROWS - 1));    // north east
    neighbourIndices.push(nodeIndex + GRIDROWS);          // east
    neighbourIndices.push(nodeIndex + (GRIDROWS + 1));    // south east

    for (const n of neighbourIndices) {
        if (!nodes[n].blocked) {
            validNeighbourIndices.push(n);
            // nodes[n].parent = nodes[nodeIndex];
        }
    }
    return validNeighbourIndices;
}


function getNodeWithLowestTotalCost(nodeList) {

    let chosenNode = nodeList[0];
    let lowestTotalCost = chosenNode.totalCost;
    for (const node of nodeList) {
        console.log('node:', node);
        console.log(node.index, 'total cost:', node.totalCost);
        if (node.totalCost <= lowestTotalCost) {
            chosenNode = node;
            lowestTotalCost = node.totalCost;
        }
    }
    console.log('the chosen node:', chosenNode);
    return chosenNode;
}

function updateGridFromNodes() {

    for (const node of nodes) {
        if (node.open) {
            gridSquares[node.index].material.color.set('lightgrey');
        }
        if (node.closed) {
            gridSquares[node.index].material.color.set('yellow');
        }
    }
}


function highlightPath(targetIndex) {
    let currentPathNode = nodes[targetIndex];
    console.log('currentPathNode:', currentPathNode);
    const pathList = [];
    while (currentPathNode.parent) {
        pathList.push(currentPathNode.index);
        currentPathNode = currentPathNode.parent;
    }
    pathList.push(currentPathNode.index);

    console.log(pathList);
    pathList.forEach(function (i) {
        gridSquares[i].material.color.set('lightcoral');
    });
}

function getPath(startIndex, targetIndex) {

    console.log('calculating path');
    console.log(startIndex);
    console.log(targetIndex);

    // stop if path is invalid!
    if (!startIndex || !targetIndex || nodes[startIndex].blocked || nodes[targetIndex].blocked) {
        console.log('path is invalid')
        return;
    }

    const path = [];
    const pathNodesOpen = [];
    const pathNodesClosed = [];

    pathNodesOpen.push(nodes[startIndex]);

    let currentNode = pathNodesOpen[0];

    while (pathNodesOpen.length > 0) {

        console.log('****************');

        updateGridFromNodes();

        if (pathNodesOpen.length > 1) {
            console.log('the current node: ', currentNode);
            currentNode = getNodeWithLowestTotalCost(pathNodesOpen);

        }
        pathNodesOpen.splice(pathNodesOpen.indexOf(currentNode), 1);
        pathNodesClosed.push(currentNode);
        currentNode.open = false;
        currentNode.closed = true;
        // console.log('pathNodesClosed: ', pathNodesClosed);

        if (currentNode.index === targetIndex) {
            // TODO: draw the path!
            console.log('FOUND A PATH!');
            // console.log('the path is: ', path);
            highlightPath(targetIndex);
            return;
        }

        const neighbourNodeIndices = getNeighbourNodeIndices(currentNode.index);
        // console.log(neighbourNodeIndices);
        neighbourNodeIndices.forEach(n => {

            if (nodes[n].blocked || pathNodesClosed.indexOf(nodes[n]) != -1) {
                // console.log('node blocked or in closed list');
                return;
            }

            // get the nodes targetCost
            nodes[n].targetCost = calculateTargetCost(nodes[n], nodes[targetIndex]);

            console.log('neighbour node', nodes[n]);
            // if new path of the neighbour is shorter, or neighbour is not in the open list
            let newStartCost = currentNode.startCost + calculateStartCost(currentNode, nodes[n])
            if (newStartCost < nodes[n].startCost || pathNodesOpen.indexOf(nodes[n]) == -1) {
                nodes[n].startCost = newStartCost;
                nodes[n].calculateTotalCost();
                nodes[n].parent = currentNode;
                // console.log(nodes[n]);

                if (pathNodesOpen.indexOf(nodes[n]) == -1) {
                    // console.log('adding ', n, ' to the open list');
                    pathNodesOpen.push(nodes[n]);
                    nodes[n].open = true;
                }
            }
        })
    }
}


/*
// Binary Heap
class BinaryHeap {
    constructor(heap) {
        this.heap = heap
    }

    insert(value) {
        this.heap.push(value)
        this.bubbleUp();
    }

    bubbleUp() {
        let index = this.heap.length - 1;

        while (index > 0) {
            let element = this.heap[index],
                parentIndex = Math.floor((index - 1) / 2),
                parent = this.heap[parentIndex];

            if (parent.h_cost <= element.h_cost) {
                break;
            } else {
                this.heap[index] = parent;
                this.heap[parentIndex] = element;
                index = parentIndex;
            }
        }
    }

    extractMin() {
        const min = this.heap[0];
        this.heap[0] = this.heap.pop()
        this.sinkDown(0)
        return min
    }

    sinkDown(index) {

        let left = 2 * index + 1;
        let right = 2 * index + 2;
        let smallest = index;
        const length = this.heap.length;

        if (left <= length && this.heap[left].h_cost < this.heap[smallest].h_cost) {
            smallest = left;
        }
        if (right <= length && this.heap[right].h_cost < this.heap[smallest].h_cost) {
            smallest = right;
        }
        // swap
        if (smallest !== index) {
            [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
            this.sinkDown(smallest);
        }
    }

    delete() {
        this.heap = [];
    }

    peekAtMin() {
        return this.heap[0];
    }

}
*/