import Tree from './Tree.js';

/**
 * Base class for coniferous trees (needle-leaved evergreens).
 */
export default class Conifer extends Tree {
    constructor(options = {}) {
        super(options);
        // Default properties for conifers
        this.options.isEvergreen = true;
    }
}
