/* 
    startCost - distance from starting node
    targetCost - distance to target node
    totalCost - startCost + targetCost
*/
const nodes = [];
const pathNodeIndices = [];
let startIndex = null;
let targetIndex = null;
const nodeColoringPackages = []; //keep track of path progression

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
        }
    }
    return validNeighbourIndices;
}


function getNodeWithLowestTotalCost(nodeList) {
    let chosenNode = nodeList[0];
    let lowestTotalCost = chosenNode.totalCost;
    for (const node of nodeList) {
        if (node.totalCost <= lowestTotalCost) {
            chosenNode = node;
            lowestTotalCost = node.totalCost;
        }
    }
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


function getPath(startIndex, targetIndex) {

    // console.log('calculating path');
    // console.log(startIndex);
    // console.log(targetIndex);

    nodeColoringPackages.length = 0; //clear the packages

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

    let iteration = 0;
    while (pathNodesOpen.length > 0) {

        let nodesForColoring = []; //use this array to store nodes to be coloured through each iteration.

        if (pathNodesOpen.length > 1) {
            currentNode = getNodeWithLowestTotalCost(pathNodesOpen);
        }
        pathNodesOpen.splice(pathNodesOpen.indexOf(currentNode), 1);
        pathNodesClosed.push(currentNode);
        currentNode.open = false;
        currentNode.closed = true;
        nodesForColoring.push({ index: currentNode.index, state: 'closed' });
        if (currentNode.index === targetIndex) {
            console.log('FOUND A PATH!');
            // draw the path!
            nodeColoringPackages.push({ nodes: buildFinalnodeColoringPackage(targetIndex), iteration: iteration });
            highlightWithInterval();
            return;
        }


        const neighbourNodeIndices = getNeighbourNodeIndices(currentNode.index);
        neighbourNodeIndices.forEach(n => {
            if (nodes[n].blocked || pathNodesClosed.indexOf(nodes[n]) != -1) {
                return;
            }
            // get the nodes targetCost
            nodes[n].targetCost = calculateTargetCost(nodes[n], nodes[targetIndex]);
            // if new path of the neighbour is shorter, or neighbour is not in the open list
            let newStartCost = currentNode.startCost + calculateStartCost(currentNode, nodes[n])
            if (newStartCost < nodes[n].startCost || pathNodesOpen.indexOf(nodes[n]) == -1) {
                nodes[n].startCost = newStartCost;
                nodes[n].calculateTotalCost();
                nodes[n].parent = currentNode;

                if (pathNodesOpen.indexOf(nodes[n]) == -1) {
                    pathNodesOpen.push(nodes[n]);
                    nodes[n].open = true;
                    nodesForColoring.push({ index: n, state: 'open' });
                }
            }
        })

        nodeColoringPackages.push({ nodes: nodesForColoring, iteration: iteration });
        iteration++;
    }
}

function buildFinalnodeColoringPackage(targetIndex) {

    const finalPath = [];
    let currentPathNode = nodes[targetIndex];

    while (currentPathNode.parent) {
        finalPath.push({ index: currentPathNode.index, state: 'path' });
        currentPathNode = currentPathNode.parent;
    }
    finalPath.push({ index: currentPathNode.index, state: 'path' });

    console.log('finalPath:', finalPath);

    return finalPath;

}

function highlightWithInterval() {

    for (let i = 0; i < nodeColoringPackages.length; i++) {
        let currentPackage = nodeColoringPackages[i];
        setTimeout(function () {
            // console.log(currentPackage);
            for (const n of currentPackage.nodes) {

                if (n.state === 'closed') {
                    gridSquares[n.index].material.color.set('lightgreen');
                }
                if (n.state === 'open') {
                    gridSquares[n.index].material.color.set('lightgrey');
                }
                if (n.state === 'path') {
                    gridSquares[n.index].material.color.set('lightseagreen');
                }
            }
        }, 50 * i);
    }
}