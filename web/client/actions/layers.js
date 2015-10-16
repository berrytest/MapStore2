/**
 * Copyright 2015, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const TOGGLE_NODE = 'TOGGLE_NODE';
const SORT_NODE = 'SORT_NODE';

function toggleNode(node, type, status) {
    return {
        type: TOGGLE_NODE,
        node: node,
        nodeType: type,
        status: !status
    };
}

function sortNode(node, order) {
    return {
        type: SORT_NODE,
        node: node,
        order: order
    };
}

module.exports = {toggleNode, sortNode, TOGGLE_NODE, SORT_NODE};